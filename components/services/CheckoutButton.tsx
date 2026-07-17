"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface CheckoutButtonProps {
    serviceId: string;
    planId?: string;
    title: string;
    amount: number; // in paise
    autoCheckout?: boolean;
    /** Documents uploaded before this request existed; attached to it at checkout. */
    documentIds?: string[];
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
    prefill: { name: string; email: string };
    notes: Record<string, string>;
    theme: { color: string };
    modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
    open(): void;
}

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

export function CheckoutButton({ serviceId, planId, title, amount, autoCheckout, documentIds }: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const { data: session } = useSession()

    useEffect(() => {
        if (autoCheckout) handleCheckout();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoCheckout]);

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement("script")
            script.src = "https://checkout.razorpay.com/v1/checkout.js"
            script.onload = () => resolve(true)
            script.onerror = () => resolve(false)
            document.body.appendChild(script)
        })
    }

    const handleCheckout = async () => {
        setIsLoading(true)
        try {
            const response = await fetch("/api/payments/razorpay/create-order", {
                method: "POST",
                body: JSON.stringify({ serviceId, planId, documentIds }),
                headers: { "Content-Type": "application/json" }
            })
            const orderData = await response.json()

            if (!response.ok || !orderData.success) {
                toast.error(orderData.error || "Failed to initiate payment")
                setIsLoading(false)
                return
            }

            // Demo mode: no live gateway keys. Settle the payment server-side and
            // proceed through the same post-payment flow as a real transaction.
            if (orderData.demoMode) {
                const done = await fetch("/api/payments/demo/complete", {
                    method: "POST",
                    body: JSON.stringify({ serviceRequestId: orderData.serviceRequestId }),
                    headers: { "Content-Type": "application/json" },
                })
                const doneData = await done.json()
                if (!done.ok || !doneData.success) {
                    toast.error(doneData.error || "Failed to complete payment")
                    setIsLoading(false)
                    return
                }
                setIsLoading(false)
                toast.success("Payment successful! Setting up your service request...")
                router.push(`/dashboard/services/${orderData.serviceRequestId}?status=awaiting_verification`)
                return
            }

            // Real Razorpay path — needs the public key + checkout SDK.
            const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
            if (!razorpayKey) {
                toast.error("Payment gateway not configured. Please contact support.")
                setIsLoading(false)
                return
            }
            const resScript = await loadRazorpayScript()
            if (!resScript) {
                toast.error("Razorpay SDK failed to load. Check your connection.")
                setIsLoading(false)
                return
            }

            const options: RazorpayOptions = {
                key: razorpayKey,
                amount: orderData.amountPaise,
                currency: orderData.currency,
                name: "TaxKosh",
                description: `Payment for ${title}`,
                order_id: orderData.razorpayOrderId,
                handler: async function (response) {
                    // Finalize immediately via signature verification so the
                    // request is marked PAID without waiting on the webhook. The
                    // webhook remains an idempotent backup.
                    try {
                        await fetch("/api/payments/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            }),
                        })
                    } catch {
                        // Non-fatal: the webhook will still finalize it shortly.
                    }
                    setIsLoading(false)
                    toast.success("Payment received! Setting up your service request...")
                    router.push(`/dashboard/services/${orderData.serviceRequestId}?status=awaiting_verification`)
                },
                prefill: {
                    name: session?.user?.name ?? "",
                    email: session?.user?.email ?? "",
                },
                notes: { receipt: orderData.serviceRequestId },
                theme: { color: "#0f172a" },
                modal: {
                    // Reset loading state when the user dismisses the Razorpay modal
                    // without completing payment.  Without this, the finally block fires
                    // immediately after paymentObject.open() (which is synchronous) and
                    // re-enables the button while the modal is still on screen, allowing
                    // a double-click to create a second Razorpay order.
                    ondismiss: () => setIsLoading(false),
                },
            }

            const paymentObject = new window.Razorpay(options)
            paymentObject.open()
            // Do NOT reset isLoading here — it resets via ondismiss or the handler above.
            return
        } catch (e) {
            console.error("Checkout Error:", e)
            toast.error("An error occurred during checkout")
            setIsLoading(false)
        }
    }

    return (
        <Button
            className="w-full text-[10px] font-black uppercase tracking-widest h-11 rounded-2xl bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5"
            onClick={handleCheckout}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing Secure Gateway...
                </>
            ) : (
                <>Pay ₹{(amount / 100).toFixed(0)} & Proceed</>
            )}
        </Button>
    )
}
