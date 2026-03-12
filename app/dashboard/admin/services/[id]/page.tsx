"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    FileText,
    ArrowLeft,
    MessageCircle,
    CheckCircle,
    Upload,
    Download,
    AlertTriangle,
    Clock,
    User,
    Mail,
    CreditCard
} from "lucide-react";
import Link from "next/link";
import InternalNotes from "./notes-feed";
import { DocumentItem } from "@/components/services/DocumentItem";
import { maskPAN } from "@/lib/security";

export default function ServiceOperationDetail({ params }: any) {
    const [req, setReq] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        params.then((res: any) => {
            fetch(`/api/admin/services?id=${res.id}`)
                .then(r => r.json())
                .then(data => {
                    // API now returns array with 1 item or empty if filtered by ID
                    setReq(data[0] || null);
                    setIsLoading(false);
                });
        });
    }, [params]);

    if (isLoading) return <div className="p-12 text-center text-muted-foreground animate-pulse">Scanning request signature...</div>;
    if (!req) return <div className="p-12 text-center">Service Request not found.</div>;

    const handleClarification = async () => {
        const message = prompt("What clarification is required? This will be sent to the user.");
        if (!message) return;
        setIsActionLoading(true);
        try {
            await fetch(`/api/admin/services/${req.id}/clarification`, {
                method: "POST",
                body: JSON.stringify({ message }),
                headers: { "Content-Type": "application/json" }
            });
            window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleFileAcknowledgement = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setIsActionLoading(true);
        try {
            await fetch(`/api/admin/services/${req.id}/file`, {
                method: "POST",
                body: formData
            });
            window.location.reload();
        } catch (e) {
            console.error(e);
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/admin/services"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{req.category.replace(/_/g, " ")}</h1>
                        <Badge variant="outline" className="font-mono text-xs">{req.id}</Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><User className="w-4 h-4" /> {req.user.name}</span>
                        <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {req.user.email}</span>
                        <span className="flex items-center gap-1 font-mono uppercase bg-slate-100 dark:bg-slate-900 px-2 rounded"><CreditCard className="w-4 h-4" /> {maskPAN(req.user.pan)}</span>
                    </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Badge variant={req.slaStatus === "CRITICAL" ? "destructive" : "secondary"}>
                        <Clock className="w-3 h-3 mr-1" /> SLA: {req.hoursElapsed}h elapsed
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Documents & Details */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight">{req.status.replace(/_/g, " ")}</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-slate-50 dark:bg-slate-900 border-none">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Paid Amount</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold tracking-tight">₹{(req.amount / 100).toLocaleString()}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2 italic">
                                <FileText className="w-5 h-5 text-primary" /> User Documents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {req.documents?.length === 0 ? (
                                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                                        No documents uploaded by user yet.
                                    </div>
                                ) : (
                                    req.documents?.map((doc: any) => (
                                        <DocumentItem key={doc.id} doc={doc} />
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {req.filedAcknowledgementS3Key && (
                        <Card className="border-green-500/20 bg-green-500/5">
                            <CardHeader>
                                <CardTitle className="text-green-700 flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5" /> Filed Acknowledgement
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="border-green-200" onClick={() => window.open(`/api/documents/view?key=${req.filedAcknowledgementS3Key}`, '_blank')}>
                                    <Download className="w-4 h-4 mr-2" /> View Filing Proof
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Actions & Notes */}
                <div className="space-y-8">
                    <Card className="border-t-4 border-t-primary">
                        <CardHeader>
                            <CardTitle>Management Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Button className="w-full justify-start" variant="outline" onClick={handleClarification} disabled={isActionLoading}>
                                <MessageCircle className="w-4 h-4 mr-2" /> Request Clarification
                            </Button>

                            <div className="relative">
                                <input
                                    type="file"
                                    className="hidden"
                                    id="ack-upload"
                                    onChange={handleFileAcknowledgement}
                                    disabled={isActionLoading}
                                />
                                <Button className="w-full justify-start bg-emerald-600 hover:bg-emerald-700" onClick={() => document.getElementById('ack-upload')?.click()} disabled={isActionLoading}>
                                    <Upload className="w-4 h-4 mr-2" /> Mark as Filed
                                </Button>
                            </div>

                            <Button className="w-full justify-start text-destructive" variant="ghost" disabled={isActionLoading}>
                                <AlertTriangle className="w-4 h-4 mr-2" /> Reject Application
                            </Button>
                        </CardContent>
                    </Card>

                    <InternalNotes serviceRequestId={req.id} />
                </div>
            </div>
        </div>
    );
}
