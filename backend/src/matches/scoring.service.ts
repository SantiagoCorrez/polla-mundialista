export type PointTypeResult = 'EXACT' | 'WINNER_DIFF' | 'WINNER' | 'NONE';

export interface ScoringResult {
  points: number;
  pointType: PointTypeResult;
}

/**
 * Calculate points for a prediction against the actual result.
 *
 * Rule 1 — Exact Score (5 pts): predicted score === actual score
 * Rule 2 — Winner + Goal Difference (3 pts): correct winner AND same goal difference
 * Rule 3 — Winner Only (1 pt): correct winner/draw but different goal difference
 * Rule 4 — No Points (0 pts): wrong prediction
 */
export function calcularPuntos(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): ScoringResult {
  // Rule 1: Exact score
  if (predHome === actualHome && predAway === actualAway) {
    return { points: 5, pointType: 'EXACT' };
  }

  const resultadoPrediccion = Math.sign(predHome - predAway); // -1, 0, 1
  const resultadoReal = Math.sign(actualHome - actualAway);
  const ganadorCorrecto = resultadoPrediccion === resultadoReal;

  // Rule 2: Winner + goal difference
  const difPrediccion = predHome - predAway;
  const difReal = actualHome - actualAway;
  if (ganadorCorrecto && difPrediccion === difReal) {
    return { points: 3, pointType: 'WINNER_DIFF' };
  }

  // Rule 3: Winner only
  if (ganadorCorrecto) {
    return { points: 1, pointType: 'WINNER' };
  }

  // Rule 4: No points
  return { points: 0, pointType: 'NONE' };
}
