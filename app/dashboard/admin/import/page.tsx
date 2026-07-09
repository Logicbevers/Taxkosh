"use client"

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import {
    UploadCloud, FileSpreadsheet, CheckCircle2, XCircle,
    ArrowLeft, AlertTriangle, Download, Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface ParsedRow {
    name: string;
    email: string;
    phone?: string;
    pan?: string;
    gstin?: string;
    role: "INDIVIDUAL" | "BUSINESS" | "CA";
    _valid: boolean;
    _errors: string[];
}

interface ImportResult {
    email: string;
    status: "created" | "skipped" | "error";
    reason?: string;
}

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES = new Set(["INDIVIDUAL", "BUSINESS", "CA"]);

function parseCSV(text: string): ParsedRow[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const header = lines[0].split(",").map(h => h.replace(/^"|"$/g, "").trim().toLowerCase());
    const nameIdx = header.indexOf("name");
    const emailIdx = header.indexOf("email");
    const phoneIdx = header.indexOf("phone");
    const panIdx = header.indexOf("pan");
    const gstinIdx = header.indexOf("gstin");
    const roleIdx = header.indexOf("role");

    if (emailIdx === -1) return [];

    return lines.slice(1).filter(l => l.trim()).map(line => {
        const cols = line.split(",").map(c => c.replace(/^"|"$/g, "").trim());
        const get = (i: number) => (i >= 0 ? cols[i] ?? "" : "");

        const email = get(emailIdx);
        const name = get(nameIdx) || email.split("@")[0];
        const rawRole = get(roleIdx).toUpperCase();
        const role = (VALID_ROLES.has(rawRole) ? rawRole : "INDIVIDUAL") as ParsedRow["role"];
        const pan = get(panIdx).toUpperCase() || undefined;
        const phone = get(phoneIdx) || undefined;
        const gstin = get(gstinIdx) || undefined;

        const errors: string[] = [];
        if (!EMAIL_REGEX.test(email)) errors.push("Invalid email");
        if (pan && !PAN_REGEX.test(pan)) errors.push("Invalid PAN format");
        if (phone && !/^\d{10}$/.test(phone.replace(/\D/g, ""))) errors.push("Phone must be 10 digits");

        return { name, email, phone, pan, gstin, role, _valid: errors.length === 0, _errors: errors };
    });
}

export default function ImportPage() {
    const fileRef = useRef<HTMLInputElement>(null);
    const [rows, setRows] = useState<ParsedRow[]>([]);
    const [results, setResults] = useState<ImportResult[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [fileName, setFileName] = useState("");

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        setResults([]);
        setIsDone(false);

        const reader = new FileReader();
        reader.onload = ev => {
            const text = ev.target?.result as string;
            setRows(parseCSV(text));
        };
        reader.readAsText(file);
    };

    const validRows = rows.filter(r => r._valid);
    const invalidRows = rows.filter(r => !r._valid);

    const handleImport = async () => {
        if (validRows.length === 0) return;
        setIsImporting(true);
        try {
            const res = await fetch("/api/admin/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: validRows }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.error ?? "Import failed");
                return;
            }
            setResults(data.results ?? []);
            setIsDone(true);
            toast.success(`Import complete — ${data.created} created, ${data.skipped} skipped`);
        } catch {
            toast.error("Import failed. Please try again.");
        } finally {
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const csv = ["name,email,phone,pan,gstin,role", "Ravi Kumar,ravi@example.com,9876543210,ABCDE1234F,,INDIVIDUAL", "Acme Corp,admin@acme.com,9123456789,,27AABCU9603R1ZX,BUSINESS"].join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "taxkosh-import-template.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="p-8 space-y-8 max-w-6xl mx-auto pb-24 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-primary/10 hover:text-primary">
                    <Link href="/dashboard/admin/customers"><ArrowLeft className="w-4 h-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">Bulk Import</h1>
                    <p className="text-muted-foreground text-sm mt-1">Import taxpayers from a CSV file. Existing accounts are skipped.</p>
                </div>
            </div>

            {/* Upload Zone */}
            {rows.length === 0 && (
                <Card className="border-none shadow-xl dark:bg-slate-900/50 rounded-3xl">
                    <CardContent className="p-0">
                        <div
                            className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl p-16 flex flex-col items-center gap-6 cursor-pointer hover:border-primary/50 hover:bg-primary/[0.02] transition-all duration-300"
                            onClick={() => fileRef.current?.click()}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                const file = e.dataTransfer.files[0];
                                if (file) {
                                    const dt = new DataTransfer();
                                    dt.items.add(file);
                                    if (fileRef.current) fileRef.current.files = dt.files;
                                    handleFile({ target: { files: dt.files } } as React.ChangeEvent<HTMLInputElement>);
                                }
                            }}
                        >
                            <div className="h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <UploadCloud className="w-10 h-10 text-primary" />
                            </div>
                            <div className="text-center">
                                <p className="font-black text-lg text-slate-900 dark:text-white">Drop your CSV here</p>
                                <p className="text-sm text-slate-500 mt-1">or click to browse. Required columns: <code className="text-primary">email</code></p>
                                <p className="text-[11px] text-slate-400 mt-2">Optional: name, phone, pan, gstin, role (INDIVIDUAL/BUSINESS/CA)</p>
                            </div>
                            <Button variant="outline" className="h-12 rounded-2xl font-black text-xs uppercase tracking-widest px-6" onClick={e => { e.stopPropagation(); downloadTemplate(); }}>
                                <Download className="w-4 h-4 mr-2" /> Download Template
                            </Button>
                        </div>
                        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
                    </CardContent>
                </Card>
            )}

            {/* Preview */}
            {rows.length > 0 && !isDone && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                                <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-black text-sm text-slate-900 dark:text-white">{fileName}</p>
                                <p className="text-[11px] text-slate-400">{rows.length} rows detected · <span className="text-emerald-600 font-bold">{validRows.length} valid</span> · <span className="text-rose-500 font-bold">{invalidRows.length} invalid</span></p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="h-10 rounded-2xl font-black text-[10px] uppercase tracking-widest px-5" onClick={() => { setRows([]); setFileName(""); if (fileRef.current) fileRef.current.value = ""; }}>
                                Reset
                            </Button>
                            <Button className="h-10 rounded-2xl font-black text-[10px] uppercase tracking-widest px-6" onClick={handleImport} disabled={isImporting || validRows.length === 0}>
                                {isImporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Importing...</> : `Import ${validRows.length} Taxpayers`}
                            </Button>
                        </div>
                    </div>

                    {invalidRows.length > 0 && (
                        <div className="flex items-start gap-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 p-5 rounded-2xl">
                            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="font-black text-xs uppercase tracking-widest text-amber-700">{invalidRows.length} rows will be skipped due to validation errors</p>
                                <p className="text-xs text-amber-600/80 mt-1">Fix your CSV and re-upload to include them.</p>
                            </div>
                        </div>
                    )}

                    <Card className="border-none shadow-xl dark:bg-slate-900/50 rounded-3xl overflow-hidden">
                        <CardHeader className="border-b border-slate-100 dark:border-slate-800 py-4 px-6">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Preview — All Rows</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Status</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Name</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Email</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Phone</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">PAN</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest">Role</TableHead>
                                            <TableHead className="text-[10px] font-black uppercase tracking-widest pr-6">Issues</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rows.map((row, i) => (
                                            <TableRow key={i} className={row._valid ? "" : "bg-rose-50/40 dark:bg-rose-950/10"}>
                                                <TableCell className="pl-6">
                                                    {row._valid
                                                        ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                        : <XCircle className="w-4 h-4 text-rose-500" />}
                                                </TableCell>
                                                <TableCell className="font-medium text-sm">{row.name}</TableCell>
                                                <TableCell className="text-sm">{row.email}</TableCell>
                                                <TableCell className="text-sm text-slate-500">{row.phone ?? "—"}</TableCell>
                                                <TableCell className="font-mono text-xs">{row.pan ?? "—"}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest px-2 h-5 rounded-lg">{row.role}</Badge>
                                                </TableCell>
                                                <TableCell className="pr-6 text-[11px] text-rose-500 font-medium">{row._errors.join(", ") || "—"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Results */}
            {isDone && results.length > 0 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Created", count: results.filter(r => r.status === "created").length, color: "text-emerald-600", bg: "bg-emerald-500/10", icon: CheckCircle2 },
                            { label: "Skipped (existing)", count: results.filter(r => r.status === "skipped").length, color: "text-amber-600", bg: "bg-amber-500/10", icon: AlertTriangle },
                            { label: "Errors", count: results.filter(r => r.status === "error").length, color: "text-rose-600", bg: "bg-rose-500/10", icon: XCircle },
                        ].map(stat => (
                            <Card key={stat.label} className="border-none shadow-xl dark:bg-slate-900/50 rounded-3xl">
                                <CardContent className="p-6 flex items-center gap-4">
                                    <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                    </div>
                                    <div>
                                        <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.count}</div>
                                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="flex gap-3">
                        <Button variant="outline" className="h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest px-6" onClick={() => { setRows([]); setResults([]); setIsDone(false); setFileName(""); }}>
                            Import Another File
                        </Button>
                        <Button asChild className="h-11 rounded-2xl font-black text-[10px] uppercase tracking-widest px-6">
                            <Link href="/dashboard/admin/customers">View Taxpayer Registry</Link>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
