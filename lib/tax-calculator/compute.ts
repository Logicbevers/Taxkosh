import { IncomeSources, Deductions, TaxComputationResult, TaxRegime } from "./types";
import { NEW_REGIME_SLABS_AY25_26, OLD_REGIME_SLABS_AY25_26, STANDARD_DEDUCTION, getSurchargeRate, HEALTH_AND_EDUCATION_CESS_RATE, TaxSlab } from "./slabs";
import { calculateAllowedDeductions } from "./deductions";

function calculateGrossTotalIncome(income: IncomeSources): number {
    const salary = Math.max(0, income.salary - income.exemptAllowances);

    // House Property (limit loss set-off to 2L generally, but simplified here)
    const hp = income.houseProperty;

    // Capital Gains
    const stcg = income.capitalGains.shortTerm.reduce((acc, gain) => acc + (gain.saleValue - gain.buyValue - gain.expenses), 0);
    const ltcg = income.capitalGains.longTerm.reduce((acc, gain) => acc + (gain.saleValue - gain.buyValue - gain.expenses), 0);

    // Business
    const biz = income.businessProfession.regular +
        (income.businessProfession.presumptive44AD * 0.06) + // 6% digital 
        (income.businessProfession.presumptive44ADA * 0.50); // 50% professional

    // Other
    const other = Object.values(income.otherSources).reduce((acc, val) => acc + val, 0);

    // We are not handling complex loss set-off rules in this iteration for simplicity
    return Math.max(0, salary + hp + Math.max(0, stcg) + Math.max(0, ltcg) + biz + other);
}

function calculateTaxFromSlabs(taxableIncome: number, slabs: TaxSlab[]): { grossTax: number; bracketDetails: { rate: number; amount: number }[] } {
    let grossTax = 0;
    const bracketDetails: { rate: number; amount: number }[] = [];

    for (const slab of slabs) {
        if (taxableIncome > slab.min) {
            const taxableAmountInSlab = slab.max === null
                ? taxableIncome - slab.min
                : Math.min(taxableIncome, slab.max) - slab.min;

            if (taxableAmountInSlab > 0) {
                const taxForSlab = (taxableAmountInSlab * slab.rate) / 100;
                grossTax += taxForSlab;
                bracketDetails.push({ rate: slab.rate, amount: taxForSlab });
            }
        } else {
            break;
        }
    }

    return { grossTax, bracketDetails };
}

function calculateRebate87A(grossTax: number, taxableIncome: number, regime: TaxRegime): number {
    // Budget 2024 (AY 25-26): New Regime rebate limit is 7L income (tax 25k)
    // Old Regime rebate limit is 5L income (tax 12.5k)
    if (regime === "NEW" && taxableIncome <= 700000) {
        return Math.min(grossTax, 25000);
    }
    if (regime === "OLD" && taxableIncome <= 500000) {
        return Math.min(grossTax, 12500);
    }
    return 0;
}

export function computeTax(income: IncomeSources, deductions: Deductions, age: number, regime: TaxRegime): TaxComputationResult {
    const grossTotalIncome = calculateGrossTotalIncome(income);

    // Deductions calculation
    const { total: totalDeductions } = calculateAllowedDeductions(deductions, regime, income.salary);

    const taxableIncomeRaw = Math.max(0, grossTotalIncome - totalDeductions);
    // Round off to nearest 10 under section 288A
    const taxableIncome = Math.round(taxableIncomeRaw / 10) * 10;

    // Tax slabs
    const slabs = regime === "NEW" ? NEW_REGIME_SLABS_AY25_26 : OLD_REGIME_SLABS_AY25_26(age);
    const { grossTax, bracketDetails } = calculateTaxFromSlabs(taxableIncome, slabs);

    // Rebate 87A
    const rebate87A = calculateRebate87A(grossTax, taxableIncome, regime);
    const taxAfterRebate = grossTax - rebate87A;

    // Surcharge
    const surchargeRate = getSurchargeRate(taxableIncome, regime);
    const surcharge = (taxAfterRebate * surchargeRate) / 100;

    // Marginal Relief (skipping complex MR calculation for brevity, assume 0 for MVP)
    const taxIncludingSurcharge = taxAfterRebate + surcharge;

    // Cess 4%
    const healthAndEducationCess = (taxIncludingSurcharge * HEALTH_AND_EDUCATION_CESS_RATE) / 100;

    // Total Tax Liability (Round off under 288B to nearest 10)
    const netTaxLiabilityRaw = taxIncludingSurcharge + healthAndEducationCess;
    const netTaxLiability = Math.round(netTaxLiabilityRaw / 10) * 10;

    return {
        regime,
        grossTotalIncome,
        totalDeductions,
        taxableIncome,
        taxRatesApplied: bracketDetails,
        grossTax,
        rebate87A,
        taxAfterRebate,
        surcharge,
        healthAndEducationCess,
        netTaxLiability
    };
}

/**
 * Utility to compare both regimes and return the optimal one.
 */
export function compareRegimes(income: IncomeSources, deductions: Deductions, age: number): { optimal: TaxRegime; savings: number; newCompute: TaxComputationResult; oldCompute: TaxComputationResult } {
    const newCompute = computeTax(income, deductions, age, "NEW");
    const oldCompute = computeTax(income, deductions, age, "OLD");

    const diff = oldCompute.netTaxLiability - newCompute.netTaxLiability;

    if (diff > 0) {
        return { optimal: "NEW", savings: diff, newCompute, oldCompute };
    } else if (diff < 0) {
        return { optimal: "OLD", savings: Math.abs(diff), newCompute, oldCompute };
    }

    // If equal, default to new as it requires zero documentation
    return { optimal: "NEW", savings: 0, newCompute, oldCompute };
}
