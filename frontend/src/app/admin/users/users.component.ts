import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../shared/api.service';
import { Inject } from '@angular/core';

@Component({
  selector: 'app-reset-password-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatDialogModule, MatDialogRef],
  template: `
    <h2 mat-dialog-title style="font-family: 'Outfit', sans-serif;">Cambiar Contraseña</h2>
    <mat-dialog-content>
      <p style="margin-bottom: 16px;">Nueva contraseña para <strong>{{data.username}}</strong></p>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Nueva Contraseña</mat-label>
          <input matInput type="password" formControlName="newPassword">
          <mat-hint>Mín 8 chars, 1 mayúscula, 1 número, 1 símbolo</mat-hint>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" class="btn-gold" [disabled]="form.invalid" (click)="submit()">Guardar</button>
    </mat-dialog-actions>
  `
})
export class ResetPasswordDialogComponent {
  form: FormGroup;
  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ResetPasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string }
  ) {
    this.form = this.fb.group({
      newPassword: ['', Validators.required]
    });
  }
  submit() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.newPassword);
    }
  }
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSnackBarModule,
    MatChipsModule, MatMenuModule, MatProgressSpinnerModule, MatDialogModule
  ],
  template: `
    <div class="page-container">
      <h1 class="page-title">👥 Gestión de Usuarios</h1>

      <div class="filters card-glass">
        <mat-form-field appearance="outline" style="flex:1; min-width:200px">
          <mat-label>Buscar</mat-label>
          <input matInput [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="Nombre, username o email">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>
      </div>

      <div *ngIf="loading()" class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>

      <div *ngIf="!loading()" class="table-wrap card-glass">
        <table mat-table [dataSource]="users()" class="users-table">
          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let u">
              <div style="display:flex;flex-direction:column">
                <span style="font-weight:600">{{ u.fullName }}</span>
                <span style="color:var(--text-muted);font-size:0.8rem">{{'@' + u.username}}</span>
              </div>
            </td>
          </ng-container>
          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>Email</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>
          <ng-container matColumnDef="role">
            <th mat-header-cell *matHeaderCellDef>Rol</th>
            <td mat-cell *matCellDef="let u">
              <span class="badge" [class.badge-gold]="u.role==='ADMIN'" [class.badge-green]="u.role==='USER'">{{ u.role }}</span>
            </td>
          </ng-container>
          <ng-container matColumnDef="points">
            <th mat-header-cell *matHeaderCellDef>Puntos</th>
            <td mat-cell *matCellDef="let u" style="font-weight:700;color:var(--gold)">{{ u.totalPoints }}</td>
          </ng-container>
          <ng-container matColumnDef="predictions">
            <th mat-header-cell *matHeaderCellDef>Preds</th>
            <td mat-cell *matCellDef="let u">{{ u._count?.predictions || 0 }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Estado</th>
            <td mat-cell *matCellDef="let u">
              <span class="badge" [class.badge-green]="u.isActive" [class.badge-red]="!u.isActive">
                {{ u.isActive ? 'Activo' : 'Bloqueado' }}
              </span>
            </td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Acciones</th>
            <td mat-cell *matCellDef="let u">
              <button mat-icon-button [matMenuTriggerFor]="menu"><mat-icon>more_vert</mat-icon></button>
              <mat-menu #menu="matMenu">
                <button mat-menu-item (click)="toggleActive(u.id)">
                  <mat-icon>{{ u.isActive ? 'block' : 'check_circle' }}</mat-icon>
                  {{ u.isActive ? 'Bloquear' : 'Activar' }}
                </button>
                <button mat-menu-item (click)="toggleRole(u.id, u.role)">
                  <mat-icon>admin_panel_settings</mat-icon>
                  {{ u.role === 'ADMIN' ? 'Quitar Admin' : 'Hacer Admin' }}
                </button>
                <button mat-menu-item (click)="resetPassword(u)">
                  <mat-icon>password</mat-icon>
                  Cambiar Contraseña
                </button>
              </mat-menu>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns"></tr>
        </table>
        <mat-paginator [length]="total" [pageSize]="20" (page)="onPage($event)" showFirstLastButtons></mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .filters { display:flex; gap:16px; margin-bottom:16px; padding:16px 20px; }
    .table-wrap { padding:0; overflow:hidden; }
    .users-table { width:100%; background:transparent !important; th { color:var(--text-secondary) !important; } td { border-bottom-color:var(--border-color) !important; } }
    .loading-container { display:flex; justify-content:center; padding:80px 0; }
  `],
})
export class AdminUsersComponent implements OnInit {
  columns = ['username', 'email', 'role', 'points', 'predictions', 'status', 'actions'];
  users = signal<any[]>([]);
  loading = signal(false);
  search = '';
  total = 0;
  page = 1;
  private searchTimeout: any;

  constructor(private api: ApiService, private snackBar: MatSnackBar, private dialog: MatDialog) { }

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.api.getUsers(this.page, 20, this.search || undefined).subscribe({
      next: (res) => { this.users.set(res.data.users); this.total = res.data.total; this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  onSearch() { clearTimeout(this.searchTimeout); this.searchTimeout = setTimeout(() => { this.page = 1; this.load(); }, 400); }
  onPage(e: PageEvent) { this.page = e.pageIndex + 1; this.load(); }

  toggleActive(id: string) {
    this.api.toggleUserActive(id).subscribe({
      next: () => { this.load(); this.snackBar.open('Estado actualizado', 'OK', { duration: 2000 }); },
    });
  }

  toggleRole(id: string, currentRole: string) {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    this.api.setUserRole(id, newRole).subscribe({
      next: () => { this.load(); this.snackBar.open('Rol actualizado', 'OK', { duration: 2000 }); },
    });
  }

  resetPassword(user: any) {
    const dialogRef = this.dialog.open(ResetPasswordDialogComponent, {
      width: '400px',
      data: { username: user.username }
    });

    dialogRef.afterClosed().subscribe(newPassword => {
      if (newPassword) {
        this.api.adminResetPassword(user.id, newPassword).subscribe({
          next: () => {
            this.snackBar.open('Contraseña actualizada correctamente', 'OK', { duration: 3000, panelClass: 'snack-success' });
          },
          error: (err) => {
            this.snackBar.open(err.error?.message || 'Error al actualizar contraseña', 'OK', { duration: 4000, panelClass: 'snack-error' });
          }
        });
      }
    });
  }
}
