import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './auth/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'matches', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'matches',
    canActivate: [authGuard],
    loadComponent: () => import('./matches/matches.component').then(m => m.MatchesComponent),
  },
  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () => import('./groups/groups.component').then(m => m.GroupsComponent),
  },
  {
    path: 'ranking',
    canActivate: [authGuard],
    loadComponent: () => import('./ranking/ranking.component').then(m => m.RankingComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./admin/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./admin/users/users.component').then(m => m.AdminUsersComponent),
      },
      {
        path: 'matches',
        loadComponent: () => import('./admin/matches/admin-matches.component').then(m => m.AdminMatchesComponent),
      },
      {
        path: 'groups',
        loadComponent: () => import('./admin/groups/admin-groups.component').then(m => m.AdminGroupsComponent),
      },
      {
        path: 'reports',
        loadComponent: () => import('./admin/reports/reports.component').then(m => m.AdminReportsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'matches' },
];
