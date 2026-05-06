<?php

namespace App\Matches;

class ScoringService
{
    /**
     * Calculate points for a prediction against the actual result.
     *
     * Rule 1 — Exact Score (5 pts): predicted score === actual score
     * Rule 2 — Winner + Goal Difference (3 pts): correct winner AND same goal difference
     * Rule 3 — Winner Only (1 pt): correct winner/draw but different goal difference
     * Rule 4 — No Points (0 pts): wrong prediction
     */
    public static function calcularPuntos(
        int $predHome,
        int $predAway,
        int $actualHome,
        int $actualAway
    ): array {
        // Rule 1: Exact score
        if ($predHome === $actualHome && $predAway === $actualAway) {
            return ['points' => 5, 'pointType' => 'EXACT'];
        }

        $resultPred = $predHome <=> $predAway;    // -1, 0, 1
        $resultReal = $actualHome <=> $actualAway;
        $correctWinner = ($resultPred === $resultReal);

        // Rule 2: Winner + goal difference
        $diffPred = $predHome - $predAway;
        $diffReal = $actualHome - $actualAway;
        if ($correctWinner && $diffPred === $diffReal) {
            return ['points' => 3, 'pointType' => 'WINNER_DIFF'];
        }

        // Rule 3: Winner only
        if ($correctWinner) {
            return ['points' => 1, 'pointType' => 'WINNER'];
        }

        // Rule 4: No points
        return ['points' => 0, 'pointType' => 'NONE'];
    }
}
