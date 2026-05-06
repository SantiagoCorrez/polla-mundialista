import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../shared/api.service';
import { TeamStanding, GROUP_LABELS } from '../shared/models';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatTableModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">🏆 Tablas de Grupos</h1>

      <div *ngIf="loading()" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading()" class="groups-grid">
        <div *ngFor="let group of groups" class="group-card card-glass animate-fade-in-up">
          <h3 class="group-title">Grupo {{ group }}</h3>

          <div class="table-responsive">
            <table mat-table [dataSource]="getStandings(group)" class="standings-table">
              <ng-container matColumnDef="team">
                <th mat-header-cell *matHeaderCellDef>Equipo</th>
                <td mat-cell *matCellDef="let row" class="team-cell">
                  <img [src]="row.flagUrl" class="mini-flag" loading="lazy"
                    onerror="this.src='https://flagcdn.com/w40/xx.png'">
                  <span>{{ row.teamName }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="played">
                <th mat-header-cell *matHeaderCellDef>PJ</th>
                <td mat-cell *matCellDef="let row">{{ row.played }}</td>
              </ng-container>

              <ng-container matColumnDef="won">
                <th mat-header-cell *matHeaderCellDef>PG</th>
                <td mat-cell *matCellDef="let row">{{ row.won }}</td>
              </ng-container>

              <ng-container matColumnDef="drawn">
                <th mat-header-cell *matHeaderCellDef>PE</th>
                <td mat-cell *matCellDef="let row">{{ row.drawn }}</td>
              </ng-container>

              <ng-container matColumnDef="lost">
                <th mat-header-cell *matHeaderCellDef>PP</th>
                <td mat-cell *matCellDef="let row">{{ row.lost }}</td>
              </ng-container>

              <ng-container matColumnDef="gf">
                <th mat-header-cell *matHeaderCellDef>GF</th>
                <td mat-cell *matCellDef="let row">{{ row.goalsFor }}</td>
              </ng-container>

              <ng-container matColumnDef="gc">
                <th mat-header-cell *matHeaderCellDef>GC</th>
                <td mat-cell *matCellDef="let row">{{ row.goalsAgainst }}</td>
              </ng-container>

              <ng-container matColumnDef="gd">
                <th mat-header-cell *matHeaderCellDef>DG</th>
                <td mat-cell *matCellDef="let row" [class.positive]="row.goalDifference > 0"
                  [class.negative]="row.goalDifference < 0">
                  {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                </td>
              </ng-container>

              <ng-container matColumnDef="points">
                <th mat-header-cell *matHeaderCellDef>Pts</th>
                <td mat-cell *matCellDef="let row" class="points-cell">{{ row.points }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns; let i = index"
                [class.qualify-zone]="i < 2"></tr>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .groups-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
      gap: 20px;
    }

    .group-card { padding: 20px; }

    .group-title {
      font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1.2rem;
      color: var(--gold); margin-bottom: 12px;
    }

    .table-responsive { overflow-x: auto; }

    .standings-table {
      width: 100%; background: transparent !important;
      th { color: var(--text-secondary) !important; font-weight: 600; font-size: 0.75rem; padding: 8px 6px !important; }
      td { padding: 8px 6px !important; font-size: 0.85rem; border-bottom-color: var(--border-color) !important; }
    }

    .team-cell {
      display: flex; align-items: center; gap: 8px;
    }

    .mini-flag { width: 24px; height: 16px; border-radius: 2px; object-fit: cover; }

    .points-cell { font-weight: 700; color: var(--gold); }
    .positive { color: var(--success); }
    .negative { color: var(--danger); }

    .qualify-zone {
      background: rgba(34, 197, 94, 0.06) !important;
      border-left: 3px solid var(--success);
    }

    .loading-container { display: flex; justify-content: center; padding: 80px 0; }

    @media (max-width: 480px) {
      .groups-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class GroupsComponent implements OnInit {
  groups = GROUP_LABELS;
  displayedColumns = ['team', 'played', 'won', 'drawn', 'lost', 'gf', 'gc', 'gd', 'points'];
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

  getStandings(group: string): TeamStanding[] {
    return this.allStandings()[group] || [];
  }
}
