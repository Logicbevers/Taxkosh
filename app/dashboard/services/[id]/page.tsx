import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceDocumentUploader } from "./uploader"
import { DocumentItem } from "@/components/services/DocumentItem"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { ServiceRequestStatus } from "@prisma/client"
import { Download } from "lucide-react"

import { ServiceTimeline } from "@/components/services/ServiceTimeline"
import { ResolutionCenter } from "@/components/services/ResolutionCenter"

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const resolvedParams = await params;
    const reqId = resolvedParams.id;

    const req = await prisma.serviceRequest.findUnique({
        where: { id: reqId, userId: session.user.id },
        include: {
            documents: true,
            platformInvoice: true,
            internalNotes: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    })

    if (!req) redirect("/dashboard/services")

    return (
        <div className="container p-6 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/dashboard/services"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {req.category.replace(/_/g, " ")}
                            <Badge variant="secondary" className="text-sm font-mono">{req.id.split("-")[0]}</Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1">Created on {req.createdAt.toLocaleDateString()}</p>
                    </div>
                </div>
                {req.status === ServiceRequestStatus.FILED && req.filedAcknowledgementS3Key && (
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2" asChild>
                        <a href={`/api/documents/${req.id}/view?type=filed`} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" /> Download Filed Return
                        </a>
                    </Button>
                )}
            </div>

            <Card className="overflow-visible border-none bg-transparent shadow-none">
                <CardContent className="p-0">
                    <ServiceTimeline currentStatus={req.status} />
                </CardContent>
            </Card>

            {req.status === ServiceRequestStatus.CLARIFICATION_REQUIRED && (
                <ResolutionCenter
                    serviceRequestId={req.id}
                    lastInternalNote={req.internalNotes[0]}
                />
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Service Documents</CardTitle>
                            {req.platformInvoice && (
                                <Button variant="outline" size="sm" asChild className="gap-2">
                                    <a href={`/api/documents/${req.platformInvoice.id}/view`} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-4 h-4" />
                                        Invoice PDF
                                    </a>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent>
                            {req.documents.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                    <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
                                </div>
                            ) : (
                                <ul className="grid sm:grid-cols-2 gap-3">
                                    {req.documents.map((doc: any) => (
                                        <DocumentItem key={doc.id} doc={doc} />
                                    ))}
                                </ul>
                            )}
                        </CardContent>
                    </Card>

                    {req.status === ServiceRequestStatus.PENDING_DOCUMENTS && (
                        <form action={async () => {
                            "use server"
                            const { prisma } = await import("@/lib/prisma");
                            await prisma.serviceRequest.update({
                                where: { id: req.id },
                                data: { status: "DOCUMENTS_SUBMITTED" }
                            })
                            redirect(`/dashboard/services/${req.id}`)
                        }}>
                            <Button type="submit" size="lg" className="w-full" disabled={req.documents.length === 0}>
                                Submit For Review
                            </Button>
                        </form>
                    )}

                    {req.status === "DOCUMENTS_SUBMITTED" && (
                        <div className="p-4 bg-blue-500/10 text-blue-700 rounded-md border border-blue-500/20">
                            <p className="font-medium text-sm">Documents successfully submitted! Our team is reviewing them.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {(req.status === "PENDING_DOCUMENTS" || req.status === "CLARIFICATION_REQUIRED") && (
                        <ServiceDocumentUploader serviceRequestId={req.id} />
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Requirements Checklist</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc pl-5 text-sm space-y-2 text-muted-foreground">
                                {req.category === "ITR_FILING" && (
                                    <>
                                        <li>Form 16 (Part A & B)</li>
                                        <li>Form 26AS / AIS / TIS</li>
                                        <li>Investment Proofs (80C, 80D etc.)</li>
                                        <li>Bank Statements for the financial year</li>
                                    </>
                                )}
                                {req.category === "GST_FILING" && (
                                    <>
                                        <li>Sales Register (B2B and B2C)</li>
                                        <li>Purchase Register (for ITC matching)</li>
                                        <li>Bank Statement</li>
                                    </>
                                )}
                                {req.category === "TDS_FILING" && (
                                    <>
                                        <li>TAN Registration Details</li>
                                        <li>Vendor Invoice Details</li>
                                        <li>Challan Copies (if taxes paid)</li>
                                    </>
                                )}
                                {req.category === "BUSINESS_COMPLIANCE" && (
                                    <>
                                        <li>Incorporation Certificate</li>
                                        <li>Previous Year Audited Financials</li>
                                        <li>Director KYC Details</li>
                                    </>
                                )}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
