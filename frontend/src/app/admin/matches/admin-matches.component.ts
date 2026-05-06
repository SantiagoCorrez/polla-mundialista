import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { ApiService } from '../../shared/api.service';
import { Match, Phase, PHASE_LABELS, GROUP_LABELS } from '../../shared/models';

@Component({
  selector: 'app-admin-matches',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, MatTabsModule, MatCardModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatSnackBarModule, MatProgressSpinnerModule, MatDialogModule,
  ],
  template: `
    <div class="page-container">
      <h1 class="page-title">📋 Gestión de Partidos</h1>

      <mat-tab-group (selectedTabChange)="onPhaseChange($event)" animationDuration="200ms">
        <mat-tab *ngFor="let phase of phases" [label]="phaseLabels[phase]">
          <div *ngIf="phase === 'GROUP_STAGE'" class="group-chips" style="padding:16px 0">
            <mat-chip-listbox (change)="onGroupChange($event.value)">
              <mat-chip-option *ngFor="let g of groups" [value]="g"
                [selected]="selectedGroup === g" color="accent">Grupo {{ g }}</mat-chip-option>
            </mat-chip-listbox>
          </div>

          <div *ngIf="phase !== 'GROUP_STAGE'" class="knockout-generator card-glass" style="margin: 16px 0; padding: 20px;">
            <h3 style="margin-top:0; color: var(--gold); font-family: 'Outfit'">➕ Crear Partido para {{ phaseLabels[phase] }}</h3>
            <form [formGroup]="knockoutForm" (ngSubmit)="generateKnockoutMatch()" style="display: flex; flex-wrap: wrap; gap: 16px; align-items: flex-start;">
              <mat-form-field appearance="outline" style="flex: 1; min-width: 200px">
                <mat-label>Equipo Local</mat-label>
                <mat-select formControlName="homeTeamId">
                  <mat-option *ngFor="let team of allTeams" [value]="team.id">{{ team.name }} (Grupo {{ team.group }})</mat-option>
                </mat-select>
              </mat-form-field>
              
              <mat-form-field appearance="outline" style="flex: 1; min-width: 200px">
                <mat-label>Equipo Visitante</mat-label>
                <mat-select formControlName="awayTeamId">
                  <mat-option *ngFor="let team of allTeams" [value]="team.id">{{ team.name }} (Grupo {{ team.group }})</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" style="width: 200px">
                <mat-label>Fecha y Hora</mat-label>
                <input matInput type="datetime-local" formControlName="matchDate">
              </mat-form-field>

              <mat-form-field appearance="outline" style="flex: 1; min-width: 200px">
                <mat-label>Estadio</mat-label>
                <input matInput formControlName="stadium">
              </mat-form-field>

              <div style="width: 100%; display: flex; justify-content: flex-end;">
                <button mat-raised-button class="btn-gold" type="submit" [disabled]="knockoutForm.invalid">Generar Partido</button>
              </div>
            </form>
          </div>

          <div *ngIf="loading()" class="loading"><mat-spinner diameter="32"></mat-spinner></div>


          <div *ngIf="!loading()" class="matches-list">
            <div *ngFor="let match of matches()" class="match-item card-glass">
              <div class="match-info">
                <div class="teams-row">
                  <img [src]="match.homeTeam.flagUrl" class="flag-sm" onerror="this.src='https://flagcdn.com/w40/xx.png'">
                  <strong>{{ match.homeTeam.name }}</strong>
                  <span class="vs">vs</span>
                  <strong>{{ match.awayTeam.name }}</strong>
                  <img [src]="match.awayTeam.flagUrl" class="flag-sm" onerror="this.src='https://flagcdn.com/w40/xx.png'">
                </div>
                <div class="match-meta">
                  {{ match.matchDate | date:'dd MMM yyyy HH:mm' }}
                  <span *ngIf="match.stadium"> · {{ match.stadium }}</span>
                  <span class="badge" style="margin-left:8px"
                    [class.badge-green]="match.status==='SCHEDULED'"
                    [class.badge-gold]="match.status==='LIVE'"
                    [class.badge-blue]="match.status==='FINISHED'">{{ match.status }}</span>
                </div>
                <div *ngIf="match.status==='FINISHED'" class="result-display">
                  Resultado: <strong style="color:var(--gold)">{{ match.homeScore }} - {{ match.awayScore }}</strong>
                  <span *ngIf="match._count" style="color:var(--text-muted);margin-left:12px">
                    ({{ match._count.predictions }} predicciones)
                  </span>
                </div>
              </div>

              <div class="match-actions">
                <button mat-stroked-button *ngIf="match.status !== 'FINISHED'"
                  (click)="openResultForm(match)" color="accent">
                  <mat-icon>scoreboard</mat-icon> Resultado
                </button>
                <button mat-icon-button (click)="deleteMatch(match.id)" color="warn"
                  *ngIf="match.status === 'SCHEDULED'">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Result Form (inline) -->
      <div *ngIf="resultMatch" class="result-form card-glass animate-scale-in" style="margin-top:24px">
        <h3 style="font-family:'Outfit';color:var(--gold);margin:0 0 16px">
          📝 Registrar Resultado: {{ resultMatch.homeTeam.name }} vs {{ resultMatch.awayTeam.name }}
        </h3>
        <form [formGroup]="resultForm" (ngSubmit)="submitResult()" style="display:flex;flex-wrap:wrap;gap:12px;align-items:flex-end">
          <mat-form-field appearance="outline" style="width:100px">
            <mat-label>Local</mat-label>
            <input matInput type="number" min="0" formControlName="homeScore">
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:100px">
            <mat-label>Visitante</mat-label>
            <input matInput type="number" min="0" formControlName="awayScore">
          </mat-form-field>
          <button mat-raised-button class="btn-gold" type="submit" [disabled]="resultForm.invalid">
            <mat-icon>check</mat-icon> Calcular y Guardar Puntos
          </button>
          <button mat-button (click)="resultMatch = null" type="button">Cancelar</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .matches-list { display:flex; flex-direction:column; gap:12px; padding:16px 0; }
    .match-item { display:flex; justify-content:space-between; align-items:center; padding:16px; flex-wrap:wrap; gap:12px; }
    .teams-row { display:flex; align-items:center; gap:8px; font-size:0.95rem; flex-wrap:wrap; }
    .flag-sm { width:24px; height:16px; border-radius:2px; object-fit:cover; }
    .vs { color:var(--text-muted); font-size:0.8rem; }
    .match-meta { color:var(--text-secondary); font-size:0.8rem; margin-top:4px; }
    .result-display { margin-top:4px; font-size:0.85rem; }
    .match-actions { display:flex; gap:8px; align-items:center; }
    .loading { display:flex; justify-content:center; padding:40px; }
    .result-form { padding:24px; }
  `],
})
export class AdminMatchesComponent implements OnInit {
  phases: Phase[] = ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER', 'SEMI', 'THIRD', 'FINAL'];
  phaseLabels = PHASE_LABELS;
  groups = GROUP_LABELS;
  selectedPhase: Phase = 'GROUP_STAGE';
  selectedGroup = 'A';
  loading = signal(false);
  matches = signal<Match[]>([]);
  resultMatch: Match | null = null;
  resultForm: FormGroup;
  knockoutForm: FormGroup;
  allTeams: any[] = [];

