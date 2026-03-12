"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, UserPlus } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function DeducteeManager() {
    const [deductees, setDeductees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [pan, setPan] = useState("");
    const [category, setCategory] = useState("NON_COMPANY");

    useEffect(() => {
        fetchDeductees();
    }, []);

    async function fetchDeductees() {
        const res = await fetch("/api/tds/deductees");
        const data = await res.json();
        setDeductees(data);
        setLoading(false);
    }

    async function handleAddDeductee(e: React.FormEvent) {
        e.preventDefault();
        const res = await fetch("/api/tds/deductees", {
            method: "POST",
            body: JSON.stringify({ name, pan, category })
        });

        if (res.ok) {
            setOpen(false);
            fetchDeductees();
            setName("");
            setPan("");
        }
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Deductee Master</h1>
                    <p className="text-sm text-muted-foreground">Manage your vendors and employees for TDS deduction.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button><UserPlus className="mr-2 h-4 w-4" /> Add Deductee</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Deductee</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddDeductee} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">PAN Number</label>
                                <Input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Category</label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="COMPANY">Company</SelectItem>
                                        <SelectItem value="NON_COMPANY">Non-Company / Individual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="submit" className="w-full">Create Deductee</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Search className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Search deductees by name or PAN..." className="max-w-md" />
                    </div>
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">PAN (Masked)</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Category</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deductees.map((d) => (
                                    <tr key={d.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{d.name}</td>
                                        <td className="p-4 align-middle font-mono">XXXXX{d.id.slice(-4)}X</td>
                                        <td className="p-4 align-middle">{d.category}</td>
                                        <td className="p-4 align-middle text-primary cursor-pointer hover:underline">View History</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
