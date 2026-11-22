
import React from 'react';
import {
  FileText,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
} from 'lucide-react';

import SectionTitle from './SectionTitle';

function ProgramInfo({ program }) {
  const benefits = Array.isArray(program.benefits)
    ? program.benefits.filter(
        (item) => typeof item === 'string' && item.trim()
      )
    : [];

  const requirements = Array.isArray(program.requirements)
    ? program.requirements.filter(
        (item) => typeof item === 'string' && item.trim()
      )
    : [];

  const description =
    program.description?.trim() ||
    'Informasi deskripsi program belum tersedia.';

  return (
    <section className="overflow-hidden rounded-3xl border border-[#e4f1e8] bg-white shadow-[0_8px_30px_rgba(10,61,46,0.05)]">
      {/* Accent Line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0A3D2E] via-[#10C35D] to-[#9BE7B8]" />

      <div className="space-y-8 p-5 sm:p-7 lg:p-9">
        {/* Section Heading */}
        <SectionTitle
          icon={FileText}
          eyebrow="Tentang program"
          title="Informasi Program"
        />

        {/* Gambaran Umum */}
        <div className="relative overflow-hidden rounded-2xl border border-[#dcefe2] bg-gradient-to-br from-[#f2faf5] via-[#f7fcf8] to-white p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[#10C35D]/[0.07]" />

          <div className="pointer-events-none absolute -bottom-12 right-24 h-28 w-28 rounded-full bg-[#10C35D]/[0.05]" />

          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#0A3D2E] text-white shadow-lg shadow-[#0A3D2E]/15">
              <FileText size={22} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#10A653]">
                  Gambaran Umum
                </span>

                <span className="h-px w-8 bg-[#10C35D]/40" />
              </div>

              <p className="max-w-4xl text-sm leading-7 text-gray-600 sm:text-[15px]">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Manfaat dan Persyaratan */}
        {(benefits.length > 0 || requirements.length > 0) && (
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
            {/* Manfaat Program */}
            {benefits.length > 0 && (
              <div className="group relative overflow-hidden rounded-2xl border border-[#e2eee6] bg-white p-5 shadow-[0_5px_20px_rgba(10,61,46,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(10,61,46,0.08)] sm:p-6">
                <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-[#10C35D] to-[#b6ebc9]" />

                <div className="mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#eaf8ef] text-[#0A8F49]">
                      <Sparkles size={21} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#0A3D2E] sm:text-lg">
                        Manfaat Program
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-400">
                        Keuntungan yang diperoleh
                      </p>
                    </div>
                  </div>

                  <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#edf9f1] px-2 text-xs font-bold text-[#0A8F49]">
                    {benefits.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {benefits.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl bg-[#f7fbf8] px-3.5 py-3 transition-colors duration-200 hover:bg-[#edf8f1]"
                    >
                      <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#dff5e7] text-[#0A9B4E]">
                        <CheckCircle2 size={15} />
                      </div>

                      <p className="text-sm leading-6 text-gray-600">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Persyaratan Pendaftaran */}
            {requirements.length > 0 && (
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0A3D2E] via-[#0d5039] to-[#126644] p-5 text-white shadow-[0_8px_24px_rgba(10,61,46,0.15)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_rgba(10,61,46,0.22)] sm:p-6">
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border-[20px] border-white/[0.05]" />

                <div className="pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full bg-[#10C35D]/[0.08]" />

                <div className="relative mb-6 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#a7f0c1]">
                      <ClipboardCheck size={21} />
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white sm:text-lg">
                        Persyaratan Pendaftaran
                      </h3>

                      <p className="mt-0.5 text-xs text-green-100/65">
                        Hal yang perlu dipersiapkan
                      </p>
                    </div>
                  </div>

                  <span className="flex h-8 min-w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 px-2 text-xs font-bold text-[#b8f3cd]">
                    {requirements.length}
                  </span>
                </div>

                <div className="relative space-y-3">
                  {requirements.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 rounded-xl border border-white/[0.09] bg-white/[0.07] px-3.5 py-3 transition-colors duration-200 hover:bg-white/[0.12]"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#10C35D]/20 text-xs font-bold text-[#a7f0c1]">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      <p className="text-sm leading-6 text-green-50/90">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default ProgramInfo;