  constructor(private api: ApiService, private snackBar: MatSnackBar, private fb: FormBuilder) {
    this.resultForm = this.fb.group({
      homeScore: [0, [Validators.required, Validators.min(0)]],
      awayScore: [0, [Validators.required, Validators.min(0)]],
    });
    this.knockoutForm = this.fb.group({
      homeTeamId: ['', Validators.required],
      awayTeamId: ['', Validators.required],
      matchDate: ['', Validators.required],
      stadium: [''],
    });
  }

  ngOnInit() { 
    this.load(); 
    this.loadTeams();
  }

  loadTeams() {
    this.api.getTeams().subscribe(res => {
      this.allTeams = res.data;
    });
  }

  onPhaseChange(event: any) { this.selectedPhase = this.phases[event.index]; this.load(); }
  onGroupChange(g: string) { if (g) { this.selectedGroup = g; this.load(); } }

  load() {
    this.loading.set(true);
    const group = this.selectedPhase === 'GROUP_STAGE' ? this.selectedGroup : undefined;
    this.api.getMatches(this.selectedPhase, group).subscribe({
      next: (res) => { this.matches.set(res.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openResultForm(match: Match) { this.resultMatch = match; this.resultForm.reset({ homeScore: 0, awayScore: 0 }); }

  submitResult() {
    if (!this.resultMatch) return;
    this.api.registerResult(this.resultMatch.id, this.resultForm.value).subscribe({
      next: (res) => {
        this.snackBar.open(`✅ Resultado guardado. ${res.data.predictionsUpdated} predicciones actualizadas.`, 'OK', { duration: 5000, panelClass: 'snack-success' });
        this.resultMatch = null;
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  generateKnockoutMatch() {
    if (this.knockoutForm.invalid) return;
    const data = this.knockoutForm.value;
    if (data.homeTeamId === data.awayTeamId) {
      this.snackBar.open('Los equipos deben ser diferentes', 'OK', { duration: 3000, panelClass: 'snack-error' });
      return;
    }

    const payload = {
      phase: this.selectedPhase,
      matchups: [data]
    };

    this.api.generateBracket(payload).subscribe({
      next: () => {
        this.snackBar.open('✅ Partido creado correctamente', 'OK', { duration: 3000, panelClass: 'snack-success' });
        this.knockoutForm.reset();
        this.load();
      },
      error: (err) => this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' }),
    });
  }

  deleteMatch(id: string) {
    if (confirm('¿Eliminar este partido?')) {
      this.api.deleteMatch(id).subscribe({
        next: () => { this.load(); this.snackBar.open('Partido eliminado', 'OK', { duration: 2000 }); },
        error: (err) => this.snackBar.open(err.error?.message || 'Error', 'OK', { duration: 4000, panelClass: 'snack-error' }),
      });
    }
  }
}
