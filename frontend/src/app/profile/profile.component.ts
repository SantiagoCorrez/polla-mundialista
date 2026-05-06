import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../auth/services/auth.service';
import { Prediction, PHASE_LABELS } from '../shared/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatTabsModule,
    MatSnackBarModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-container">
      <h1 class="page-title">👤 Mi Perfil</h1>

      <div class="profile-layout">
        <!-- Profile Card -->
        <div class="profile-card card-glass animate-fade-in-up">
          <div class="profile-avatar">
            <div class="avatar-circle">{{ getInitials() }}</div>
          </div>
          <div class="profile-info" *ngIf="profile()">
            <h2 class="profile-name">{{ profile().fullName }}</h2>
            <p class="profile-username">{{ '@' + profile().username }}</p>
            <p class="profile-email">{{ profile().email }}</p>
            <span class="badge" [class.badge-gold]="profile().role === 'ADMIN'"
              [class.badge-green]="profile().role === 'USER'">
              {{ profile().role }}
            </span>
          </div>

          <mat-divider></mat-divider>

          <div class="profile-stats" *ngIf="profile()?.stats">
            <div class="stat">
              <span class="stat-value">{{ profile().stats.totalPoints }}</span>
              <span class="stat-label">Puntos</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile().stats.totalPredictions }}</span>
              <span class="stat-label">Predicciones</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ profile().stats.exactos }}</span>
              <span class="stat-label">Exactos 🌟</span>
            </div>
            <div class="stat">
              <span class="stat-value">#{{ profile().rankPosition }}</span>
              <span class="stat-label">Ranking</span>
            </div>
          </div>
        </div>

        <!-- Edit Forms -->
        <div class="edit-section">
          <mat-tab-group animationDuration="200ms">
            <mat-tab label="Editar Perfil">
              <div class="tab-content card-glass">
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nombre completo</mat-label>
                    <input matInput formControlName="fullName">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Username</mat-label>
                    <input matInput formControlName="username">
                  </mat-form-field>
                  <button mat-raised-button class="btn-gold" type="submit">Guardar Cambios</button>
                </form>
              </div>
            </mat-tab>

            <mat-tab label="Cambiar Contraseña">
              <div class="tab-content card-glass">
                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Contraseña actual</mat-label>
                    <input matInput type="password" formControlName="currentPassword">
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Nueva contraseña</mat-label>
                    <input matInput type="password" formControlName="newPassword">
                    <mat-hint>Mín 8 chars, 1 mayúscula, 1 número, 1 símbolo</mat-hint>
                  </mat-form-field>
                  <button mat-raised-button class="btn-gold" type="submit">Cambiar Contraseña</button>
                </form>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>

      <!-- Prediction History -->
      <h2 class="section-title" style="margin-top: 32px;">📋 Historial de Predicciones</h2>
      <div class="history-grid" *ngIf="predictions().length > 0">
        <div *ngFor="let pred of predictions()" class="history-card card-glass">
          <div class="history-match">
            <span>{{ pred.match?.homeTeam?.name }} vs {{ pred.match?.awayTeam?.name }}</span>
            <span class="badge badge-blue" style="font-size:0.65rem">{{ getPhaseLabel(pred.match?.phase) }}</span>
          </div>
          <div class="history-scores">
            <span>Pred: {{ pred.predictedHome }} - {{ pred.predictedAway }}</span>
            <span *ngIf="pred.match?.homeScore !== null">
              Real: {{ pred.match?.homeScore }} - {{ pred.match?.awayScore }}
            </span>
          </div>
          <div class="history-points" *ngIf="pred.points !== null">
            <span class="badge" [class]="getPointClass(pred.pointType)">
              {{ getPointIcon(pred.pointType) }} {{ pred.points }} pts
            </span>
          </div>
          <div *ngIf="pred.points === null" class="badge badge-blue">⏳ Pendiente</div>
        </div>
      </div>
      <div *ngIf="predictions().length === 0" class="empty-state card-glass">
        <p>No hay predicciones aún</p>
      </div>
    </div>
  `,
  styles: [`
    .profile-layout { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
    .profile-card { text-align: center; padding: 32px 24px; }
    .avatar-circle {
      width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 16px;
      background: linear-gradient(135deg, var(--green-primary), var(--green-light));
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1.8rem; color: #fff;
      border: 3px solid var(--gold);
    }
    .profile-name { font-family: 'Outfit'; font-weight: 700; margin: 0 0 4px; }
    .profile-username { color: var(--text-secondary); margin: 0 0 4px; }
    .profile-email { color: var(--text-muted); font-size: 0.85rem; margin: 0 0 8px; }
    .profile-stats {
      display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-top: 16px;
    }
    .stat { display: flex; flex-direction: column; }
    .stat-value { font-family: 'Outfit'; font-weight: 700; font-size: 1.3rem; color: var(--gold); }
    .stat-label { color: var(--text-muted); font-size: 0.75rem; }
    .tab-content { padding: 24px; margin-top: 16px; }
    .full-width { width: 100%; }
    .section-title { font-family: 'Outfit'; font-weight: 600; color: var(--text-primary); font-size: 1.2rem; }
    .history-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; margin-top: 12px; }
    .history-card { padding: 16px; }
    .history-match { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-weight: 500; font-size: 0.9rem; flex-wrap: wrap; gap: 4px; }
    .history-scores { display: flex; gap: 16px; color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px; }
    .empty-state { text-align: center; padding: 40px; color: var(--text-muted); }
    @media (max-width: 768px) { .profile-layout { grid-template-columns: 1fr; } }
  `],
})
export class ProfileComponent implements OnInit {
  profile = signal<any>(null);
  predictions = signal<Prediction[]>([]);
  profileForm: FormGroup;
  passwordForm: FormGroup;

  constructor(
    private fb: FormBuilder, private api: ApiService,
    private authService: AuthService, private snackBar: MatSnackBar,
  ) {
    this.profileForm = this.fb.group({ fullName: [''], username: [''] });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.api.getProfile().subscribe(res => {
      this.profile.set(res.data);
      this.profileForm.patchValue({ fullName: res.data.fullName, username: res.data.username });
    });
    this.api.getPredictionHistory().subscribe(res => this.predictions.set(res.data));
  }

  getInitials(): string {
    const name = this.profile()?.fullName || '';
    return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  }

  updateProfile() {
    this.api.updateProfile(this.profileForm.value).subscribe({
      next: (res) => {
        this.authService.updateLocalUser(res.data);
        this.snackBar.open('Perfil actualizado', 'OK', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  changePassword() {
    this.api.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.passwordForm.reset();
        this.snackBar.open('Contraseña actualizada', 'OK', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  getPhaseLabel(phase: string | undefined): string { return phase ? (PHASE_LABELS as any)[phase] || phase : ''; }
  getPointClass(type: string | null): string {
    switch(type) { case 'EXACT': return 'badge-gold'; case 'WINNER_DIFF': return 'badge-green'; case 'WINNER': return 'badge-blue'; default: return 'badge-red'; }
  }
  getPointIcon(type: string | null): string {
    switch(type) { case 'EXACT': return '🌟'; case 'WINNER_DIFF': return '✅'; case 'WINNER': return '👍'; default: return '❌'; }
  }
}
