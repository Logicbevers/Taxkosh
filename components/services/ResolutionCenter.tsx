"use client";

import { useState, useRef } from "react";
import { AlertCircle, Send, FileUp, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ResolutionCenterProps {
    serviceRequestId: string;
    /** The clarification the ops/CA team asked for (serviceRequest.notes). */
    expertMessage?: {
        content: string;
        createdAt: Date;
    };
}

export function ResolutionCenter({ serviceRequestId, expertMessage }: ResolutionCenterProps) {
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    async function sendMessage() {
        if (!message.trim()) {
            toast.error("Please enter a message");
            return;
        }
        setSending(true);
        try {
            const res = await fetch(`/api/services/request/${serviceRequestId}/respond`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error || "Failed to send message");
                return;
            }
            toast.success("Response sent to your tax expert");
            setMessage("");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setSending(false);
        }
    }

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("documentType", "OTHER");
            formData.append("label", file.name);
            formData.append("serviceRequestId", serviceRequestId);
            const res = await fetch("/api/documents/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast.error(data.error || "Upload failed");
                return;
            }
            toast.success(`${file.name} uploaded successfully`);
        } catch {
            toast.error("Upload failed. Please try again.");
        } finally {
            setUploading(false);
            if (fileRef.current) fileRef.current.value = "";
        }
    }

    return (
        <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 dark:border-amber-900/30 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-amber-700 dark:text-amber-500 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5" />
                    Action Required: Clarification Needed
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
                {expertMessage && (
                    <div className="bg-background rounded-lg p-4 border border-amber-100 dark:border-amber-900/50 shadow-sm">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Message from Tax Expert:</p>
                        <p className="text-sm text-foreground leading-relaxed italic">
                            &quot;{expertMessage.content}&quot;
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Received on {new Date(expertMessage.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        Please provide the requested information or upload the missing documents below to resume the filing process.
                    </p>
                    <Textarea
                        placeholder="Type your response here..."
                        className="min-h-[100px] bg-background resize-none border-amber-200 focus-visible:ring-amber-500"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={sending}
                    />
                    <div className="flex gap-2">
                        <Button
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2"
                            onClick={sendMessage}
                            disabled={sending || !message.trim()}
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            {sending ? "Sending…" : "Send Message"}
                        </Button>
                        <Button
                            variant="outline"
                            className="border-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/20 gap-2"
                            onClick={() => fileRef.current?.click()}
                            disabled={uploading}
                        >
                            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                            {uploading ? "Uploading…" : "Upload Files"}
                        </Button>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileUpload}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
