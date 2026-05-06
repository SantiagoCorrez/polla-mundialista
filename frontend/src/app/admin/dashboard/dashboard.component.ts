import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../shared/api.service';
import { DashboardStats } from '../../shared/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">🛡️ Panel de Administración</h1>

      <div *ngIf="loading()" class="loading-container"><mat-spinner diameter="40"></mat-spinner></div>

      <div *ngIf="!loading() && stats()" class="dashboard">
        <!-- Stat Cards -->
        <div class="stats-grid">
          <div class="stat-card card-glass animate-fade-in-up">
            <div class="stat-icon" style="background: rgba(59,130,246,0.15); color: var(--info);">
              <mat-icon>people</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()!.totalUsers }}</span>
              <span class="stat-label">Usuarios</span>
            </div>
          </div>

          <div class="stat-card card-glass animate-fade-in-up" style="animation-delay: 100ms">
            <div class="stat-icon" style="background: rgba(34,197,94,0.15); color: var(--success);">
              <mat-icon>analytics</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()!.totalPredictions }}</span>
              <span class="stat-label">Predicciones</span>
            </div>
          </div>

          <div class="stat-card card-glass animate-fade-in-up" style="animation-delay: 200ms">
            <div class="stat-icon" style="background: rgba(255,215,0,0.15); color: var(--gold);">
              <mat-icon>sports_soccer</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()!.percentFinished }}%</span>
              <span class="stat-label">Partidos finalizados</span>
            </div>
          </div>

          <div class="stat-card card-glass animate-fade-in-up" style="animation-delay: 300ms">
            <div class="stat-icon" style="background: rgba(239,68,68,0.15); color: var(--danger);">
              <mat-icon>trending_up</mat-icon>
            </div>
            <div class="stat-content">
              <span class="stat-number">{{ stats()!.averagePointsPerUser }}</span>
              <span class="stat-label">Promedio pts/usuario</span>
            </div>
          </div>
        </div>

        <!-- Most predicted match -->
        <div class="info-card card-glass" *ngIf="stats()!.matchWithMostPredictions">
          <h3>⭐ Partido con más predicciones</h3>
          <p>{{ stats()!.matchWithMostPredictions!.matchName }} — {{ stats()!.matchWithMostPredictions!.predictionCount }} predicciones</p>
        </div>

        <!-- Last match distribution -->
        <div class="info-card card-glass" *ngIf="stats()!.lastMatchDistribution">
          <h3>📊 Distribución último partido: {{ stats()!.lastMatchDistribution!.match }}</h3>
          <div class="dist-grid">
            <div *ngFor="let d of stats()!.lastMatchDistribution!.distribution" class="dist-item">
              <span class="dist-type badge" [class]="getDistClass(d.type)">{{ d.type }}</span>
              <span class="dist-count">{{ d.count }} usuarios</span>
            </div>
          </div>
        </div>

        <!-- Quick Links -->
        <div class="quick-links">
          <a mat-raised-button routerLink="/admin/users" class="quick-link">
            <mat-icon>manage_accounts</mat-icon> Gestionar Usuarios
          </a>
          <a mat-raised-button routerLink="/admin/matches" class="quick-link">
            <mat-icon>edit_calendar</mat-icon> Gestionar Partidos
          </a>
          <a mat-raised-button routerLink="/admin/groups" class="quick-link">
            <mat-icon>groups</mat-icon> Gestionar Grupos
          </a>
          <a mat-raised-button routerLink="/admin/reports" class="quick-link">
            <mat-icon>download</mat-icon> Reportes
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .stat-card { display: flex; align-items: center; gap: 16px; padding: 20px; }
    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
    .stat-number { font-family: 'Outfit'; font-weight: 800; font-size: 1.8rem; color: var(--text-primary); }
    .stat-label { color: var(--text-muted); font-size: 0.8rem; }
    .stat-content { display: flex; flex-direction: column; }
    .info-card { padding: 20px; margin-bottom: 16px; h3 { font-family: 'Outfit'; font-weight: 600; margin: 0 0 12px; font-size: 1rem; } p { color: var(--text-secondary); margin: 0; } }
    .dist-grid { display: flex; gap: 16px; flex-wrap: wrap; }
    .dist-item { display: flex; align-items: center; gap: 8px; }
    .dist-count { color: var(--text-secondary); font-size: 0.85rem; }
    .quick-links { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px; }
    .quick-link {
      background: var(--bg-surface) !important; color: var(--text-primary) !important;
      border: 1px solid var(--border-color) !important; border-radius: var(--radius-sm) !important;
      padding: 12px 20px !important; display: flex; align-items: center; gap: 8px;
      text-decoration: none; transition: var(--transition);
      &:hover { border-color: var(--gold); box-shadow: var(--shadow-gold); }
    }
    .loading-container { display: flex; justify-content: center; padding: 80px 0; }
  `],
})
export class DashboardComponent implements OnInit {
  loading = signal(false);
  stats = signal<DashboardStats | null>(null);

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loading.set(true);
    this.api.getDashboardStats().subscribe({
      next: (res) => { this.stats.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getDistClass(type: string): string {
    switch(type) { case 'EXACT': return 'badge-gold'; case 'WINNER_DIFF': return 'badge-green'; case 'WINNER': return 'badge-blue'; default: return 'badge-red'; }
  }
}
