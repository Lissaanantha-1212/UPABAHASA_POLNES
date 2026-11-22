
import React from 'react';
import {
  Image,
  UserRound,
  BookOpen,
  Target,
  Network,
  History,
} from 'lucide-react';

export const tabs = [
  { id: 'hero', label: 'Hero', icon: Image },
  { id: 'profil', label: 'Profil UPA Bahasa', icon: UserRound },
  { id: 'sejarah', label: 'Sejarah', icon: BookOpen },
  {
    id: 'visi-misi',
    label: 'Visi, Misi, Tugas & Fungsi',
    icon: Target,
  },
  { id: 'struktur', label: 'Struktur Organisasi', icon: Network },
  { id: 'kepemimpinan', label: 'Riwayat Kepemimpinan', icon: History },
];

export default function TentangTabs({ activeTab, onTabChange }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2">
      <div className="overflow-x-auto">
        <div className="flex w-max min-w-full flex-nowrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#10C35D] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
                }`}
              >
                <Icon size={18} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
