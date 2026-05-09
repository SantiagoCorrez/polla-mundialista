import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from '../shared/api.service';
import { Match, Prediction, Phase, PHASE_LABELS, GROUP_LABELS, Team } from '../shared/models';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-matches',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatTabsModule, MatCardModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatSnackBarModule, MatDialogModule,
    MatProgressSpinnerModule, MatBadgeModule,
  ],
  template: `
    <div class="page-container">
      <h1 class="page-title">⚽ Partidos y Predicciones</h1>

      <!-- Phase Tabs -->
      <mat-tab-group (selectedTabChange)="onPhaseChange($event)" animationDuration="300ms"
        class="phase-tabs" [selectedIndex]="selectedPhaseIndex">
        <mat-tab *ngFor="let phase of phases" [label]="phaseLabels[phase]">
          <!-- Group sub-tabs for GROUP_STAGE -->
          <div *ngIf="phase === 'GROUP_STAGE'" class="group-chips">
            <mat-chip-listbox (change)="onGroupChange($event.value)">
              <mat-chip-option *ngFor="let g of groups" [value]="g"
                [selected]="selectedGroup === g" color="accent">
                Grupo {{ g }}
              </mat-chip-option>
            </mat-chip-listbox>
          </div>

          <!-- Loading -->
          <div *ngIf="loading()" class="loading-container">
            <mat-spinner diameter="40"></mat-spinner>
          </div>

          <!-- Match Cards -->
          <div *ngIf="!loading()" class="matches-grid">
            <div *ngFor="let match of filteredMatches(); let i = index"
              class="match-card card-glass animate-fade-in-up"
              [style.animation-delay]="i * 50 + 'ms'">

              <!-- Match Header -->
              <div class="match-header">
                <span class="match-phase-badge badge"
                  [class.badge-green]="match.status === 'SCHEDULED'"
                  [class.badge-gold]="match.status === 'LIVE'"
                  [class.badge-blue]="match.status === 'FINISHED'">
                  {{ match.status === 'SCHEDULED' ? '🗓️ Programado' : match.status === 'LIVE' ? '🔴 En Vivo' : '✅ Finalizado' }}
                </span>
                <span class="match-date">{{ match.matchDate | date:'dd MMM yyyy, HH:mm' }}</span>
              </div>

              <!-- Teams -->
              <div class="match-teams">
                <div class="team">
                  <img [src]="match.homeTeam.flagUrl" [alt]="match.homeTeam.name"
                    class="team-flag" loading="lazy"
                    onerror="this.src='https://flagcdn.com/w80/xx.png'">
                  <span class="team-name">{{ match.homeTeam.name }}</span>
                </div>

                <div class="match-score">
                  <div *ngIf="match.status === 'FINISHED' || match.status === 'LIVE'" class="score-display">
                    <span class="score">{{ match.homeScore }}</span>
                    <span class="score-divider">-</span>
                    <span class="score">{{ match.awayScore }}</span>
                  </div>
                  <div *ngIf="match.status === 'SCHEDULED'" class="vs-display">VS</div>
                </div>

                <div class="team">
                  <img [src]="match.awayTeam.flagUrl" [alt]="match.awayTeam.name"
                    class="team-flag" loading="lazy"
                    onerror="this.src='https://flagcdn.com/w80/xx.png'">
                  <span class="team-name">{{ match.awayTeam.name }}</span>
                </div>
              </div>

              <!-- Stadium -->
              <div *ngIf="match.stadium" class="match-stadium">
                <mat-icon>stadium</mat-icon>
                <span>{{ match.stadium }}</span>
              </div>

              <!-- Prediction Form -->
              <div class="prediction-section" *ngIf="match.status === 'SCHEDULED'">
                <div *ngIf="isMatchLocked(match.matchDate)" class="badge badge-red" style="margin-bottom: 12px; display: inline-block;">
                  🔒 Bloqueado: Falta menos de 3 horas
                </div>

                <div class="pred-form" *ngIf="!getPrediction(match.id) && !isMatchLocked(match.matchDate)">
                  <span class="pred-label">Tu predicción:</span>
                  <div class="pred-inputs">
                    <input type="number" min="0" max="20" [(ngModel)]="predInputs[match.id + '_home']"
                      class="pred-input" placeholder="0">
                    <span class="pred-dash">-</span>
                    <input type="number" min="0" max="20" [(ngModel)]="predInputs[match.id + '_away']"
                      class="pred-input" placeholder="0">
                    <button mat-mini-fab color="accent" (click)="submitPrediction(match.id)" class="pred-btn">
                      <mat-icon>send</mat-icon>
                    </button>
                  </div>
                </div>

                <div class="pred-existing" *ngIf="getPrediction(match.id) as pred">
                  <span class="pred-label">✅ Tu predicción:</span>
                  <div class="pred-result">
                    <span class="pred-score">{{ pred.predictedHome }} - {{ pred.predictedAway }}</span>
                    <button *ngIf="!isMatchLocked(match.matchDate)" mat-icon-button (click)="enableEdit(match.id, pred)" class="edit-btn">
                      <mat-icon>edit</mat-icon>
                    </button>
                  </div>
                </div>

                <!-- Edit form -->
                <div class="pred-form" *ngIf="editingMatch === match.id">
                  <span class="pred-label">Editar:</span>
                  <div class="pred-inputs">
                    <input type="number" min="0" max="20" [(ngModel)]="predInputs[match.id + '_home']"
                      class="pred-input" placeholder="0">
                    <span class="pred-dash">-</span>
                    <input type="number" min="0" max="20" [(ngModel)]="predInputs[match.id + '_away']"
                      class="pred-input" placeholder="0">
                    <button mat-mini-fab color="accent" (click)="updatePrediction(match.id)" class="pred-btn">
                      <mat-icon>check</mat-icon>
                    </button>
                    <button mat-icon-button (click)="editingMatch = ''" class="cancel-btn">
                      <mat-icon>close</mat-icon>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Finished: Show result -->
              <div class="prediction-result" *ngIf="match.status === 'FINISHED' && getPrediction(match.id) as pred">
                <div class="result-row">
                  <span class="pred-label">Tu predicción: {{ pred.predictedHome }} - {{ pred.predictedAway }}</span>
                  <span class="points-badge"
                    [class]="'badge ' + getPointBadgeClass(pred.pointType)">
                    {{ getPointIcon(pred.pointType) }} {{ pred.points }} pts
                  </span>
                </div>
              </div>

              <div class="prediction-result no-pred" *ngIf="match.status === 'FINISHED' && !getPrediction(match.id)">
                <span class="badge badge-red">❌ No predijiste</span>
              </div>
            </div>

            <div *ngIf="filteredMatches().length === 0 && !loading()" class="empty-state">
              <mat-icon>sports_soccer</mat-icon>
              <p>No hay partidos en esta fase</p>
            </div>
          </div>
        </mat-tab>

        <!-- TOP 4 Y GOLEADOR TAB -->
        <mat-tab label="🏆 Top 4 y Goleador">
          <div class="matches-grid">
            <div class="match-card card-glass animate-fade-in-up" style="grid-column: 1 / -1; max-width: 600px; margin: 0 auto; padding: 30px;">
              <div style="text-align:center; margin-bottom: 24px;">
                <h2 style="color:var(--gold); font-family:'Outfit'">Predicciones Finales</h2>
                <p style="color:var(--text-secondary); font-size:0.9rem">Elige tus 4 mejores del torneo y al máximo goleador.</p>
                
                <div *ngIf="isLocked" class="badge badge-red" style="margin-top:12px; display:inline-block">
                  🔒 Bloqueado: El torneo ya comenzó
                </div>
              </div>

              <form *ngIf="top4Form" [formGroup]="top4Form" (ngSubmit)="submitTop4()" style="display:flex; flex-direction:column; gap:16px;">
                <mat-form-field appearance="outline">
                  <mat-label>🏆 Campeón</mat-label>
                  <mat-select formControlName="championId">
                     <mat-option *ngFor="let team of allTeams" [value]="team.id">{{ team.name }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>🥈 Subcampeón</mat-label>
                  <mat-select formControlName="runnerUpId">
                     <mat-option *ngFor="let team of allTeams" [value]="team.id">{{ team.name }}</mat-option>
                  </mat-select>
                </mat-form-field>

                 <mat-form-field appearance="outline">
                  <mat-label>🥉 Tercer Lugar</mat-label>
                  <mat-select formControlName="thirdPlaceId">
                     <mat-option *ngFor="let team of allTeams" [value]="team.id">{{ team.name }}</mat-option>
                  </mat-select>
                </mat-form-field>

                 <mat-form-field appearance="outline">
                  <mat-label>🏅 Cuarto Lugar</mat-label>
                  <mat-select formControlName="fourthPlaceId">
                     <mat-option *ngFor="let team of allTeams" [value]="team.id">{{ team.name }}</mat-option>
                  </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline">
                  <mat-label>⚽ Máximo Goleador (Nombre del jugador)</mat-label>
                  <input matInput formControlName="topScorer" placeholder="Ej. Kylian Mbappé">
                </mat-form-field>

                <button mat-raised-button class="btn-gold" type="submit" [disabled]="top4Form.invalid || isLocked || savingTop4" style="margin-top:10px; padding:12px">
                  <mat-spinner *ngIf="savingTop4" diameter="20" style="display:inline-block; vertical-align:middle; margin-right:8px;"></mat-spinner>
                  Guardar Predicciones Extras
                </button>
              </form>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .phase-tabs ::ng-deep .mat-mdc-tab-labels { gap: 4px; }
    .phase-tabs ::ng-deep .mat-mdc-tab { min-width: auto; }

    .group-chips { padding: 16px 0; }
    .group-chips mat-chip-listbox { display: flex; flex-wrap: wrap; gap: 8px; }

    .loading-container { display: flex; justify-content: center; padding: 80px 0; }

    .matches-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 20px; padding: 16px 0;
    }

    .match-card { padding: 20px; }

    .match-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 16px; flex-wrap: wrap; gap: 8px;
    }

    .match-date { color: var(--text-secondary); font-size: 0.85rem; }

    .match-teams {
      display: flex; align-items: center; justify-content: space-between;
      gap: 16px; margin-bottom: 12px;
    }

    .team {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      flex: 1; text-align: center;
    }

    .team-flag {
      width: 48px; height: 32px; border-radius: 4px; object-fit: cover;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .team-name { font-weight: 600; font-size: 0.9rem; }

    .match-score { flex-shrink: 0; }

    .score-display {
      display: flex; align-items: center; gap: 8px;
    }

    .score {
      font-family: 'Outfit', sans-serif; font-size: 2rem; font-weight: 800;
      color: var(--gold);
    }

    .score-divider { color: var(--text-muted); font-size: 1.5rem; }

    .vs-display {
      font-family: 'Outfit', sans-serif; font-size: 1.2rem; font-weight: 700;
      color: var(--text-muted); padding: 8px 16px;
      border: 1px solid var(--border-color); border-radius: var(--radius-sm);
    }

    .match-stadium {
      display: flex; align-items: center; gap: 6px;
      color: var(--text-muted); font-size: 0.8rem; margin-bottom: 12px;
      mat-icon { font-size: 16px; width: 16px; height: 16px; }
    }

    .prediction-section { border-top: 1px solid var(--border-color); padding-top: 12px; }

    .pred-form, .pred-existing { display: flex; flex-direction: column; gap: 8px; }
    .pred-label { color: var(--text-secondary); font-size: 0.85rem; font-weight: 500; }

    .pred-inputs {
      display: flex; align-items: center; gap: 8px;
    }

    .pred-input {
      width: 60px; height: 40px; text-align: center; font-size: 1.1rem; font-weight: 700;
      background: var(--bg-surface); border: 1px solid var(--border-color);
      border-radius: var(--radius-sm); color: var(--text-primary);
      outline: none; transition: var(--transition);
      &:focus { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold-glow); }
    }

    .pred-dash { color: var(--text-muted); font-weight: 700; }
    .pred-btn { transform: scale(0.85); }
    .edit-btn { color: var(--text-secondary); }
    .cancel-btn { color: var(--danger); }

    .pred-result {
      display: flex; align-items: center; gap: 8px;
    }

    .pred-score {
      font-weight: 700; font-size: 1.2rem; color: var(--gold);
      background: rgba(255,215,0,0.1); padding: 4px 12px;
      border-radius: var(--radius-sm);
    }

    .prediction-result {
      border-top: 1px solid var(--border-color); padding-top: 12px;
    }

    .result-row {
      display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;
    }

    .points-badge { font-weight: 700; }
    .no-pred { text-align: center; }

    .empty-state {
      text-align: center; padding: 60px 20px; color: var(--text-muted);
      mat-icon { font-size: 48px; width: 48px; height: 48px; opacity: 0.3; }
      p { margin-top: 12px; font-size: 1.1rem; }
    }

    @media (max-width: 480px) {
      .matches-grid { grid-template-columns: 1fr; }
      .team-name { font-size: 0.8rem; }
      .score { font-size: 1.5rem; }
    }
  `],
})
export class MatchesComponent implements OnInit {
  phases: Phase[] = ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER', 'SEMI', 'THIRD', 'FINAL'];
  phaseLabels = PHASE_LABELS;
  groups = GROUP_LABELS;

