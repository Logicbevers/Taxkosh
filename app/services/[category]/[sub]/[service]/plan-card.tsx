"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckoutButton } from "@/components/services/CheckoutButton";
import { Check, ArrowRight } from "lucide-react";

interface Props {
    serviceId: string;
    serviceName: string;
    price: number;
    isSignedIn: boolean;
    returnPath: string;
    autoCheckout?: boolean;
}

export function ServiceCheckoutCard({
    serviceId, serviceName, price, isSignedIn, returnPath, autoCheckout,
}: Props) {
    const callback = `${returnPath}?checkout=1`;
    const loginHref = `/login?callbackUrl=${encodeURIComponent(callback)}`;

    return (
        <Card className="border-2 border-primary shadow-lg shadow-primary/10">
            <CardContent className="p-6 flex flex-col gap-5">
                {/* Price display */}
                <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Service fee</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold tracking-tight">
                            ₹{price > 0 ? price.toLocaleString("en-IN") : "—"}
                        </span>
                        {price > 0 && <span className="text-sm text-muted-foreground">one-time</span>}
                    </div>
                    {price === 0 && (
                        <p className="text-sm text-muted-foreground mt-1">Pricing not yet set — contact us.</p>
                    )}
                </div>

                {/* What's included */}
                <ul className="space-y-2 text-sm">
                    {[
                        "Expert-verified filing",
                        "Secure document vault",
                        "Government acknowledgement",
                        "Real-time status updates",
                    ].map((f) => (
                        <li key={f} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{f}</span>
                        </li>
                    ))}
                </ul>

                {/* CTA */}
                {isSignedIn ? (
                    <CheckoutButton
                        serviceId={serviceId}
                        title={serviceName}
                        amount={price * 100}
                        autoCheckout={autoCheckout}
                    />
                ) : (
                    <Button asChild className="w-full">
                        <Link href={loginHref}>
                            Get Started
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                )}

                {!isSignedIn && (
                    <p className="text-[10px] text-center text-muted-foreground -mt-3">
                        Sign in required to purchase
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
