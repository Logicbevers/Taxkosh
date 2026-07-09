import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ServiceDocumentUploader } from "./uploader"
import { DocumentItem } from "@/components/services/DocumentItem"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft, CheckCircle2, Clock, Download } from "lucide-react"
import Link from "next/link"
import { ServiceRequestStatus, Document } from "@prisma/client"

import { ServiceTimeline } from "@/components/services/ServiceTimeline"
import { ResolutionCenter } from "@/components/services/ResolutionCenter"
import { triggerStatusNotification } from "@/lib/notifications"

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth()
    if (!session?.user?.id) redirect("/login")

    const resolvedParams = await params;
    const reqId = resolvedParams.id;

    const req = await prisma.serviceRequest.findUnique({
        where: { id: reqId, userId: session.user.id },
        include: {
            user: true,
            service: true,
            plan: true,
            documents: true,
            platformInvoice: true,
            internalNotes: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    })

    if (!req) redirect("/dashboard/services")

    const requiredDocs = req.service?.requiredDocuments || []
    const uploadedDocsByLabel = req.documents.reduce((acc: Record<string, Document>, doc: Document) => {
        if (doc.label) acc[doc.label] = doc
        return acc
    }, {})

    return (
        <div className="container p-6 space-y-8 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" asChild className="shrink-0">
                        <Link href="/dashboard/services"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            {req.service?.name || "Service Request"}
                            <Badge variant="secondary" className="text-sm font-mono">{req.id.split("-")[0]}</Badge>
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {req.plan?.planName && `${req.plan.planName} Plan • `}
                            Created on {req.createdAt.toLocaleDateString()}
                        </p>
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

            {/* Contextual KYC nudge — PAN is required to actually file a return */}
            {!req.user.pan && req.status !== ServiceRequestStatus.FILED && req.status !== ServiceRequestStatus.COMPLETED && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border-2 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900/50">
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Complete your tax profile</p>
                            <p className="text-xs text-amber-700/80 dark:text-amber-400/80">Add your PAN so we can file this return on your behalf.</p>
                        </div>
                    </div>
                    <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700 text-white shrink-0">
                        <Link href="/dashboard/profile">Add PAN →</Link>
                    </Button>
                </div>
            )}

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
                            <CardTitle className="text-xl font-bold">Requirement Checklist</CardTitle>
                            {req.platformInvoice && (
                                <Button variant="outline" size="sm" asChild className="gap-2">
                                    <a href={`/api/documents/${req.platformInvoice.id}/view`} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-4 h-4" />
                                        Invoice PDF
                                    </a>
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {requiredDocs.map((docName: string) => {
                                const uploadedDoc = uploadedDocsByLabel[docName];
                                return (
                                    <div key={docName} className={`p-4 rounded-xl border-2 transition-all ${uploadedDoc ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/50' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${uploadedDoc ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300'}`}>
                                                    {uploadedDoc ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm uppercase tracking-tight text-slate-900 dark:text-slate-100">{docName}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                                        {uploadedDoc ? `Attached: ${uploadedDoc.fileName}` : "Awaiting document upload"}
                                                    </p>
                                                </div>
                                            </div>
                                            {!uploadedDoc && (req.status === ServiceRequestStatus.CREATED || req.status === ServiceRequestStatus.PAID || req.status === ServiceRequestStatus.DOCUMENTS_PENDING || req.status === ServiceRequestStatus.CLARIFICATION_REQUIRED) ? (
                                                <div className="relative">
                                                    <ServiceDocumentUploader serviceRequestId={req.id} label={docName} />
                                                </div>
                                            ) : uploadedDoc ? (
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                                    <a
                                                        href={`/api/documents/${uploadedDoc.id}/view`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={`Download ${uploadedDoc.fileName}`}
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </a>
                                                </Button>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="pt-6 border-t mt-6">
                                <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-4">Other Supporting Documents</h4>
                                <ul className="grid sm:grid-cols-2 gap-3">
                                    {req.documents.filter((d: Document) => !d.label).length === 0 ? (
                                        <div className="col-span-full py-6 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-800/30">
                                            <p className="text-xs">No additional documents attached.</p>
                                        </div>
                                    ) : (
                                        req.documents.filter((d: Document) => !d.label).map((doc: Document) => (
                                            <DocumentItem key={doc.id} doc={doc} />
                                        ))
                                    )}
                                </ul>
                                {(req.status === ServiceRequestStatus.CREATED || req.status === ServiceRequestStatus.PAID || req.status === ServiceRequestStatus.DOCUMENTS_PENDING || req.status === ServiceRequestStatus.CLARIFICATION_REQUIRED) && (
                                    <div className="mt-4">
                                        <ServiceDocumentUploader serviceRequestId={req.id} />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {(() => {
                        const missingDocsList = requiredDocs.filter((d: string) => !uploadedDocsByLabel[d]);
                        const isLocked = missingDocsList.length > 0;
                        
                        return (req.status === ServiceRequestStatus.CREATED || req.status === ServiceRequestStatus.PAID || req.status === ServiceRequestStatus.DOCUMENTS_PENDING || req.status === ServiceRequestStatus.CLARIFICATION_REQUIRED) && (
                            <form action={async () => {
                                "use server"
                                const { prisma } = await import("@/lib/prisma");

                                // Server-side block to prevent bypass
                                const checkReq = await prisma.serviceRequest.findUnique({
                                    where: { id: req.id },
                                    include: { documents: true, service: true }
                                });
                                
                                const currentRequired = checkReq?.service?.requiredDocuments || [];
                                const currentUploaded = checkReq?.documents?.map(d => d.label) || [];
                                const stillMissing = currentRequired.filter(r => !currentUploaded.includes(r as string));
                                
                                if (stillMissing.length > 0) {
                                    throw new Error("Cannot submit. Missing documents: " + stillMissing.join(", "));
                                }

                                const updated = await prisma.serviceRequest.update({
                                    where: { id: req.id },
                                    data: { status: ServiceRequestStatus.DOCUMENTS_SUBMITTED },
                                    include: { user: true, service: true }
                                })
                                
                                // Trigger Status Notification
                                const { triggerStatusNotification } = await import("@/lib/notifications");
                                await triggerStatusNotification({ 
                                    userId: updated.userId, 
                                    serviceRequestId: updated.id, 
                                    serviceName: updated.service?.name || "Service", 
                                    status: updated.status, 
                                    userEmail: updated.user.email 
                                });
                                
                                const { redirect } = await import("next/navigation");
                                redirect(`/dashboard/services/${req.id}`)
                            }}>
                                <Button type="submit" size="lg" className={`w-full font-bold ${isLocked ? 'bg-slate-200 text-slate-500' : 'bg-slate-900 hover:bg-black text-white'}`} disabled={isLocked}>
                                    {isLocked ? `Awaiting ${missingDocsList.length} Mandatory Document${missingDocsList.length > 1 ? 's' : ''}` : "Submit All Documents For Review"}
                                </Button>
                            </form>
                        );
                    })()}

                    {req.status === ServiceRequestStatus.DOCUMENTS_SUBMITTED && (
                        <div className="p-6 bg-blue-50 border-2 border-blue-100 text-blue-700 rounded-xl flex items-center gap-4">
                            <div className="p-3 bg-blue-500 text-white rounded-full">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-bold">Documents Under Review</p>
                                <p className="text-sm opacity-80">Our experts are verifying your submissions. We will notify you if anything else is needed.</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader className="border-b py-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Request Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-5 space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-semibold">{req.status.replace(/_/g, " ")}</span>
                            </div>
                            {req.plan?.planName && (
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Plan</span>
                                    <span className="font-semibold">{req.plan.planName}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Amount</span>
                                <span className="font-semibold">₹{(req.amount / 100).toLocaleString("en-IN")}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Created</span>
                                <span className="font-semibold">{req.createdAt.toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {req.status === ServiceRequestStatus.CLARIFICATION_REQUIRED && (
                        <ResolutionCenter
                            serviceRequestId={req.id}
                            lastInternalNote={req.internalNotes[0]}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