  selectedPhase: Phase = 'GROUP_STAGE';
  selectedPhaseIndex = 0;
  selectedGroup = 'A';
  loading = signal(false);
  matches = signal<Match[]>([]);
  predictions = signal<Prediction[]>([]);
  predInputs: Record<string, number> = {};
  editingMatch = '';

  top4Form!: FormGroup;
  allTeams: Team[] = [];
  savingTop4 = false;
  isLocked = false;

  constructor(
    private api: ApiService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {
    this.top4Form = this.fb.group({
      championId: [''],
      runnerUpId: [''],
      thirdPlaceId: [''],
      fourthPlaceId: [''],
      topScorer: ['']
    });
  }

  ngOnInit() { 
    this.loadData(); 
    this.loadTeams();
    this.loadTop4();
  }

  loadTeams() {
    this.api.getTeams().subscribe({
      next: (res) => { this.allTeams = res.data; }
    });
  }

  loadTop4() {
    this.api.getTournamentPrediction().subscribe({
      next: (res) => {
        if (res.data) {
          this.top4Form.patchValue({
            championId: res.data.championId,
            runnerUpId: res.data.runnerUpId,
            thirdPlaceId: res.data.thirdPlaceId,
            fourthPlaceId: res.data.fourthPlaceId,
            topScorer: res.data.topScorer,
          });
        }
      }
    });

    // Check lock manually (Tournament starts 2026-06-11T16:00:00Z)
    if (new Date() >= new Date('2026-06-11T16:00:00Z')) {
      this.isLocked = true;
      this.top4Form.disable();
    }
  }

  submitTop4() {
    if (this.top4Form.invalid || this.isLocked) return;
    this.savingTop4 = true;
    this.api.saveTournamentPrediction(this.top4Form.value).subscribe({
      next: () => {
        this.snackBar.open('✅ Predicciones extras guardadas', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.savingTop4 = false;
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' });
        this.savingTop4 = false;
      }
    });
  }

  onPhaseChange(event: any) {
    this.selectedPhase = this.phases[event.index];
    this.selectedPhaseIndex = event.index;
    this.loadData();
  }

  onGroupChange(group: string) {
    if (group) {
      this.selectedGroup = group;
      this.loadData();
    }
  }

  loadData() {
    this.loading.set(true);
    const group = this.selectedPhase === 'GROUP_STAGE' ? this.selectedGroup : undefined;

    this.api.getMatches(this.selectedPhase, group).subscribe({
      next: (res) => {
        this.matches.set(res.data);
        this.loadPredictions();
      },
      error: () => this.loading.set(false),
    });
  }

  loadPredictions() {
    const group = this.selectedPhase === 'GROUP_STAGE' ? this.selectedGroup : undefined;
    this.api.getMyPredictions(this.selectedPhase, group).subscribe({
      next: (res) => {
        this.predictions.set(res.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredMatches() { return this.matches(); }

  getPrediction(matchId: string): Prediction | undefined {
    return this.predictions().find(p => p.matchId === matchId);
  }

  isMatchLocked(matchDate: string | Date): boolean {
    const cutoff = new Date(new Date(matchDate).getTime() - 3 * 60 * 60 * 1000);
    return new Date() >= cutoff;
  }

  submitPrediction(matchId: string) {
    const home = this.predInputs[matchId + '_home'] ?? 0;
    const away = this.predInputs[matchId + '_away'] ?? 0;

    this.api.createPrediction({ matchId, predictedHome: home, predictedAway: away }).subscribe({
      next: (res) => {
        this.predictions.update(preds => [...preds, res.data]);
        this.snackBar.open('✅ Predicción enviada', 'OK', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  enableEdit(matchId: string, pred: Prediction) {
    this.editingMatch = matchId;
    this.predInputs[matchId + '_home'] = pred.predictedHome;
    this.predInputs[matchId + '_away'] = pred.predictedAway;
  }

  updatePrediction(matchId: string) {
    const home = this.predInputs[matchId + '_home'] ?? 0;
    const away = this.predInputs[matchId + '_away'] ?? 0;

    this.api.updatePrediction(matchId, { predictedHome: home, predictedAway: away }).subscribe({
      next: (res) => {
        this.predictions.update(preds => preds.map(p => p.matchId === matchId ? res.data : p));
        this.editingMatch = '';
        this.snackBar.open('✅ Predicción actualizada', 'OK', { duration: 3000, panelClass: 'snack-success' });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' });
      },
    });
  }

  getPointBadgeClass(type: string | null): string {
    switch (type) {
      case 'EXACT': return 'badge-gold';
      case 'WINNER_DIFF': return 'badge-green';
      case 'WINNER': return 'badge-blue';
      default: return 'badge-red';
    }
  }

  getPointIcon(type: string | null): string {
    switch (type) {
      case 'EXACT': return '🌟';
      case 'WINNER_DIFF': return '✅';
      case 'WINNER': return '👍';
      default: return '❌';
    }
  }
}
