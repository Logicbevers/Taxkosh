import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default async function AuditLogsPage() {
    const session = await auth();
    if (session?.user?.role !== UserRole.ADMIN) {
        redirect("/unauthorized");
    }

    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, email: true } } },
        take: 100
    });

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Security & Event Trail</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell className="text-xs font-mono">
                                        {new Date(log.createdAt).toLocaleString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{log.user?.name || "System"}</span>
                                            <span className="text-xs text-muted-foreground">{log.user?.email || "N/A"}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.action}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">{log.ipAddress}</TableCell>
                                    <TableCell className="text-xs">
                                        <pre className="max-w-[300px] truncate">
                                            {JSON.stringify(log.details)}
                                        </pre>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
