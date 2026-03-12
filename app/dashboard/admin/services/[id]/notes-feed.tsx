"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send } from "lucide-react";

export default function InternalNotes({ serviceRequestId }: { serviceRequestId: string }) {
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetch(`/api/admin/services/${serviceRequestId}/notes`)
            .then(res => res.json())
            .then(data => {
                setNotes(data);
                setIsLoading(false);
            });
    }, [serviceRequestId]);

    const handleSendNote = async () => {
        if (!newNote.trim()) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/admin/services/${serviceRequestId}/notes`, {
                method: "POST",
                body: JSON.stringify({ content: newNote }),
                headers: { "Content-Type": "application/json" }
            });
            const note = await res.json();
            setNotes([...notes, note]);
            setNewNote("");
        } catch (e) {
            console.error(e);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[500px] border rounded-lg bg-slate-50 dark:bg-slate-900/50">
            <div className="p-4 border-b bg-white dark:bg-slate-900 rounded-t-lg">
                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Internal Team Notes</h3>
            </div>

            <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                    {notes.map((note) => (
                        <div key={note.id} className="flex gap-3 items-start">
                            <Avatar className="w-8 h-8 border">
                                <AvatarFallback className="text-[10px] bg-slate-200 uppercase">
                                    {note.author.name?.[0] || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold">{note.author.name}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase">{note.author.role}</span>
                                    <span className="text-[10px] text-muted-foreground">• {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <p className="text-sm bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm inline-block max-w-full break-words">
                                    {note.content}
                                </p>
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && !isLoading && (
                        <div className="text-center py-12 text-muted-foreground italic text-sm">
                            No internal notes yet. Be the first to chime in!
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-4 border-t bg-white dark:bg-slate-900 rounded-b-lg">
                <div className="flex gap-2">
                    <Input
                        placeholder="Type an internal note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendNote()}
                        disabled={isSending}
                        className="bg-slate-50 dark:bg-slate-800 border-none"
                    />
                    <Button size="icon" onClick={handleSendNote} disabled={isSending}>
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
