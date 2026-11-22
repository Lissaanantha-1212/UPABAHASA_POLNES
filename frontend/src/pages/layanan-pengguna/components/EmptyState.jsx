import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon size={26} className="text-gray-400" />
        </div>
      )}

      <h3 className="font-semibold text-gray-700">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-500 mt-1 max-w-md">
          {description}
        </p>
      )}
    </div>
  );
}