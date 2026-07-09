"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    /** Optional suggestion chips shown below the input */
    suggestions?: string[];
    /** Maximum tags allowed */
    max?: number;
    /** Hide the helper text */
    hideHelper?: boolean;
    className?: string;
    disabled?: boolean;
}

export function TagsInput({
    value,
    onChange,
    placeholder = "Type and press Enter",
    suggestions,
    max,
    hideHelper = false,
    className,
    disabled = false,
}: TagsInputProps) {
    const [draft, setDraft] = useState("");

    const addTag = (raw: string) => {
        const tag = raw.trim();
        if (!tag) return;
        if (value.includes(tag)) return;
        if (max && value.length >= max) return;
        onChange([...value, tag]);
        setDraft("");
    };

    const removeTag = (tag: string) => {
        onChange(value.filter(t => t !== tag));
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag(draft);
        } else if (e.key === "Backspace" && !draft && value.length > 0) {
            removeTag(value[value.length - 1]);
        }
    };

    const availableSuggestions = (suggestions ?? []).filter(s => !value.includes(s));

    return (
        <div className={cn("space-y-2", className)}>
            <div
                className={cn(
                    "flex flex-wrap items-center gap-2 min-h-[40px] px-3 py-2 rounded-md border border-input bg-background",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    disabled && "opacity-50 pointer-events-none"
                )}
            >
                {value.map(tag => (
                    <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-primary/10 text-primary text-xs font-medium"
                    >
                        {tag}
                        <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            aria-label={`Remove ${tag}`}
                            className="hover:text-primary/70 transition-colors"
                            tabIndex={disabled ? -1 : 0}
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onBlur={() => draft && addTag(draft)}
                    placeholder={value.length === 0 ? placeholder : ""}
                    disabled={disabled}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
                />
            </div>

            {!hideHelper && (
                <p className="text-[10px] text-muted-foreground">
                    Press <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">Enter</kbd> or <kbd className="px-1 py-0.5 rounded bg-muted text-foreground font-mono">,</kbd> to add
                    {max && ` · max ${max}`}
                </p>
            )}

            {availableSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {availableSuggestions.map(s => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => addTag(s)}
                            disabled={disabled}
                            className="inline-flex items-center h-6 px-2 rounded-md border border-dashed border-muted-foreground/30 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                        >
                            + {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
