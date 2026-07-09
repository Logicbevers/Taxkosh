"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
    ChevronRight,
    ChevronDown,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    FolderOpen,
    Folder,
    Tag,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CatalogNode {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    depth: number;
    displayOrder: number;
    isLeaf: boolean;
    price: number;
    description: string | null;
    requiredDocuments: string[];
    slaHours: number;
    status: string;
}

interface NodeFormState {
    name: string;
    slug: string;
    displayOrder: number;
    isLeaf: boolean;
    price: number;
    description: string;
    requiredDocuments: string[];
    slaHours: number;
    status: "active" | "inactive";
}

const defaultForm = (): NodeFormState => ({
    name: "",
    slug: "",
    displayOrder: 0,
    isLeaf: false,
    price: 0,
    description: "",
    requiredDocuments: [],
    slaHours: 24,
    status: "active",
});

function slugify(s: string) {
    return s
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 80);
}

function buildTree(nodes: CatalogNode[]): Map<string | null, CatalogNode[]> {
    const map = new Map<string | null, CatalogNode[]>();
    for (const node of nodes) {
        const key = node.parentId ?? null;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(node);
    }
    return map;
}

interface TreeNodeProps {
    node: CatalogNode;
    childMap: Map<string | null, CatalogNode[]>;
    onAddChild: (parentId: string) => void;
    onEdit: (node: CatalogNode) => void;
    onDelete: (node: CatalogNode) => void;
}

