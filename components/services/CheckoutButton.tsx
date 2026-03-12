"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface CheckoutButtonProps {
    category: string;
    title: string;
    amount: number; // in paise
}

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function CheckoutButton({ category, title, amount }: CheckoutButtonProps) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

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
            // 1. Load Razorpay script
            const resScript = await loadRazorpayScript()
            if (!resScript) {
                alert("Razorpay SDK failed to load. Are you online?")
                setIsLoading(false)
                return
            }

            // 2. Create order on our backend
            const response = await fetch("/api/payments/razorpay/create-order", {
                method: "POST",
                body: JSON.stringify({ category }),
                headers: { "Content-Type": "application/json" }
            })
            const orderData = await response.json()

            if (!orderData.success) {
                alert(orderData.error || "Failed to initiate payment")
                setIsLoading(false)
                return
            }

            // 3. Open Razorpay Checkout Modal
            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
                amount: orderData.amountPaise,
                currency: orderData.currency,
                name: "TaxKosh",
                description: `Payment for ${title}`,
                order_id: orderData.razorpayOrderId,
                handler: function (response: any) {
                    // This is client-side success handler. 
                    // Note: Real state sync happens via our backend webhook.
                    // But we redirect user immediately for better UX.
                    router.push(`/dashboard/services/${orderData.serviceRequestId}?status=awaiting_verification`)
                },
                prefill: {
                    name: "", // Can be filled if session has user name
                    email: "",
                },
                notes: {
                    receipt: orderData.serviceRequestId
                },
                theme: {
                    color: "#0f172a"
                }
            }

            const paymentObject = new window.Razorpay(options)
            paymentObject.open()
        } catch (e) {
            console.error("Checkout Error:", e)
            alert("An error occurred during checkout")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Button
            className="w-full"
            onClick={handleCheckout}
            disabled={isLoading}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initializing...
                </>
            ) : (
                <>Pay ₹{(amount / 100).toFixed(0)} & Start</>
            )}
        </Button>
    )
}
