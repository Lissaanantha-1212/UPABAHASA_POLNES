
import React, { useEffect, useState } from "react";
import {
  Target,
  Lightbulb,
  ClipboardList,
  Settings,
  X,
  ArrowRight,
} from "lucide-react";

import {
  duties,
  functions,
  missions,
} from "../data/aboutContent";

const API_URL =
  "https://upabahasa-polnes-4p4a.vercel.app/api/cms/about";

const container =
  "mx-auto w-full max-w-7xl px-3 sm:px-5 md:px-8 lg:px-10";

const sectionSpacing =
  "py-10 sm:py-14 md:py-24 lg:py-28";

const defaultContent = {
  visi: "Menjadi Lembaga Bahasa yang Berkualitas dan Terkemuka di Tingkat Nasional.",
  misi: missions.join(" "),
  tugas: duties.join(" "),
  fungsi: functions.join(" "),
};

function getContentByType(items, type) {
  const filtered = items
    .filter(
      (item) =>
        item.section_type === type &&
        item.is_active !== false &&
        item.content?.trim()
    )
    .sort(
      (a, b) =>
        Number(a.sort_order) - Number(b.sort_order) ||
        Number(a.id) - Number(b.id)
    );

  if (filtered.length === 0) {
    return defaultContent[type];
  }

  if (type === "visi") {
    return filtered[0].content.trim();
  }

  return filtered
    .map((item) => item.content.trim())
    .join("\n");
}

