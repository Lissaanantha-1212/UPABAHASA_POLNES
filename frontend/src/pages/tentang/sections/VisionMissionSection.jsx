
import React, { useEffect, useState } from "react";
import {
  Target,
  Lightbulb,
  ClipboardList,
  Settings,
  X,
  ArrowRight,
} from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import {
  duties,
  functions,
  missions,
} from "../data/aboutContent";

const API_URL = "https://upabahasa-polnes-4p4a.vercel.app/api/cms/about";

const container = "mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10";
const sectionSpacing = "py-16 md:py-24 lg:py-28";

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

  return filtered.map((item) => item.content.trim()).join("\n");
}

export default function VisionMissionSection() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

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
        console.error("Gagal memuat konten visi dan misi:", error);

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
      window.removeEventListener("keydown", handleKeyDown);
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
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#10C35D_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 -left-32 h-96 w-96 rounded-full bg-[#10C35D]/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 -right-32 h-96 w-96 rounded-full bg-[#0A3D2E]/10 blur-3xl pointer-events-none" />

        <div className={`${container} relative z-10`}>
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-block rounded-full bg-[#10C35D]/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0A3D2E] shadow-xs">
              Landasan dan Pelaksanaan
            </span>

            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">
              Visi, Misi, Tugas, dan Fungsi
            </h2>

            <p className="mt-4 text-base text-gray-600">
              Mengenal arah pengembangan serta tanggung jawab UPA Bahasa dalam mendukung pelayanan kebahasaan di POLNES.
            </p>
          </div>

          {/* Kartu sejajar dan dapat digeser pada layar HP */}
          <div className="mt-16 -mx-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory px-5 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="flex w-max items-stretch gap-3 md:w-full">
              {cards.map((card, idx) => {
                const Icon = card.icon;
                const text = card.content || "";

                return (
                  <article
                    key={card.title}
                    onClick={() => setSelectedCard(card)}
                    style={{ animationDelay: `${idx * 150}ms` }}
                    className="group relative flex w-[78vw] max-w-[280px] shrink-0 snap-start cursor-pointer flex-col justify-between rounded-3xl bg-white/90 backdrop-blur-md p-7 border border-gray-200/80 shadow-[0_10px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(16,195,93,0.12)] hover:border-[#10C35D]/60 md:w-0 md:min-w-0 md:max-w-none md:flex-1"
                  >
                    <div>
                      {/* Ikon */}
                      <div className="flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#10C35D]/10 text-[#10C35D] transition-transform duration-300 group-hover:scale-110 shadow-xs">
                          <Icon size={32} strokeWidth={1.8} />
                        </div>
                      </div>

                      {/* Judul */}
                      <h3 className="mt-6 text-center text-xl font-extrabold tracking-tight text-gray-900 group-hover:text-[#10C35D] transition-colors">
                        {card.title}
                      </h3>

                      {/* Cuplikan Konten */}
                      <div className="mt-3 max-h-[90px] overflow-hidden text-center">
                        <p className="line-clamp-3 text-xs md:text-sm font-normal leading-relaxed text-gray-600">
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

                    {/* Tombol Baca Selengkapnya */}
                    <div className="mt-8 pt-4 border-t border-gray-100 flex justify-center">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gray-50 py-2.5 text-xs font-bold text-gray-700 transition-all duration-300 group-hover:bg-[#10C35D] group-hover:text-white shadow-2xs"
                      >
                        <span>Baca Selengkapnya</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
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
            className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl border border-gray-100 animate-scaleUp"
          >
            {/* Header Modal */}
            <div className="flex shrink-0 items-center justify-between border-b border-gray-100 bg-gray-50 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#10C35D] text-white shadow-sm">
                  <selectedCard.icon size={20} strokeWidth={1.8} />
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
              <p className="whitespace-pre-wrap break-words text-sm md:text-base leading-7 text-gray-700">
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
