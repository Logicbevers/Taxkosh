import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { monitoring } from "@/lib/monitoring";

/**
 * Mock Form 16 AI Parsing Engine (Phase 14)
 * In a real scenario, this would use an OCR engine like AWS Textract or Google Document AI.
 * Here, we simulate the extraction of tax-relevant data from a PDF buffer.
 */

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        monitoring.log("Form 16 parsing initiated", "info", { userId: session.user.id });

        const formData = await req.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Simulate a small delay for "AI processing"
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Mock Extrated Data based on "typical" Form 16 attributes
        const mockExtractedData = {
            employerName: "Tech Solutions Pvt Ltd",
            employerTan: "KOLT01234G",
            assessmentYear: "2024-25",
            incomeFromSalary: 850000,
            allowancesExempt: 45000,
            standardDeduction: 50000,
            taxOnEmployment: 2500,
            tdsOnSalary: 12500,
            deductions80C: {
                total: 150000,
                breakdown: [
                    { label: "EPF", amount: 60000 },
                    { label: "PPF", amount: 40000 },
                    { label: "LIC", amount: 50000 }
                ]
            }
        };

        monitoring.trackEvent("form16_parsed_success", {
            userId: session.user.id,
            salary: mockExtractedData.incomeFromSalary
        });

        return NextResponse.json({
            success: true,
            data: mockExtractedData,
            message: "Form 16 parsed successfully (Mock AI Engine)"
        });

    } catch (error: any) {
        monitoring.captureException(error, { userId: session.user.id });
        return NextResponse.json({ error: "Failed to parse document" }, { status: 500 });
    }
}
