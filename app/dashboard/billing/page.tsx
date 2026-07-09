import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Receipt } from "lucide-react";

export const metadata = { title: "Billing & Invoices — TaxKosh" };

export default async function BillingPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const invoices = await prisma.platformInvoice.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { serviceRequest: { include: { service: true } } },
    });

    const totalPaid = invoices.reduce((sum, inv) => sum + inv.total, 0);

    return (
        <div className="container max-w-4xl p-6 space-y-8 mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Invoices</h1>
                <p className="text-muted-foreground mt-1">Your GST-compliant tax invoices for TaxKosh services.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-3xl font-bold">{invoices.length}</p>
                        <p className="text-sm text-muted-foreground">Total invoices</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-3xl font-bold">₹{(totalPaid / 100).toLocaleString("en-IN")}</p>
                        <p className="text-sm text-muted-foreground">Total paid</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Invoice History</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {invoices.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No invoices yet.</p>
                            <p className="text-xs mt-1">Invoices appear here after you pay for a service.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Invoice</TableHead>
                                        <TableHead>Service</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="text-right pr-6">Download</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {invoices.map((inv) => (
                                        <TableRow key={inv.id}>
                                            <TableCell className="pl-6 font-mono text-xs">{inv.invoiceNumber}</TableCell>
                                            <TableCell className="text-sm">{inv.serviceRequest?.service?.name ?? "Managed Service"}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                            </TableCell>
                                            <TableCell className="font-semibold">₹{(inv.total / 100).toLocaleString("en-IN")}</TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button variant="ghost" size="sm" asChild className="gap-1.5">
                                                    <a href={`/api/documents/${inv.id}/view`} target="_blank" rel="noopener noreferrer" aria-label={`Download invoice ${inv.invoiceNumber}`}>
                                                        <Download className="w-4 h-4" /> PDF
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
