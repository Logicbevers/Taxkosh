"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Upload, FilePlus, Loader2 } from "lucide-react"

export function ServiceDocumentUploader({ serviceRequestId }: { serviceRequestId: string }) {
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const router = useRouter()

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return
        setIsUploading(true)
        setProgress(0)

        const file = e.target.files[0]
        const formData = new FormData()
        formData.append("file", file)
        formData.append("documentType", "OTHER")
        formData.append("serviceRequestId", serviceRequestId)

        const xhr = new XMLHttpRequest()
        xhr.open("POST", "/api/documents/upload")

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100)
                setProgress(percentComplete)
            }
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                router.refresh()
            } else {
                console.error("Upload failed", xhr.responseText)
            }
            setIsUploading(false)
            setProgress(0)
        }

        xhr.onerror = () => {
            console.error("Upload error")
            setIsUploading(false)
            setProgress(0)
        }

        xhr.send(formData)
        e.target.value = "" // reset
    }

    return (
        <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 bg-card">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
                {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
            </div>
            <div>
                <h3 className="font-semibold text-lg">Upload Document</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    PDF, JPEG, or PNG up to 10MB
                </p>
            </div>

            {isUploading && (
                <div className="w-full max-w-xs bg-secondary rounded-full h-2.5 mt-2 overflow-hidden">
                    <div
                        className="bg-primary h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            )}

            <div className="relative mt-2">
                <Button variant="outline" disabled={isUploading}>
                    <FilePlus className="w-4 h-4 mr-2" />
                    {isUploading ? `Uploading... ${progress}%` : "Select File"}
                </Button>
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleUpload}
                    disabled={isUploading}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                />
            </div>
        </div>
    )
}
