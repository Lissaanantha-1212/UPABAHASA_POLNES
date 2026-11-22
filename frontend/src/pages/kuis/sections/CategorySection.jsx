import React from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Headphones,
  Languages,
} from "lucide-react";

const categories = [
  {
    id: "Listening",
    title: "Listening",
    description: "Latihan menyimak dan memahami percakapan berbahasa Inggris.",
    icon: Headphones,
  },
  {
    id: "Reading",
    title: "Reading",
    description: "Latihan memahami informasi dan isi teks berbahasa Inggris.",
    icon: BookOpen,
  },
  {
    id: "Grammar",
    title: "Structure / Grammar",
    description: "Latihan memahami struktur dan tata bahasa Inggris.",
    icon: Languages,
  },
];

const levels = [
  {
    id: "singkat",
    title: "Singkat",
    description: "Latihan dengan tingkat pengerjaan singkat.",
  },
  {
    id: "sedang",
    title: "Sedang",
    description: "Latihan dengan tingkat pengerjaan menengah.",
  },
  {
    id: "panjang",
    title: "Panjang",
    description: "Latihan dengan tingkat pengerjaan lebih mendalam.",
  },
];

export default function CategorySection({
  selectedCategory,
  selectedLevel,
  onSelectCategory,
  onSelectLevel,
  onContinue,
}) {
  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0A3D2E] via-[#105B40] to-[#0A3D2E] text-white">
        <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[#10C35D]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#10C35D]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-20">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white/90">
            <BookOpen size={14} />
            PEMBELAJARAN BAHASA
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Kuis dan Latihan Soal Bahasa
          </h1>

          <p className="mt-1 text-2xl font-extrabold text-[#10C35D] md:text-3xl">
            UPA Bahasa POLNES
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/90 md:text-base">
            Tingkatkan kemampuan bahasa Inggris melalui latihan Reading
            dan Structure/Grammar sesuai tingkat yang ingin kamu pelajari.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-5 py-10 md:py-12">
        <div className="mb-7">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#10a653]">
            Pilih Latihan
          </p>

          <h2 className="mt-2 text-2xl font-bold text-[#173d2d]">
            Kategori Latihan
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Pilih kategori yang ingin kamu kerjakan.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            const isMaintenance = category.id === "Listening";

            return (
              <button
                key={category.id}
                type="button"
                disabled={isMaintenance}
                onClick={() => {
                  if (!isMaintenance) {
                    onSelectCategory(category.id);
                  }
                }}
                className={`group rounded-2xl border bg-white p-6 text-left transition duration-200 ${
                  isMaintenance
                    ? "cursor-not-allowed border-gray-200 opacity-70"
                    : `hover:-translate-y-1 hover:shadow-lg ${
                        isSelected
                          ? "border-[#10C35D] ring-2 ring-[#10C35D]/20 shadow-md"
                          : "border-gray-200 hover:border-[#10C35D]/50"
                      }`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl ${
                      isSelected
                        ? "bg-[#10C35D] text-white"
                        : "bg-[#eaf8ef] text-[#0b9d4a]"
                    }`}
                  >
                    <Icon size={26} />
                  </div>

                  {isSelected && (
                    <CheckCircle2 className="text-[#10C35D]" size={22} />
                  )}
                </div>

                <h3 className="mt-5 text-lg font-bold text-[#173d2d]">
                  {category.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {category.description}
                </p>

                {isMaintenance ? (
                  <div className="mt-5 inline-flex rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                    Sedang dalam pemeliharaan
                  </div>
                ) : (
                  <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-[#0b9d4a]">
                    {isSelected ? "Dipilih" : "Pilih kategori"}
                    <ChevronRight size={17} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {selectedCategory && (
          <section className="mt-10 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
            <div className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#10a653]">
                Tingkat Kesulitan
              </p>

              <h2 className="mt-2 text-xl font-bold text-[#173d2d]">
                Pilih Tingkat Latihan
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Tentukan tingkat latihan sesuai kebutuhanmu.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {levels.map((level) => {
                const isSelected = selectedLevel === level.id;

                return (
                  <button
                    key={level.title}
                    type="button"
                    onClick={() => onSelectLevel(level.id)}
                    className={`rounded-xl border p-5 text-left transition ${
                      isSelected
                        ? "border-[#10C35D] bg-[#f0fbf4] ring-2 ring-[#10C35D]/20"
                        : "border-gray-200 hover:border-[#10C35D]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-[#173d2d]">
                        {level.title}
                      </h3>

                      {isSelected && (
                        <CheckCircle2
                          size={20}
                          className="text-[#10C35D]"
                        />
                      )}
                    </div>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      {level.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                disabled={!selectedLevel}
                onClick={onContinue}
                className="inline-flex items-center gap-2 rounded-xl bg-[#10C35D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0da950] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                Lanjutkan
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

