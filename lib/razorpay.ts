import Razorpay from "razorpay";
import { ServiceCategory } from "@prisma/client";

// Razorpay SDK Instance
export const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_YourTestKeyHere",
    key_secret: process.env.RAZORPAY_KEY_SECRET || "YourTestSecretHere",
});

// Define core pricing logic. Amounts returned are in PAISE (₹1 = 100 paise)
export function getServicePricingInPaise(category: ServiceCategory): number {
    switch (category) {
        case ServiceCategory.ITR_FILING:
            return 999 * 100; // ₹999
        case ServiceCategory.GST_FILING:
            return 499 * 100; // ₹499
        case ServiceCategory.TDS_FILING:
            return 749 * 100; // ₹749
        case ServiceCategory.BUSINESS_COMPLIANCE:
            return 4999 * 100; // ₹4,999
        default:
            return 999 * 100;
    }
}
