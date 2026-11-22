
import React, { useState } from 'react';
import {
  ArrowLeft,
  User,
  CalendarDays,
  MessageSquare,
  Send,
  FileText,
  Clock,
  Trash2,
  Phone,
  Hash,
  Tag,
  ExternalLink,
  Image as ImageIcon,
  CheckCircle,
  AlertCircle,
  ClipboardList,
} from 'lucide-react';

const API_BASE_URL = 'https://upabahasa-polnes-4p4a.vercel.app';

const statusLabels = {
  menunggu: 'Menunggu',
  diproses: 'Sedang Diproses',
  perlu_dilengkapi: 'Perlu Dilengkapi',
  selesai: 'Selesai',
};

const statusStyles = {
  menunggu: 'bg-amber-50 text-amber-700 border-amber-200',
  diproses: 'bg-blue-50 text-blue-700 border-blue-200',
  perlu_dilengkapi: 'bg-orange-50 text-orange-700 border-orange-200',
  selesai: 'bg-green-50 text-green-700 border-green-200',
};

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date) => {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==========================================
// FORMAT WHATSAPP
// ==========================================

const formatWhatsApp = (number) => {
  if (!number) return '';

  let phone = String(number).replace(/\D/g, '');

  if (phone.startsWith('0')) {
    phone = `62${phone.slice(1)}`;
  } else if (phone.startsWith('8')) {
    phone = `62${phone}`;
  }

  return phone;
};

// ==========================================
// RESOLVE ATTACHMENT URL
// ==========================================

const getAttachmentUrl = (attachment) => {
  if (!attachment) return '';

  const path = String(attachment).replace(/\\/g, '/').trim();

  // Jika backend sudah mengirim URL lengkap
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  // Jika path berupa /uploads/file.jpg atau uploads/file.jpg
  const cleanPath = path.replace(/^\/+/, '');

  return `${API_BASE_URL}/${cleanPath}`;
};

// ==========================================
// ATTACHMENT PREVIEW
// ==========================================

const AttachmentPreview = ({ attachment, title = 'Lampiran' }) => {
  if (!attachment) return null;

  const attachmentUrl = getAttachmentUrl(attachment);
  const cleanPath = String(attachment).split('?')[0];

  const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(cleanPath);
  const isPDF = /\.pdf$/i.test(cleanPath);

  const fileName = cleanPath.split('/').pop() || 'File lampiran';

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="flex items-center gap-2 mb-3">
        {isImage ? (
          <ImageIcon size={17} className="text-[#10C35D]" />
        ) : (
          <FileText size={17} className="text-[#10C35D]" />
        )}

        <span className="text-sm font-semibold text-gray-700">
          {title}
        </span>
      </div>

      {isImage ? (
        <div className="space-y-3">
          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka gambar ukuran penuh di tab baru"
            className="group block w-fit max-w-full"
          >
            <img
              src={attachmentUrl}
              alt={title}
              loading="lazy"
              className="max-w-full max-h-[350px] object-contain rounded-lg border border-gray-200 bg-white transition duration-200 group-hover:opacity-90 group-hover:shadow-md"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />

            <span className="inline-flex items-center gap-1.5 mt-2 text-xs text-[#0a3d2e] font-medium group-hover:text-[#10C35D]">
              <ExternalLink size={13} />
              Klik gambar untuk melihat ukuran penuh
            </span>
          </a>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={22} className="text-red-500 shrink-0" />

            <span className="text-sm text-gray-700 truncate">
              {fileName}
            </span>
          </div>

          <a
            href={attachmentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm font-semibold text-[#0a3d2e] hover:bg-green-50 hover:border-[#10C35D] transition shrink-0"
          >
            <ExternalLink size={15} />
            {isPDF ? 'Buka PDF' : 'Buka Lampiran'}
          </a>
        </div>
      )}
    </div>
  );
};

// ==========================================
// INFO ITEM
// ==========================================

const InfoItem = ({ icon: Icon, label, value, children }) => (
  <div className="flex items-start gap-3">
    <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
      <Icon size={17} className="text-[#10C35D]" />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs text-gray-500 mb-1">{label}</p>

      {children || (
        <p className="text-sm font-semibold text-gray-800 break-words">
          {value || '-'}
        </p>
      )}
    </div>
  </div>
);

// ==========================================
// MAIN COMPONENT
// ==========================================

const ComplaintDetail = ({
  complaint,
  loading,
  saving,
  onBack,
  onUpdateStatus,
  onDelete,
}) => {
  const [status, setStatus] = useState('');
  const [notes, setNotes] = useState('');

  // ==========================================
  // SUBMIT STATUS
  // ==========================================

  const handleSubmitStatus = (e) => {
    e.preventDefault();

    if (!status) {
      alert('Silakan pilih status pengaduan terlebih dahulu.');
      return;
    }

    if (
      status === 'perlu_dilengkapi' &&
      !notes.trim()
    ) {
      alert('Catatan Admin wajib diisi ketika meminta informasi tambahan.');
      return;
    }

    if (
      status === 'selesai' &&
      !notes.trim()
    ) {
      alert('Catatan penyelesaian wajib diisi.');
      return;
    }

    onUpdateStatus({
      status,
      admin_note: notes.trim(),
      resolution_note: status === 'selesai' ? notes.trim() : '',
    });
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <div className="w-10 h-10 rounded-full border-4 border-green-100 border-t-[#10C35D] animate-spin mx-auto mb-4" />

        <p className="text-sm font-medium text-gray-600">
          Memuat detail pengaduan...
        </p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center shadow-sm">
        <AlertCircle size={36} className="text-gray-300 mx-auto mb-3" />

        <p className="text-gray-600 mb-5">
          Detail pengaduan tidak ditemukan.
        </p>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-[#0a3d2e] font-semibold hover:text-[#10C35D]"
        >
          <ArrowLeft size={17} />
          Kembali ke Manajemen Pengaduan
        </button>
      </div>
    );
  }

  const whatsappNumber =
    complaint.whatsapp ||
    complaint.phone ||
    complaint.no_whatsapp ||
    '';

  const whatsappLink = formatWhatsApp(whatsappNumber);

  const currentStatusStyle =
    statusStyles[complaint.status] ||
    'bg-gray-100 text-gray-600 border-gray-200';

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-5">

      {/* HEADER ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a3d2e] hover:text-[#10C35D] transition w-fit"
        >
          <ArrowLeft size={18} />
          Kembali ke Manajemen Pengaduan
        </button>

        {complaint.status === 'selesai' && (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold hover:bg-red-100 transition disabled:opacity-50"
          >
            
          </button>
        )}
      </div>

      {/* DETAIL PENGADUAN */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

        {/* DETAIL HEADER */}
        <div className="p-5 sm:p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <ClipboardList size={19} className="text-[#10C35D]" />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Manajemen Pengaduan
                </span>
              </div>

              <h2 className="text-xl font-bold text-[#0a3d2e]">
                Detail Pengaduan
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Nomor Tiket:{' '}
                <span className="font-semibold text-gray-700">
                  {complaint.ticket_number || '-'}
                </span>
              </p>
            </div>

            <span
              className={`inline-flex items-center gap-2 w-fit px-3 py-2 rounded-full border text-xs font-semibold ${currentStatusStyle}`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {statusLabels[complaint.status] || complaint.status}
            </span>

          </div>
        </div>

        {/* INFORMASI PELAPOR */}
        <div className="p-5 sm:p-6">

          <h3 className="text-sm font-bold text-[#0a3d2e] mb-5">
            Informasi Pelapor
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">

            <InfoItem
              icon={User}
              label="Nama Pelapor"
              value={complaint.name}
            />

            <InfoItem
              icon={Hash}
              label="NIM"
              value={complaint.nim}
            />

            <InfoItem
              icon={ClipboardList}
              label="Program Studi"
              value={complaint.program_studi}
            />

            <InfoItem
              icon={Phone}
              label="Nomor WhatsApp"
            >
              {whatsappNumber ? (
                <a
                  href={`https://wa.me/${whatsappLink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0a3d2e] hover:text-[#10C35D]"
                >
                  {whatsappNumber}
                  <ExternalLink size={13} />
                </a>
              ) : (
                <p className="text-sm font-semibold text-gray-400">
                  Belum tersedia
                </p>
              )}
            </InfoItem>

            <InfoItem
              icon={Tag}
              label="Kategori Pengaduan"
              value={complaint.category}
            />

            <InfoItem
              icon={MessageSquare}
              label="Layanan"
              value={complaint.layanan}
            />

            <InfoItem
              icon={CalendarDays}
              label="Tanggal Pengaduan"
              value={formatDate(complaint.created_at)}
            />

          </div>

          <div className="border-t border-gray-100 my-6" />

          {/* ISI PENGADUAN */}
          <div className="mb-6">
            <h3 className="font-bold text-[#0a3d2e] text-sm mb-3 flex items-center gap-2">
              <MessageSquare size={17} />
              Isi Pengaduan
            </h3>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 sm:p-5">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {complaint.description || '-'}
              </p>
            </div>
          </div>

          {/* LAMPIRAN UTAMA */}
          {complaint.attachment && (
            <div className="mb-4">
              <AttachmentPreview
                attachment={complaint.attachment}
                title="Lampiran Pengaduan"
              />
            </div>
          )}

          {/* LAMPIRAN TAMBAHAN */}
          {complaint.additional_attachment && (
            <div className="mb-4">
              <AttachmentPreview
                attachment={complaint.additional_attachment}
                title="Lampiran Informasi Tambahan"
              />
            </div>
          )}

          {!complaint.attachment && !complaint.additional_attachment && (
            <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
              <FileText size={22} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">
                Tidak ada lampiran pada pengaduan ini.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* UPDATE STATUS */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

        <div className="mb-5">
          <h3 className="font-bold text-[#0a3d2e]">
            Perbarui Status Pengaduan
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Pilih status terbaru dan berikan catatan jika diperlukan.
          </p>
        </div>

        <form onSubmit={handleSubmitStatus} className="space-y-4">

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status Pengaduan
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-50 bg-white cursor-pointer"
            >
              <option value="">Pilih status baru</option>
              <option value="menunggu">Menunggu</option>
              <option value="diproses">Sedang Diproses</option>
              <option value="perlu_dilengkapi">Perlu Dilengkapi</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Catatan Admin

              {(status === 'selesai' ||
                status === 'perlu_dilengkapi') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={
                status === 'selesai'
                  ? 'Masukkan catatan penyelesaian pengaduan (wajib diisi)...'
                  : status === 'perlu_dilengkapi'
                    ? 'Masukkan informasi yang perlu dilengkapi mahasiswa (wajib diisi)...'
                    : 'Masukkan catatan atau keterangan untuk pengaduan ini...'
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-50 resize-none"
            />

            <p className="text-xs text-gray-400 mt-2">
              Catatan wajib diisi jika status diubah menjadi Selesai atau Perlu Dilengkapi.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#10C35D] text-white rounded-xl text-sm font-semibold hover:bg-[#0a3d2e] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>

        </form>
      </div>

      {/* RIWAYAT PENGADUAN */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-sm">

        <div className="mb-5">
          <h3 className="font-bold text-[#0a3d2e] flex items-center gap-2">
            <Clock size={18} />
            Riwayat Pengaduan
          </h3>

          <p className="text-xs text-gray-500 mt-1">
            Catatan perubahan status pengaduan.
          </p>
        </div>

        {complaint.histories?.length > 0 ? (
          <div className="space-y-5">

            {complaint.histories.map((history, index) => {
              const historyStatus =
                history.new_status || history.status;

              return (
                <div
                  key={history.id || index}
                  className="relative flex gap-3"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <CheckCircle size={16} className="text-[#10C35D]" />
                    </div>

                    {index !== complaint.histories.length - 1 && (
                      <div className="w-px flex-1 bg-green-100 mt-2" />
                    )}
                  </div>

                  <div className="flex-1 pb-3 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {statusLabels[historyStatus] || historyStatus || 'Perubahan Status'}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(history.created_at)}
                    </p>

                    {(history.admin_note || history.notes || history.student_note) && (
                      <div className="mt-2 bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                          {history.admin_note ||
                            history.notes ||
                            history.student_note}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

          </div>
        ) : (
          <div className="text-center py-8">
            <Clock size={26} className="text-gray-300 mx-auto mb-2" />

            <p className="text-sm text-gray-500">
              Belum ada riwayat perubahan status.
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

export default ComplaintDetail;
