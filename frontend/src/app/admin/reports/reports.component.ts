import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../shared/api.service';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule, MatProgressSpinnerModule],
  template: `
    <div class="page-container">
      <h1 class="page-title">📊 Reportes</h1>

      <div class="reports-grid">
        <div class="report-card card-glass animate-fade-in-up">
          <div class="report-icon">📈</div>
          <h3>Ranking General</h3>
          <p>Exportar el ranking completo con todos los datos de puntuación por usuario.</p>
          <button mat-raised-button class="btn-gold" (click)="downloadRankingExcel()" [disabled]="downloading === 'ranking'">
            <mat-spinner *ngIf="downloading === 'ranking'" diameter="18"></mat-spinner>
            <mat-icon *ngIf="downloading !== 'ranking'">download</mat-icon>
            Descargar Excel
          </button>
        </div>

        <div class="report-card card-glass animate-fade-in-up" style="animation-delay:100ms">
          <div class="report-icon">📋</div>
          <h3>Resumen de la Polla</h3>
          <p>PDF con portada, ranking Top-10, estadísticas generales y partidos finalizados.</p>
          <button mat-raised-button class="btn-gold" (click)="downloadPollaPdf()" [disabled]="downloading === 'polla'">
            <mat-spinner *ngIf="downloading === 'polla'" diameter="18"></mat-spinner>
            <mat-icon *ngIf="downloading !== 'polla'">picture_as_pdf</mat-icon>
            Descargar PDF
          </button>
        </div>

        <div class="report-card card-glass animate-fade-in-up" style="animation-delay:200ms">
          <div class="report-icon">🏆</div>
          <h3>Predicciones Top 4</h3>
          <p>Excel con los pronósticos (Campeón, Subcampeón, 3ro, 4to y Goleador).</p>
          <button mat-raised-button class="btn-gold" (click)="downloadTournamentExcel()" [disabled]="downloading === 'tournament'">
            <mat-spinner *ngIf="downloading === 'tournament'" diameter="18"></mat-spinner>
            <mat-icon *ngIf="downloading !== 'tournament'">download</mat-icon>
            Descargar Excel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap:20px; }
    .report-card { padding:28px; text-align:center; h3 { font-family:'Outfit'; font-weight:600; margin:12px 0 8px; } p { color:var(--text-secondary); font-size:0.9rem; margin:0 0 20px; } }
    .report-icon { font-size:2.5rem; }
  `],
})
export class AdminReportsComponent {
  downloading = '';

  constructor(private api: ApiService, private snackBar: MatSnackBar) {}

  downloadRankingExcel() {
    this.downloading = 'ranking';
    this.api.downloadRankingExcel().subscribe({
      next: (blob) => { this.downloadBlob(blob, 'ranking_general.xlsx'); this.downloading = ''; },
      error: () => { this.snackBar.open('Error al descargar', 'OK', { duration: 3000, panelClass: 'snack-error' }); this.downloading = ''; },
    });
  }

  downloadPollaPdf() {
    this.downloading = 'polla';
    this.api.downloadPollaSummaryPdf().subscribe({
      next: (blob) => { this.downloadBlob(blob, 'resumen_polla.pdf'); this.downloading = ''; },
      error: () => { this.snackBar.open('Error al descargar', 'OK', { duration: 3000, panelClass: 'snack-error' }); this.downloading = ''; },
    });
  }

  downloadTournamentExcel() {
    this.downloading = 'tournament';
    this.api.downloadTournamentPredictionsExcel().subscribe({
      next: (blob) => { this.downloadBlob(blob, 'predicciones_top4.xlsx'); this.downloading = ''; },
      error: () => { this.snackBar.open('Error al descargar', 'OK', { duration: 3000, panelClass: 'snack-error' }); this.downloading = ''; },
    });
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  }
}
