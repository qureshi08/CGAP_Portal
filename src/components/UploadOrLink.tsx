"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Link2, Upload, Loader2, CheckCircle2 } from "lucide-react";

interface UploadOrLinkProps {
    bucket: "fellow-documents" | "submissions";
    onUploaded: (url: string) => void;
    label?: string;
}

// Documents/code only — video and audio must go through the link path.
// Mirrored server-side as the bucket's allowedMimeTypes/fileSizeLimit
// (ensureSeedData in actions.ts) so this can't be bypassed by calling the
// upload API directly. See TECH_STACK.md's note on the free storage tier.
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ["pdf", "jpg", "jpeg", "png", "doc", "docx", "zip"];

function validateFile(file: File): string | null {
    if (file.type.startsWith("video/") || file.type.startsWith("audio/")) {
        return "Video and audio can't be uploaded directly — paste a link instead (e.g. an unlisted YouTube video or Drive link).";
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        return `.${ext || "?"} isn't supported here. Allowed: ${ALLOWED_EXTENSIONS.join(", ")} — for anything else, paste a link.`;
    }
    if (file.size > MAX_FILE_SIZE) {
        return `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is 10MB. Paste a link instead for larger files.`;
    }
    return null;
}

/**
 * Small files (transcripts, screenshots, zipped source) upload directly to
 * Supabase Storage. Large media (explainer videos, recordings) must be
 * pasted as a link instead — see TECH_STACK.md's note on the free storage tier.
 */
export default function UploadOrLink({ bucket, onUploaded, label = "Evidence" }: UploadOrLinkProps) {
    const [mode, setMode] = useState<"file" | "link">("file");
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadedName, setUploadedName] = useState<string | null>(null);
    const [linkValue, setLinkValue] = useState("");

    async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            e.target.value = ""; // allow re-selecting the same file after fixing it
            return;
        }

        setUploading(true);
        const path = `${crypto.randomUUID()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file);
        setUploading(false);

        if (uploadError) {
            setError(uploadError.message);
            return;
        }

        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        setUploadedName(file.name);
        onUploaded(data.publicUrl);
    }

    function handleLinkSubmit() {
        if (!linkValue.trim()) return;
        onUploaded(linkValue.trim());
    }

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setMode("file")} className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border ${mode === "file" ? "bg-primary-muted border-primary/30 text-primary-dark" : "border-border text-muted"}`}>
                    <Upload className="w-3 h-3 inline mr-1" />Upload file
                </button>
                <button type="button" onClick={() => setMode("link")} className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border ${mode === "link" ? "bg-primary-muted border-primary/30 text-primary-dark" : "border-border text-muted"}`}>
                    <Link2 className="w-3 h-3 inline mr-1" />Paste link
                </button>
            </div>

            {mode === "file" ? (
                <div key="file-mode">
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.zip" onChange={handleFile} disabled={uploading} className="input-field !text-[11px] !py-1.5" />
                    {uploading && <p className="text-[10.5px] text-muted mt-1 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>}
                    {uploadedName && !uploading && <p className="text-[10.5px] text-primary mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {uploadedName} uploaded</p>}
                </div>
            ) : (
                <div key="link-mode" className="flex gap-1.5">
                    <input
                        type="url"
                        placeholder="https://drive.google.com/… or GitHub/YouTube link"
                        value={linkValue}
                        onChange={e => setLinkValue(e.target.value)}
                        className="input-field !text-[11px] flex-1"
                    />
                    <button type="button" onClick={handleLinkSubmit} className="btn-secondary !px-3 !py-1.5 !text-[11px]">Attach</button>
                </div>
            )}
            {error && <p className="text-[10.5px] text-rose-600">{error}</p>}
            <p className="text-[10px] text-muted">{label} — PDF/JPG/PNG/DOC/DOCX/ZIP up to 10MB. Video/audio must be a link (Drive/YouTube unlisted).</p>
        </div>
    );
}
