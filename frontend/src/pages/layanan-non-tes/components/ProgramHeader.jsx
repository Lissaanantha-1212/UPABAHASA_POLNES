import React from 'react';
import StatusBadge from './StatusBadge';

function ProgramHeader({ program, ProgramIcon }) {
  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-green-100 bg-white shadow-sm">

      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between md:px-7 md:py-6">

        <div className="flex min-w-0 items-center gap-4">

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#10C35D]/10 text-[#10C35D]">
            <ProgramIcon size={26} />
          </div>

          <div className="min-w-0">

            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#10C35D]">
              Program yang dipilih
            </p>

            <h2 className="mt-1 text-xl font-bold leading-snug text-[#0a3d2e] md:text-2xl">
              {program.name}
            </h2>

            <p className="mt-1 text-xs text-gray-500">
              UPA Bahasa · Politeknik Negeri Samarinda
            </p>

          </div>
        </div>

        <StatusBadge status={program.status} />

      </div>
    </section>
  );
}

export default ProgramHeader;
