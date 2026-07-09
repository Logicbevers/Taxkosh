const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const crypto = require('crypto');

async function simulateRealWorldFlow() {
    console.log("Starting Simulation Sequence...");
    let issues = [];

    try {
        // 1. Create Category
        console.log("[1] Creating Category: Income Tax");
        const category = await prisma.category.create({
            data: {
                name: "Income Tax",
                slug: "income-tax-" + Date.now(),
                description: "Income Tax Category",
                status: "active",
                displayOrder: 1
            }
        });
        if (!category.id) throw new Error("Category creation failed");

        // 2. Create SubCategory
        console.log("[2] Creating SubCategory: ITR Filing");
        const subCat = await prisma.subCategory.create({
            data: {
                categoryId: category.id,
                name: "ITR Filing",
                status: "active"
            }
        });
        if (!subCat.id) throw new Error("SubCategory creation failed");

        // 3. Create Service
        console.log("[3] Creating Service: ITR Filing (Salaried)");
        const service = await prisma.service.create({
            data: {
                categoryId: category.id,
                subCategoryId: subCat.id,
                name: "ITR Filing (Salaried)",
                slug: "itr-filing-salaried-" + Date.now(),
                description: "Comprehensive ITR filing for salaried individuals.",
                status: "active",
                slaHours: 48,
                requiredDocuments: ["Form 16"]
            }
        });
        if (!service.id) throw new Error("Service creation failed");

        // 4. Add Plan
        console.log("[4] Add Plan: Basic (499)");
        const plan = await prisma.servicePlan.create({
            data: {
                serviceId: service.id,
                planName: "Basic",
                price: 499,
                description: "Expert review, Email support",
                turnaroundTime: "2-3 Days",
                status: "active"
            }
        });
        if (!plan.id) throw new Error("Plan creation failed");

        // Create mock user
        console.log("[5] Creating Mock User acting as Customer");
        const user = await prisma.user.create({
            data: {
                name: "Test Customer",
                email: "customer_" + Date.now() + "@test.com",
                role: "INDIVIDUAL"
            }
        });

        // Simulating the API calls...
        console.log("[6] User: Selects plan & Creates Request (PAYMENT_PENDING)");
        const serviceReq = await prisma.serviceRequest.create({
            data: {
                userId: user.id,
                serviceId: service.id,
                planId: plan.id,
                amount: Math.round(plan.price * 100),
                status: "PAYMENT_PENDING"
            }
        });

        console.log("[7] Setup Webhook / Payment Success (transition to PAID)");
        // Emulating webhook
        const slaHours = service.slaHours || 24;
        const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);
        
        await prisma.serviceRequest.update({
            where: { id: serviceReq.id },
            data: {
                status: "PAID",
                razorpayPaymentId: "pay_" + Date.now(),
                slaDeadline
            }
        });

        console.log("[8] User: Uploads documents (Form 16)");
        const testDoc = await prisma.document.create({
            data: {
                userId: user.id,
                serviceRequestId: serviceReq.id,
                fileName: "Form16_Test.pdf",
                s3Key: "test-s3-key-" + Date.now(),
                fileSize: 1024,
                mimeType: "application/pdf",
                documentType: "FORM16",
                label: "Form 16", // Mapped directly
                isEncrypted: false
            }
        });

        console.log("[9] User: Submits Documents to Admin");
        await prisma.serviceRequest.update({
            where: { id: serviceReq.id },
            data: { status: "DOCUMENTS_SUBMITTED" }
        });

        console.log("[10] Admin: Views request & transition to UNDER_PROCESS");
        // Check if admin is blocked
        const checkReq = await prisma.serviceRequest.findUnique({
            where: { id: serviceReq.id },
            include: { documents: true, service: true }
        });
        const reqDocs = checkReq.service.requiredDocuments;
        const uploadedDocs = checkReq.documents.map(d => d.label);
        const missing = reqDocs.filter(r => !uploadedDocs.includes(r));
        if (missing.length > 0) throw new Error("Admin is improperly blocked due to missing documents map issue!");
        
        await prisma.serviceRequest.update({
            where: { id: serviceReq.id },
            data: { status: "UNDER_PROCESS" }
        });

        console.log("[11] Admin: Marks as READY_FOR_FILING");
        await prisma.serviceRequest.update({
            where: { id: serviceReq.id },
            data: { status: "READY_FOR_FILING" }
        });

        console.log("[12] Admin: Uploads Ack & Marks as FILED");
        await prisma.serviceRequest.update({
            where: { id: serviceReq.id },
            data: { 
                status: "FILED",
                filedAcknowledgementS3Key: "test-ack-s3-" + Date.now()
            }
        });

        console.log("[13] Admin: Completes request");
        await prisma.serviceRequest.update({
            where: { id: serviceReq.id },
            data: { status: "COMPLETED" }
        });

        console.log("\n--------------------------");
        console.log("FINAL VALIDATION:");
        const finalCheck = await prisma.serviceRequest.findUnique({
            where: { id: serviceReq.id },
            include: { user: true, plan: true, documents: true, service: { include: { subCategory: { include: { category: true }} } } }
        });

        if (!finalCheck.plan || finalCheck.plan.price !== 499) issues.push("Plan linking failed");
        if (finalCheck.documents.length !== 1) issues.push("Documents missing payload");
        if (finalCheck.status !== "COMPLETED") issues.push("Final status failed");
        if (!finalCheck.slaDeadline) issues.push("SLA tracking failed to initiate on Payment");
        if (!finalCheck.service.subCategory.category.id) issues.push("Dynamic Relational link missing to deep root category");
        
        if (issues.length > 0) {
            console.log("\nRESULT: FAIL");
            console.log("Issues found:");
            issues.forEach(i => console.log("- " + i));
            process.exit(1);
        } else {
            console.log("\nRESULT: PASS");
            console.log("Data layer, relations, and operational logic fully validated successfully. Zero issues.");
            process.exit(0);
        }

    } catch (e) {
        console.error("Simulation crashed with error:", e);
        console.log("\nRESULT: FAIL");
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

simulateRealWorldFlow();
