import React from 'react';

function FormField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
  children,
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-semibold text-gray-700"
      >
        {label}
      </label>

      {children || (
        <input
          id={name}
          required
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10"
        />
      )}
    </div>
  );
}

export default FormField;