export default function VisionMissionSection() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  // Mengambil konten CMS
  useEffect(() => {
    let isMounted = true;

    async function loadContent() {
      try {
        const response = await fetch(API_URL);

        if (!response.ok) {
          throw new Error("Gagal mengambil konten CMS.");
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error("Respons CMS tidak berhasil.");
        }

        const items = Array.isArray(result.data?.items)
          ? result.data.items
          : [];

        if (isMounted) {
          setContent({
            visi: getContentByType(items, "visi"),
            misi: getContentByType(items, "misi"),
            tugas: getContentByType(items, "tugas"),
            fungsi: getContentByType(items, "fungsi"),
          });

          setLoadError(false);
        }
      } catch (error) {
        console.error(
          "Gagal memuat konten visi dan misi:",
          error
        );

        if (isMounted) {
          setLoadError(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);

  // Mengunci scroll ketika modal terbuka
  useEffect(() => {
    if (!selectedCard) return;

    const previousOverflow = document.body.style.overflow;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedCard(null);
      }
    };

    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;

      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedCard]);

  const cards = [
    {
      title: "Visi",
      icon: Target,
      content: content?.visi,
    },
    {
      title: "Misi",
      icon: Lightbulb,
      content: content?.misi,
    },
    {
      title: "Tugas",
      icon: ClipboardList,
      content: content?.tugas,
    },
    {
      title: "Fungsi",
      icon: Settings,
      content: content?.fungsi,
    },
  ];

  return (
    <>
      <section
        id="visi-misi"
        className={`relative scroll-mt-16 overflow-hidden bg-gradient-to-b from-[#F4FBF7] via-[#EAEFF5] to-[#F4FBF7] ${sectionSpacing}`}
      >
        {/* Ornamen Latar Belakang */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#10C35D_1px,transparent_1px)] opacity-30 [background-size:24px_24px]" />

        <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-[#10C35D]/10 blur-3xl" />

        <div className="pointer-events-none absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-[#0A3D2E]/10 blur-3xl" />

        <div className={`${container} relative z-10`}>

          {/* Heading Section */}
          <div className="mx-auto max-w-3xl text-center">

            <span className="inline-block rounded-full bg-[#10C35D]/15 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-[#0A3D2E] shadow-xs sm:px-4 sm:py-1.5 sm:text-xs">
              Landasan dan Pelaksanaan
            </span>

            <h2 className="mt-3 text-[clamp(19px,5vw,36px)] font-extrabold leading-tight tracking-tight text-gray-900 md:mt-4 md:text-4xl">
              Visi, Misi, Tugas, dan Fungsi
            </h2>

            <p className="mx-auto mt-3 max-w-3xl text-[clamp(10px,2.5vw,16px)] leading-relaxed text-gray-600 md:mt-4">
              Mengenal arah pengembangan serta tanggung jawab UPA Bahasa dalam mendukung pelayanan kebahasaan di POLNES.
            </p>
          </div>

          {/* Grid Empat Kartu */}
          <div className="mt-8 grid grid-cols-4 items-stretch gap-1.5 sm:mt-12 sm:gap-3 md:mt-16">

            {cards.map((card, idx) => {
              const Icon = card.icon;
              const text = card.content || "";

              return (
                <article
                  key={card.title}
                  onClick={() => setSelectedCard(card)}
                  style={{
                    animationDelay: `${idx * 150}ms`,
                  }}
                  className="group relative flex min-w-0 aspect-[0.86/1] cursor-pointer flex-col justify-between rounded-xl border border-gray-200/80 bg-white/90 p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.04)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[#10C35D]/60 hover:shadow-[0_20px_40px_rgba(16,195,93,0.12)] sm:rounded-2xl sm:p-4 md:aspect-auto md:min-h-[400px] md:rounded-3xl md:p-7"
                >
                  <div>

                    {/* Ikon */}
                    <div className="flex justify-center">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#10C35D]/10 text-[#10C35D] shadow-xs transition-transform duration-300 group-hover:scale-110 sm:h-12 sm:w-12 sm:rounded-xl md:h-16 md:w-16 md:rounded-2xl">

                        <Icon
                          className="h-3.5 w-3.5 sm:h-6 sm:w-6 md:h-8 md:w-8"
                          strokeWidth={1.8}
                        />

                      </div>
                    </div>

                    {/* Judul */}
                    <h3 className="mt-2 text-center text-[9px] font-extrabold leading-tight tracking-tight text-gray-900 transition-colors group-hover:text-[#10C35D] sm:mt-4 sm:text-sm md:mt-6 md:text-xl">
                      {card.title}
                    </h3>

                    {/* Cuplikan Konten */}
                    <div className="mt-2 max-h-[55px] overflow-hidden text-center sm:mt-3 sm:max-h-[100px] md:max-h-none">

                      <p className="line-clamp-3 break-words text-[8px] font-normal leading-relaxed text-gray-600 sm:line-clamp-3 sm:text-xs md:text-sm">

                        {loading ? (
                          <span className="animate-pulse text-gray-400">
                            Memuat konten...
                          </span>
                        ) : loadError ? (
                          <span className="text-gray-400">
                            Gagal memuat konten.
                          </span>
                        ) : (
                          text
                        )}

                      </p>
                    </div>
                  </div>

                  {/* Tombol Detail */}
                  <div className="mt-2 flex justify-center border-t border-gray-100 pt-1.5 sm:mt-5 sm:pt-3 md:mt-8 md:pt-4">

                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-0.5 rounded-md bg-gray-50 py-1.5 text-[8px] font-bold text-gray-700 shadow-2xs transition-all duration-300 group-hover:bg-[#10C35D] group-hover:text-white sm:gap-2 sm:rounded-xl sm:py-2 sm:text-[10px] md:rounded-2xl md:py-2.5 md:text-xs"
                    >
                      <span className="sm:hidden">
                        Detail
                      </span>

                      <span className="hidden sm:inline">
                        Baca Selengkapnya
                      </span>

                      <ArrowRight
                        className="h-2.5 w-2.5 sm:h-3 sm:w-3"
                      />
                    </button>
                  </div>

                </article>
              );
            })}

          </div>
        </div>
      </section>

      {/* Modal Popup Interaktif */}
      {selectedCard && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md transition-opacity animate-fadeIn"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedCard(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="vision-mission-modal-title"
            className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl animate-scaleUp"
          >

            {/* Header Modal */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10C35D] text-white shadow-sm">
                  <selectedCard.icon
                    size={20}
                    strokeWidth={1.8}
                  />
                </div>

                <div>
                  <h3
                    id="vision-mission-modal-title"
                    className="text-lg font-extrabold text-gray-900"
                  >
                    {selectedCard.title}
                  </h3>

                  <p className="text-[11px] font-medium text-gray-500">
                    UPA Bahasa POLNES
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                aria-label="Tutup"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all hover:bg-[#10C35D] hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            {/* Konten Detail Lengkap */}
            <div className="overflow-y-auto px-6 py-6">
              <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-700 md:text-base">
                {selectedCard.content}
              </p>
            </div>

            {/* Footer Modal */}
            <div className="flex shrink-0 justify-end border-t border-gray-100 bg-gray-50 px-6 py-3.5">

              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="rounded-xl bg-[#0A3D2E] px-5 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-[#10C35D]"
              >
                Tutup
              </button>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
