'use client';

import { useState } from 'react';
import { Loader2, UploadCloud } from 'lucide-react';
import { UploadDropzone } from '@/lib/uploadthing';

export default function ReceiptUploader({
  disabled,
  disabledMessage,
  onUploaded,
  onError
}: {
  disabled?: boolean;
  disabledMessage?: string;
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  if (disabled) {
    return (
      <div className="flex w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink/10 bg-ink/[0.03] py-8 text-center">
        <UploadCloud size={22} className="text-ink/25" />
        <p className="text-sm font-semibold text-ink/40">{disabledMessage ?? 'Upload locked'}</p>
      </div>
    );
  }

  return (
    <div>
      {/*
        The dropzone stays mounted (just hidden) while uploading so the upload
        isn't cancelled. mode: 'auto' starts the upload the moment a file is
        picked or dropped — no "Upload" confirm button.
      */}
      <div className={uploading ? 'hidden' : undefined}>
        <UploadDropzone
          endpoint="paymentReceipt"
          config={{ mode: 'auto' }}
          // Fires the instant a file is chosen, before UploadThing has even
          // fetched its presigned URL, so the progress UI shows immediately.
          onBeforeUploadBegin={(files) => {
            setUploading(true);
            setProgress(0);
            return files;
          }}
          onUploadProgress={(p) => setProgress(p)}
          onClientUploadComplete={(res) => {
            setUploading(false);
            const url = res?.[0]?.url ?? null;
            if (url) onUploaded(url);
          }}
          onUploadError={(e) => {
            setUploading(false);
            setProgress(0);
            onError?.(e.message);
          }}
          appearance={{
            container:
              'w-full cursor-pointer rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 py-7 transition-colors hover:border-brand-400 hover:bg-brand-50',
            uploadIcon: 'text-brand-400',
            label: 'text-sm font-semibold text-brand-600',
            allowedContent: 'text-xs text-ink/40',
            // Auto mode needs no button; the whole dropzone is the click target.
            button: 'hidden'
          }}
          content={{
            label: () => 'Drag & drop your receipt here, or click to browse',
            allowedContent: () => 'Image or PDF, up to 4MB'
          }}
        />
      </div>

      {uploading && (
        <div className="rounded-2xl border-2 border-dashed border-brand-400 bg-brand-50/70 px-4 py-6">
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-600">
            <Loader2 size={16} className="animate-spin" /> We are uploading...
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-200"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
          <p className="mt-1.5 text-center text-xs text-ink/50">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}
