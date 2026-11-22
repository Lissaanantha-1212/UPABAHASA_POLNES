import React from 'react';

export default function SectionHeading({
  icon: Icon,
  title,
  description
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-[#0a3d2e] flex items-center gap-2">
        {Icon && <Icon size={22} />}
        {title}
      </h2>

      {description && (
        <p className="text-sm text-gray-500 mt-1">
          {description}
        </p>
      )}
    </div>
  );
}