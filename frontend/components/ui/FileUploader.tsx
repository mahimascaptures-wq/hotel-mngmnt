'use client';

import { useRef, useState } from 'react';
import { Upload, X, FileText, ImageIcon, FileType2, Download, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const SERVER_ROOT = API_URL.replace(/\/api\/?$/, '');

export interface UploadedAttachment {
  _id?: string;
  filename: string;
  originalName?: string;
  url: string;
  mimeType?: string;
  size?: number;
  uploadedAt?: string;
}

interface FileUploaderProps {
  attachments?: UploadedAttachment[];
  onUpload: (files: File[]) => Promise<void> | void;
  onRemove?: (attachment: UploadedAttachment) => Promise<void> | void;
  uploading?: boolean;
  maxSizeMB?: number;
  accept?: string;
  helperText?: string;
  disabled?: boolean;
}

function fileIcon(mime?: string) {
  if (!mime) return FileText;
  if (mime.startsWith('image/')) return ImageIcon;
  if (mime === 'application/pdf') return FileType2;
  return FileText;
}

function humanSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileAbsoluteUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url;
  return `${SERVER_ROOT}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function FileUploader({
  attachments = [],
  onUpload,
  onRemove,
  uploading = false,
  maxSizeMB = 10,
  accept = 'image/*,application/pdf,.doc,.docx,.txt',
  helperText = 'Images, PDF, DOC, TXT (max 10MB each)',
  disabled = false,
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = async (list: FileList | File[]) => {
    const arr = Array.from(list);
    const oversize = arr.find((f) => f.size > maxSizeMB * 1024 * 1024);
    if (oversize) {
      toast.error(`"${oversize.name}" exceeds ${maxSizeMB}MB limit`);
      return;
    }
    if (arr.length === 0) return;
    await onUpload(arr);
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        className={cn(
          'group flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition',
          dragOver
            ? 'border-brand-500 bg-brand-50'
            : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50',
          (disabled || uploading) && 'pointer-events-none opacity-60'
        )}
      >
        {uploading ? (
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        ) : (
          <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-100 text-brand-600">
            <Upload className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-slate-800">
            {uploading ? 'Uploading...' : 'Click or drag files here'}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{helperText}</p>
        </div>
      </div>

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((a, idx) => {
            const Icon = fileIcon(a.mimeType);
            const isImage = a.mimeType?.startsWith('image/');
            const href = fileAbsoluteUrl(a.url);
            return (
              <li
                key={a._id || `${a.filename}-${idx}`}
                className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={href}
                    alt={a.originalName || a.filename}
                    className="h-10 w-10 rounded object-cover"
                  />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded bg-slate-100 text-slate-500">
                    <Icon className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">
                    {a.originalName || a.filename}
                  </p>
                  <p className="text-xs text-slate-500">{humanSize(a.size)}</p>
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600"
                  title="Open / Download"
                >
                  <Download className="h-4 w-4" />
                </a>
                {onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(a)}
                    className="rounded-md p-1.5 text-rose-500 hover:bg-rose-50"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
