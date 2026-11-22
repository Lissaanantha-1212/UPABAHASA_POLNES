import React from 'react';
import {
  Smile,
  Star,
  Check,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';

export default function SurveiSection({
  surveyAspects = [],
  surveyForm,
  setSurveyForm,
  surveySubmitted,
  setSurveySubmitted,
  isLoadingAspects = false,
  aspectsError = '',
  isSubmittingSurvey,
  surveyError,
  setSurveyError,
  handleSurveySubmit,
}) {
  const ratings = [
    { value: 'Sangat Baik', short: 'Sangat Baik' },
    { value: 'Baik', short: 'Baik' },
    { value: 'Kurang Baik', short: 'Kurang Baik' },
    { value: 'Tidak Baik', short: 'Tidak Baik' },
  ];

  const isFormDisabled =
    isSubmittingSurvey ||
    isLoadingAspects ||
    surveyAspects.length === 0;

  return (
    <div className="animate-fadeIn bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
      {!surveySubmitted ? (
        <form onSubmit={handleSurveySubmit} className="space-y-6">

          {/* HEADER SURVEI */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0a3d2e] to-[#116344] p-5 md:p-6 text-white relative overflow-hidden">
            <div className="absolute -right-8 -top-10 w-36 h-36 rounded-full bg-white/5" />

            <div className="relative flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <Smile size={23} />
              </div>

              <div>
                <p className="text-xs font-semibold tracking-wider text-green-200 uppercase mb-1">
                  Masukan Anda Berarti
                </p>

                <h2 className="text-xl md:text-2xl font-bold mb-2">
                  Survei Kepuasan Layanan
                </h2>

                <p className="text-sm text-green-50/90 leading-relaxed max-w-xl">
                  Bantu kami meningkatkan kualitas layanan UPA Bahasa POLNES.
                  Pilih satu jawaban yang paling sesuai dengan pengalaman Anda.
                </p>
              </div>
            </div>
          </div>

          {/* INFORMASI PENILAIAN */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#0a3d2e]">
                Penilaian Layanan
              </h3>

              <p className="text-xs text-gray-500 mt-1">
                Berikan penilaian untuk setiap aspek berikut.
              </p>
            </div>

            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-[#0a3d2e]">
              <Star size={13} className="text-[#10C35D]" />
              {surveyAspects.length} aspek penilaian
            </span>
          </div>

          {/* STATUS PEMUATAN ASPEK */}
          {isLoadingAspects && (
            <div className="flex items-center gap-3 rounded-xl border border-green-100 bg-green-50 px-4 py-4">
              <RefreshCw size={18} className="animate-spin text-[#10C35D]" />
              <p className="text-sm text-[#0a3d2e]">
                Memuat aspek penilaian survei...
              </p>
            </div>
          )}

          {/* PESAN JIKA ASPEK GAGAL DIMUAT */}
          {!isLoadingAspects && aspectsError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <AlertCircle
                size={17}
                className="text-red-500 shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs font-semibold text-red-600">
                  Aspek survei gagal dimuat.
                </p>
                <p className="text-xs text-red-600 leading-relaxed mt-1">
                  {aspectsError} Silakan muat ulang halaman untuk mencoba kembali.
                </p>
              </div>
            </div>
          )}

          {/* JIKA BELUM ADA ASPEK AKTIF */}
          {!isLoadingAspects &&
            !aspectsError &&
            surveyAspects.length === 0 && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                <AlertCircle
                  size={17}
                  className="text-amber-600 shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-700 leading-relaxed">
                  Belum ada aspek penilaian survei yang tersedia saat ini.
                </p>
              </div>
            )}

          {/* DAFTAR ASPEK PENILAIAN DARI DATABASE */}
          {!isLoadingAspects && surveyAspects.length > 0 && (
            <div className="space-y-4">
              {surveyAspects.map((aspect, index) => {
                const aspectId = String(aspect.id);

                return (
                  <section
                    key={aspect.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 md:p-5 transition-colors hover:border-green-200"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-green-50 text-[#0a3d2e] flex items-center justify-center text-xs font-bold shrink-0">
                        {String(index + 1).padStart(2, '0')}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#0a3d2e]">
                          {aspect.label}

                          {aspect.englishLabel && (
                            <span className="ml-2 text-xs font-medium text-gray-400">
                              ({aspect.englishLabel})
                            </span>
                          )}
                        </h4>

                        {aspect.description && (
                          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            {aspect.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {ratings.map((rating) => {
                        const isSelected =
                          surveyForm[aspectId] === rating.value;

                        return (
                          <label
                            key={rating.value}
                            className={`relative flex items-center justify-center min-h-11 px-2 py-2.5 rounded-lg border text-center text-xs font-semibold cursor-pointer transition-all ${
                              isSelected
                                ? 'border-[#10C35D] bg-green-50 text-[#0a3d2e] ring-1 ring-[#10C35D]/30'
                                : 'border-gray-200 bg-white text-gray-600 hover:border-green-300 hover:bg-green-50/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`aspect-${aspect.id}`}
                              value={rating.value}
                              checked={isSelected}
                              onChange={(e) =>
                                setSurveyForm((prev) => ({
                                  ...prev,
                                  [aspectId]: e.target.value,
                                }))
                              }
                              className="sr-only"
                              required
                              disabled={isSubmittingSurvey}
                            />

                            {isSelected && (
                              <Check
                                size={13}
                                className="mr-1 text-[#10C35D] shrink-0"
                              />
                            )}

                            <span>{rating.short}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {/* KOMENTAR DAN SARAN */}
          <div className="rounded-xl border border-gray-200 p-4 md:p-5">
            <label className="block text-sm font-bold text-[#0a3d2e] mb-1.5">
              Komentar atau Saran

              <span className="ml-2 text-xs font-normal text-gray-400">
                (Opsional)
              </span>
            </label>

            <p className="text-xs text-gray-500 mb-3">
              Ada hal yang ingin disampaikan? Tuliskan masukan Anda di sini.
            </p>

            <textarea
              rows={4}
              value={surveyForm.saran || ''}
              onChange={(e) =>
                setSurveyForm((prev) => ({
                  ...prev,
                  saran: e.target.value,
                }))
              }
              disabled={isSubmittingSurvey}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/20 transition-all resize-y disabled:bg-gray-50"
              placeholder="Tuliskan saran atau masukan Anda untuk perbaikan layanan..."
            />
          </div>

          {/* PETUNJUK */}
          <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              <span className="font-bold text-gray-700">Petunjuk:</span>
              {' '}Seluruh aspek penilaian wajib diisi.
              Komentar atau saran boleh dikosongkan.
            </p>

            <p className="text-xs text-gray-500 leading-relaxed mt-2">
              Survei ini bersifat anonim. Data identitas pribadi tidak diminta
              dalam pengisian survei.
            </p>
          </div>

          {/* PESAN ERROR PENGIRIMAN */}
          {surveyError && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <AlertCircle
                size={17}
                className="text-red-500 shrink-0 mt-0.5"
              />

              <p className="text-xs text-red-600 leading-relaxed">
                {surveyError}
              </p>
            </div>
          )}

          {/* TOMBOL KIRIM */}
          <button
            type="submit"
            disabled={isFormDisabled}
            className="w-full bg-[#10C35D] hover:bg-[#0DAA50] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-md shadow-green-600/20 hover:-translate-y-0.5"
          >
            {isSubmittingSurvey ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Mengirim Penilaian...
              </>
            ) : (
              <>
                <Send size={18} />
                Kirim Penilaian
              </>
            )}
          </button>
        </form>
      ) : (
        /* HALAMAN BERHASIL */
        <div className="text-center py-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-5">
            <Smile size={40} className="text-[#10C35D]" />
          </div>

          <h2 className="text-2xl font-bold text-[#0a3d2e] mb-3">
            Terima Kasih atas Penilaian Anda!
          </h2>

          <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
            Masukan Anda berhasil dikirim dan akan menjadi bahan evaluasi
            untuk meningkatkan kualitas pelayanan UPA Bahasa POLNES.
          </p>

          <p className="text-xs text-gray-500">
            Penilaian Anda telah tersimpan. Terima kasih telah berpartisipasi
            dalam survei kepuasan layanan.
          </p>

          <button
            onClick={() => {
              setSurveySubmitted(false);
              setSurveyError('');
            }}
            className="mt-6 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
          >
            Kembali ke Formulir
          </button>
        </div>
      )}
    </div>
  );
}
