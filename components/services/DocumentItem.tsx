"use client"
import { useState } from "react"
import { FileText, Download, Loader2 } from "lucide-react"

export function DocumentItem({ doc }: { doc: { id: string, fileName: string, fileSize: number } }) {
    const [loading, setLoading] = useState(false)

    const handleView = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/documents/${doc.id}/view`)
            const data = await res.json()
            if (data.signedUrl) {
                window.open(data.signedUrl, "_blank", "noopener,noreferrer")

                // Console log the secure metadata payload as requested by requirements
                console.log("Secure Metadata Payload:", data.metadata)
            } else {
                alert(data.error || "Failed to load document")
            }
        } catch (e) {
            console.error(e)
            alert("Failed to load document")
        } finally {
            setLoading(false)
        }
    }

    return (
        <li className="flex items-center justify-between p-3 bg-muted/30 rounded-md border group hover:bg-muted/50 transition-colors">
            <div className="flex items-center space-x-3 overflow-hidden cursor-pointer" onClick={handleView}>
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-medium truncate group-hover:underline">{doc.fileName}</span>
            </div>
            <div className="flex items-center space-x-4">
                <span className="text-xs text-muted-foreground shrink-0">
                    {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                </span>
                <button onClick={handleView} disabled={loading} className="text-muted-foreground hover:text-primary transition-colors">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
            </div>
        </li>
    )
}
