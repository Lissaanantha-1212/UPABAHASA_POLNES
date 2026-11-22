import React, { useEffect, useRef } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Info,
  X,
} from 'lucide-react';

import FormField from './FormField';
import ProdiCombobox from '../../layanan-pengguna/components/ProdiCombobox';

function RegistrationForm({
  currentProgram,
  formData,
  submissionStatus,
  submissionMessage,
  isSubmitting,
  majorsList,
  handleInputChange,
  handleSubmit,
  onClose,
}) {
  const contentRef = useRef(null);

  useEffect(() => {
    if (submissionStatus && contentRef.current) {
      contentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    }
  }, [submissionStatus]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (currentProgram.status !== 'open') return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#062B20]/65 px-3 py-5 backdrop-blur-sm sm:px-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-modal-title"
        className="relative my-auto w-full max-w-xl overflow-hidden rounded-2xl border border-green-100 bg-white shadow-2xl"
      >

        <div className="h-1.5 bg-gradient-to-r from-[#10C35D] to-[#8BE0A9]" />

        {/* HEADER MODAL */}

        <div className="flex items-start justify-between gap-4 bg-[#0a3d2e] px-5 py-5 text-white md:px-7">

          <div className="flex min-w-0 items-center gap-3">

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <FileText size={20} />
            </div>

            <div className="min-w-0">

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-green-200">
                Pendaftaran Peserta
              </p>

              <h2
                id="registration-modal-title"
                className="mt-1 text-lg font-bold"
              >
                Formulir Pendaftaran
              </h2>

              <p className="mt-1 text-xs text-green-100/80">
                {currentProgram.name}
              </p>

            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup formulir"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white transition hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={19} />
          </button>

        </div>

        {/* ISI MODAL */}

        <div
          ref={contentRef}
          className="max-h-[calc(100vh-11rem)] overflow-y-auto p-5 md:p-7"
        >

          {submissionStatus && (
            <div
              role="status"
              aria-live="polite"
              className={`mb-5 flex items-start gap-3 rounded-xl border p-3.5 ${
                submissionStatus === 'success'
                  ? 'border-green-200 bg-green-50'
                  : submissionStatus === 'duplicate'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-red-200 bg-red-50'
              }`}
            >
              {submissionStatus === 'success' ? (
                <CheckCircle2
                  size={19}
                  className="mt-0.5 shrink-0 text-green-700"
                />
              ) : (
                <AlertCircle
                  size={19}
                  className={`mt-0.5 shrink-0 ${
                    submissionStatus === 'duplicate'
                      ? 'text-amber-700'
                      : 'text-red-700'
                  }`}
                />
              )}

              <div>
                <p
                  className={`text-sm font-bold ${
                    submissionStatus === 'success'
                      ? 'text-green-800'
                      : submissionStatus === 'duplicate'
                        ? 'text-amber-800'
                        : 'text-red-800'
                  }`}
                >
                  {submissionStatus === 'success'
                    ? 'Pendaftaran berhasil!'
                    : submissionStatus === 'duplicate'
                      ? 'Pendaftaran berhasil, perlu pemeriksaan'
                      : 'Pendaftaran gagal dikirim'}
                </p>

                <p
                  className={`mt-1 text-xs leading-5 ${
                    submissionStatus === 'success'
                      ? 'text-green-700'
                      : submissionStatus === 'duplicate'
                        ? 'text-amber-700'
                        : 'text-red-700'
                  }`}
                >
                  {submissionMessage}
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
            className="space-y-4"
          >

            <div className="rounded-xl border border-green-100 bg-[#F0FAF4] p-3.5">

              <p className="flex items-center gap-2 text-xs font-semibold text-[#0a3d2e]">
                <Info size={15} className="shrink-0 text-[#10C35D]" />
                Lengkapi data diri dengan benar.
              </p>

              <p className="mt-1 pl-[23px] text-[11px] leading-5 text-gray-500">
                Pastikan nomor WhatsApp aktif agar informasi
                pendaftaran dan jadwal dapat diterima.
              </p>

            </div>

            <FormField
              label="Nama Lengkap"
              name="nama"
              value={formData.nama}
              onChange={handleInputChange}
              placeholder="Contoh: Budi Santoso"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              <FormField
                label="NIM"
                name="nim"
                value={formData.nim}
                onChange={handleInputChange}
                placeholder="Nomor induk"
              />

              <FormField
                label="Kelas"
                name="kelas"
                value={formData.kelas}
                onChange={handleInputChange}
                placeholder="Contoh: 1A"
              />

            </div>

            <ProdiCombobox
              value={formData.prodi}
              options={majorsList}
              onChange={(value) =>
                handleInputChange({
                  target: { name: 'prodi', value },
                })
              }
              required
            />

            <FormField
              label="Semester"
              name="semester"
              value={formData.semester}
              onChange={handleInputChange}
            >

              <select
                id="semester"
                required
                name="semester"
                value={formData.semester}
                onChange={handleInputChange}
                className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition hover:border-gray-300 focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10"
              >

                <option value="">
                  Pilih Semester
                </option>

                {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                  <option key={semester} value={semester}>
                    Semester {semester}
                  </option>
                ))}

              </select>

            </FormField>

            <FormField
              label="Nomor WhatsApp / HP Aktif"
              name="noWa"
              value={formData.noWa}
              onChange={handleInputChange}
              placeholder="08xxxxxxxxxx"
              type="tel"
            />

            <button
              type="submit"
              disabled={isSubmitting}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#10C35D] px-4 py-3 text-sm font-bold text-white shadow-md shadow-green-700/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0DAA50] hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Send
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />

              {isSubmitting ? 'Mengirim...' : 'Kirim Formulir'}

            </button>

            <p className="text-center text-[10px] leading-5 text-gray-400">
              Pastikan seluruh informasi yang dimasukkan
              sudah benar sebelum mengirim formulir.
            </p>

          </form>

        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-center">
          <p className="text-[10px] text-gray-400">
            UPA Bahasa Â· Politeknik Negeri Samarinda
          </p>
        </div>

      </section>
    </div>
  );
}

export default RegistrationForm;

