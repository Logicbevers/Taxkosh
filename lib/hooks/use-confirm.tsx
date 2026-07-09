"use client";

import { useState, useCallback } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface ConfirmRequest {
    title: string;
    description: string;
    confirmLabel?: string;
    danger?: boolean;
    onConfirm: () => void | Promise<void>;
}

/**
 * `useConfirm` returns:
 *   - `confirm(opts)` — opens the dialog with the given options
 *   - `ConfirmDialogPortal` — render this once in your component tree
 */
export function useConfirm() {
    const [req, setReq] = useState<ConfirmRequest | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const confirm = useCallback((opts: ConfirmRequest) => {
        setReq(opts);
    }, []);

    const handleConfirm = async () => {
        if (!req) return;
        try {
            setIsLoading(true);
            await req.onConfirm();
            setReq(null);
        } finally {
            setIsLoading(false);
        }
    };

    const ConfirmDialogPortal = (
        <ConfirmDialog
            open={req !== null}
            onOpenChange={(open) => !open && !isLoading && setReq(null)}
            title={req?.title ?? ""}
            description={req?.description ?? ""}
            confirmLabel={req?.confirmLabel}
            danger={req?.danger}
            isLoading={isLoading}
            onConfirm={handleConfirm}
        />
    );

    return { confirm, ConfirmDialogPortal };
}
