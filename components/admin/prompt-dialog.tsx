"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PromptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    label?: string;
    placeholder?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    /** Pre-fill the input */
    defaultValue?: string;
    /** Minimum characters required to enable confirm */
    minLength?: number;
    /** Maximum characters allowed */
    maxLength?: number;
    isLoading?: boolean;
    onSubmit: (value: string) => void | Promise<void>;
}

export function PromptDialog({
    open,
    onOpenChange,
    title,
    description,
    label = "Message",
    placeholder,
    confirmLabel = "Send",
    cancelLabel = "Cancel",
    defaultValue = "",
    minLength = 1,
    maxLength = 1000,
    isLoading = false,
    onSubmit,
}: PromptDialogProps) {
    const [value, setValue] = useState(defaultValue);

    // Reset whenever the dialog re-opens
    useEffect(() => {
        if (open) setValue(defaultValue);
    }, [open, defaultValue]);

    const trimmed = value.trim();
    const canSubmit = trimmed.length >= minLength && !isLoading;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        await onSubmit(trimmed);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="prompt-dialog-input">{label}</Label>
                    <Textarea
                        id="prompt-dialog-input"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        maxLength={maxLength}
                        rows={4}
                        disabled={isLoading}
                        autoFocus
                    />
                    <p className="text-[10px] text-muted-foreground text-right">
                        {trimmed.length} / {maxLength}
                    </p>
                </div>
                <DialogFooter className="gap-2 sm:gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={isLoading}
                    >
                        {cancelLabel}
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        {isLoading ? "Sending..." : confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
