import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User as UserIcon, Mail, Phone, Shield, Calendar, CreditCard } from "lucide-react";
import { maskPAN, decrypt } from "@/lib/security";
import { KycForm } from "./kyc-form";

export const metadata = { title: "Profile Settings — TaxKosh" };

export default async function ProfilePage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            name: true, email: true, role: true, phone: true, pan: true,
            gstin: true, emailVerified: true, createdAt: true,
            _count: { select: { serviceRequests: true, documents: true } },
        },
    });
    if (!user) redirect("/login");

    // PAN is stored encrypted (iv:tag:ciphertext) — decrypt before masking,
    // otherwise the raw ciphertext is shown.
    const panPlain = user.pan ? decrypt(user.pan) : null;

    const rows = [
        { icon: UserIcon, label: "Full Name", value: user.name ?? "—" },
        { icon: Mail, label: "Email", value: user.email },
        { icon: Phone, label: "Phone", value: user.phone ?? "Not provided" },
        { icon: CreditCard, label: "PAN", value: maskPAN(panPlain) },
        { icon: Shield, label: "GSTIN", value: user.gstin ?? "Not provided" },
        { icon: Calendar, label: "Member since", value: new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
    ];

    const showBusinessFields = user.role === "BUSINESS" || user.role === "CA";

    return (
        <div className="container max-w-4xl p-6 space-y-8 mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
                <p className="text-muted-foreground mt-1">Your account details and compliance identity.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-1">
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold mb-4">
                            {(user.name?.[0] ?? user.email[0]).toUpperCase()}
                        </div>
                        <p className="font-semibold">{user.name ?? "TaxKosh User"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                        <div className="flex flex-wrap gap-2 justify-center mt-4">
                            <Badge variant="secondary">{user.role}</Badge>
                            <Badge variant={user.emailVerified ? "default" : "outline"} className={user.emailVerified ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}>
                                {user.emailVerified ? "Email verified" : "Unverified"}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base">Account Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        {rows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between py-3 border-b last:border-0">
                                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <r.icon className="w-4 h-4" /> {r.label}
                                </span>
                                <span className="text-sm font-medium">{r.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-3xl font-bold">{user._count.serviceRequests}</p>
                        <p className="text-sm text-muted-foreground">Service requests</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <p className="text-3xl font-bold">{user._count.documents}</p>
                        <p className="text-sm text-muted-foreground">Documents uploaded</p>
                    </CardContent>
                </Card>
            </div>

            <KycForm
                initial={{
                    phone: user.phone,
                    panMasked: maskPAN(panPlain),
                    hasPan: !!user.pan,
                    aadhaarLast4: null,
                    gstin: user.gstin,
                }}
                showBusinessFields={showBusinessFields}
            />

            <p className="text-xs text-muted-foreground">
                Something not right? Contact support at{" "}
                <a href="mailto:support@taxkosh.com" className="text-primary hover:underline">support@taxkosh.com</a>.
            </p>
        </div>
    );
}
