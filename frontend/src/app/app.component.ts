import { Component, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatButtonModule, MatIconModule,
    MatSidenavModule, MatListModule, MatMenuModule,
  ],
  template: `
    <div class="app-layout" *ngIf="isAuthenticated(); else authLayout">
      <!-- Top Toolbar -->
      <mat-toolbar class="app-toolbar">
        <button mat-icon-button (click)="sidenavOpen = !sidenavOpen" class="menu-btn">
          <mat-icon>menu</mat-icon>
        </button>
        <div class="toolbar-brand" routerLink="/matches">
          <span class="brand-icon">⚽</span>
          <span class="brand-text">Polla Mundialista San Mateo</span>
        </div>
        <span class="toolbar-spacer"></span>
        <div class="toolbar-actions">
          <button mat-button routerLink="/matches" routerLinkActive="active-link" class="nav-btn">
            <mat-icon>sports_soccer</mat-icon>
            <span class="nav-label">Partidos</span>
          </button>
          <button mat-button routerLink="/groups" routerLinkActive="active-link" class="nav-btn">
            <mat-icon>groups</mat-icon>
            <span class="nav-label">Grupos</span>
          </button>
          <button mat-button routerLink="/ranking" routerLinkActive="active-link" class="nav-btn">
            <mat-icon>leaderboard</mat-icon>
            <span class="nav-label">Ranking</span>
          </button>
          <button mat-button *ngIf="isAdmin()" routerLink="/admin" routerLinkActive="active-link" class="nav-btn admin-btn">
            <mat-icon>admin_panel_settings</mat-icon>
            <span class="nav-label">Admin</span>
          </button>
        </div>
        <button mat-icon-button [matMenuTriggerFor]="userMenu" class="user-avatar-btn">
          <div class="user-avatar">{{ userInitials() }}</div>
        </button>
        <mat-menu #userMenu="matMenu">
          <div class="menu-header">
            <div class="menu-user-name">{{ currentUser()?.fullName }}</div>
            <div class="menu-user-role badge" [class.badge-gold]="isAdmin()" [class.badge-green]="!isAdmin()">
              {{ currentUser()?.role }}
            </div>
          </div>
          <mat-divider></mat-divider>
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Mi Perfil</span>
          </button>
          <button mat-menu-item (click)="onLogout()">
            <mat-icon>logout</mat-icon>
            <span>Cerrar Sesión</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <!-- Mobile Sidenav -->
      <mat-sidenav-container class="sidenav-container">
        <mat-sidenav #sidenav [opened]="sidenavOpen" mode="over" class="mobile-sidenav"
          (closedStart)="sidenavOpen = false">
          <div class="sidenav-header">
            <span class="brand-icon">⚽</span>
            <span class="brand-text">Polla Mundialista San Mateo</span>
          </div>
          <mat-nav-list>
            <a mat-list-item routerLink="/matches" routerLinkActive="active-link" (click)="sidenavOpen = false">
              <mat-icon matListItemIcon>sports_soccer</mat-icon>
              <span matListItemTitle>Partidos</span>
            </a>
            <a mat-list-item routerLink="/groups" routerLinkActive="active-link" (click)="sidenavOpen = false">
              <mat-icon matListItemIcon>groups</mat-icon>
              <span matListItemTitle>Grupos</span>
            </a>
            <a mat-list-item routerLink="/ranking" routerLinkActive="active-link" (click)="sidenavOpen = false">
              <mat-icon matListItemIcon>leaderboard</mat-icon>
              <span matListItemTitle>Ranking</span>
            </a>
            <a mat-list-item routerLink="/profile" routerLinkActive="active-link" (click)="sidenavOpen = false">
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>Mi Perfil</span>
            </a>
            <a mat-list-item *ngIf="isAdmin()" routerLink="/admin" routerLinkActive="active-link" (click)="sidenavOpen = false">
              <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
              <span matListItemTitle>Admin Panel</span>
            </a>
            <mat-divider></mat-divider>
            <a mat-list-item (click)="onLogout()">
              <mat-icon matListItemIcon>logout</mat-icon>
              <span matListItemTitle>Cerrar Sesión</span>
            </a>
          </mat-nav-list>
        </mat-sidenav>
        <mat-sidenav-content class="main-content">
          <router-outlet></router-outlet>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>

    <ng-template #authLayout>
      <router-outlet></router-outlet>
    </ng-template>
  `,
  styles: [`
    .app-layout { display: flex; flex-direction: column; height: 100vh; }

    .app-toolbar {
      background: linear-gradient(135deg, #0d2818 0%, #1a472a 50%, #0a1628 100%) !important;
      border-bottom: 1px solid var(--border-color);
      box-shadow: 0 2px 20px rgba(0,0,0,0.5);
      padding: 0 16px;
      height: 64px;
      z-index: 100;
      position: sticky;
      top: 0;
    }

    .menu-btn { display: none; color: var(--text-secondary); }

    .toolbar-brand {
      display: flex; align-items: center; gap: 10px; cursor: pointer;
      transition: var(--transition);
      &:hover { opacity: 0.9; }
    }

    .brand-icon { font-size: 1.6rem; }
    .brand-text {
      font-family: 'Outfit', sans-serif;
      font-weight: 700; font-size: 1.3rem;
      background: linear-gradient(135deg, #ffd700, #f59e0b);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }

    .toolbar-spacer { flex: 1; }

    .toolbar-actions { display: flex; gap: 4px; margin-right: 8px; }

    .nav-btn {
      color: var(--text-secondary) !important;
      border-radius: 8px !important;
      transition: var(--transition);
      display: flex; align-items: center; gap: 6px;
      &:hover { color: var(--text-primary) !important; background: rgba(255,255,255,0.05) !important; }
      &.active-link {
        color: var(--gold) !important;
        background: rgba(255, 215, 0, 0.08) !important;
      }
      .nav-label { font-size: 0.85rem; }
    }

    .admin-btn.active-link { color: var(--success) !important; background: rgba(34,197,94,0.08) !important; }

    .user-avatar-btn { margin-left: 4px; }
    .user-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--green-primary), var(--green-light));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.85rem; color: #fff;
      border: 2px solid var(--gold);
    }

    .menu-header { padding: 12px 16px; }
    .menu-user-name { font-weight: 600; margin-bottom: 4px; }

    .sidenav-container { flex: 1; }
    .main-content { background: var(--bg-primary); min-height: calc(100vh - 64px); }

    .mobile-sidenav {
      background: var(--bg-secondary) !important;
      width: 280px;
      border-right: 1px solid var(--border-color) !important;
    }

    .sidenav-header {
      display: flex; align-items: center; gap: 10px;
      padding: 20px; border-bottom: 1px solid var(--border-color);
    }

    @media (max-width: 768px) {
      .menu-btn { display: block; }
      .toolbar-actions { display: none; }
      .brand-text { font-size: 1rem; }
    }
  `],
})
export class AppComponent {
  sidenavOpen = false;
  currentUser = this.authService.currentUser;
  isAuthenticated = this.authService.isAuthenticated;
  isAdmin = this.authService.isAdmin;

  userInitials = computed(() => {
    const name = this.currentUser()?.fullName || '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  });

  constructor(private authService: AuthService) {}

  onLogout() {
    this.authService.logout();
  }
}
