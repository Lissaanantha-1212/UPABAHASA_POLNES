
import React from 'react';

export default function FormInput({
  label,
  required = false,
  className = '',
  ...props
}) {
  return (
    <div className="w-full min-w-0">
      <label className="block text-xs font-semibold text-gray-600 mb-2">
        {label}

        {required && (
          <span className="text-red-500 ml-1">*</span>
        )}
      </label>

      <input
        {...props}
        required={required}
        className={`
          w-full min-w-0
          px-4 py-3
          rounded-xl
          border border-gray-200
          bg-white
          text-sm text-gray-700
          placeholder:text-gray-400
          outline-none
          focus:border-[#10C35D]
          focus:ring-2 focus:ring-[#10C35D]/20
          transition-all
          ${className}
        `}
      />
    </div>
  );
}
