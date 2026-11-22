import React from "react";
import {
  FileText,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  Play,
  Headphones,
  Languages,
} from "lucide-react";

export default function PreviewSection({
  selectedCategory,
  selectedLevel,
  onBack,
  onStart,
  isPreparing = false,
  showPreparingNotice = false,
}) {
  const categoryConfig = {
    Listening: { title: "Listening", icon: Headphones },
    Reading: { title: "Reading", icon: BookOpen },
    Grammar: { title: "Structure / Grammar", icon: Languages },
  };

  const selectedCategoryInfo = categoryConfig[selectedCategory];

  const CategoryIcon = selectedCategoryInfo?.icon || BookOpen;
  const categoryLabel = selectedCategoryInfo?.title || selectedCategory;

  return (
    <div className="min-h-screen bg-[#f7faf8] px-5 py-12">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={onBack}
          disabled={isPreparing}
          className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#0b9d4a] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft size={18} />
          Kembali ke pilihan latihan
        </button>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-9">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[#eaf8ef] text-[#0b9d4a]">
            <CategoryIcon size={27} />
          </div>

          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-[#10a653]">
            Persiapan Latihan
          </p>

          <h1 className="mt-2 text-2xl font-bold text-[#173d2d]">
            Siap untuk Mulai?
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Periksa kembali kategori dan tingkat latihan sebelum memulai
            pengerjaan.
          </p>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-[#f5faf6] p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <FileText size={17} />
                <span className="text-xs font-medium">Kategori Latihan</span>
              </div>

              <p className="mt-3 text-base font-bold text-[#173d2d]">
                {categoryLabel}
              </p>
            </div>

            <div className="rounded-xl bg-[#f5faf6] p-4">
              <div className="flex items-center gap-2 text-gray-500">
                <BookOpen size={17} />
                <span className="text-xs font-medium">Tingkat Latihan</span>
              </div>

              <p className="mt-3 text-base font-bold text-[#173d2d]">
                {selectedLevel}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-[#d5efdf] bg-[#f0fbf4] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-[#0b9d4a]"
              />

              <div>
                <h3 className="text-sm font-semibold text-[#17633a]">
                  Informasi sebelum memulai
                </h3>

                <p className="mt-2 text-xs leading-6 text-[#37694c]">
                  Soal latihan akan disiapkan dan dipilih oleh sistem
                  berdasarkan kategori serta tingkat latihan yang kamu pilih.
                  Pastikan kamu siap sebelum memulai pengerjaan.
                </p>
              </div>
            </div>
          </div>

          {showPreparingNotice && (
            <div
              className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"
              role="status"
              aria-live="polite"
            >
              <p className="text-sm font-medium leading-6 text-amber-800">
                Sedang mempersiapkan dan mengacak soal latihan. Mohon tunggu
                sebentar.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={onStart}
            disabled={isPreparing}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10C35D] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#0da950] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Play size={18} fill="currentColor" />
            {isPreparing ? "Menyiapkan Latihan..." : "Mulai Latihan"}
          </button>
        </div>
      </div>
    </div>
  );
}