function TreeNode({ node, childMap, onAddChild, onEdit, onDelete }: TreeNodeProps) {
    const [expanded, setExpanded] = useState(true);
    const children = childMap.get(node.id) ?? [];
    const hasChildren = children.length > 0;

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 group transition-colors",
                    node.isLeaf && "bg-primary/5 hover:bg-primary/10"
                )}
                style={{ paddingLeft: `${node.depth * 20 + 12}px` }}
            >
                {/* Expand / leaf indicator */}
                <button
                    className="w-4 h-4 shrink-0 text-muted-foreground"
                    onClick={() => !node.isLeaf && setExpanded((v) => !v)}
                >
                    {node.isLeaf ? (
                        <Tag className="w-4 h-4 text-primary" />
                    ) : hasChildren ? (
                        expanded ? (
                            <ChevronDown className="w-4 h-4" />
                        ) : (
                            <ChevronRight className="w-4 h-4" />
                        )
                    ) : (
                        <Folder className="w-4 h-4" />
                    )}
                </button>

                {/* Name */}
                <span className={cn("text-sm font-medium flex-1 truncate", node.isLeaf && "text-primary")}>
                    {node.name}
                    {node.isLeaf && node.price > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground font-normal">
                            ₹{node.price.toLocaleString("en-IN")}
                        </span>
                    )}
                </span>

                {/* Status badge */}
                <Badge
                    variant={node.status === "active" ? "secondary" : "outline"}
                    className="hidden sm:flex text-[10px] h-5"
                >
                    {node.isLeaf ? "service" : "folder"}
                </Badge>
                {node.status === "inactive" && (
                    <Badge variant="outline" className="hidden sm:flex text-[10px] h-5 text-muted-foreground">
                        inactive
                    </Badge>
                )}

                {/* Actions (show on hover) */}
                <div className="hidden group-hover:flex items-center gap-1 ml-2">
                    {!node.isLeaf && (
                        <Button
                            size="icon"
                            variant="ghost"
                            className="w-6 h-6"
                            title="Add child"
                            onClick={() => onAddChild(node.id)}
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6"
                        title="Edit"
                        onClick={() => onEdit(node)}
                    >
                        <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="w-6 h-6 text-destructive hover:text-destructive"
                        title="Delete"
                        onClick={() => onDelete(node)}
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {expanded && !node.isLeaf && hasChildren && (
                <div>
                    {children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            childMap={childMap}
                            onAddChild={onAddChild}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface NodeDialogProps {
    open: boolean;
    mode: "create" | "edit";
    parentName?: string;
    form: NodeFormState;
    saving: boolean;
    onChange: (patch: Partial<NodeFormState>) => void;
    onSave: () => void;
    onClose: () => void;
}

function NodeDialog({ open, mode, parentName, form, saving, onChange, onSave, onClose }: NodeDialogProps) {
    const [newDoc, setNewDoc] = useState("");

    function addDoc() {
        const trimmed = newDoc.trim();
        if (!trimmed || form.requiredDocuments.includes(trimmed)) return;
        onChange({ requiredDocuments: [...form.requiredDocuments, trimmed] });
        setNewDoc("");
    }

    function removeDoc(doc: string) {
        onChange({ requiredDocuments: form.requiredDocuments.filter((d) => d !== doc) });
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "create"
                            ? parentName
                                ? `Add child to "${parentName}"`
                                : "Add root node"
                            : "Edit node"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5 col-span-2">
                            <Label>Name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => {
                                    const name = e.target.value;
                                    onChange({
                                        name,
                                        ...(mode === "create" ? { slug: slugify(name) } : {}),
                                    });
                                }}
                                placeholder="e.g. Income Tax Returns"
                            />
                        </div>
                        <div className="space-y-1.5 col-span-2">
                            <Label>Slug</Label>
                            <Input
                                value={form.slug}
                                onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                                placeholder="e.g. income-tax-returns"
                                className="font-mono text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Description</Label>
                        <Textarea
                            value={form.description}
                            onChange={(e) => onChange({ description: e.target.value })}
                            placeholder="Brief description (optional)"
                            rows={2}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label>Display order</Label>
                            <Input
                                type="number"
                                min={0}
                                value={form.displayOrder}
                                onChange={(e) => onChange({ displayOrder: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Status</Label>
                            <select
                                className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
                                value={form.status}
                                onChange={(e) => onChange({ status: e.target.value as "active" | "inactive" })}
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Leaf toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                            <p className="text-sm font-medium">Mark as service (leaf)</p>
                            <p className="text-xs text-muted-foreground">
                                Enables price, docs, and SLA — no children allowed
                            </p>
                        </div>
                        <Switch
                            checked={form.isLeaf}
                            onCheckedChange={(v) => onChange({ isLeaf: v })}
                        />
                    </div>

                    {form.isLeaf && (
                        <>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <Label>Price (₹)</Label>
                                    <Input
                                        type="number"
                                        min={0}
                                        step={1}
                                        value={form.price}
                                        onChange={(e) => onChange({ price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label>SLA (hours)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={720}
                                        value={form.slaHours}
                                        onChange={(e) => onChange({ slaHours: parseInt(e.target.value) || 24 })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Required documents</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={newDoc}
                                        onChange={(e) => setNewDoc(e.target.value)}
                                        placeholder="e.g. PAN Card"
                                        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDoc())}
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={addDoc}>
                                        Add
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {form.requiredDocuments.map((doc) => (
                                        <Badge key={doc} variant="secondary" className="gap-1">
                                            {doc}
                                            <button onClick={() => removeDoc(doc)} className="ml-0.5 hover:text-destructive">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                    {form.requiredDocuments.length === 0 && (
                                        <p className="text-xs text-muted-foreground">No documents added yet</p>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={onSave} disabled={saving || !form.name.trim() || !form.slug.trim()}>
                        {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CatalogTreeClient({ initialNodes }: { initialNodes: CatalogNode[] }) {
    const [nodes, setNodes] = useState<CatalogNode[]>(initialNodes);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
    const [activeParentId, setActiveParentId] = useState<string | null>(null);
    const [editingNode, setEditingNode] = useState<CatalogNode | null>(null);
    const [form, setForm] = useState<NodeFormState>(defaultForm());
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<CatalogNode | null>(null);
    const [deleting, setDeleting] = useState(false);

    const childMap = useMemo(() => buildTree(nodes), [nodes]);

    function patchForm(patch: Partial<NodeFormState>) {
        setForm((f) => ({ ...f, ...patch }));
    }

    const openAddChild = useCallback((parentId: string) => {
        setDialogMode("create");
        setActiveParentId(parentId);
        setEditingNode(null);
        setForm(defaultForm());
        setDialogOpen(true);
    }, []);

    function openAddRoot() {
        setDialogMode("create");
        setActiveParentId(null);
        setEditingNode(null);
        setForm(defaultForm());
        setDialogOpen(true);
    }

    const openEdit = useCallback((node: CatalogNode) => {
        setDialogMode("edit");
        setEditingNode(node);
        setForm({
            name: node.name,
            slug: node.slug,
            displayOrder: node.displayOrder,
            isLeaf: node.isLeaf,
            price: node.price,
            description: node.description ?? "",
            requiredDocuments: node.requiredDocuments,
            slaHours: node.slaHours,
            status: node.status as "active" | "inactive",
        });
        setDialogOpen(true);
    }, []);

    function openDelete(node: CatalogNode) {
        setDeleteTarget(node);
    }

    async function handleSave() {
        setSaving(true);
        try {
            if (dialogMode === "create") {
                const res = await fetch("/api/admin/catalog", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ...form, parentId: activeParentId }),
                });
                const data = await res.json();
                if (!res.ok) {
                    toast.error(data.error ?? "Failed to create node");
                    return;
                }
                setNodes((prev) => [...prev, data]);
                toast.success(`"${data.name}" created`);
            } else if (editingNode) {
                const res = await fetch(`/api/admin/catalog/${editingNode.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(form),
                });
                const data = await res.json();
                if (!res.ok) {
                    toast.error(data.error ?? "Failed to update node");
                    return;
                }
                setNodes((prev) => prev.map((n) => (n.id === data.id ? data : n)));
                toast.success(`"${data.name}" updated`);
            }
            setDialogOpen(false);
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/catalog/${deleteTarget.id}`, { method: "DELETE" });
            if (!res.ok) {
                const data = await res.json();
                toast.error(data.error ?? "Failed to delete node");
                return;
            }
            setNodes((prev) => prev.filter((n) => n.id !== deleteTarget.id));
            toast.success(`"${deleteTarget.name}" deleted`);
            setDeleteTarget(null);
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setDeleting(false);
        }
    }

    const rootNodes = childMap.get(null) ?? [];
    const parentNode = activeParentId ? nodes.find((n) => n.id === activeParentId) : null;

    return (
        <>
            <div className="border rounded-xl overflow-hidden bg-card">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                    <p className="text-xs text-muted-foreground">
                        {nodes.length} node{nodes.length !== 1 ? "s" : ""} total ·{" "}
                        {nodes.filter((n) => n.isLeaf).length} services
                    </p>
                    <Button size="sm" onClick={openAddRoot}>
                        <Plus className="w-4 h-4 mr-1.5" />
                        Add root category
                    </Button>
                </div>

                {/* Tree */}
                <div className="p-3 min-h-[200px]">
                    {rootNodes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                            <FolderOpen className="w-10 h-10 mb-3 opacity-30" />
                            <p className="text-sm">No categories yet.</p>
                            <p className="text-xs mt-1">Click "Add root category" to get started.</p>
                        </div>
                    ) : (
                        rootNodes.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                childMap={childMap}
                                onAddChild={openAddChild}
                                onEdit={openEdit}
                                onDelete={openDelete}
                            />
                        ))
                    )}
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/20 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Folder className="w-3 h-3" /> Folder node</span>
                    <span className="flex items-center gap-1"><Tag className="w-3 h-3 text-primary" /> Service leaf</span>
                    <span className="ml-auto">Hover a row to see actions</span>
                </div>
            </div>

            {/* Create / Edit dialog */}
            <NodeDialog
                open={dialogOpen}
                mode={dialogMode}
                parentName={parentNode?.name}
                form={form}
                saving={saving}
                onChange={patchForm}
                onSave={handleSave}
                onClose={() => setDialogOpen(false)}
            />

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This node will be permanently deleted. You cannot delete a node that has children or
                            existing service requests.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting…</> : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
