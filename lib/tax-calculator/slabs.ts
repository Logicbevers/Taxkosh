// slabs.ts (AY 2025-26)
// Reference: Union Budget 2024 proposals for FY 2024-25 (AY 2025-26)

export interface TaxSlab {
    min: number;
    max: number | null;
    rate: number;
}

export const NEW_REGIME_SLABS_AY25_26: TaxSlab[] = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300000, max: 700000, rate: 5 },
    { min: 700000, max: 1000000, rate: 10 },
    { min: 1000000, max: 1200000, rate: 15 },
    { min: 1200000, max: 1500000, rate: 20 },
    { min: 1500000, max: null, rate: 30 },
];

export const OLD_REGIME_SLABS_AY25_26 = (age: number): TaxSlab[] => {
    // Super Senior Citizen (80+ years)
    if (age >= 80) {
        return [
            { min: 0, max: 500000, rate: 0 },
            { min: 500000, max: 1000000, rate: 20 },
            { min: 1000000, max: null, rate: 30 },
        ];
    }

    // Senior Citizen (60-79 years)
    if (age >= 60) {
        return [
            { min: 0, max: 300000, rate: 0 },
            { min: 300000, max: 500000, rate: 5 },
            { min: 500000, max: 1000000, rate: 20 },
            { min: 1000000, max: null, rate: 30 },
        ];
    }

    // < 60 years
    return [
        { min: 0, max: 250000, rate: 0 },
        { min: 250000, max: 500000, rate: 5 },
        { min: 500000, max: 1000000, rate: 20 },
        { min: 1000000, max: null, rate: 30 },
    ];
};

export const STANDARD_DEDUCTION = 75000; // Increased to 75k in New Regime Budget 2024, but keeping 50k for Old. Handled in deductions.ts.

export function getSurchargeRate(taxableIncome: number, regime: "OLD" | "NEW"): number {
    if (taxableIncome <= 5000000) return 0;
    if (taxableIncome <= 10000000) return 10;
    if (taxableIncome <= 20000000) return 15;

    // New regime caps surcharge at 25%. Old regime goes up to 37%.
    if (taxableIncome <= 50000000) return 25;
    return regime === "NEW" ? 25 : 37;
}

export const HEALTH_AND_EDUCATION_CESS_RATE = 4; // 4%
