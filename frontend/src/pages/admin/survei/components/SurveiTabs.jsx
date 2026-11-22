import React from 'react';
import { LayoutDashboard, SlidersHorizontal } from 'lucide-react';

export const tabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard
  },
  {
    id: 'aspek',
    label: 'Kelola Aspek',
    icon: SlidersHorizontal
  }
];

export default function SurveiTabs({ activeTab, onTabChange }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-2">
      <div className="grid grid-cols-2 gap-2">
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

