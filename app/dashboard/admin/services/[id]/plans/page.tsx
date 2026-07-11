"use client"

import { useEffect, useState, use } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ArrowLeft, IndianRupee, Clock, Tag, Info } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { useConfirm } from "@/lib/hooks/use-confirm";

interface ServicePlan {
    id: string;
    serviceId: string;
    planName: string;
    price: number;
    description: string | null;
    turnaroundTime: string | null;
    status: string;
    createdAt: string;
}

interface Service {
    id: string;
    name: string;
    subCategory: {
        name: string;
        category: {
            name: string;
        }
    }
}

export default function ServicePlansPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: serviceId } = use(params);
    const { confirm, ConfirmDialogPortal } = useConfirm();
    const [service, setService] = useState<Service | null>(null);
    const [plans, setPlans] = useState<ServicePlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<ServicePlan | null>(null);

    // Form states
    const [form, setForm] = useState({
        planName: "",
        price: "",
        description: "",
        turnaroundTime: "",
        status: "active"
    });

    useEffect(() => {
        fetchData();
    }, [serviceId]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Fetch service details from the standard services list (reusing existing API with filter)
            const serviceRes = await fetch(`/api/admin/services`);
            const allServices = await serviceRes.json();
            const currentService = allServices.find((s: any) => s.id === serviceId);
            setService(currentService);

            const plansRes = await fetch(`/api/admin/services/${serviceId}/plans`);
            const plansData = await plansRes.json();
            setPlans(plansData);
        } catch (error) {
            toast.error("Failed to load data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const method = editingPlan ? "PATCH" : "POST";
        const url = editingPlan ? `/api/admin/service-plans/${editingPlan.id}` : `/api/admin/services/${serviceId}/plans`;
        
        if (!form.planName || form.price === "") {
            toast.error("Name and Price are required");
            return;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            
            if (res.ok) {
                toast.success(`Plan ${editingPlan ? "updated" : "created"} successfully`);
                setIsModalOpen(false);
                setEditingPlan(null);
                resetForm();
                fetchData();
            } else {
                toast.error("Operation failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleDelete = (id: string, planName: string) => {
        confirm({
            title: `Delete plan "${planName}"?`,
            description: "This is irreversible. Active service requests already linked to this plan are not affected, but no new requests can pick it.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/service-plans/${id}`, { method: "DELETE" });
                    if (res.ok) {
                        toast.success("Plan deleted");
                        fetchData();
                    } else {
                        const data = await res.json().catch(() => ({}));
                        toast.error(data.error || "Delete failed");
                    }
                } catch {
                    toast.error("Delete failed");
                }
            }
        });
    };

    const resetForm = () => {
        setForm({
            planName: "",
            price: "",
            description: "",
            turnaroundTime: "",
            status: "active"
        });
    };

    const openEdit = (plan: ServicePlan) => {
        setEditingPlan(plan);
        setForm({
            planName: plan.planName,
            price: plan.price.toString(),
            description: plan.description || "",
            turnaroundTime: plan.turnaroundTime || "",
            status: plan.status
        });
        setIsModalOpen(true);
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-primary/10 hover:text-primary transition-all">
                        <Link href="/dashboard/admin/services"><ArrowLeft className="w-4 h-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="font-serif text-3xl text-foreground">
                            Service Tiers
                        </h1>
                        {service ? (
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Configuring monetization vectors for <span className="text-primary font-bold">{service.name}</span>
                            </p>
                        ) : (
                            <p className="text-muted-foreground mt-1 text-sm font-medium">Curating execution tiers and pricing logic.</p>
                        )}
                    </div>
                </div>
                <Button 
                    className="rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all px-6"
                    onClick={() => {
                        setEditingPlan(null);
                        resetForm();
                        setIsModalOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" /> New Strategy
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-muted-foreground animate-pulse">Syncing pricing bank...</span>
                        </div>
                    </div>
                ) : plans.length === 0 ? (
                    <Card className="col-span-full py-20 border-none shadow-sm dark:bg-slate-900 flex flex-col items-center justify-center text-muted-foreground bg-muted/20">
                        <Tag className="w-12 h-12 mb-4 opacity-20" />
                        <p className="font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">No Pricing Definitions Found</p>
                        <Button variant="link" onClick={() => setIsModalOpen(true)} className="text-primary font-bold">Initialize Tier Architecture</Button>
                    </Card>
                ) : (
                    plans.map((plan) => (
                        <Card key={plan.id} className={`group overflow-hidden border-none shadow-sm dark:bg-slate-900 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 ${plan.status !== 'active' ? 'opacity-60 grayscale' : ''}`}>
                            <CardHeader className="bg-muted/30 border-b pb-6 relative">
                                <div className="flex justify-between items-center">
                                    <Badge variant="outline" className={`text-[10px] font-black tracking-widest uppercase border-primary/20 bg-primary/5 text-primary px-3 py-1 ${plan.status !== 'active' ? 'opacity-50' : ''}`}>
                                        {plan.status}
                                    </Badge>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-slate-200 transition-all" onClick={() => openEdit(plan)}>
                                            <Edit className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => handleDelete(plan.id, plan.planName)}>
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-xl mt-4 font-bold tracking-tight text-slate-900 dark:text-slate-100">{plan.planName}</CardTitle>
                                <div className="flex items-baseline gap-1 mt-2">
                                    <span className="font-serif text-3xl flex items-center text-primary">
                                        <IndianRupee className="w-4 h-4 mr-1 text-primary" /> {plan.price.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Execution Unit</span>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Latency</span>
                                            <span className="font-bold text-sm text-slate-900 dark:text-slate-100">{plan.turnaroundTime || "Customized"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 rounded-xl bg-muted text-muted-foreground mt-0.5">
                                            <Info className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Operational Scope</span>
                                            <p className="text-xs font-semibold text-muted-foreground leading-relaxed italic">{plan.description || "Systemic parameters not detailed."}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Plan Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Pricing Plan"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="planName">Plan Name</Label>
                            <Input 
                                id="planName" 
                                value={form.planName} 
                                onChange={(e) => setForm({...form, planName: e.target.value})} 
                                placeholder="e.g. Basic Plan"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="price">Price (₹)</Label>
                                <Input 
                                    id="price" 
                                    type="number"
                                    value={form.price} 
                                    onChange={(e) => setForm({...form, price: e.target.value})} 
                                    placeholder="499"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="tat">Turnaround Time</Label>
                                <Input 
                                    id="tat" 
                                    value={form.turnaroundTime} 
                                    onChange={(e) => setForm({...form, turnaroundTime: e.target.value})} 
                                    placeholder="e.g. 24-48 Hours"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="desc">Plan Description</Label>
                            <Textarea 
                                id="desc" 
                                value={form.description} 
                                onChange={(e) => setForm({...form, description: e.target.value})} 
                                placeholder="Describe what's included in this plan..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select 
                                value={form.status} 
                                onValueChange={(v) => setForm({...form, status: v})}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Plan</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {ConfirmDialogPortal}
        </div>
    );
}
