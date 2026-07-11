"use client"

import { useState, useEffect, use } from "react";
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
    User as UserIcon,
    Mail,
    CreditCard,
    Briefcase,
    Zap,
    Phone,
    Calendar,
    ChevronRight,
    Loader2,
    Eye
} from "lucide-react";
import Link from "next/link";
import InternalNotes from "./notes-feed";
import { DocumentItem } from "@/components/services/DocumentItem";
import { maskPAN } from "@/lib/security";
import { toast } from "sonner";
import { PromptDialog } from "@/components/admin";

export default function ServiceOperationDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id: requestId } = use(params);
    const [req, setReq] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isClarificationOpen, setIsClarificationOpen] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState(false);
    const router = useRouter();

    const fetchRequest = async () => {
        try {
            const r = await fetch(`/api/admin/service-requests/${requestId}`);
            if (!r.ok) { setReq(null); return; }
            const data = await r.json();
            setReq(data);
        } catch (err) {
            console.error(err);
            setReq(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequest();
    }, [requestId]);

    if (isLoading) return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-6">
                <div className="h-16 w-16 rounded-3xl border-4 border-primary/20 border-t-primary animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Loading request...</p>
            </div>
        </div>
    );
    if (!req) return (
        <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 opacity-40">
                <div className="h-20 w-20 bg-slate-100 rounded-3xl flex items-center justify-center"><FileText className="w-10 h-10 text-slate-400" /></div>
                <p className="font-black text-xs uppercase tracking-widest">Request record not found in system</p>
            </div>
        </div>
    );

    const handleStatusUpdate = async (newStatus: string) => {
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/service-requests/${req.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: newStatus }),
                headers: { "Content-Type": "application/json" }
            });
            if (res.ok) {
                toast.success(`Moved to ${newStatus.replace(/_/g, ' ')}`);
                fetchRequest();
            } else {
                const data = await res.json();
                toast.error(data.error || "Couldn't update the status. Please try again.");
            }
        } catch (e) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleClarification = () => setIsClarificationOpen(true);

    const submitClarification = async (message: string) => {
        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/service-requests/${req.id}/clarification`, {
                method: "POST",
                body: JSON.stringify({ message }),
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Failed to send clarification");
                return;
            }
            toast.success("Clarification request sent to client");
            setIsClarificationOpen(false);
            fetchRequest();
        } catch (e) {
            console.error(e);
            toast.error("Failed to send clarification");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleManualUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/service-requests/${req.id}/document`, {
                method: "POST",
                body: formData
            });
            if (res.ok) {
                toast.success("Document uploaded");
                fetchRequest();
            }
        } catch (e) {
            toast.error("Upload failed");
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleFilingUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        setIsActionLoading(true);
        try {
            const res = await fetch(`/api/admin/service-requests/${req.id}/file`, {
                method: "POST",
                body: formData
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                toast.error(data.error || "Upload failed");
                return;
            }
            toast.success("Filing acknowledgement uploaded");
            fetchRequest();
        } catch (e) {
            console.error(e);
            toast.error("Upload failed. Please try again.");
        } finally {
            setIsActionLoading(false);
        }
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                        <Link href="/dashboard/admin/service-requests"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-serif text-3xl text-foreground">
                                {req.service?.name || "Managed Service"}
                            </h1>
                            <Badge variant="outline" className="font-mono text-[10px] py-1 px-3 border-primary/20 bg-primary/5 text-primary tracking-widest uppercase">
                                ID: {req.id.slice(0, 8)}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground mt-1 text-sm font-medium flex items-center gap-2">
                            Status: <span className="text-primary font-bold uppercase tracking-widest text-xs">{req.status.replace(/_/g, ' ')}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className={`h-11 px-6 rounded-2xl flex items-center gap-3 shadow-sm border transition-all ${req.slaStatus === 'CRITICAL' ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/50 text-rose-600' : req.slaStatus === 'WARNING' ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/50 text-amber-600' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        <Clock className={`w-4 h-4 ${req.slaStatus === 'CRITICAL' ? 'animate-pulse' : ''}`} />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">
                            {typeof req.hoursElapsed === 'number' ? `${req.hoursElapsed}h in queue` : '—'}
                            {req.slaStatus === 'CRITICAL' && ' · SLA breached'}
                            {req.slaStatus === 'WARNING' && ' · SLA at risk'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Missing Documents Alert */}
            {(() => {
                const required = req.service?.requiredDocuments || [];
                const uploaded = req.documents?.map((d: any) => d.label).filter(Boolean) || [];
                const missing = required.filter((r: string) => !uploaded.includes(r));
                
                if (missing.length > 0 && req.status !== "COMPLETED" && req.status !== "FILED") {
                    return (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200/50 p-6 rounded-2xl flex items-center gap-5 shadow-sm">
                            <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-600 shadow-inner">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <p className="font-black text-xs uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">Missing Documents</p>
                                <p className="text-sm font-semibold text-amber-800/80 dark:text-amber-300/80 mt-1">
                                    Waiting on the customer to upload: <span className="font-black text-amber-900 dark:text-white px-2 py-0.5 rounded bg-amber-200/50 dark:bg-amber-800/50">{missing.join(", ")}</span>
                                </p>
                            </div>
                        </div>
                    );
                }
                return null;
            })()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-[2rem] border border-white/20 dark:border-slate-800 backdrop-blur-sm group">
                            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 py-5 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-400 group-hover:text-primary transition-colors duration-300">
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
                                        <UserIcon className="w-3.5 h-3.5" />
                                    </div>
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5 px-6 pb-6 space-y-3">
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all group/row">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Legal Name</span>
                                    <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white group-hover/row:text-primary transition-colors">{req.user.name}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all group/row">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email</span>
                                    <span className="font-bold text-xs tracking-tight lowercase text-slate-700 dark:text-slate-300">{req.user.email}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">PAN</span>
                                    <code className="font-mono font-black text-xs uppercase bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-inner text-slate-700 dark:text-slate-300">
                                        {maskPAN(req.user.pan)}
                                    </code>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-[2rem] border border-white/20 dark:border-slate-800 backdrop-blur-sm group">
                            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-100 dark:border-slate-800 py-5 px-6">
                                <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-3 text-slate-400 group-hover:text-primary transition-colors duration-300">
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 transition-colors">
                                        <Briefcase className="w-3.5 h-3.5" />
                                    </div>
                                    Service Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-5 px-6 pb-6 space-y-3">
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Plan</span>
                                    <Badge variant="outline" className="font-black text-[9px] uppercase tracking-tighter border-primary/20 bg-primary/5 text-primary px-3 h-6 rounded-xl">{req.plan?.planName || "Custom"}</Badge>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all group/row">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Amount Paid</span>
                                    <span className="font-black text-base tracking-tight text-primary">₹{(req.amount / 100).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Requested On</span>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3.5 h-3.5 text-slate-300" />
                                        <span className="font-black text-xs text-slate-900 dark:text-white tabular-nums">{new Date(req.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Section 3: Document Repository */}
                    <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-[2rem] border border-white/20 dark:border-slate-800 backdrop-blur-sm relative">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 py-6 px-8">
                            <div>
                                <CardTitle className="flex items-center gap-3 font-black text-[11px] uppercase tracking-[0.3em] text-slate-500">
                                    <div className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-inner">
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    Documents
                                </CardTitle>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2 pl-11">Customer-submitted files</p>
                            </div>
                            <div className="relative">
                                <input type="file" id="manual-doc" className="hidden" onChange={handleManualUpload} />
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="h-10 rounded-2xl border-dashed border-2 border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest px-5 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all shadow-sm" 
                                    onClick={() => document.getElementById('manual-doc')?.click()}
                                >
                                    <Upload className="w-3 h-3 mr-2" /> Upload Document
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(() => {
                                    const required = req.service?.requiredDocuments || [];
                                    const uploadedByLabel = req.documents?.reduce((acc: any, d: any) => {
                                        if (d.label) acc[d.label] = d;
                                        return acc;
                                    }, {}) || {};
                                    
                                    const extras = req.documents?.filter((d: any) => !d.label || !required.includes(d.label)) || [];
                                    
                                    return (
                                        <>
                                            {required.map((reqDoc: string) => {
                                                const doc = uploadedByLabel[reqDoc];
                                                return (
                                                    <div key={reqDoc} className={`group relative border rounded-2xl p-4 transition-all duration-300 ${doc ? 'border-primary/20 bg-primary/[0.02]' : 'border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20'}`}>
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner transition-transform group-hover:scale-105 ${doc ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-100 dark:border-emerald-900/50' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-500 border-amber-100 dark:border-amber-900/50'}`}>
                                                                    {doc ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 opacity-60" />}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[140px]">{reqDoc}</p>
                                                                    {doc ? (
                                                                        <div className="flex items-center gap-2 mt-1">
                                                                            <span className="text-[9px] font-black uppercase text-primary/70 tracking-tighter">{(doc.fileSize / 1024).toFixed(0)} KB</span>
                                                                            <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                                                                            <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter truncate max-w-[100px]">{doc.fileName}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[9px] font-black uppercase text-amber-500/80 tracking-widest mt-1">Pending Submission</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            {doc && (
                                                                <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white shadow-sm transition-all" onClick={() => window.open(`/api/documents/view?key=${doc.s3Key}`, '_blank')}>
                                                                        <Eye className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white shadow-sm transition-all text-primary">
                                                                        <Download className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            
                                            {extras.map((doc: any) => (
                                                <div key={doc.id} className="group relative border border-slate-100 dark:border-slate-800 rounded-2xl p-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-300">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-primary border border-slate-100 dark:border-slate-800 shadow-inner group-hover:scale-105 transition-transform">
                                                                <FileText className="w-6 h-6" />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate max-w-[140px]">{doc.fileName}</p>
                                                                <div className="flex items-center gap-2 mt-1">
                                                                    <span className="text-[9px] font-black uppercase text-primary/70 tracking-tighter">{(doc.fileSize / 1024).toFixed(0)} KB</span>
                                                                    <span className="h-0.5 w-0.5 rounded-full bg-slate-300" />
                                                                    <span className="text-[9px] font-black uppercase text-muted-foreground tracking-tighter">Supplemental</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white shadow-sm transition-all" onClick={() => window.open(`/api/documents/view?key=${doc.s3Key}`, '_blank')}>
                                                                <Eye className="w-4 h-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-xl hover:bg-white shadow-sm transition-all text-primary">
                                                                <Download className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {required.length === 0 && extras.length === 0 && (
                                                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-3xl bg-muted/10">
                                                    <div className="h-16 w-16 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <FileText className="w-8 h-8 opacity-20" />
                                                    </div>
                                                    <p className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-400">No documents yet</p>
                                                    <p className="text-xs text-muted-foreground mt-2 italic px-8">Waiting for the customer to upload their documents.</p>
                                                </div>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Filed Record */}
                    {req.filedAcknowledgementS3Key && (
                        <Card className="border-none shadow-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
                            <CardHeader className="py-6 px-8 relative z-10">
                                <CardTitle className="text-white font-black uppercase text-[11px] tracking-[0.3em] flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-white/20">
                                        <CheckCircle className="w-4 h-4" />
                                    </div>
                                    Filing Complete
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pb-8 px-8 relative z-10">
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                    <p className="text-sm font-semibold text-emerald-50 leading-relaxed max-w-md">
                                        The filing acknowledgement has been uploaded and is available to the customer.
                                    </p>
                                    <Button variant="outline" className="h-12 rounded-2xl border-none bg-white text-emerald-700 hover:bg-emerald-50 font-black text-xs uppercase tracking-widest shadow-xl px-8" onClick={() => window.open(`/api/documents/view?key=${req.filedAcknowledgementS3Key}`, '_blank')}>
                                        <Download className="w-4 h-4 mr-2" /> Download Acknowledgement
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Controls */}
                <div className="space-y-8">
                    {/* Section 4: Lifecycle Engine */}
                    <Card className="border-none shadow-xl dark:bg-slate-900 overflow-hidden sticky top-8 group">
                        <div className="h-1 bg-gradient-to-r from-primary to-primary/70 w-full" />
                        <CardHeader className="bg-muted/30 border-b py-6 px-8 shadow-inner">
                            <CardTitle className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500 group-hover:text-primary transition-colors">Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <Button className="w-full justify-between h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest group/btn transition-all hover:ring-2 hover:ring-primary/20 border-slate-100" variant="outline" onClick={() => handleStatusUpdate("DOCUMENTS_PENDING")} disabled={isActionLoading}>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono">01</div>
                                    Request Documents
                                </div>
                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform text-primary/40" />
                            </Button>
                            
                            <Button className="w-full justify-between h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest group/btn transition-all hover:ring-2 hover:ring-primary/20 border-slate-100" variant="outline" onClick={() => handleStatusUpdate("UNDER_PROCESS")} disabled={isActionLoading}>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-mono">02</div>
                                    Start Processing
                                </div>
                                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform text-primary/40" />
                            </Button>

                            <Button className="w-full justify-between h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest group/btn transition-all hover:ring-2 hover:ring-amber-500/20 border-slate-100" variant="outline" onClick={handleClarification} disabled={isActionLoading}>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-mono">03</div>
                                    Ask Customer
                                </div>
                                <MessageCircle className="w-4 h-4 group-hover/btn:rotate-12 transition-transform text-amber-500/40" />
                            </Button>

                            <Button className="w-full justify-between h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest group/btn transition-all hover:ring-2 hover:ring-blue-500/20 border-slate-100" variant="outline" onClick={() => handleStatusUpdate("READY_FOR_FILING")} disabled={isActionLoading}>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-mono">04</div>
                                    Mark Ready to File
                                </div>
                                <CheckCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform text-blue-500/40" />
                            </Button>

                            <div className="relative pt-4">
                                <input type="file" id="filing-receipt" className="hidden" onChange={handleFilingUpload} />
                                <Button className="w-full justify-between h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest group/btn bg-primary text-white hover:shadow-lg hover:shadow-primary/30 transition-all border-none" onClick={() => document.getElementById('filing-receipt')?.click()} disabled={isActionLoading}>
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-xl bg-white/20 text-white flex items-center justify-center">
                                            <Upload className="w-4 h-4" />
                                        </div>
                                        Upload Filing & Complete
                                    </div>
                                    <Zap className="w-4 h-4 group-hover/btn:animate-pulse" />
                                </Button>
                            </div>

                            <div className="pt-8 border-t border-dashed mt-4">
                                <Button className="w-full justify-center h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95 border border-transparent hover:border-rose-100" variant="ghost" onClick={() => handleStatusUpdate("REJECTED")} disabled={isActionLoading}>
                                    <AlertTriangle className="w-4 h-4 mr-3" /> Reject Request
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Section 5: Internal Communication */}
                    <InternalNotes serviceRequestId={req.id} />
                </div>
            </div>

            <PromptDialog
                open={isClarificationOpen}
                onOpenChange={setIsClarificationOpen}
                title="Request clarification from client"
                description="The client will be notified by email and the request status will move to CLARIFICATION_REQUIRED."
                label="Clarification message"
                placeholder="e.g. Please re-upload Form 16 — the previous file was unreadable on page 2."
                confirmLabel="Send to client"
                minLength={10}
                maxLength={1000}
                isLoading={isActionLoading}
                onSubmit={submitClarification}
            />
        </div>
    );
}
