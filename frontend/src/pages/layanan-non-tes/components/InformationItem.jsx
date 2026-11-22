import React from 'react';

function InformationItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#10C35D]/10 text-[#10C35D]">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-[#0a3d2e]">
          {value}
        </p>
      </div>
    </div>
  );
}

export default InformationItem;