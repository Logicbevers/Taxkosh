"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send } from "lucide-react";

export default function InternalNotes({ serviceRequestId }: { serviceRequestId: string }) {
    const [notes, setNotes] = useState<any[]>([]);
    const [newNote, setNewNote] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        fetch(`/api/admin/service-requests/${serviceRequestId}/notes`)
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
            const res = await fetch(`/api/admin/service-requests/${serviceRequestId}/notes`, {
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
        <div className="flex flex-col h-[550px] border-none rounded-3xl bg-slate-50/50 dark:bg-slate-900/50 shadow-inner overflow-hidden">
            <div className="p-6 border-b bg-white dark:bg-slate-900 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-slate-500">Internal Notes</h3>
                </div>
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary">
                    Staff Only
                </Badge>
            </div>

            <ScrollArea className="flex-1 px-6 py-4">
                <div className="space-y-6">
                    {notes.map((note) => (
                        <div key={note.id} className="flex gap-4 items-start group/note">
                            <Avatar className="w-9 h-9 border-2 border-white shadow-sm shrink-0">
                                <AvatarFallback className="text-[10px] bg-slate-900 text-white font-black uppercase">
                                    {note.author.name?.[0] || 'A'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-black tracking-tight">{note.author.name}</span>
                                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter bg-primary/5 px-1.5 rounded">{note.author.role}</span>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tabular-nums">
                                        {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="relative group/bubble">
                                    <p className="text-xs font-medium bg-white dark:bg-slate-800 p-3.5 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 shadow-sm text-slate-700 dark:text-slate-300 leading-relaxed transition-shadow hover:shadow-md">
                                        {note.content}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                            <div className="h-12 w-12 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-4">
                                <Send className="w-5 h-5" />
                            </div>
                            <p className="font-black text-[10px] uppercase tracking-widest">No notes yet</p>
                        </div>
                    )}
                </div>
            </ScrollArea>

            <div className="p-6 border-t bg-white dark:bg-slate-900">
                <div className="flex gap-3 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-800 focus-within:ring-2 ring-primary/20 transition-all">
                    <Input
                        placeholder="Add an internal note..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendNote()}
                        disabled={isSending}
                        className="bg-transparent border-none focus-visible:ring-0 text-xs font-medium"
                    />
                    <Button 
                        size="icon" 
                        onClick={handleSendNote} 
                        disabled={isSending || !newNote.trim()} 
                        className={`h-9 w-9 rounded-xl transition-all ${newNote.trim() ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-slate-200 text-slate-400'}`}
                    >
                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
