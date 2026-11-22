import React from 'react';
import {
  Image,
  UserRound,
  Newspaper,
  Images,
} from 'lucide-react';

export const tabs = [
  { id: 'hero', label: 'Hero Beranda', icon: Image },
  { id: 'profil', label: 'Profil Singkat', icon: UserRound },
  { id: 'berita', label: 'Berita Pilihan', icon: Newspaper },
  { id: 'galeri', label: 'Galeri Pilihan', icon: Images },
];

export default function BerandaTabs({ activeTab, onTabChange }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2">
      <div className="grid grid-cols-4 gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#10C35D] text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
              }`}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


