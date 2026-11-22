
import React from 'react';
import {
  Search,
  History,
  AlertCircle,
  RefreshCw,
  FileText,
  MessageSquare,
  Check,
  Clock,
  Upload,
  Send,
} from 'lucide-react';

import SectionHeading from '../components/SectionHeading';
import FormInput from '../components/FormInput';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import ComplaintAttachmentPreview from '../components/ComplaintAttachmentPreview';

export default function TrackingSection({
  trackInput,
  setTrackInput,
  accessInput,
  setAccessInput,
  handleTrackSubmit,
  isTracking,
  trackingError,
  trackingResult,
  additionalInfo,
  setAdditionalInfo,
  additionalFile,
  additionalFileError,
  isSubmittingAdditional,
  handleAdditionalSubmit,
  handleAdditionalFileChange,
  handleRemoveAdditionalFile,
}) {
  return (
    <div className="animate-fadeIn">
      <SectionHeading
        icon={Search}
        title="Tracking Pengaduan"
        description="Masukkan nomor tiket dan kode akses yang diperoleh setelah mengirim pengaduan untuk melihat perkembangan penanganannya."
      />

      {localStorage.getItem('lastComplaintData') && (
        <button
          type="button"
          onClick={() => {
            const lastData = JSON.parse(
              localStorage.getItem('lastComplaintData')
            );

            setTrackInput(lastData.ticket);
            setAccessInput(lastData.accessCode);
          }}
          className="mb-5 w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-green-50 border border-green-200 text-[#0a3d2e] text-sm font-semibold hover:bg-green-100 transition-all"
        >
          <History size={16} />
          Isi otomatis dengan pengaduan terakhir yang berhasil dikirim
        </button>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6">
        <form onSubmit={handleTrackSubmit} className="space-y-5">
          <div className="grid md:grid-cols-2 gap-5">
            <FormInput
              label="Nomor Tiket Pengaduan"
              required
              value={trackInput}
              onChange={(e) => setTrackInput(e.target.value)}
              placeholder="Contoh: ADU-2026-1234"
            />

            <FormInput
              label="Kode Akses"
              required
              value={accessInput}
              onChange={(e) => setAccessInput(e.target.value.toUpperCase())}
              placeholder="Masukkan kode akses"
            />
          </div>

          <button
            type="submit"
            disabled={isTracking}
            className="w-full md:w-auto px-7 py-3 rounded-xl bg-[#10C35D] hover:bg-[#0DAA50] disabled:bg-gray-400 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
          >
            {isTracking
              ? <RefreshCw size={17} className="animate-spin" />
              : <Search size={17} />}
            {isTracking ? 'Memeriksa...' : 'Periksa Pengaduan'}
          </button>
        </form>

        {trackingError && (
          <div className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={19} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 leading-relaxed">
              {trackingError}
            </p>
          </div>
        )}

        {!trackingResult && !trackingError && (
          <EmptyState
            icon={Search}
            title="Belum Ada Pengaduan yang Ditampilkan"
            description="Masukkan nomor tiket dan kode akses untuk melihat informasi serta perkembangan pengaduan Anda."
          />
        )}
      </div>

      {trackingResult && (
        <div className="space-y-6">

          {/* INFORMASI TIKET */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                  Nomor Tiket
                </p>
                <p className="text-lg md:text-xl font-bold font-mono text-[#0a3d2e]">
                  {trackingResult.ticket}
                </p>
              </div>

              <StatusBadge status={trackingResult.status} />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-1">Tanggal Pengajuan</p>
                <p className="text-sm font-semibold text-gray-700">
                  {trackingResult.tanggalPengajuan}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Waktu Pengajuan</p>
                <p className="text-sm font-semibold text-gray-700">
                  {trackingResult.waktuPengajuan} WITA
                </p>
              </div>
            </div>
          </div>

          {/* DETAIL PENGADUAN */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0a3d2e] mb-4 flex items-center gap-2">
              <FileText size={18} /> Detail Pengaduan
            </h3>

            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Nama Pengguna</p>
                <p className="text-sm font-semibold text-gray-700">
                  {trackingResult.nama}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Program Studi</p>
                <p className="text-sm font-semibold text-gray-700">
                  {trackingResult.prodi}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Jenis Layanan</p>
                <p className="text-sm font-semibold text-gray-700">
                  {trackingResult.layanan}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Kategori Pengaduan</p>
                <p className="text-sm font-semibold text-gray-700">
                  {trackingResult.kategori}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">
                Deskripsi Pengaduan
              </p>

              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line break-words">
                {trackingResult.detail}
              </p>
            </div>

            {trackingResult.additionalDetails?.length > 0 && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h4 className="text-sm font-bold text-[#0a3d2e] mb-4">
                  Informasi Tambahan
                </h4>

                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                  {trackingResult.additionalDetails.map((item, index) => (
                    <div key={index}>
                      <p className="text-xs text-gray-400 mb-1">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* LAMPIRAN PENGADUAN */}
            {(trackingResult.lampiranAwal ||
              trackingResult.lampiranTambahan) && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <h4 className="text-sm font-bold text-[#0a3d2e] mb-4">
                  Lampiran Pengaduan
                </h4>

                <div className="space-y-4">
                  <ComplaintAttachmentPreview
                    attachment={trackingResult.lampiranAwal}
                    title="Bukti Pendukung Awal"
                  />

                  <ComplaintAttachmentPreview
                    attachment={trackingResult.lampiranTambahan}
                    title="Lampiran Informasi Tambahan"
                  />
                </div>
              </div>
            )}
          </div>

          {/* TANGGAPAN ADMIN */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0a3d2e] mb-4 flex items-center gap-2">
              <MessageSquare size={18} /> Tanggapan Admin
            </h3>

            {trackingResult.catatanAdmin ? (
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {trackingResult.catatanAdmin}
                </p>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500">
                  Belum ada tanggapan dari admin.
                </p>
              </div>
            )}

            {trackingResult.status === 'selesai' &&
              trackingResult.hasilPenyelesaian && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-[#0a3d2e] mb-2">
                    Hasil Penyelesaian
                  </p>

                  <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {trackingResult.hasilPenyelesaian}
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* RIWAYAT PENANGANAN */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0a3d2e] mb-5 flex items-center gap-2">
              <History size={18} /> Riwayat Penanganan
            </h3>

            <div className="relative space-y-6">
              <div className="absolute left-[13px] top-3 bottom-4 w-px bg-gray-200" />

              {(trackingResult.history || []).map((step, index) => (
                <div key={index} className="relative flex gap-4">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                      step.done
                        ? 'bg-[#10C35D] text-white'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                    }`}
                  >
                    {step.done ? <Check size={14} /> : <Clock size={14} />}
                  </div>

                  <div className="pt-0.5 flex-1">
                    <p
                      className={`text-sm font-semibold ${
                        step.done ? 'text-[#0a3d2e]' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {step.date}
                    </p>

                    {step.description && (
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FORM INFORMASI TAMBAHAN */}
          {trackingResult.status === 'perlu_dilengkapi' && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
              <div className="flex items-center gap-2 text-orange-800 font-bold mb-2">
                <AlertCircle size={19} />
                Pengaduan Memerlukan Informasi Tambahan
              </div>

              <p className="text-sm text-orange-800 leading-relaxed mb-4">
                Silakan baca catatan admin, kemudian lengkapi informasi yang diminta melalui formulir berikut.
              </p>

              <form onSubmit={handleAdditionalSubmit} className="space-y-4">

                {/* CATATAN TAMBAHAN */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Informasi Tambahan <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    required
                    rows={4}
                    value={additionalInfo}
                    onChange={(e) => setAdditionalInfo(e.target.value)}
                    placeholder="Tuliskan informasi tambahan atau perbaikan data..."
                    className="w-full px-4 py-3 rounded-xl border border-orange-200 bg-white text-sm outline-none focus:border-orange-400 resize-y"
                  />
                </div>

                {/* LAMPIRAN TAMBAHAN */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Lampiran Tambahan
                    <span className="text-gray-400 font-normal"> (Opsional)</span>
                  </label>

                  <div className="border-2 border-dashed border-orange-200 rounded-xl p-5 bg-white text-center">
                    {additionalFile ? (
                      <>
                        <FileText
                          size={30}
                          className="text-[#10C35D] mx-auto mb-2"
                        />

                        <p className="text-xs text-[#10C35D] font-semibold break-all">
                          {additionalFile.name}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          {(additionalFile.size / 1024).toFixed(1)} KB
                        </p>

                        <button
                          type="button"
                          onClick={handleRemoveAdditionalFile}
                          className="mt-3 text-xs text-red-500 font-semibold hover:text-red-700"
                        >
                          Hapus File
                        </button>
                      </>
                    ) : (
                      <>
                        <Upload
                          size={30}
                          className="text-gray-400 mx-auto mb-2"
                        />

                        <p className="text-xs text-gray-500 mb-1">
                          Pilih foto atau dokumen pendukung
                        </p>

                        <p className="text-xs text-gray-400 mb-3">
                          Format JPG, PNG, PDF (Maksimal 2 MB)
                        </p>

                        <label
                          htmlFor="additionalFileInput"
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-50 text-[#0a3d2e] text-xs font-bold cursor-pointer hover:bg-green-100"
                        >
                          <Upload size={14} />
                          Pilih File
                        </label>
                      </>
                    )}

                    <input
                      id="additionalFileInput"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleAdditionalFileChange}
                      className="hidden"
                    />
                  </div>

                  {additionalFileError && (
                    <p className="text-xs text-red-500 mt-2">
                      {additionalFileError}
                    </p>
                  )}
                </div>

                {/* TOMBOL KIRIM */}
                <button
                  type="submit"
                  disabled={isSubmittingAdditional}
                  className="px-5 py-3 rounded-xl bg-[#10C35D] hover:bg-[#0DAA50] disabled:bg-gray-400 text-white text-sm font-bold flex items-center gap-2 transition-all"
                >
                  {isSubmittingAdditional ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Kirim Informasi Tambahan
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
