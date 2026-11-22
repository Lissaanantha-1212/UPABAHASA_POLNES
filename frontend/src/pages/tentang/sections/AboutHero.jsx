import React, { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const API_URL = "http://localhost:5000/api/cms/about";
const ABOUT_CACHE_KEY = "upa_cms_about_hero_cache";

function readAboutCache() {
  try {
    const cached = localStorage.getItem(ABOUT_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);

    if (!data || typeof data !== "object") return null;

    return {
      title: typeof data.title === "string" ? data.title : "",
      description: typeof data.description === "string" ? data.description : "",
      image: typeof data.image === "string" ? data.image : null,
    };
  } catch {
    return null;
  }
}

const container = "mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10";

function getImageUrl(path) {
  if (!path || typeof path !== "string") return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `http://localhost:5000${path}`;
}

export default function AboutHero() {
  const [content, setContent] = useState(() =>
    readAboutCache() || {
      title: "",
      description: "",
      image: null,
    }
  );

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error("Gagal mengambil konten Hero Tentang.");
        }

        const data = result.data || {};
        const settings = Array.isArray(data.settings) ? data.settings : [];

        const settingMap = Object.fromEntries(
          settings.map((item) => [
            item.setting_key,
            item.setting_value ?? "",
          ])
        );

        if (!isMounted) return;

        const nextContent = {
          title: settingMap.tentang_hero_title ?? "",
          description: settingMap.tentang_hero_description ?? "",
          image: getImageUrl(data.hero?.image_path),
        };

        setContent(nextContent);

        try {
          localStorage.setItem(
            ABOUT_CACHE_KEY,
            JSON.stringify(nextContent)
          );
        } catch (cacheError) {
          console.warn("Cache Hero Tentang tidak dapat disimpan:", cacheError);
        }
      } catch (error) {
        console.error("Gagal memuat Hero Tentang:", error);
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[#0a3d2e]">
        {content.image && (
          <img
            src={content.image}
            alt="Lingkungan Politeknik Negeri Samarinda"
            className="h-full w-full object-cover object-[65%_center]"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-r from-[#073d2c]/95 via-[#0a5938]/80 to-[#0a5938]/25" />
      </div>

      <div
        className={`${container} flex min-h-[270px] items-center justify-center py-12 md:min-h-[320px] md:py-16`}
      >
        <div className="max-w-2xl text-center text-white">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {content.title}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-green-50 md:text-base">
            {content.description}
          </p>

          <div className="mt-6 flex justify-center">
            <a
              href="#profil"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0a3d2e] shadow-sm transition hover:-translate-y-0.5 hover:bg-green-100 hover:shadow-md"
            >
              Jelajahi Profil
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

