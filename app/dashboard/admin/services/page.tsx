"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Briefcase, Search, Filter, Clock, Trash2 } from "lucide-react";
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
import { useConfirm } from "@/lib/hooks/use-confirm";
import { TagsInput } from "@/components/admin";

interface SubCategory {
    id: string;
    name: string;
    categoryId: string;
}

interface Category {
    id: string;
    name: string;
    subCategories: SubCategory[];
}

interface Service {
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    subCategoryId: string;
    description: string | null;
    requiredDocuments: string[];
    price: number;
    slaHours: number;
    status: string;
    createdAt: string;
    subCategory: {
        name: string;
        category: {
            name: string;
        }
    }
}

export default function ServiceCatalogPage() {
    const { confirm, ConfirmDialogPortal } = useConfirm();
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    // Form states
    const [form, setForm] = useState({
        name: "",
        slug: "",
        categoryId: "",
        subCategoryId: "",
        description: "",
        requiredDocuments: [] as string[],
        price: 0,
        slaHours: 24,
        status: "active"
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [servicesRes, categoriesRes] = await Promise.all([
                fetch("/api/admin/services"),
                fetch("/api/admin/categories")
            ]);
            
            const servicesData = await servicesRes.json();
            const categoriesData = await categoriesRes.json();
            
            setServices(servicesData);
            setCategories(categoriesData);
        } catch (error) {
            toast.error("Failed to load catalog data");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const method = editingService ? "PATCH" : "POST";
        const url = editingService ? `/api/admin/services/${editingService.id}` : "/api/admin/services";
        
        if (!form.name || !form.slug || !form.categoryId || !form.subCategoryId) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form)
            });
            
            if (res.ok) {
                toast.success(`Service ${editingService ? "updated" : "created"} successfully`);
                setIsModalOpen(false);
                setEditingService(null);
                resetForm();
                fetchData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Operation failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const resetForm = () => {
        setForm({
            name: "",
            slug: "",
            categoryId: "",
            subCategoryId: "",
            description: "",
            requiredDocuments: [],
            price: 0,
            slaHours: 24,
            status: "active"
        });
    };

    const handleDelete = (service: Service) => {
        confirm({
            title: `Delete service "${service.name}"?`,
            description: "This is irreversible. Any pricing plans and active service requests under this service must be migrated or removed first.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/services/${service.id}`, { method: "DELETE" });
                    const data = await res.json();
                    if (res.ok) {
                        toast.success("Service deleted");
                        fetchData();
                    } else {
                        toast.error(data.error || "Delete failed");
                    }
                } catch {
                    toast.error("Delete failed");
                }
            }
        });
    };

    const openEdit = (service: Service) => {
        setEditingService(service);
        setForm({
            name: service.name,
            slug: service.slug,
            categoryId: service.categoryId,
            subCategoryId: service.subCategoryId,
            description: service.description || "",
            requiredDocuments: service.requiredDocuments || [],
            price: service.price ?? 0,
            slaHours: service.slaHours,
            status: service.status
        });
        setIsModalOpen(true);
    };


    const filteredServices = services.filter(s => 
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.subCategory.name.toLowerCase().includes(search.toLowerCase()) ||
        s.subCategory.category.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="font-serif text-[32px] text-foreground">
                        Service Inventory
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium tracking-tight">
                        Curating the execution parameters for <span className="text-primary font-bold">platform-offered</span> professional services.
                    </p>
                </div>
                <Button 
                    className="h-12 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all px-8 font-black text-[10px] uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-black"
                    onClick={() => {
                        setEditingService(null);
                        resetForm();
                        setIsModalOpen(true);
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" /> New Service
                </Button>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-3xl backdrop-blur-sm border border-white/20 dark:border-slate-800">
                <CardHeader className="pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="relative flex-1 w-full group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                            <Input 
                                placeholder="Filter inventory by service name, category or hierarchy..." 
                                className="pl-11 bg-white dark:bg-slate-900 border-none shadow-inner focus-visible:ring-2 focus-visible:ring-primary/20 h-14 font-medium text-sm rounded-2xl"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white dark:bg-slate-900 h-14 px-6 rounded-2xl flex items-center shadow-inner border border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mr-3">Listed</span>
                                <span className="text-lg font-black tabular-nums text-primary">{filteredServices.length}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all border border-slate-100 dark:border-slate-800">
                                <Filter className="w-4 h-4 text-slate-500" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="py-6 pl-8 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Service Definition</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Taxonomy Hierarchy</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Price</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">SLA Commitment</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Status</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-right pr-8 text-slate-400">Directives</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing service bank...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : filteredServices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-32">
                                            <div className="max-w-xs mx-auto space-y-4 opacity-50">
                                                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto text-slate-400">
                                                    <Briefcase className="w-8 h-8" />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">Inventory baseline is currently null.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredServices.map((service) => (
                                        <TableRow key={service.id} className="group hover:bg-muted/10 transition-colors border-slate-50 dark:border-slate-900">
                                            <TableCell className="py-5 pl-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all duration-500 shadow-sm">
                                                        <Briefcase className="w-4 h-4" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                                                            {service.name}
                                                        </span>
                                                        <span className="text-[10px] font-mono font-bold text-slate-400 mt-0.5 uppercase tracking-tighter">
                                                            ID_{service.slug}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{service.subCategory.category.name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <div className="h-px w-2 bg-slate-200 dark:bg-slate-700" />
                                                        <span className="text-[10px] font-black text-primary uppercase tracking-tight">
                                                            {service.subCategory.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                                                    {service.price > 0 ? `₹${service.price.toLocaleString("en-IN")}` : <span className="text-slate-300 text-[10px] uppercase tracking-widest">—</span>}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="font-black text-[9px] tracking-widest uppercase border-slate-100 bg-white dark:bg-slate-800 dark:border-slate-700 py-1.5 px-3 rounded-lg shadow-sm">
                                                    <Clock className="w-3 h-3 mr-2 text-primary" /> {service.slaHours}H CYCLE
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-1.5 w-1.5 rounded-full ${service.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${service.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}`}>
                                                        {service.status}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-400 hover:text-slate-900 dark:hover:text-white" onClick={() => openEdit(service)}>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all text-slate-400" onClick={() => handleDelete(service)}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Service Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <div className="bg-slate-900 px-8 pt-8 pb-6 border-b border-white/[0.06]">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <Briefcase className="w-4 h-4 text-primary" />
                                </div>
                                <DialogTitle className="text-white font-black text-sm uppercase tracking-[0.2em]">
                                    {editingService ? "Modify Service Definition" : "Register New Managed Service"}
                                </DialogTitle>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-11">Configure execution parameters and SLA commitment</p>
                        </DialogHeader>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Service Label</Label>
                                    <Input 
                                        id="name" 
                                        value={form.name} 
                                        onChange={(e) => setForm({...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, "-")})} 
                                        placeholder="e.g. ITR Filing (Salaried)"
                                        className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-medium focus-visible:ring-2 focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">URL Slug</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">/</span>
                                        <Input 
                                            id="slug" 
                                            value={form.slug} 
                                            onChange={(e) => setForm({...form, slug: e.target.value})} 
                                            placeholder="itr-salaried"
                                            className="h-12 pl-8 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-mono font-bold text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Parent Category</Label>
                                    <Select 
                                        value={form.categoryId} 
                                        onValueChange={(v) => setForm({...form, categoryId: v, subCategoryId: ""})}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black text-[11px] uppercase tracking-widest focus:ring-2 focus:ring-primary/20">
                                            <SelectValue placeholder="Choose Category" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id} className="rounded-xl font-bold py-3">{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Sub Category</Label>
                                    <Select 
                                        value={form.subCategoryId} 
                                        onValueChange={(v) => setForm({...form, subCategoryId: v})}
                                        disabled={!form.categoryId}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black text-[11px] uppercase tracking-widest focus:ring-2 focus:ring-primary/20 disabled:opacity-40">
                                            <SelectValue placeholder="Choose SubCategory" />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                            {categories.find(c => c.id === form.categoryId)?.subCategories.map(s => (
                                                <SelectItem key={s.id} value={s.id} className="rounded-xl font-bold py-3">{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Service Fee (₹)</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={form.price}
                                            onChange={(e) => setForm({...form, price: parseFloat(e.target.value) || 0})}
                                            className="h-12 pl-8 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black tabular-nums focus-visible:ring-2 focus-visible:ring-primary/20"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">SLA Commitment (Hours)</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={form.slaHours}
                                            onChange={(e) => setForm({...form, slaHours: parseInt(e.target.value)})}
                                            className="h-12 pr-20 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black tabular-nums focus-visible:ring-2 focus-visible:ring-primary/20"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase tracking-widest text-slate-400">Hours</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Visibility State</Label>
                                    <Select 
                                        value={form.status} 
                                        onValueChange={(v) => setForm({...form, status: v})}
                                    >
                                        <SelectTrigger className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black text-[11px] uppercase tracking-widest focus:ring-2 focus:ring-primary/20">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                            <SelectItem value="active" className="rounded-xl font-black text-[11px] uppercase tracking-widest py-3">Active</SelectItem>
                                            <SelectItem value="inactive" className="rounded-xl font-black text-[11px] uppercase tracking-widest py-3">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Required Documents</Label>
                                    <TagsInput
                                        value={form.requiredDocuments}
                                        onChange={(tags) => setForm({ ...form, requiredDocuments: tags })}
                                        placeholder="Add a document, press Enter"
                                        suggestions={["Form 16", "Form 26AS", "Bank Statement", "PAN Card", "Aadhaar", "Investment Proofs"]}
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Service Description</Label>
                                <Textarea 
                                    id="desc" 
                                    value={form.description} 
                                    onChange={(e) => setForm({...form, description: e.target.value})} 
                                    placeholder="Details about what is covered in this service..."
                                    className="bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-medium focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Button variant="ghost" className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 px-6 text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 px-8 bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl hover:-translate-y-0.5 transition-all" onClick={handleSave}>
                            {editingService ? "Update Service" : "Register Service"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {ConfirmDialogPortal}
        </div>
    );
}
