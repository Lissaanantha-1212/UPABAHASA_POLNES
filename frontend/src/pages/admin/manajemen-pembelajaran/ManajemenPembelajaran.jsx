
import React, { useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  BookText,
} from 'lucide-react';

import AdminLayout from '../../../layouts/AdminLayout';
import EBookSection from './sections/EBookSection';
import KuisSection from './sections/KuisSection';

// ==========================================
// MENU NAVIGASI
// ==========================================

const menuItems = [
  {
    id: 'ebook',
    label: 'E-Book',
    icon: BookOpen,
  },
  {
    id: 'kuis',
    label: 'Kuis',
    icon: ClipboardList,
  },
  {
    id: 'jurnal',
    label: 'Jurnal',
    icon: BookText,
  },
];

// ==========================================
// KOMPONEN UTAMA
// ==========================================

export default function ManajemenPembelajaran() {
  const [activeTab, setActiveTab] = useState('ebook');

  return (
    <AdminLayout>
      <div className="space-y-5">

        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-bold text-[#0a3d2e]">
            Manajemen Pembelajaran
          </h1>
        </div>

        {/* MENU NAVIGASI */}
        <div className="bg-white border border-gray-200 rounded-xl p-2">
          <div className="grid grid-cols-3 gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
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
        <div>

          {/* E-BOOK */}
          {activeTab === 'ebook' && (
            <EBookSection />
          )}

          {/* KUIS */}
          {activeTab === 'kuis' && (
            <KuisSection />
          )}

          {/* JURNAL */}
          {activeTab === 'jurnal' && (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
              <BookText
                size={36}
                className="mx-auto mb-3 text-gray-400"
              />

              <h2 className="text-base font-semibold text-gray-700">
                Manajemen Jurnal
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Halaman sedang dalam pemeliharaan.
              </p>
            </div>
          )}

        </div>

      </div>
    </AdminLayout>
  );
}
