import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card animate-scale-in">
        <div class="auth-header">
          <div class="auth-logo">⚽</div>
          <h1 class="auth-title">Crear Cuenta</h1>
          <p class="auth-subtitle">Únete a la Polla Mundialista</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre completo</mat-label>
            <input matInput formControlName="fullName">
            <mat-icon matPrefix>badge</mat-icon>
            <mat-error *ngIf="form.get('fullName')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Username</mat-label>
            <input matInput formControlName="username">
            <mat-icon matPrefix>alternate_email</mat-icon>
            <mat-error *ngIf="form.get('username')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="form.get('username')?.hasError('minlength')">Mínimo 3 caracteres</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" type="email">
            <mat-icon matPrefix>email</mat-icon>
            <mat-error *ngIf="form.get('email')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="form.get('email')?.hasError('email')">Email inválido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-hint>Mín 8 chars, 1 mayúscula, 1 número, 1 símbolo</mat-hint>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Requerido</mat-error>
            <mat-error *ngIf="form.get('password')?.hasError('pattern')">No cumple requisitos</mat-error>
          </mat-form-field>

          <button mat-raised-button class="btn-gold full-width submit-btn" type="submit" [disabled]="loading">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Registrarse</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>¿Ya tienes cuenta? <a routerLink="/login" class="auth-link">Inicia sesión</a></p>
        </div>
      </div>

      <div class="auth-decoration">
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--gradient-main); position: relative; overflow: hidden; padding: 24px;
    }
    .auth-card {
      background: var(--gradient-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-xl); padding: 40px;
      width: 100%; max-width: 480px; position: relative; z-index: 2;
      box-shadow: var(--shadow-lg);
    }
    .auth-header { text-align: center; margin-bottom: 24px; }
    .auth-logo { font-size: 3rem; margin-bottom: 8px; }
    .auth-title {
      font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.6rem;
      background: var(--gradient-gold);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0 0 6px;
    }
    .auth-subtitle { color: var(--text-secondary); font-size: 0.9rem; margin: 0; }
    .auth-form { display: flex; flex-direction: column; gap: 4px; }
    .full-width { width: 100%; }
    .submit-btn { height: 48px; font-size: 1rem; margin-top: 8px; border-radius: var(--radius-sm) !important; }
    .auth-footer { text-align: center; margin-top: 20px; color: var(--text-secondary); p { margin: 0; } }
    .auth-link { color: var(--gold); text-decoration: none; font-weight: 600; &:hover { text-decoration: underline; } }
    .auth-decoration { position: absolute; inset: 0; pointer-events: none; }
    .deco-circle { position: absolute; border-radius: 50%; background: radial-gradient(circle, rgba(26,71,42,0.3), transparent 70%); }
    .deco-1 { width: 400px; height: 400px; top: -100px; right: -100px; }
    .deco-2 { width: 300px; height: 300px; bottom: -50px; left: -80px; background: radial-gradient(circle, rgba(255,215,0,0.08), transparent 70%); }
  `],
})
export class RegisterComponent {
  form: FormGroup;
  loading = false;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/),
      ]],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;

    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Cuenta creada. Inicia sesión.', 'OK', { duration: 4000, panelClass: 'snack-success' });
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Error al registrar';
        this.snackBar.open(msg, 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }
}
