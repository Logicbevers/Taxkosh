/**
 * TDS Compliance Engine (Phase 14)
 * Calculates Interest and Penalties for late TDS payments.
 * 
 * Rules:
 * 1. Interest on Delayed Deduction: 1% per month or part of a month from the date tax was deductible.
 * 2. Interest on Delayed Payment (Deposited late): 1.5% per month or part of a month from the date tax was deducted.
 * 3. Late Filing Fee (234E): Rs. 200 per day until return is filed, capped at the TDS amount.
 */

import { differenceInMonths, differenceInDays, isAfter } from "date-fns";

export interface TdsComplianceResult {
    interestDeduction: number;
    interestPayment: number;
    lateFee: number;
    totalComplianceCost: number;
}

/**
 * Calculate interest for delayed TDS actions
 * @param amount TDS amount
 * @param deductibleDate Date when tax SHOULD have been deducted
 * @param actualDeductionDate Date when tax WAS actually deducted
 * @param depositDate Date when tax was deposited to Govt
 */
export function calculateTdsInterest(
    amount: number,
    deductibleDate: Date,
    actualDeductionDate: Date,
    depositDate: Date,
    dueDate: Date // 7th of following month usually
): TdsComplianceResult {
    let interestDeduction = 0;
    let interestPayment = 0;

    // 1. Delayed Deduction (1% per month)
    if (isAfter(actualDeductionDate, deductibleDate)) {
        // "Part of a month" counts as a full month
        const months = Math.max(1, differenceInMonths(actualDeductionDate, deductibleDate) + 1);
        interestDeduction = amount * 0.01 * months;
    }

    // 2. Delayed Payment (1.5% per month from deduction date to deposit date)
    if (isAfter(depositDate, dueDate)) {
        const months = Math.max(1, differenceInMonths(depositDate, actualDeductionDate) + 1);
        interestPayment = amount * 0.015 * months;
    }

    return {
        interestDeduction: Math.round(interestDeduction),
        interestPayment: Math.round(interestPayment),
        lateFee: 0, // Calculated separately based on return filing date
        totalComplianceCost: Math.round(interestDeduction + interestPayment)
    };
}

/**
 * Late Filing Fee (Section 234E)
 */
export function calculateLateFilingFee(
    tdsAmount: number,
    returnDueDate: Date,
    actualFilingDate: Date
): number {
    if (isAfter(actualFilingDate, returnDueDate)) {
        const days = differenceInDays(actualFilingDate, returnDueDate);
        const fee = days * 200;
        return Math.min(fee, tdsAmount); // Capped at TDS amount
    }
    return 0;
}
