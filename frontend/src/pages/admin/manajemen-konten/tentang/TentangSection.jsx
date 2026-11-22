
import React, { useState } from 'react';
import TentangTabs from './components/TentangTabs';
import SejarahSection from './sections/SejarahSection';
import HeroSection from './sections/HeroSection';
import ProfilTentangSection from './sections/ProfilTentangSection';
import StrukturOrganisasiSection from './sections/StrukturOrganisasiSection';
import LeadershipHistorySection from './sections/LeadershipHistorySection';
import VisiMisiTugasFungsiSection from './sections/VisiMisiTugasFungsiSection';

const sectionContent = {
  sejarah: {
    title: 'Sejarah UPA Bahasa',
    description: 'Kelola informasi sejarah dan perjalanan UPA Bahasa POLNES.',
  },
  'visi-misi': {
    title: 'Visi, Misi, Tugas & Fungsi',
    description: 'Kelola visi, misi, tugas, dan fungsi UPA Bahasa dalam satu bagian.',
  },
  struktur: {
    title: 'Struktur Organisasi',
    description: 'Kelola divisi dan personel dalam struktur organisasi UPA Bahasa.',
  },
  kepemimpinan: {
    title: 'Riwayat Kepemimpinan',
    description: 'Kelola daftar Kepala UPA Bahasa beserta periode kepemimpinannya.',
  },
};

export default function TentangSection() {
  const [activeTab, setActiveTab] = useState('hero');
  const activeSection = sectionContent[activeTab];

  return (
    <div className="space-y-6">
      <TentangTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'hero' ? (
        <HeroSection />
      ) : activeTab === 'profil' ? (
        <ProfilTentangSection />
      ) : activeTab === 'sejarah' ? (
        <SejarahSection />
      ) : activeTab === 'visi-misi' ? (
        <VisiMisiTugasFungsiSection />
      ) : activeTab === 'struktur' ? (
        <StrukturOrganisasiSection />
      ) : activeTab === 'kepemimpinan' ? (
        <LeadershipHistorySection />
      ) : (
        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-bold text-[#0a3d2e]">
            {activeSection.title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            {activeSection.description}
          </p>

          <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-10 text-center">
            <p className="text-sm text-gray-500">
              Form pengelolaan {activeSection.title} akan dibuat pada tahap berikutnya.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

