import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ApiService } from '../shared/api.service';
import { AuthService } from '../auth/services/auth.service';
import { RankingEntry, Phase, PHASE_LABELS } from '../shared/models';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatTableModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, MatPaginatorModule,
  ],
  template: `
    <div class="page-container">
      <h1 class="page-title">🏅 Ranking Global</h1>

      <!-- My Position Card -->
      <div class="my-position card-glass animate-fade-in-up" *ngIf="myPosition()">
        <div class="pos-icon">🏆</div>
        <div class="pos-info">
          <span class="pos-label">Tu posición</span>
          <span class="pos-number">#{{ myPosition()?.position || '-' }}</span>
        </div>
        <div class="pos-info">
          <span class="pos-label">Puntos</span>
          <span class="pos-points">{{ myPosition()?.totalPoints || 0 }}</span>
        </div>
        <div class="pos-info">
          <span class="pos-label">Participantes</span>
          <span class="pos-total">{{ myPosition()?.totalUsers || 0 }}</span>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters card-glass">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Buscar usuario</mat-label>
          <input matInput [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Username...">
          <mat-icon matPrefix>search</mat-icon>
        </mat-form-field>

        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>Filtrar por fase</mat-label>
          <mat-select [(ngModel)]="selectedPhase" (ngModelChange)="loadRanking()">
            <mat-option value="">Todas las fases</mat-option>
            <mat-option *ngFor="let p of phases" [value]="p">{{ phaseLabels[p] }}</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <!-- Ranking Table -->
      <div *ngIf="loading()" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
      </div>

      <div *ngIf="!loading()" class="ranking-table-wrap card-glass animate-fade-in-up">
        <table mat-table [dataSource]="rankings()" class="ranking-table">
          <ng-container matColumnDef="position">
            <th mat-header-cell *matHeaderCellDef>#</th>
            <td mat-cell *matCellDef="let row">
              <span class="position-badge" [class.gold]="row.position === 1"
                [class.silver]="row.position === 2" [class.bronze]="row.position === 3">
                {{ row.position <= 3 ? getMedal(row.position) : row.position }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="avatar">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let row">
              <div class="rank-avatar">{{ getInitials(row.fullName) }}</div>
            </td>
          </ng-container>

          <ng-container matColumnDef="username">
            <th mat-header-cell *matHeaderCellDef>Usuario</th>
            <td mat-cell *matCellDef="let row">
              <div class="user-info">
                <span class="user-name">{{ row.fullName }}</span>
                <span class="user-handle">{{ '@' + row.username }}</span>
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="exactos">
            <th mat-header-cell *matHeaderCellDef>🌟 5pts</th>
            <td mat-cell *matCellDef="let row">{{ row.exactos }}</td>
          </ng-container>

          <ng-container matColumnDef="winnerDiff">
            <th mat-header-cell *matHeaderCellDef>✅ 3pts</th>
            <td mat-cell *matCellDef="let row">{{ row.winnerDiff }}</td>
          </ng-container>

          <ng-container matColumnDef="winnerOnly">
            <th mat-header-cell *matHeaderCellDef>👍 1pt</th>
            <td mat-cell *matCellDef="let row">{{ row.winnerOnly }}</td>
          </ng-container>

          <ng-container matColumnDef="totalPoints">
            <th mat-header-cell *matHeaderCellDef>Total</th>
            <td mat-cell *matCellDef="let row" class="total-points">{{ row.totalPoints }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"
            [class.my-row]="row.userId === currentUserId()"></tr>
        </table>

        <mat-paginator [length]="totalItems" [pageSize]="20" [pageSizeOptions]="[10, 20, 50]"
          (page)="onPage($event)" showFirstLastButtons>
        </mat-paginator>
      </div>
    </div>
  `,
  styles: [`
    .my-position {
      display: flex; align-items: center; gap: 32px; padding: 20px 28px; margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .pos-icon { font-size: 2.5rem; }
    .pos-info { display: flex; flex-direction: column; }
    .pos-label { color: var(--text-muted); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .pos-number { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--gold); }
    .pos-points { font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800; color: var(--success); }
    .pos-total { font-family: 'Outfit', sans-serif; font-size: 1.5rem; font-weight: 600; color: var(--text-secondary); }

    .filters { display: flex; gap: 16px; margin-bottom: 20px; padding: 16px 20px; flex-wrap: wrap; }
    .filter-field { flex: 1; min-width: 200px; }

    .ranking-table-wrap { padding: 0; overflow: hidden; }
    .ranking-table {
      width: 100%; background: transparent !important;
      th { color: var(--text-secondary) !important; font-weight: 600; font-size: 0.8rem; }
      td { border-bottom-color: var(--border-color) !important; }
    }

    .position-badge {
      font-weight: 700; font-size: 1rem;
      &.gold { color: #ffd700; font-size: 1.3rem; }
      &.silver { color: #c0c0c0; font-size: 1.2rem; }
      &.bronze { color: #cd7f32; font-size: 1.1rem; }
    }

    .rank-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, var(--green-primary), var(--green-light));
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 0.75rem; color: #fff;
    }

    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 600; font-size: 0.9rem; }
    .user-handle { color: var(--text-muted); font-size: 0.8rem; }

    .total-points { font-weight: 800; font-size: 1.1rem; color: var(--gold); }

    .my-row {
      background: rgba(255, 215, 0, 0.06) !important;
      border-left: 3px solid var(--gold);
    }

    .loading-container { display: flex; justify-content: center; padding: 80px 0; }
  `],
})
export class RankingComponent implements OnInit {
  phases: Phase[] = ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER', 'SEMI', 'THIRD', 'FINAL'];
  phaseLabels = PHASE_LABELS;
  displayedColumns = ['position', 'avatar', 'username', 'exactos', 'winnerDiff', 'winnerOnly', 'totalPoints'];

  loading = signal(false);
  rankings = signal<RankingEntry[]>([]);
  myPosition = signal<any>(null);
  currentUserId = computed(() => this.authService.currentUser()?.id || '');

  searchQuery = '';
  selectedPhase = '';
  totalItems = 0;
  currentPage = 1;

  private searchTimeout: any;

  constructor(private api: ApiService, private authService: AuthService) {}

  ngOnInit() {
    this.loadRanking();
    this.loadMyPosition();
  }

  loadRanking() {
    this.loading.set(true);
    this.api.getRanking(this.currentPage, 20, this.selectedPhase || undefined, this.searchQuery || undefined).subscribe({
      next: (res) => {
        this.rankings.set(res.data.rankings);
        this.totalItems = res.data.total;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadMyPosition() {
    this.api.getMyPosition().subscribe({
      next: (res) => this.myPosition.set(res.data),
    });
  }

  onSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadRanking();
    }, 400);
  }

  onPage(event: PageEvent) {
    this.currentPage = event.pageIndex + 1;
    this.loadRanking();
  }

  getMedal(pos: number): string {
    return pos === 1 ? '🥇' : pos === 2 ? '🥈' : '🥉';
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
