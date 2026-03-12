import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole, ServiceRequestStatus } from "@prisma/client";
import { sendInvoiceEmail } from "@/lib/resend"; // Re-using resend logic or similar
import { resend } from "@/lib/resend";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    const userRole = session?.user?.role;

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.TAX_EXECUTIVE, UserRole.SENIOR_REVIEWER];
    if (!session?.user?.id || !allowedRoles.includes(userRole as UserRole)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const { message } = await req.json();
        const resolvedParams = await params;

        const updatedRequest = await prisma.serviceRequest.update({
            where: { id: resolvedParams.id },
            data: {
                status: ServiceRequestStatus.CLARIFICATION_REQUIRED,
                notes: message // Storing user-facing message in notes for now
            },
            include: { user: true }
        });

        // Notify user via Resend
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: "TaxKosh Support <support@taxkosh.com>",
                to: [updatedRequest.user.email],
                subject: `Clarification Required - ${updatedRequest.id.split("-")[0]}`,
                html: `
                    <div>
                        <h1>Clarification Required</h1>
                        <p>Hi ${updatedRequest.user.name || "User"},</p>
                        <p>Our tax team requires further information regarding your <strong>${updatedRequest.category.replace(/_/g, " ")}</strong> request.</p>
                        <p><strong>Message:</strong> ${message}</p>
                        <p>Please log in to your dashboard to provide the necessary details.</p>
                        <p><br/>Best,<br/>The TaxKosh Team</p>
                    </div>
                `
            });
        }

        return NextResponse.json(updatedRequest);
    } catch (error) {
        console.error("Clarification Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
