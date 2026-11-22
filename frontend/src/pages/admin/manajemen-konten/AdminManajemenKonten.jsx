import React, { useState } from 'react';
import {
  House,
  Building2,
  Newspaper,
  Images,
} from 'lucide-react';

import AdminLayout from '../../../layouts/AdminLayout';
import InformasiSection from './informasi/InformasiSection';

import BerandaSection from './beranda/BerandaSection';
import GaleriSection from './GaleriSection';
import TentangSection from './tentang/TentangSection';
// ==========================================
// MENU NAVIGASI CMS
// ==========================================

const menuItems = [
  {
    id: 'beranda',
    label: 'Beranda',
    icon: House,
  },
  {
    id: 'tentang',
    label: 'Tentang UPA Bahasa',
    icon: Building2,
  },
  {
    id: 'informasi',
    label: 'Informasi',
    icon: Newspaper,
  },
  {
    id: 'galeri',
    label: 'Galeri',
    icon: Images,
  },
];

const sectionContent = {
  beranda: {
    title: 'Manajemen Beranda',
    description: 'Kelola tampilan utama website UPA Bahasa POLNES.',
    detail: 'Pengaturan gambar Hero Beranda.',
    icon: House,
  },
  tentang: {
    title: 'Manajemen Tentang UPA Bahasa',
    description: 'Kelola profil dan informasi mengenai UPA Bahasa POLNES.',
    detail:
      'Profil dan Sejarah, Visi dan Misi, Tugas dan Fungsi, Struktur Organisasi, serta Riwayat Kepemimpinan.',
    icon: Building2,
  },
  informasi: {
    title: 'Manajemen Informasi',
    description: 'Kelola berita, pengumuman, dan FAQ website UPA Bahasa.',
    detail: 'Pengelolaan Berita, Pengumuman, dan FAQ.',
    icon: Newspaper,
  },
  galeri: {
    title: 'Manajemen Galeri',
    description: 'Kelola dokumentasi kegiatan UPA Bahasa POLNES.',
    detail: 'Pengelolaan foto dan dokumentasi kegiatan.',
    icon: Images,
  },
};

// ==========================================
// KOMPONEN UTAMA
// ==========================================

export default function AdminManajemenKonten() {
  const [activeTab, setActiveTab] = useState('informasi');

  const activeSection = sectionContent[activeTab];
  const ActiveIcon = activeSection.icon;

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-[#0a3d2e]">
            Manajemen Konten
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Kelola informasi dan konten website UPA Bahasa POLNES.
          </p>
        </div>

        {/* MENU NAVIGASI */}
        <div className="rounded-xl border border-gray-200 bg-white p-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#10C35D] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* KONTEN */}
        <div className="space-y-5">

          {/* IDENTITAS BAGIAN */}
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-green-50 text-[#10C35D]">
              <ActiveIcon size={28} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#0a3d2e]">
                {activeSection.title}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {activeSection.description}
              </p>
            </div>
          </div>

          {activeTab === 'beranda' ? (
            <BerandaSection />
          ) : activeTab === 'informasi' ? (
            <InformasiSection />
          ) : activeTab === 'galeri' ? (
            <GaleriSection />
          ) : activeTab === 'tentang' ? (
            <TentangSection />
          ) : (
            <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-[#0a3d2e]">
                {activeSection.title}
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                {activeSection.detail}
              </p>

              <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center">
                <ActiveIcon
                  size={32}
                  className="mx-auto mb-3 text-gray-400"
                />

                <p className="text-sm font-medium text-gray-600">
                  Area pengelolaan konten
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Fitur pengelolaan akan ditampilkan pada bagian ini.
                </p>
              </div>
            </section>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}



