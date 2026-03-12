// deductions.ts
import { Deductions, TaxRegime } from "./types";

/**
 * Calculates allowable deductions capped at legal limits.
 * Differentiates between OLD and NEW regime allowable deductions.
 */
export function calculateAllowedDeductions(
    claimed: Deductions,
    regime: TaxRegime,
    salaryIncome: number
): { total: number; breakdown: Record<string, number> } {
    const breakdown: Record<string, number> = {};

    // Standard Deduction
    // For AY 25-26 (Budget 2024): 75k for New Regime, 50k for Old Regime
    const allowedStdDed = regime === "NEW" ? 75000 : 50000;
    breakdown.standardDeduction = Math.min(salaryIncome, allowedStdDed);

    // New Regime allows ONLY Standard Deduction (and 80CCD(2) employer contribution, but we group that out for now)
    if (regime === "NEW") {
        return {
            total: breakdown.standardDeduction,
            breakdown,
        };
    }

    // --- OLD REGIME DEDUCTIONS ---

    // 80C Cap (1.5L)
    breakdown.section80C = Math.min(claimed.section80C || 0, 150000);

    // 80D Cap
    const selfLimit = claimed.section80D?.isSelfSenior ? 50000 : 25000;
    const childSelfAllowed = Math.min(claimed.section80D?.selfAmount || 0, selfLimit);

    const parentsLimit = claimed.section80D?.isParentsSenior ? 50000 : 25000;
    const parentsAllowed = Math.min(claimed.section80D?.parentsAmount || 0, parentsLimit);

    breakdown.section80D = childSelfAllowed + parentsAllowed;

    // 80CCD(1B) Cap (50k)
    breakdown.section80CCD1B = Math.min(claimed.section80CCD1B || 0, 50000);

    // 24(b) Home loan Interest Cap (2L)
    breakdown.section24b = Math.min(claimed.section24b || 0, 200000);

    // 80TTA / 80TTB Cap
    // Note: Cannot claim both. TTB is for senior citizens.
    if (claimed.section80TTB > 0) {
        breakdown.section80TTB = Math.min(claimed.section80TTB, 50000);
    } else {
        breakdown.section80TTA = Math.min(claimed.section80TTA || 0, 10000);
    }

    // 80G Donations (Simplification: using full value entered by user, in reality it's subject to adjusted gross total income caps)
    breakdown.section80G = claimed.section80G || 0;

    // Sum all allowable
    const total = Object.values(breakdown).reduce((acc, val) => acc + val, 0);

    return { total, breakdown };
}
