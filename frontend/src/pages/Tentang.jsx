import React from "react";

import AboutHero from "./tentang/sections/AboutHero";
import ProfileSection from "./tentang/sections/ProfileSection";
import HistorySection from "./tentang/sections/HistorySection";
import OrganizationSection from "./tentang/sections/OrganizationSection";
import VisionMissionSection from "./tentang/sections/VisionMissionSection";
import LeadershipHistory from "./tentang/components/LeadershipHistory";

const container = "mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10";

export default function Tentang() {
  const navigation = [
    ["Profil", "#profil"],
    ["Sejarah", "#sejarah"],
    ["Struktur Organisasi", "#struktur"],
    ["Visi, Misi, Tugas & Fungsi", "#visi-misi"],
    ["Riwayat Kepemimpinan", "#riwayat-kepemimpinan"],
  ];

  return (
    <main className="overflow-hidden bg-white text-gray-700">
      <AboutHero />

      <div className="relative z-[999] bg-red-600 px-4 py-5 text-center text-white">
  <p className="text-xl font-extrabold">
    TES DEPLOYMENT FRONTEND
  </p>
  <p className="mt-1 text-sm">
    Jika tulisan ini muncul, perubahan frontend berhasil ditayangkan.
  </p>
</div>

      {/* NAVIGASI DALAM HALAMAN */}
      <nav className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 shadow-[0_3px_12px_rgba(10,61,46,0.04)] backdrop-blur-md">
        <div className={`${container} flex gap-6 overflow-x-auto py-3.5`}>
          {navigation.map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="shrink-0 text-xs font-semibold text-gray-600 transition hover:text-[#10a653] md:text-sm"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <ProfileSection />
      <HistorySection />
      <OrganizationSection />
      <VisionMissionSection />
      <LeadershipHistory />
    </main>
  );
}
