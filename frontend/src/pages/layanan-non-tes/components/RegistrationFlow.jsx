
import React from 'react';
import { ListChecks } from 'lucide-react';

import SectionTitle from './SectionTitle';

function RegistrationFlow({ steps = [] }) {
  const availableSteps = Array.isArray(steps)
    ? steps.filter(
        (item) => typeof item === 'string' && item.trim()
      )
    : [];

  if (availableSteps.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e4f1e8] bg-white shadow-[0_8px_30px_rgba(10,61,46,0.05)]">
      {/* Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0A3D2E] via-[#10C35D] to-[#9BE7B8]" />

      <div className="space-y-7 p-5 sm:p-7 lg:p-9">
        {/* Section Heading */}
        <SectionTitle
          icon={ListChecks}
          eyebrow="Tahapan program"
          title="Alur Pendaftaran"
          description="Ikuti tahapan berikut untuk mengetahui proses pendaftaran hingga penyelesaian program."
        />

        {/* Timeline */}
        <div className="relative space-y-3">
          {availableSteps.map((step, index) => (
            <div
              key={`${index}-${step}`}
              className="relative flex items-stretch gap-3 sm:gap-4"
            >
              {/* Connecting Line */}
              {index !== availableSteps.length - 1 && (
                <div className="absolute bottom-[-13px] left-[19px] top-10 w-px bg-gradient-to-b from-[#10C35D]/50 to-[#dcefe2]" />
              )}

              {/* Step Number */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ccebd7] bg-[#edf9f1] text-sm font-bold text-[#0A8F49]">
                {String(index + 1).padStart(2, '0')}
              </div>

              {/* Step Content */}
              <div className="flex min-w-0 flex-1 items-center rounded-2xl border border-[#e5eee8] bg-[#fafcfb] px-4 py-3.5 transition-all duration-200 hover:border-[#b9e5c8] hover:bg-[#f3faf5] sm:px-5 sm:py-4">
                <p className="text-sm leading-6 text-gray-600 sm:text-[15px]">
                  {step}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total Steps */}
        <div className="flex items-center justify-between border-t border-dashed border-[#e2eee6] pt-5">
          <span className="text-xs font-medium text-gray-400">
            Tahapan pendaftaran
          </span>

          <span className="rounded-full bg-[#edf9f1] px-3 py-1.5 text-xs font-semibold text-[#0A8F49]">
            {availableSteps.length} Langkah
          </span>
        </div>
      </div>
    </section>
  );
}

export default RegistrationFlow;
