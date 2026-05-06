import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { Response } from 'express';

const prisma = new PrismaClient();

export class ReportsService {

  // Report 1: General Ranking → Excel
  async generateRankingExcel(res: Response) {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        fullName: true,
        username: true,
        email: true,
        predictions: {
          where: { points: { not: null } },
          select: { points: true, pointType: true },
        },
      },
    });

    const rankings = users.map(user => {
      const preds = user.predictions;
      return {
        fullName: user.fullName,
        username: user.username,
        email: user.email,
        totalPoints: preds.reduce((s, p) => s + (p.points || 0), 0),
        exactos: preds.filter(p => p.pointType === 'EXACT').length,
        winnerDiff: preds.filter(p => p.pointType === 'WINNER_DIFF').length,
        winnerOnly: preds.filter(p => p.pointType === 'WINNER').length,
        none: preds.filter(p => p.pointType === 'NONE').length,
      };
    }).sort((a, b) => b.totalPoints - a.totalPoints);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Polla Mundialista';
    const sheet = workbook.addWorksheet('Ranking General');

    // Header styling
    sheet.columns = [
      { header: 'Posición', key: 'position', width: 10 },
      { header: 'Nombre', key: 'fullName', width: 25 },
      { header: 'Username', key: 'username', width: 18 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Pts Totales', key: 'totalPoints', width: 12 },
      { header: 'Exactos (5)', key: 'exactos', width: 12 },
      { header: 'Ganador+Dif (3)', key: 'winnerDiff', width: 16 },
      { header: 'Solo Ganador (1)', key: 'winnerOnly', width: 16 },
      { header: 'Sin Puntos (0)', key: 'none', width: 14 },
    ];

    // Style header row
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A472A' },
    };
    headerRow.alignment = { horizontal: 'center' };

    rankings.forEach((r, i) => {
      sheet.addRow({
        position: i + 1,
        fullName: r.fullName,
        username: r.username,
        email: r.email,
        totalPoints: r.totalPoints,
        exactos: r.exactos,
        winnerDiff: r.winnerDiff,
        winnerOnly: r.winnerOnly,
        none: r.none,
      });
    });

    // Alternate row colors
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' },
        };
      }
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ranking_general.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  // Report 2: Predictions by Match → Excel
  async generateMatchPredictionsExcel(res: Response, matchId: string) {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeTeam: true,
        awayTeam: true,
        predictions: {
          include: {
            user: { select: { username: true, fullName: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!match) throw new Error('Match not found');

    const workbook = new ExcelJS.Workbook();
    const title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
    const sheet = workbook.addWorksheet(title.substring(0, 31));

    sheet.columns = [
      { header: 'Username', key: 'username', width: 18 },
      { header: 'Pred Local', key: 'predHome', width: 12 },
      { header: 'Pred Visit', key: 'predAway', width: 12 },
      { header: 'Resultado Pred', key: 'resultPred', width: 15 },
      { header: 'Resultado Real', key: 'resultReal', width: 15 },
      { header: 'Puntos', key: 'points', width: 10 },
      { header: 'Tipo', key: 'type', width: 15 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FF1A472A' },
    };

    for (const pred of match.predictions) {
      sheet.addRow({
        username: pred.user.username,
        predHome: pred.predictedHome,
        predAway: pred.predictedAway,
        resultPred: `${pred.predictedHome} - ${pred.predictedAway}`,
        resultReal: match.homeScore !== null ? `${match.homeScore} - ${match.awayScore}` : 'Pendiente',
        points: pred.points ?? '-',
        type: pred.pointType || '-',
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=predicciones_partido_${matchId}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  // Report 2.5: Tournament Predictions → Excel
  async generateTournamentPredictionsExcel(res: Response) {
    const predictions = await prisma.tournamentPrediction.findMany({
      include: {
        user: { select: { fullName: true, username: true, email: true } },
        champion: { select: { name: true } },
        runnerUp: { select: { name: true } },
        thirdPlace: { select: { name: true } },
        fourthPlace: { select: { name: true } },
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Polla Mundialista';
    const sheet = workbook.addWorksheet('Predicciones Top 4 y Goleador');

    sheet.columns = [
      { header: 'Nombre', key: 'fullName', width: 25 },
      { header: 'Username', key: 'username', width: 18 },
      { header: 'Campeón', key: 'champion', width: 18 },
      { header: 'Subcampeón', key: 'runnerUp', width: 18 },
      { header: '3er Lugar', key: 'thirdPlace', width: 18 },
      { header: '4to Lugar', key: 'fourthPlace', width: 18 },
      { header: 'Goleador', key: 'topScorer', width: 20 },
      { header: 'Fecha Carga', key: 'createdAt', width: 15 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FF1A472A' },
    };

    for (const pred of predictions) {
      sheet.addRow({
        fullName: pred.user.fullName,
        username: pred.user.username,
        champion: pred.champion?.name || '-',
        runnerUp: pred.runnerUp?.name || '-',
        thirdPlace: pred.thirdPlace?.name || '-',
        fourthPlace: pred.fourthPlace?.name || '-',
        topScorer: pred.topScorer || '-',
        createdAt: pred.updatedAt.toISOString().split('T')[0],
      });
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=predicciones_fase_final.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  }

  // Report 3: Polla Summary → PDF
  async generatePollaSummaryPdf(res: Response) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resumen_polla.pdf');
    doc.pipe(res);

    // Title
    doc.fontSize(24).font('Helvetica-Bold')
      .fillColor('#1A472A')
      .text('⚽ POLLA MUNDIALISTA 2026', { align: 'center' });
    doc.moveDown();
    doc.fontSize(14).font('Helvetica')
      .fillColor('#666666')
      .text('Resumen General del Torneo', { align: 'center' });
    doc.moveDown(2);

    // Stats
    const [totalUsers, totalPredictions, totalMatches, finishedMatches] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.prediction.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'FINISHED' } }),
    ]);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A472A')
      .text('📊 Estadísticas Generales');
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').fillColor('#333333');
    doc.text(`Total Usuarios: ${totalUsers}`);
    doc.text(`Total Predicciones: ${totalPredictions}`);
    doc.text(`Partidos Totales: ${totalMatches}`);
    doc.text(`Partidos Finalizados: ${finishedMatches} (${totalMatches > 0 ? Math.round(finishedMatches / totalMatches * 100) : 0}%)`);
    doc.moveDown(1.5);

    // Top 10 ranking
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        fullName: true,
        username: true,
        predictions: {
          where: { points: { not: null } },
          select: { points: true, pointType: true },
        },
      },
    });

    const rankings = users.map(u => ({
      fullName: u.fullName,
      username: u.username,
      totalPoints: u.predictions.reduce((s, p) => s + (p.points || 0), 0),
      exactos: u.predictions.filter(p => p.pointType === 'EXACT').length,
    })).sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 10);

    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A472A')
      .text('🏆 Top 10 Ranking');
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    const colX = [50, 80, 230, 360, 440];
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');

    doc.rect(50, tableTop - 2, 500, 18).fill('#1A472A');
    doc.fillColor('#FFFFFF');
    doc.text('#', colX[0] + 5, tableTop + 2, { width: 25 });
    doc.text('Nombre', colX[1] + 5, tableTop + 2, { width: 145 });
    doc.text('Username', colX[2] + 5, tableTop + 2, { width: 125 });
    doc.text('Puntos', colX[3] + 5, tableTop + 2, { width: 75 });
    doc.text('Exactos', colX[4] + 5, tableTop + 2, { width: 60 });

    let y = tableTop + 20;
    doc.font('Helvetica').fillColor('#333333');
    rankings.forEach((r, i) => {
      if (i % 2 === 0) {
        doc.rect(50, y - 2, 500, 16).fill('#F0F0F0');
        doc.fillColor('#333333');
      }
      doc.text(`${i + 1}`, colX[0] + 5, y + 1, { width: 25 });
      doc.text(r.fullName, colX[1] + 5, y + 1, { width: 145 });
      doc.text(r.username, colX[2] + 5, y + 1, { width: 125 });
      doc.text(`${r.totalPoints}`, colX[3] + 5, y + 1, { width: 75 });
      doc.text(`${r.exactos}`, colX[4] + 5, y + 1, { width: 60 });
      y += 18;
    });

    doc.moveDown(3);

    // Finished matches summary
    const finishedMatchesList = await prisma.match.findMany({
      where: { status: 'FINISHED' },
      include: { homeTeam: true, awayTeam: true, _count: { select: { predictions: true } } },
      orderBy: { matchDate: 'asc' },
      take: 20,
    });

    if (finishedMatchesList.length > 0) {
      doc.addPage();
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A472A')
        .text('📋 Partidos Finalizados (últimos 20)');
      doc.moveDown(0.5);

      for (const m of finishedMatchesList) {
        doc.fontSize(10).font('Helvetica').fillColor('#333333');
        doc.text(
          `${m.homeTeam.name} ${m.homeScore} - ${m.awayScore} ${m.awayTeam.name}  |  ` +
          `Predicciones: ${m._count.predictions}  |  ${m.phase}`,
          { indent: 10 }
        );
      }
    }

    doc.end();
  }

  // Report 4: User Predictions → PDF
  async generateUserPredictionsPdf(res: Response, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true, username: true, email: true },
    });

    if (!user) throw new Error('User not found');

    const predictions = await prisma.prediction.findMany({
      where: { userId },
      include: {
        match: { include: { homeTeam: true, awayTeam: true } },
      },
      orderBy: { match: { matchDate: 'asc' } },
    });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=predicciones_${user.username}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#1A472A')
      .text('⚽ Predicciones del Usuario', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').fillColor('#666666')
      .text(`${user.fullName} (@${user.username})`, { align: 'center' });
    doc.moveDown(1.5);

    // Stats summary
    const totalPoints = predictions.reduce((s, p) => s + (p.points || 0), 0);
    const exactos = predictions.filter(p => p.pointType === 'EXACT').length;
    const winnerDiff = predictions.filter(p => p.pointType === 'WINNER_DIFF').length;
    const winnerOnly = predictions.filter(p => p.pointType === 'WINNER').length;

    doc.fontSize(11).font('Helvetica-Bold').fillColor('#1A472A').text('Resumen:');
    doc.fontSize(10).font('Helvetica').fillColor('#333333');
    doc.text(`Total Predicciones: ${predictions.length}  |  Puntos: ${totalPoints}  |  Exactos: ${exactos}  |  Ganador+Dif: ${winnerDiff}  |  Solo Ganador: ${winnerOnly}`);
    doc.moveDown(1.5);

    // Group predictions by phase
    const phases = ['GROUP_STAGE', 'ROUND_OF_32', 'ROUND_OF_16', 'QUARTER', 'SEMI', 'THIRD', 'FINAL'];
    const phaseLabels: Record<string, string> = {
      GROUP_STAGE: 'Fase de Grupos',
      ROUND_OF_32: 'Dieciseisavos',
      ROUND_OF_16: 'Octavos de Final',
      QUARTER: 'Cuartos de Final',
      SEMI: 'Semifinales',
      THIRD: 'Tercer Puesto',
      FINAL: 'Final',
    };

    for (const phase of phases) {
      const phasePreds = predictions.filter(p => p.match.phase === phase);
      if (phasePreds.length === 0) continue;

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1A472A')
        .text(`📌 ${phaseLabels[phase] || phase}`);
      doc.moveDown(0.3);

      for (const pred of phasePreds) {
        const m = pred.match;
        const resultIcon = pred.pointType === 'EXACT' ? '🌟' :
          pred.pointType === 'WINNER_DIFF' ? '✅' :
            pred.pointType === 'WINNER' ? '👍' :
              pred.pointType === 'NONE' ? '❌' : '⏳';

        doc.fontSize(9).font('Helvetica').fillColor('#333333');
        const line = `${resultIcon} ${m.homeTeam.name} vs ${m.awayTeam.name}  |  ` +
          `Pred: ${pred.predictedHome}-${pred.predictedAway}  |  ` +
          `Real: ${m.homeScore !== null ? `${m.homeScore}-${m.awayScore}` : 'Pendiente'}  |  ` +
          `Pts: ${pred.points ?? '-'}`;
        doc.text(line, { indent: 15 });
      }
      doc.moveDown(0.8);
    }

    doc.end();
  }

  // Admin dashboard stats
  async getDashboardStats() {
    const [totalUsers, totalPredictions, totalMatches, finishedMatches] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.prediction.count(),
      prisma.match.count(),
      prisma.match.count({ where: { status: 'FINISHED' } }),
    ]);

    // Match with most predictions
    const matchWithMostPreds = await prisma.match.findFirst({
      include: {
        homeTeam: true,
        awayTeam: true,
        _count: { select: { predictions: true } },
      },
      orderBy: { predictions: { _count: 'desc' } },
    });

    // Average points per user
    const usersWithPoints = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        predictions: {
          where: { points: { not: null } },
          select: { points: true },
        },
      },
    });

    const allPointsTotals = usersWithPoints.map(u =>
      u.predictions.reduce((s, p) => s + (p.points || 0), 0)
    );
    const avgPoints = allPointsTotals.length > 0
      ? (allPointsTotals.reduce((a, b) => a + b, 0) / allPointsTotals.length).toFixed(1)
      : '0';

    // Point distribution for last finished match
    let lastMatchDistribution = null;
    const lastFinished = await prisma.match.findFirst({
      where: { status: 'FINISHED' },
      orderBy: { matchDate: 'desc' },
      include: { homeTeam: true, awayTeam: true },
    });

    if (lastFinished) {
      const lastPreds = await prisma.prediction.groupBy({
        by: ['pointType'],
        where: { matchId: lastFinished.id, points: { not: null } },
        _count: true,
      });

      lastMatchDistribution = {
        match: `${lastFinished.homeTeam.name} vs ${lastFinished.awayTeam.name}`,
        distribution: lastPreds.map(p => ({
          type: p.pointType,
          count: p._count,
        })),
      };
    }

    return {
      totalUsers,
      totalPredictions,
      totalMatches,
      finishedMatches,
      percentFinished: totalMatches > 0 ? Math.round(finishedMatches / totalMatches * 100) : 0,
      matchWithMostPredictions: matchWithMostPreds ? {
        matchName: `${matchWithMostPreds.homeTeam.name} vs ${matchWithMostPreds.awayTeam.name}`,
        predictionCount: matchWithMostPreds._count.predictions,
      } : null,
      averagePointsPerUser: parseFloat(avgPoints),
      lastMatchDistribution,
    };
  }
}
