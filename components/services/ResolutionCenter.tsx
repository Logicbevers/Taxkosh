import { AlertCircle, Send, FileUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ResolutionCenterProps {
    serviceRequestId: string;
    lastInternalNote?: {
        content: string;
        createdAt: Date;
    };
}

export function ResolutionCenter({ serviceRequestId, lastInternalNote }: ResolutionCenterProps) {
    return (
        <Card className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10 dark:border-amber-900/30 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="pb-3 px-6 pt-6">
                <CardTitle className="text-amber-700 dark:text-amber-500 flex items-center gap-2 text-lg">
                    <AlertCircle className="w-5 h-5" />
                    Action Required: Clarification Needed
                </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
                {lastInternalNote && (
                    <div className="bg-background rounded-lg p-4 border border-amber-100 dark:border-amber-900/50 shadow-sm">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Message from Tax Expert:</p>
                        <p className="text-sm text-foreground leading-relaxed italic">
                            "{lastInternalNote.content}"
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                            Received on {new Date(lastInternalNote.createdAt).toLocaleDateString()}
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
                    />
                    <div className="flex gap-2">
                        <Button className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-2">
                            <Send className="w-4 h-4" /> Send Message
                        </Button>
                        <Button variant="outline" className="border-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/20 gap-2">
                            <FileUp className="w-4 h-4" /> Upload Files
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
