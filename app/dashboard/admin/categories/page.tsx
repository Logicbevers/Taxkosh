"use client"

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Folder, FolderOpen, MoreVertical, Layers } from "lucide-react";
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
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useConfirm } from "@/lib/hooks/use-confirm";

interface SubCategory {
    id: string;
    name: string;
    description: string | null;
    status: string;
    createdAt: string;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    displayOrder: number;
    status: string;
    createdAt: string;
    subCategories: SubCategory[];
}

export default function CategoriesPage() {
    const { confirm, ConfirmDialogPortal } = useConfirm();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    
    // Modal states
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isSubCategoryModalOpen, setIsSubCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editingSubCategory, setEditingSubCategory] = useState<{sub: SubCategory, catId: string} | null>(null);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

    // Form states
    const [catForm, setCatForm] = useState({ name: "", slug: "", description: "", displayOrder: 0, status: "active" });
    const [subForm, setSubForm] = useState({ name: "", description: "", status: "active" });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/admin/categories");
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            toast.error("Failed to load categories");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleExpand = (id: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedCategories(newExpanded);
    };

    const handleSaveCategory = async () => {
        const method = editingCategory ? "PATCH" : "POST";
        const url = editingCategory ? `/api/admin/categories/${editingCategory.id}` : "/api/admin/categories";
        
        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(catForm)
            });
            
            if (res.ok) {
                toast.success(`Category ${editingCategory ? "updated" : "created"} successfully`);
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
                setCatForm({ name: "", slug: "", description: "", displayOrder: 0, status: "active" });
                fetchCategories();
            } else {
                const err = await res.json();
                toast.error(err.error || "Operation failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const handleSaveSubCategory = async () => {
        const method = editingSubCategory ? "PATCH" : "POST";
        const url = editingSubCategory ? `/api/admin/subcategories/${editingSubCategory.sub.id}` : "/api/admin/subcategories";
        
        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...subForm, categoryId: selectedCategoryId })
            });
            
            if (res.ok) {
                toast.success(`SubCategory ${editingSubCategory ? "updated" : "created"} successfully`);
                setIsSubCategoryModalOpen(false);
                setEditingSubCategory(null);
                setSubForm({ name: "", description: "", status: "active" });
                fetchCategories();
            } else {
                const err = await res.json();
                toast.error(err.error || "Operation failed");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const openEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCatForm({
            name: cat.name,
            slug: cat.slug,
            description: cat.description || "",
            displayOrder: cat.displayOrder,
            status: cat.status
        });
        setIsCategoryModalOpen(true);
    };

    const handleDeleteCategory = (cat: Category) => {
        confirm({
            title: `Delete category "${cat.name}"?`,
            description: "This is irreversible. Any sub-categories under this taxonomy node must be removed first.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/categories/${cat.id}`, { method: "DELETE" });
                    const data = await res.json();
                    if (res.ok) {
                        toast.success("Category deleted");
                        fetchCategories();
                    } else {
                        toast.error(data.error || "Delete failed");
                    }
                } catch {
                    toast.error("Delete failed");
                }
            }
        });
    };

    const handleDeleteSubCategory = (sub: SubCategory) => {
        confirm({
            title: `Delete sub-category "${sub.name}"?`,
            description: "This is irreversible. Services nested under this sub-category must be removed first.",
            confirmLabel: "Delete",
            danger: true,
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/subcategories/${sub.id}`, { method: "DELETE" });
                    const data = await res.json();
                    if (res.ok) {
                        toast.success("Sub-category deleted");
                        fetchCategories();
                    } else {
                        toast.error(data.error || "Delete failed");
                    }
                } catch {
                    toast.error("Delete failed");
                }
            }
        });
    };

    const openEditSubCategory = (sub: SubCategory, catId: string) => {
        setEditingSubCategory({ sub, catId });
        setSelectedCategoryId(catId);
        setSubForm({
            name: sub.name,
            description: sub.description || "",
            status: sub.status
        });
        setIsSubCategoryModalOpen(true);
    };

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto pb-24 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="font-serif text-[32px] text-foreground">
                        Taxonomy Engine
                    </h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium tracking-tight">
                        Orchestrating the structural hierarchy of <span className="text-primary font-bold">compliance vectors</span> and financial services.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button 
                        className="h-12 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all px-8 font-black text-[10px] uppercase tracking-[0.2em] bg-slate-900 text-white hover:bg-black"
                        onClick={() => {
                            setEditingCategory(null);
                            setCatForm({ name: "", slug: "", description: "", displayOrder: 0, status: "active" });
                            setIsCategoryModalOpen(true);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" /> New Category
                    </Button>
                </div>
            </div>

            <Card className="border-none shadow-2xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 overflow-hidden rounded-3xl backdrop-blur-sm border border-white/20 dark:border-slate-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[80px]"></TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] py-6 text-slate-400">Structure Nodes</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Endpoint Slug</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-center text-slate-400">Priority</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Visibility</TableHead>
                                    <TableHead className="text-[10px] font-black uppercase tracking-[0.3em] text-right pr-8 text-slate-400">Directives</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-32">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Syncing Hierarchy...</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : categories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-32">
                                            <div className="max-w-xs mx-auto space-y-4 opacity-50">
                                                <div className="h-16 w-16 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto">
                                                    <Layers className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-500">The taxonomy baseline is currently null.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                categories.map((cat) => (
                                    <React.Fragment key={cat.id}>
                                        <TableRow className="group hover:bg-muted/10 transition-colors border-slate-100 dark:border-slate-800">
                                            <TableCell className="pl-6">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className={`h-7 w-7 transition-transform ${expandedCategories.has(cat.id) ? 'rotate-90' : ''}`}
                                                    onClick={() => toggleExpand(cat.id)}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${expandedCategories.has(cat.id) ? 'bg-primary/10 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                                                        {expandedCategories.has(cat.id) ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-sm tracking-tight">{cat.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium">{cat.subCategories.length} Branching points</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg text-slate-500 font-bold border border-slate-200/50 dark:border-slate-700">
                                                    /{cat.slug}
                                                </code>
                                            </TableCell>
                                            <TableCell className="text-center font-mono text-[10px] font-black text-slate-300">
                                                ORD_0{cat.displayOrder}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`text-[9px] font-black tracking-widest uppercase border-none transition-all py-1 px-3 ${cat.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                                                    {cat.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-8">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="sm" className="h-9 rounded-xl text-[10px] font-black uppercase tracking-widest px-4 hover:bg-primary/5 hover:text-primary transition-all border border-transparent hover:border-primary/20" onClick={() => {
                                                        setSelectedCategoryId(cat.id);
                                                        setEditingSubCategory(null);
                                                        setSubForm({ name: "", description: "", status: "active" });
                                                        setIsSubCategoryModalOpen(true);
                                                    }}>
                                                        <Plus className="w-3.5 h-3.5 mr-2" /> Sub-Node
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all" onClick={() => openEditCategory(cat)}>
                                                        <Edit className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all" onClick={() => handleDeleteCategory(cat)}>
                                                        <Trash2 className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedCategories.has(cat.id) && (
                                            <>
                                                {cat.subCategories.length === 0 ? (
                                                    <TableRow className="hover:bg-transparent">
                                                        <TableCell></TableCell>
                                                        <TableCell colSpan={5} className="py-12 pl-20">
                                                            <div className="flex items-center gap-4 opacity-30">
                                                                <div className="h-px w-8 bg-slate-300" />
                                                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Leaf terminal reached. No branches.</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    cat.subCategories.map((sub) => (
                                                        <TableRow key={sub.id} className="bg-slate-50/20 dark:bg-slate-900/20 hover:bg-slate-100/30 transition-colors group/sub">
                                                            <TableCell></TableCell>
                                                            <TableCell className="pl-16 py-4">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="h-10 w-px bg-slate-200 dark:bg-slate-800 relative">
                                                                        <div className="absolute top-1/2 left-0 w-4 h-px bg-slate-200 dark:bg-slate-800" />
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-black text-xs text-slate-900 dark:text-slate-100 group-hover/sub:text-primary transition-colors tracking-tight">{sub.name}</span>
                                                                        {sub.description && <span className="text-[10px] text-muted-foreground font-medium line-clamp-1 mt-0.5">{sub.description}</span>}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell></TableCell>
                                                            <TableCell></TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className={`h-1.5 w-1.5 rounded-full ${sub.status === 'active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'}`} />
                                                                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">{sub.status}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right pr-8">
                                                                <div className="flex gap-1 opacity-0 group-hover/sub:opacity-100 transition-opacity">
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all" onClick={() => openEditSubCategory(sub, cat.id)}>
                                                                        <Edit className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-all" onClick={() => handleDeleteSubCategory(sub)}>
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>

            {/* Category Modal */}
            <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <div className="bg-slate-900 px-8 pt-8 pb-6 border-b border-white/[0.06]">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-8 w-8 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                                    <Folder className="w-4 h-4 text-primary" />
                                </div>
                                <DialogTitle className="text-white font-black text-sm uppercase tracking-[0.2em]">
                                    {editingCategory ? "Modify Taxonomy Node" : "Register New Category"}
                                </DialogTitle>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-11">Define a top-level compliance vector</p>
                        </DialogHeader>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-8 space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Taxonomy Label</Label>
                            <Input 
                                id="name" 
                                value={catForm.name} 
                                onChange={(e) => setCatForm({...catForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, "-")})} 
                                placeholder="e.g. Income Tax"
                                className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-medium focus-visible:ring-2 focus-visible:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="slug" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">URL Slug</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-sm">/</span>
                                <Input 
                                    id="slug" 
                                    value={catForm.slug} 
                                    onChange={(e) => setCatForm({...catForm, slug: e.target.value})} 
                                    placeholder="income-tax"
                                    className="h-12 pl-8 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-mono font-bold text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Description</Label>
                            <Textarea 
                                id="description" 
                                value={catForm.description} 
                                onChange={(e) => setCatForm({...catForm, description: e.target.value})}
                                placeholder="Brief description of this category..."
                                className="bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-medium focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="order" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Display Order</Label>
                                <Input 
                                    id="order" 
                                    type="number" 
                                    value={catForm.displayOrder} 
                                    onChange={(e) => setCatForm({...catForm, displayOrder: parseInt(e.target.value)})}
                                    className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black tabular-nums focus-visible:ring-2 focus-visible:ring-primary/20"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="stat" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Visibility State</Label>
                                <Select 
                                    value={catForm.status} 
                                    onValueChange={(v) => setCatForm({...catForm, status: v})}
                                >
                                    <SelectTrigger id="stat" className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black text-[11px] uppercase tracking-widest focus:ring-2 focus:ring-primary/20">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                        <SelectItem value="active" className="rounded-xl font-black text-[11px] uppercase tracking-widest py-3">Active</SelectItem>
                                        <SelectItem value="inactive" className="rounded-xl font-black text-[11px] uppercase tracking-widest py-3">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Button variant="ghost" className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 px-6 text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={() => setIsCategoryModalOpen(false)}>Cancel</Button>
                        <Button className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 px-8 bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl hover:-translate-y-0.5 transition-all" onClick={handleSaveCategory}>
                            {editingCategory ? "Update Node" : "Register Node"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SubCategory Modal */}
            <Dialog open={isSubCategoryModalOpen} onOpenChange={setIsSubCategoryModalOpen}>
                <DialogContent className="max-w-lg p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
                    <div className="bg-slate-900 px-8 pt-8 pb-6 border-b border-white/[0.06]">
                        <DialogHeader>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="h-8 w-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                                    <FolderOpen className="w-4 h-4 text-primary" />
                                </div>
                                <DialogTitle className="text-white font-black text-sm uppercase tracking-[0.2em]">
                                    {editingSubCategory ? "Modify Branch Node" : "Add Sub-Taxonomy Node"}
                                </DialogTitle>
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 pl-11">Branching point under parent category</p>
                        </DialogHeader>
                    </div>
                    <div className="bg-white dark:bg-slate-950 p-8 space-y-5">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Parent Node</Label>
                            <div className="h-12 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center px-4 border-none shadow-inner">
                                <div className="flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-primary" />
                                    <span className="font-black text-sm tracking-tight">
                                        {categories.find(c => c.id === selectedCategoryId)?.name || "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subname" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Branch Label</Label>
                            <Input 
                                id="subname" 
                                value={subForm.name} 
                                onChange={(e) => setSubForm({...subForm, name: e.target.value})} 
                                placeholder="e.g. ITR Filing"
                                className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-medium focus-visible:ring-2 focus-visible:ring-primary/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subdesc" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Description</Label>
                            <Textarea 
                                id="subdesc" 
                                value={subForm.description} 
                                onChange={(e) => setSubForm({...subForm, description: e.target.value})}
                                placeholder="Brief description..."
                                className="bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-medium focus-visible:ring-2 focus-visible:ring-primary/20 resize-none"
                                rows={3}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="substat" className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 pl-1">Visibility State</Label>
                            <Select 
                                value={subForm.status} 
                                onValueChange={(v) => setSubForm({...subForm, status: v})}
                            >
                                <SelectTrigger id="substat" className="h-12 bg-slate-50 dark:bg-slate-900 border-none shadow-inner rounded-2xl font-black text-[11px] uppercase tracking-widest focus:ring-2 focus:ring-primary/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-2xl p-2">
                                    <SelectItem value="active" className="rounded-xl font-black text-[11px] uppercase tracking-widest py-3">Active</SelectItem>
                                    <SelectItem value="inactive" className="rounded-xl font-black text-[11px] uppercase tracking-widest py-3">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 px-8 py-5 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
                        <Button variant="ghost" className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 px-6 text-slate-500 hover:text-slate-900 dark:hover:text-white" onClick={() => setIsSubCategoryModalOpen(false)}>Cancel</Button>
                        <Button className="rounded-2xl font-black text-[10px] uppercase tracking-widest h-11 px-8 bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl hover:-translate-y-0.5 transition-all" onClick={handleSaveSubCategory}>
                            {editingSubCategory ? "Update Branch" : "Add Branch"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {ConfirmDialogPortal}
        </div>
    );
}
