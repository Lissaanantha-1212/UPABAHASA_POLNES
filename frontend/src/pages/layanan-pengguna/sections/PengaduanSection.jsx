
import React from 'react';
import {
  MessageSquare,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  Send,
  CheckCircle,
  ShieldCheck,
  Trash2,
  CalendarDays,
  Clock,
  MapPin,
  Monitor,
  TicketCheck,
  ArrowRight,
} from 'lucide-react';

import SectionHeading from '../components/SectionHeading';
import FormInput from '../components/FormInput';
import ProdiCombobox from '../components/ProdiCombobox';

export default function PengaduanSection({
  aduForm,
  setAduForm,
  majorsList,
  selectedFile,
  fileError,
  ticketSuccess,
  createdTicket,
  isSubmitting,
  currentCategories,
  isToeflScore,
  serviceOptions,
  handleAduSubmit,
  handleServiceChange,
  handleCategoryChange,
  handleFileChange,
  handleRemoveFile,
  setActiveTab,
  setTrackInput,
  setAccessInput,
}) {
  const updateField = (field, value) => {
    setAduForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="animate-fadeIn bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

      {!ticketSuccess ? (
        <form onSubmit={handleAduSubmit}>

          {/* HEADER */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <SectionHeading
              icon={MessageSquare}
              title="Formulir Pengaduan"
              description="Sampaikan kendala atau keluhan Anda kepada UPA Bahasa. Pastikan informasi yang diberikan lengkap dan jelas."
            />

            <div className="flex items-center gap-2 mt-5 px-4 py-3 rounded-xl bg-green-50 border border-green-100">
              <ShieldCheck size={17} className="text-[#10C35D] shrink-0" />
              <p className="text-xs text-green-800 leading-relaxed">
                Data pengaduan akan digunakan untuk membantu proses penanganan
                dan tindak lanjut oleh Admin UPA Bahasa.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8 space-y-8">

            {/* DATA PELAPOR */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <MessageSquare size={17} className="text-[#10C35D]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0a3d2e]">
                    Identitas Pelapor
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Lengkapi informasi diri Anda.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <FormInput
                  label="Nama Lengkap"
                  required
                  value={aduForm.nama}
                  onChange={(e) => updateField('nama', e.target.value)}
                  placeholder="Nama sesuai KTM"
                />

                <FormInput
                  label="NIM"
                  required
                  value={aduForm.nim}
                  onChange={(e) => updateField('nim', e.target.value)}
                  placeholder="3312001001"
                />

                <ProdiCombobox
                  value={aduForm.prodi}
                  options={majorsList}
                  onChange={(value) => updateField('prodi', value)}
                  required
                />

                <FormInput
                  label="Nomor WhatsApp"
                  value={aduForm.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                  placeholder="08123456789"
                />
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* DETAIL PENGADUAN */}
            <section>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <FileText size={17} className="text-[#10C35D]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0a3d2e]">
                    Detail Pengaduan
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Pilih layanan dan kategori kendala yang dialami.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Jenis Layanan <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={aduForm.layanan}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/20 transition-all"
                  >
                    {serviceOptions.map((service) => (
                      <option key={service} value={service}>
                        {service}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">
                    Kategori Pengaduan <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={aduForm.kategori}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/20 transition-all"
                  >
                    {currentCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* INFORMASI KHUSUS TOEFL */}
              {isToeflScore && (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/60 overflow-hidden">
                  <div className="flex items-start gap-3 p-4 border-b border-amber-100">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertCircle size={18} className="text-amber-700" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900">
                        Informasi Tambahan Tes TOEFL
                      </h4>
                      <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                        Isi informasi pelaksanaan tes sesuai sesi yang
                        mengalami kendala.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 md:p-5 grid md:grid-cols-2 gap-5">
                    <FormInput
                      label="Tanggal Pelaksanaan Tes"
                      type="date"
                      required
                      value={aduForm.tanggalTes}
                      onChange={(e) => updateField('tanggalTes', e.target.value)}
                    />

                    <FormInput
                      label="Jam / Sesi Tes"
                      required
                      value={aduForm.sesiTes}
                      onChange={(e) => updateField('sesiTes', e.target.value)}
                      placeholder="Contoh: Sesi 1 / 08.00 WITA"
                    />

                    <FormInput
                      label="Ruangan Laboratorium"
                      required
                      value={aduForm.ruangan}
                      onChange={(e) => updateField('ruangan', e.target.value)}
                      placeholder="Contoh: Laboratorium A atau Laboratorium B"
                    />

                    <FormInput
                      label="Nomor Komputer"
                      required
                      value={aduForm.nomorKomputer}
                      onChange={(e) => updateField('nomorKomputer', e.target.value)}
                      placeholder="Contoh: Komputer 12"
                    />
                  </div>
                </div>
              )}

              {/* TANGGAL KENDALA */}
              {!isToeflScore &&
                aduForm.kategori !== 'Lainnya' &&
                aduForm.kategori !== '' && (
                  <div className="mt-5">
                    <FormInput
                      label={
                        aduForm.kategori === 'Pendaftaran'
                          ? 'Tanggal Pendaftaran (Jika Ada)'
                          : aduForm.kategori === 'Jadwal'
                            ? 'Tanggal Jadwal yang Mengalami Kendala'
                            : aduForm.kategori === 'Sertifikat'
                              ? 'Tanggal Pelaksanaan Tes / Kursus (Jika Ada)'
                              : 'Tanggal Kejadian (Jika Ada)'
                      }
                      type="date"
                      value={aduForm.tanggalKendala}
                      onChange={(e) => updateField('tanggalKendala', e.target.value)}
                    />
                  </div>
                )}

              {/* DESKRIPSI */}
              <div className="mt-5">
                <label className="block text-xs font-semibold text-gray-600 mb-2">
                  Deskripsi Pengaduan <span className="text-red-500">*</span>
                </label>

                <textarea
                  rows="5"
                  value={aduForm.detail}
                  onChange={(e) => updateField('detail', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/20 transition-all resize-y placeholder:text-gray-400"
                  placeholder="Jelaskan kendala yang Anda alami secara jelas dan lengkap. Sertakan informasi pendukung agar pengaduan lebih mudah ditindaklanjuti..."
                  required
                />

                <p className="text-[11px] text-gray-400 mt-2">
                  Tuliskan kronologi atau detail kendala yang Anda alami.
                </p>
              </div>
            </section>

            <div className="border-t border-gray-100" />

            {/* BUKTI PENDUKUNG */}
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                  <Upload size={17} className="text-[#10C35D]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0a3d2e]">
                    Bukti Pendukung
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Lampirkan bukti jika tersedia (opsional).
                  </p>
                </div>
              </div>

              <div
                onClick={() => {
                  if (!selectedFile) {
                    document.getElementById('fileInput')?.click();
                  }
                }}
                className={`rounded-2xl border-2 border-dashed p-6 md:p-8 text-center transition-all ${
                  selectedFile
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-green-300 hover:bg-green-50/30 cursor-pointer'
                }`}
              >
                {selectedFile ? (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <FileText size={24} className="text-[#10C35D]" />
                    </div>

                    <p className="text-sm text-gray-700 font-semibold break-all">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-red-500 font-semibold hover:text-red-700"
                    >
                      <Trash2 size={14} />
                      Hapus File
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto mb-3">
                      <Upload size={22} className="text-[#10C35D]" />
                    </div>

                    <p className="text-sm font-semibold text-gray-700">
                      Klik untuk mengunggah bukti
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Foto atau dokumen pendukung pengaduan
                    </p>

                    <span className="inline-block mt-3 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] text-gray-500">
                      JPG, PNG, PDF · Maksimal 2 MB
                    </span>
                  </>
                )}
              </div>

              <input
                id="fileInput"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {fileError && (
                <p className="flex items-center gap-1.5 text-xs text-red-500 mt-2">
                  <AlertCircle size={14} />
                  {fileError}
                </p>
              )}
            </section>

            {/* CATATAN */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <AlertCircle size={18} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed">
                <span className="font-bold">Catatan:</span> Setelah pengaduan
                berhasil dikirim, Anda akan mendapatkan nomor tiket dan kode
                akses. Simpan keduanya untuk melacak status pengaduan.
              </p>
            </div>

            {/* SUBMIT */}
            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#10C35D] hover:bg-[#0DAA50] disabled:bg-gray-400 text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-green-600/20 hover:-translate-y-0.5 disabled:translate-y-0"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    Mengirim Pengaduan...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Kirim Pengaduan
                  </>
                )}
              </button>

              <p className="text-center text-[11px] text-gray-400 mt-3">
                Pastikan data yang Anda masukkan sudah benar sebelum dikirim.
              </p>
            </div>
          </div>
        </form>
      ) : (
        /* HALAMAN SUKSES */
        <div className="px-5 py-10 md:px-10 md:py-14">
          <div className="max-w-lg mx-auto text-center">

            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
              <CheckCircle size={42} className="text-[#10C35D]" />
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-semibold mb-4">
              <CheckCircle size={13} />
              Pengiriman Berhasil
            </span>

            <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d2e] mb-3">
              Pengaduan Berhasil Dikirim!
            </h2>

            <p className="text-sm text-gray-500 leading-relaxed mb-8">
              Pengaduan Anda telah tercatat di sistem. Simpan nomor tiket dan
              kode akses berikut untuk memeriksa perkembangan penanganan
              pengaduan.
            </p>

            {/* NOMOR TIKET */}
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-3 text-left">
              <div className="flex items-center gap-2 mb-2">
                <TicketCheck size={16} className="text-green-700" />
                <p className="text-[11px] font-bold text-green-800 uppercase tracking-wider">
                  Nomor Tiket Pengaduan
                </p>
              </div>

              <p className="text-2xl md:text-3xl font-mono font-bold text-[#0a3d2e] tracking-wide break-all">
                {createdTicket?.ticket_number}
              </p>
            </div>

            {/* KODE AKSES */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck size={16} className="text-gray-500" />
                <p className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                  Kode Akses
                </p>
              </div>

              <p className="text-2xl md:text-3xl font-mono font-bold text-[#0a3d2e] tracking-[0.15em]">
                {createdTicket?.access_code}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Gunakan kode ini bersama nomor tiket untuk membuka detail
                pengaduan.
              </p>
            </div>

            {/* PERINGATAN */}
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-7 text-left">
              <AlertCircle size={17} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <span className="font-bold">Penting:</span> Jangan membagikan
                kode akses kepada orang lain. Simpan nomor tiket dan kode akses
                agar Anda dapat memeriksa status pengaduan kembali.
              </p>
            </div>

            {/* TOMBOL */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('tracking');
                  setTrackInput(createdTicket?.ticket_number || '');
                  setAccessInput(createdTicket?.access_code || '');
                }}
                className="flex-1 px-5 py-3.5 bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                Lacak Pengaduan
                <ArrowRight size={17} />
              </button>

              <button
                type="button"
                onClick={() => {
                  setTicketSuccess(false);
                  setCreatedTicket(null);
                  setAduForm({
                    nama: '',
                    nim: '',
                    prodi: '',
                    whatsapp: '',
                    layanan: 'TOEFL Prediction',
                    kategori: 'Hasil/Skor',
                    tanggalTes: '',
                    sesiTes: '',
                    ruangan: '',
                    nomorKomputer: '',
                    tanggalKendala: '',
                    detail: '',
                  });
                }}
                className="flex-1 px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all"
              >
                Buat Pengaduan Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
