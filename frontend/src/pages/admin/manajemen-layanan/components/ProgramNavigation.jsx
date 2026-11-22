import React from 'react';

const ProgramNavigation = ({
  PROGRAMS,
  programs,
  selectedSlug,
  handleSelectProgram,
}) => (
  <>
    {/* PILIH PROGRAM */}
            <div className="bg-white border border-gray-200 rounded-xl p-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PROGRAMS.map((program) => {
                  const exists = programs.some(
                    (item) => item.slug === program.slug
                  );

                  if (!exists) return null;

                  const Icon = program.icon;
                  const active = selectedSlug === program.slug;

                  return (
                    <button
                      key={program.slug}
                      type="button"
                      onClick={() => handleSelectProgram(program.slug)}
                      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold border transition ${
                        active
                          ? 'bg-[#10C35D] border-[#10C35D] text-white shadow-sm'
                          : 'bg-white border-transparent text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
                      }`}
                    >
                      <Icon size={19} />
                      {program.label}
                    </button>
                  );
                })}
              </div>
            </div>
  </>
);

export default ProgramNavigation;
