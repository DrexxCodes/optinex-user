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
      <UploadDropzone
        endpoint="paymentReceipt"
        onUploadBegin={() => {
          setUploading(true);
          setProgress(0);
        }}
        onUploadProgress={(p) => setProgress(p)}
        onClientUploadComplete={(res) => {
          setUploading(false);
          const url = res?.[0]?.url ?? null;
          if (url) onUploaded(url);
        }}
        onUploadError={(e) => {
          setUploading(false);
          onError?.(e.message);
        }}
        appearance={{
          container:
            'w-full cursor-pointer rounded-2xl border-2 border-dashed border-brand-200 bg-brand-50/50 py-7 transition-colors hover:border-brand-400 hover:bg-brand-50 ut-uploading:border-brand-400 ut-uploading:bg-brand-50/70',
          uploadIcon: 'text-brand-400',
          label: 'text-sm font-semibold text-brand-600',
          allowedContent: 'text-xs text-ink/40',
          button:
            'mt-3 rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 ut-uploading:opacity-60 ut-readying:opacity-60'
        }}
        content={{
          label: () => 'Drag & drop your receipt here, or click to browse',
          allowedContent: () => 'Image or PDF, up to 4MB',
          button: ({ ready }) => (ready ? 'Choose file' : 'Preparing…')
        }}
      />

      {uploading && (
        <div className="mt-2.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10">
            <div
              className="h-full rounded-full bg-brand-500 transition-[width] duration-200"
              style={{ width: `${Math.max(4, progress)}%` }}
            />
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink/50">
            <Loader2 size={12} className="animate-spin" /> Uploading… {progress}%
          </p>
        </div>
      )}
    </div>
  );
}
