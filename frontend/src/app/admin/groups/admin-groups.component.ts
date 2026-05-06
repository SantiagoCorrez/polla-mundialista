import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../shared/api.service';
import { TeamStanding, GROUP_LABELS } from '../../shared/models';

@Component({
  selector: 'app-admin-groups',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">🏆 Gestión de Grupos</h1>
      <p style="color:var(--text-secondary);margin-bottom:24px">
        Visualiza las tablas de posiciones y marca los clasificados para la fase eliminatoria.
      </p>

      <div *ngIf="loading()" class="loading"><mat-spinner diameter="40"></mat-spinner></div>

      <div *ngIf="!loading()" class="groups-grid">
        <div *ngFor="let group of groups" class="group-section card-glass">
          <h3 style="font-family:'Outfit';color:var(--gold);margin:0 0 12px">Grupo {{ group }}</h3>
          <table mat-table [dataSource]="getStandings(group)" class="standings-table" style="width:100%;background:transparent !important">
            <ng-container matColumnDef="team">
              <th mat-header-cell *matHeaderCellDef>Equipo</th>
              <td mat-cell *matCellDef="let r" style="display:flex;align-items:center;gap:6px">
                <img [src]="r.flagUrl" style="width:20px;height:14px;border-radius:2px" onerror="this.src='https://flagcdn.com/w40/xx.png'">
                {{ r.teamName }}
              </td>
            </ng-container>
            <ng-container matColumnDef="pj"><th mat-header-cell *matHeaderCellDef>PJ</th><td mat-cell *matCellDef="let r">{{ r.played }}</td></ng-container>
            <ng-container matColumnDef="dg"><th mat-header-cell *matHeaderCellDef>DG</th><td mat-cell *matCellDef="let r">{{ r.goalDifference }}</td></ng-container>
            <ng-container matColumnDef="pts"><th mat-header-cell *matHeaderCellDef>Pts</th><td mat-cell *matCellDef="let r" style="font-weight:700;color:var(--gold)">{{ r.points }}</td></ng-container>
            <tr mat-header-row *matHeaderRowDef="['team','pj','dg','pts']"></tr>
            <tr mat-row *matRowDef="let row; columns: ['team','pj','dg','pts']; let i = index" [class.qualify-zone]="i < 2"></tr>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .groups-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap:16px; }
    .group-section { padding:20px; }
    .standings-table th { color:var(--text-secondary) !important; font-size:0.75rem; padding:6px !important; }
    .standings-table td { padding:6px !important; font-size:0.85rem; border-bottom-color:var(--border-color) !important; }
    .qualify-zone { background:rgba(34,197,94,0.06) !important; border-left:3px solid var(--success); }
    .loading { display:flex; justify-content:center; padding:80px; }
  `],
})
export class AdminGroupsComponent implements OnInit {
  groups = GROUP_LABELS;
  loading = signal(false);
  allStandings = signal<Record<string, TeamStanding[]>>({});

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loading.set(true);
    this.api.getAllGroupStandings().subscribe({
      next: (res) => { this.allStandings.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  getStandings(group: string): TeamStanding[] { return this.allStandings()[group] || []; }
}
