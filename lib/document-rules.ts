import { z } from "zod";

/**
 * Per-document metadata stored on CatalogNode.documentRules (and mirrored to
 * Service.documentRules). Aligned with `requiredDocuments` by `label`.
 *
 * `optional: true` means the customer may acknowledge a consent instead of
 * uploading the file — `consentText` is the acknowledgement wording shown inline,
 * and `consentPdfS3Key` is an optional PDF of the full terms.
 */
export interface DocumentRule {
    label: string;
    optional: boolean;
    consentText?: string;
    consentPdfS3Key?: string;
}

export const documentRuleSchema = z.object({
    label: z.string().min(1).max(200),
    optional: z.boolean().default(false),
    consentText: z.string().max(5000).optional(),
    consentPdfS3Key: z.string().max(500).optional(),
});

export const documentRulesSchema = z.array(documentRuleSchema).max(50);

/**
 * Coerce the Prisma Json? column into typed rules, tolerating null and any legacy
 * shape (returns []). Use everywhere the rules are read so one bad row can't throw.
 */
export function parseDocumentRules(value: unknown): DocumentRule[] {
    if (!Array.isArray(value)) return [];
    const out: DocumentRule[] = [];
    for (const r of value) {
        if (!r || typeof r !== "object") continue;
        const rec = r as Record<string, unknown>;
        if (typeof rec.label !== "string" || !rec.label) continue;
        out.push({
            label: rec.label,
            optional: rec.optional === true,
            consentText: typeof rec.consentText === "string" ? rec.consentText : undefined,
            consentPdfS3Key: typeof rec.consentPdfS3Key === "string" ? rec.consentPdfS3Key : undefined,
        });
    }
    return out;
}

/** A consent may be acknowledged only when it is optional AND has something to read. */
export function isConsentEligible(rule: DocumentRule | undefined): boolean {
    return !!rule?.optional && (!!rule.consentText || !!rule.consentPdfS3Key);
}

/** Look up the rule for a label from a parsed rule list. */
export function ruleForLabel(rules: DocumentRule[], label: string): DocumentRule | undefined {
    return rules.find((r) => r.label === label);
}
