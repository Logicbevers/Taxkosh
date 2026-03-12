// types.ts

export type TaxRegime = "OLD" | "NEW";

export interface IncomeSources {
    salary: number;
    exemptAllowances: number;
    houseProperty: number;
    capitalGains: {
        shortTerm: Omit<CapitalGainDetail, 'assetType'>[];
        longTerm: CapitalGainDetail[];
    };
    businessProfession: {
        regular: number; // Net profit
        presumptive44AD: number; // Turnover (profit assumed 6% or 8%)
        presumptive44ADA: number; // Gross receipts (profit assumed 50%)
    };
    otherSources: {
        interestFixed: number;
        interestSavings: number;
        dividends: number;
        other: number;
    };
}

export interface CapitalGainDetail {
    assetType: "STOCKS" | "REAL_ESTATE" | "MUTUAL_FUNDS" | "OTHER";
    saleValue: number;
    buyValue: number;
    expenses: number;
}

export interface Deductions {
    // Section 80C to 80U
    section80C: number; // Max 1.5L
    section80D: {
        selfAmount: number; // Max 25k (50k senior)
        parentsAmount: number; // Max 25k (50k senior)
        isSelfSenior: boolean;
        isParentsSenior: boolean;
    };
    section80CCD1B: number; // NPS extra 50k
    section80G: number; // Donations
    section80TTA: number; // Savings interest max 10k
    section80TTB: number; // Senior savings/FD interest max 50k

    // House Property
    section24b: number; // Home loan interest max 2L (self occupied)

    // Standard Deduction (Salary)
    standardDeduction: number; // Flat 50k (Old and New)
}

export interface TaxComputationResult {
    regime: TaxRegime;
    grossTotalIncome: number;
    totalDeductions: number;
    taxableIncome: number;
    taxRatesApplied: { rate: number; amount: number }[];
    grossTax: number;
    rebate87A: number;
    taxAfterRebate: number;
    surcharge: number;
    healthAndEducationCess: number;
    netTaxLiability: number;
}
