import React, { useEffect, useState } from "react";

const API_URL = "https://upabahasa-polnes-4p4a.vercel.app/api/cms/about";
const API_BASE_URL = "https://upabahasa-polnes-4p4a.vercel.app";
const HISTORY_CACHE_KEY = "upa_cms_about_history_cache";

const container = "mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10";
const sectionSpacing = "py-11 md:py-14 lg:py-16";

const DEFAULT_TITLE = "Sejarah UPA Bahasa";

const DEFAULT_CONTENT = [
  "UPA Bahasa POLNES terus berkembang dalam mendukung pengembangan kemampuan bahasa dan pelayanan kebahasaan bagi sivitas akademika Politeknik Negeri Samarinda.",
  "Perjalanan UPA Bahasa menjadi bagian dari upaya institusi dalam menyediakan fasilitas pembelajaran, peningkatan kompetensi, dan pelayanan uji kemampuan bahasa.",
];

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1562774053-701939374585?w=1400";

function getImageUrl(image) {
  if (!image) return DEFAULT_IMAGE;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_BASE_URL}${image.startsWith("/") ? "" : "/"}${image}`;
}

function getDefaultHistory() {
  return {
    title: DEFAULT_TITLE,
    content: DEFAULT_CONTENT.join("\n\n"),
    image: DEFAULT_IMAGE,
  };
}

function readHistoryCache() {
  try {
    const cached = localStorage.getItem(HISTORY_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);

    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      typeof parsed.content !== "string" ||
      typeof parsed.image !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Cache Sejarah UPA Bahasa tidak dapat dibaca:", error);
    return null;
  }
}

export default function HistorySection() {
  const [history, setHistory] = useState(
    () => readHistoryCache() || getDefaultHistory()
  );

  useEffect(() => {
    let active = true;

    const loadHistory = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) return;

        const result = await response.json();
        if (!result.success || !active) return;

        const profiles = Array.isArray(result.data?.profiles)
          ? result.data.profiles
          : [];

        const sejarah = profiles.find(
          (item) => item.type === "sejarah"
        );

        const nextHistory = {
          title: sejarah?.title || DEFAULT_TITLE,
          content: sejarah?.content || DEFAULT_CONTENT.join("\n\n"),
          image: getImageUrl(sejarah?.image),
        };

        setHistory(nextHistory);

        try {
          localStorage.setItem(
            HISTORY_CACHE_KEY,
            JSON.stringify(nextHistory)
          );
        } catch (error) {
          console.warn("Cache Sejarah UPA Bahasa gagal disimpan:", error);
        }
      } catch (error) {
        console.error("Gagal memuat Sejarah UPA Bahasa:", error);
      }
    };

    loadHistory();

    return () => {
      active = false;
    };
  }, []);

  const paragraphs = history.content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section
      id="sejarah"
      className={`relative scroll-mt-16 overflow-hidden bg-[#0a3d2e] ${sectionSpacing}`}
    >
      <div className={container}>
        <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <div className="relative lg:-ml-8">
            <div className="relative h-[280px] overflow-hidden rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.18)] md:h-[370px] lg:h-[430px] lg:rounded-r-3xl lg:rounded-l-none">
              <img
                src={history.image}
                alt="Sejarah UPA Bahasa POLNES"
                className="h-full w-full object-cover object-center transition duration-700 hover:scale-105"
              />
            </div>
          </div>

          <div className="relative z-10 max-w-xl py-4 lg:py-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#55e895] md:text-xs">
              Perjalanan Kami
            </p>

            <h2 className="mt-2 text-3xl font-extrabold leading-[1.15] tracking-tight text-white md:text-4xl lg:text-[42px]">
              {history.title}
            </h2>

            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`text-sm leading-7 text-green-50/90 md:text-[15px] ${
                  index === 0 ? "mt-5" : "mt-3"
                }`}
              >
                {paragraph}
              </p>
            ))}

            <div className="mt-7 h-1 w-16 rounded-full bg-[#10C35D]" />
          </div>
        </div>
      </div>
    </section>
  );
}
