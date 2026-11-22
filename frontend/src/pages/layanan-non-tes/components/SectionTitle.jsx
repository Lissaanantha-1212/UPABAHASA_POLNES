
import React from 'react';

function SectionTitle({
  icon: Icon,
  eyebrow,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-3.5 sm:gap-4">
      {/* Icon */}
      {Icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#dcefe2] bg-gradient-to-br from-[#edf9f1] to-[#e3f6e9] text-[#10C35D]">
          <Icon size={20} strokeWidth={2} />
        </div>
      )}

      {/* Heading */}
      <div className="min-w-0 flex-1 pt-0.5">
        {eyebrow && (
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#10C35D]">
            {eyebrow}
          </p>
        )}

        <h2 className="text-lg font-bold leading-snug tracking-tight text-[#0a3d2e] sm:text-xl">
          {title}
        </h2>

        {description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-gray-500">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

export default SectionTitle;
