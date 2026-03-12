/**
 * TDS Calculation Logic based on Indian Income Tax Rules
 */

export interface TdsCalculationResult {
    basicTax: number;
    surcharge: number;
    educationCess: number;
    totalTds: number;
}

/**
 * Calculates TDS, Surcharge, and Cess for a given amount and rate.
 * Standard Cess is 4% of (Basic Tax + Surcharge).
 */
export function calculateTds(amount: number, rate: number, isCompany: boolean = false): TdsCalculationResult {
    const basicTax = (amount * rate) / 100;

    // Surcharge logic simplified for MVP (Surcharge applies only on high value payments in real life)
    let surcharge = 0;
    if (isCompany && amount > 10000000) { // Example: 1Cr threshold for company surcharge
        surcharge = basicTax * 0.07;
    } else if (!isCompany && amount > 5000000) { // Example: 50L threshold for individuals
        surcharge = basicTax * 0.10;
    }

    const educationCess = (basicTax + surcharge) * 0.04;
    const totalTds = basicTax + surcharge + educationCess;

    return {
        basicTax: Math.round(basicTax * 100) / 100,
        surcharge: Math.round(surcharge * 100) / 100,
        educationCess: Math.round(educationCess * 100) / 100,
        totalTds: Math.round(totalTds * 100) / 100,
    };
}

export const TDS_SECTIONS = [
    { code: "192", label: "Salary" },
    { code: "194C", label: "Contractors" },
    { code: "194J", label: "Professional Fees" },
    { code: "194I", label: "Rent" },
    { code: "194H", label: "Commission/Brokerage" },
];
