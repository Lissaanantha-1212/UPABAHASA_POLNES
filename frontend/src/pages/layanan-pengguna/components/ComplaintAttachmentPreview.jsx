import React from 'react';
import { FileText } from 'lucide-react';

export const getComplaintFileUrl = (filePath) => {
  if (!filePath) return '';

  // Signed URL Supabase digunakan langsung tanpa diubah.
  if (/^https?:\/\//i.test(filePath)) {
    return filePath;
  }

  const cleanPath = filePath
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');

  return `http://localhost:5000/${cleanPath}`;
};

export default function ComplaintAttachmentPreview({
  attachment,
  title
}) {
  if (!attachment) return null;

  const fileUrl = getComplaintFileUrl(attachment);

  // Abaikan query token dan fragment saat membaca ekstensi.
  const cleanAttachment = attachment.split(/[?#]/)[0];
  const extension = cleanAttachment.split('.').pop()?.toLowerCase();

  return (
    <div className="mt-3">
      {title && (
        <p className="text-sm font-semibold text-gray-700 mb-2">
          {title}
        </p>
      )}

      {['jpg', 'jpeg', 'png'].includes(extension) ? (
        <a href={fileUrl} target="_blank" rel="noreferrer">
          <img
            src={fileUrl}
            alt="Lampiran pengaduan"
            className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain"
          />
        </a>
      ) : extension === 'pdf' ? (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm text-green-700 hover:underline"
        >
          <FileText size={18} />
          Lihat lampiran PDF
        </a>
      ) : (
        <a
          href={fileUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-green-700 hover:underline"
        >
          Lihat lampiran
        </a>
      )}
    </div>
  );
}
