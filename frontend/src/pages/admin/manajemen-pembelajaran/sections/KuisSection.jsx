import React, { useState } from 'react';
import {
  Headphones,
  BookOpen,
  FileQuestion,
  ClipboardList,
  X,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import QuizCategorySection from '../kuis/QuizCategorySection';

const menuItems = [
  {
    id: 'listening',
    label: 'Listening',
    icon: Headphones,
    description: 'Kelola paket audio dan soal Listening.',
  },
  {
    id: 'reading',
    label: 'Reading',
    icon: BookOpen,
    description: 'Kelola paket teks bacaan dan soal Reading.',
  },
  {
    id: 'structure',
    label: 'Grammar',
    icon: FileQuestion,
    description: 'Kelola soal Grammar atau Structure.',
  },
];

export default function KuisSection() {
  const [activeMenu, setActiveMenu] = useState('listening');
  const [notification, setNotification] = useState(null);

  const activeItem = menuItems.find(
    (item) => item.id === activeMenu
  );

  const ActiveIcon = activeItem?.icon || ClipboardList;

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    window.setTimeout(() => setNotification(null), 3500);
  };

  return (
    <div className="space-y-5">
      {notification && (
        <div
          className={`fixed top-5 right-5 z-[100] max-w-sm w-[calc(100%-2rem)] flex items-start gap-3 p-4 rounded-xl shadow-lg border ${
            notification.type === 'success'
              ? 'bg-white border-green-200'
              : 'bg-white border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle
              size={20}
              className="text-green-600 shrink-0 mt-0.5"
            />
          ) : (
            <AlertCircle
              size={20}
              className="text-red-500 shrink-0 mt-0.5"
            />
          )}

          <p className="text-sm text-gray-700 flex-1">
            {notification.message}
          </p>

          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup notifikasi"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <div>
        <h2 className="text-lg font-bold text-[#0a3d2e]">
          Manajemen Kuis
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Kelola paket soal, soal mandiri, dan bank soal untuk setiap kategori kuis.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-2">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#10C35D] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
                }`}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#10C35D]">
            <ActiveIcon size={21} />
          </div>

          <div>
            <h3 className="font-bold text-[#0a3d2e]">
              {activeItem?.label}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {activeItem?.description}
            </p>
          </div>
        </div>

        <QuizCategorySection
          key={activeMenu}
          category={activeMenu}
          onNotify={showNotification}
        />
      </div>
    </div>
  );
}
