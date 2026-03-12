"use client"

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Filter, AlertCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function AdminServicesPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetch("/api/admin/services")
            .then(res => res.json())
            .then(data => {
                setRequests(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    const filteredRequests = requests.filter(r =>
        r.user.name?.toLowerCase().includes(search.toLowerCase()) ||
        r.id.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
    );

    const getSlaBadge = (status: string) => {
        switch (status) {
            case "CRITICAL": return "destructive";
            case "WARNING": return "outline"; // We'll custom style this below
            default: return "secondary";
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Service Requests</h1>
                    <p className="text-muted-foreground mt-1">Manage all tax filing and compliance requests from users.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Filter</Button>
                    <Button>Export CSV</Button>
                </div>
            </div>

            <Card>
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by user, ID or category..."
                                className="pl-9 bg-slate-50 dark:bg-slate-900 border-none"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 dark:bg-slate-900/50">
                                <TableHead className="font-bold">Request ID</TableHead>
                                <TableHead className="font-bold">User</TableHead>
                                <TableHead className="font-bold">Category</TableHead>
                                <TableHead className="font-bold">Status</TableHead>
                                <TableHead className="font-bold text-center">SLA Tracker</TableHead>
                                <TableHead className="text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground italic">
                                        Loading amazing requests...
                                    </TableCell>
                                </TableRow>
                            ) : filteredRequests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                        No requests found matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredRequests.map((req) => (
                                    <TableRow key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                                        <TableCell className="font-mono text-xs text-slate-500">
                                            {req.id.split("-")[0]}...
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{req.user.name || "Unknown"}</span>
                                                <span className="text-xs text-muted-foreground">{req.user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-slate-100/50">
                                                {req.category.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="font-bold">
                                                {req.status.replace(/_/g, " ")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Badge variant={getSlaBadge(req.slaStatus)} className={req.slaStatus === "WARNING" ? "border-orange-500 text-orange-600 bg-orange-50" : ""}>
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {req.hoursElapsed}h
                                                </Badge>
                                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Elapsed</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={`/dashboard/admin/services/${req.id}`}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
