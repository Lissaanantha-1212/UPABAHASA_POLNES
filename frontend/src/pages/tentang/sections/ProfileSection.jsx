
import React, { useEffect, useState } from "react";
import aboutImg from "../../../assets/about-img.jpg";

const container = "mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10";
const PROFILE_CACHE_KEY = "upa_cms_about_profile_cache";

const DEFAULT_TITLE = "Mengenal Lebih Dekat UPA Bahasa POLNES";

const DEFAULT_DESCRIPTION = [
  "Unit Penunjang Akademik Bahasa merupakan unit penunjang akademik di bidang kebahasaan. UPA Bahasa terdiri atas kepala dan kelompok jabatan fungsional, serta mempunyai tugas melaksanakan pengembangan pembelajaran, peningkatan kemampuan, dan pelayanan uji kemampuan bahasa.",
  "UPA Bahasa menyediakan berbagai layanan yang berkaitan dengan pengembangan kemampuan berbahasa dan keterampilan komunikasi bagi sivitas akademika POLNES. Layanan tersebut mendukung kebutuhan akademik, pengembangan diri, komunikasi profesional, serta kesiapan mahasiswa menghadapi dunia kerja dan lingkungan global.",
];

function getImageUrl(path) {
  if (!path) return aboutImg;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `https://upabahasa-polnes-4p4a.vercel.app${path.startsWith("/") ? "" : "/"}${path}`;
}

function getDefaultProfile() {
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION.join("\n\n"),
    image: aboutImg,
  };
}

function readProfileCache() {
  try {
    const cached = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached);

    if (
      !parsed ||
      typeof parsed.title !== "string" ||
      typeof parsed.description !== "string" ||
      typeof parsed.image !== "string"
    ) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Cache Profil UPA Bahasa tidak dapat dibaca:", error);
    return null;
  }
}

export default function ProfileSection() {
  const [profile, setProfile] = useState(
    () => readProfileCache() || getDefaultProfile()
  );

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        const response = await fetch(
          "https://upabahasa-polnes-4p4a.vercel.app/api/cms/about"
        );

        if (!response.ok) return;

        const result = await response.json();
        if (!result.success || !active) return;

        const settings = Array.isArray(result.data?.settings)
          ? result.data.settings
          : [];

        const settingMap = Object.fromEntries(
          settings.map((item) => [
            item.setting_key,
            item.setting_value || "",
          ])
        );

        const description =
          settingMap.tentang_profil_description || "";

        const nextProfile = {
          title: settingMap.tentang_profil_title || DEFAULT_TITLE,
          description: description || DEFAULT_DESCRIPTION.join("\n\n"),
          image: getImageUrl(settingMap.tentang_profil_image),
        };

        setProfile(nextProfile);

        try {
          localStorage.setItem(
            PROFILE_CACHE_KEY,
            JSON.stringify(nextProfile)
          );
        } catch (error) {
          console.warn("Cache Profil UPA Bahasa gagal disimpan:", error);
        }
      } catch (error) {
        console.error("Gagal memuat Profil UPA Bahasa:", error);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const paragraphs = profile.description
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section
      id="profil"
      className="relative scroll-mt-16 overflow-hidden bg-white"
    >
      <div className={`${container} relative`}>
        <div className="grid min-h-[300px] grid-cols-[0.95fr_1.05fr] items-center gap-3 py-8 sm:min-h-[360px] sm:gap-5 sm:py-10 md:min-h-[430px] md:gap-5 md:py-0">
          {/* Konten Profil */}
          <div className="relative z-10 min-w-0 max-w-xl py-2 md:py-12">
            <p className="mb-2 text-[8px] font-bold uppercase tracking-[0.12em] text-[#10a653] sm:mb-3 sm:text-[10px] sm:tracking-[0.18em] md:text-xs md:tracking-[0.22em]">
              Profil UPA Bahasa
            </p>

            <h2 className="max-w-lg text-base font-extrabold leading-tight tracking-tight text-[#0a3d2e] sm:text-2xl md:text-4xl lg:text-[42px]">
              {profile.title}
            </h2>

            {paragraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`${index === 0 ? "mt-2 sm:mt-4 md:mt-5" : "mt-2 sm:mt-3"} text-[9px] leading-relaxed text-gray-600 sm:text-xs sm:leading-6 md:text-[15px] md:leading-7`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Gambar Profil */}
          <div className="relative min-w-0 md:-mr-8">
            <div className="absolute -right-3 -top-3 h-20 w-20 rounded-full bg-[#10C35D]/10 blur-2xl sm:-right-5 sm:-top-5 sm:h-40 sm:w-40 sm:blur-3xl" />

            <div className="relative h-[160px] overflow-hidden rounded-xl shadow-[0_15px_40px_rgba(10,61,46,0.12)] sm:h-[230px] sm:rounded-2xl md:h-[370px] lg:h-[430px] lg:rounded-l-3xl lg:rounded-r-none">
              <img
                src={profile.image}
                alt="Dokumentasi UPA Bahasa POLNES"
                className="h-full w-full object-cover object-center transition duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
