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
  selector: 'app-login',
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
          <h1 class="auth-title">Polla Mundialista</h1>
          <p class="auth-subtitle">Inicia sesión para predecir</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="auth-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email o Username</mat-label>
            <input matInput formControlName="identifier" placeholder="tu@email.com">
            <mat-icon matPrefix>person</mat-icon>
            <mat-error *ngIf="form.get('identifier')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Contraseña</mat-label>
            <input matInput [type]="hidePassword ? 'password' : 'text'" formControlName="password">
            <mat-icon matPrefix>lock</mat-icon>
            <button mat-icon-button matSuffix (click)="hidePassword = !hidePassword" type="button">
              <mat-icon>{{ hidePassword ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            <mat-error *ngIf="form.get('password')?.hasError('required')">Requerido</mat-error>
          </mat-form-field>

          <button mat-raised-button class="btn-gold full-width submit-btn" type="submit" [disabled]="loading">
            <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
            <span *ngIf="!loading">Iniciar Sesión</span>
          </button>
        </form>

        <div class="auth-footer">
          <p>¿No tienes cuenta? <a routerLink="/register" class="auth-link">Regístrate</a></p>
        </div>
      </div>

      <div class="auth-decoration">
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
        <div class="deco-circle deco-3"></div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
      background: var(--gradient-main); position: relative; overflow: hidden;
      padding: 24px;
    }

    .auth-card {
      background: var(--gradient-card); border: 1px solid var(--border-color);
      border-radius: var(--radius-xl); padding: 48px 40px;
      width: 100%; max-width: 440px; position: relative; z-index: 2;
      box-shadow: var(--shadow-lg);
    }

    .auth-header { text-align: center; margin-bottom: 32px; }

    .auth-logo {
      font-size: 3.5rem; margin-bottom: 12px;
      filter: drop-shadow(0 4px 12px rgba(255, 215, 0, 0.3));
    }

    .auth-title {
      font-family: 'Outfit', sans-serif; font-weight: 800; font-size: 1.8rem;
      background: var(--gradient-gold);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin: 0 0 8px;
    }

    .auth-subtitle { color: var(--text-secondary); font-size: 0.95rem; margin: 0; }

    .auth-form { display: flex; flex-direction: column; gap: 8px; }
    .full-width { width: 100%; }

    .submit-btn {
      height: 48px; font-size: 1rem; margin-top: 8px;
      border-radius: var(--radius-sm) !important;
    }

    .auth-footer {
      text-align: center; margin-top: 24px; color: var(--text-secondary);
      p { margin: 0; }
    }

    .auth-link {
      color: var(--gold); text-decoration: none; font-weight: 600;
      &:hover { text-decoration: underline; }
    }

    .auth-decoration { position: absolute; inset: 0; pointer-events: none; }
    .deco-circle {
      position: absolute; border-radius: 50%;
      background: radial-gradient(circle, rgba(26, 71, 42, 0.3), transparent 70%);
    }
    .deco-1 { width: 400px; height: 400px; top: -100px; right: -100px; }
    .deco-2 { width: 300px; height: 300px; bottom: -50px; left: -80px; background: radial-gradient(circle, rgba(255,215,0,0.08), transparent 70%); }
    .deco-3 { width: 200px; height: 200px; top: 40%; left: 10%; background: radial-gradient(circle, rgba(45,107,63,0.15), transparent 70%); }

    @media (max-width: 480px) {
      .auth-card { padding: 32px 24px; }
      .auth-title { font-size: 1.5rem; }
    }
  `],
})
export class LoginComponent {
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
      identifier: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    const { identifier, password } = this.form.value;

    this.authService.login(identifier, password).subscribe({
      next: () => {
        this.snackBar.open('¡Bienvenido!', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.router.navigate(['/matches']);
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.message || 'Error al iniciar sesión';
        this.snackBar.open(msg, 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }
}
