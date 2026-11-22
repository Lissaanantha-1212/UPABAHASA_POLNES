import React, { useEffect, useRef, useState } from 'react';
import { Search, Check } from 'lucide-react';

const ProdiCombobox = ({
  value,
  options,
  onChange,
  required = false,
}) => {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(
    (option) => String(option.value) === String(value)
  );

  const filteredOptions = options.filter((option) =>
    String(option.label || '')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.setCustomValidity(
        required && !selectedOption
          ? 'Silakan pilih Program Studi dari daftar yang tersedia.'
          : ''
      );
    }
  }, [required, selectedOption]);

  useEffect(() => {
    if (selectedOption) {
      setSearch(selectedOption.label);
    }
  }, [value, options]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setSearch(selectedOption?.label || '');
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [selectedOption]);

  const chooseOption = (option) => {
    onChange(option.value);
    setSearch(option.label);
    setIsOpen(false);
    setActiveIndex(-1);

    if (inputRef.current) {
      inputRef.current.setCustomValidity('');
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setIsOpen(true);
    setActiveIndex(-1);

    if (value) {
      onChange('');
    }

    if (required) {
      event.target.setCustomValidity(
        'Silakan pilih Program Studi dari daftar yang tersedia.'
      );
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);

      setActiveIndex((current) =>
        filteredOptions.length === 0
          ? -1
          : Math.min(current + 1, filteredOptions.length - 1)
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();

      setActiveIndex((current) =>
        filteredOptions.length === 0
          ? -1
          : Math.max(current - 1, 0)
      );
    } else if (
      event.key === 'Enter' &&
      isOpen &&
      filteredOptions.length > 0
    ) {
      event.preventDefault();

      chooseOption(
        filteredOptions[activeIndex >= 0 ? activeIndex : 0]
      );
    } else if (event.key === 'Escape') {
      setIsOpen(false);
      setSearch(selectedOption?.label || '');
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative min-w-0" ref={wrapperRef}>
      <label
        htmlFor="program-studi"
        className="mb-1.5 block text-xs font-semibold text-gray-600"
      >
        Program Studi
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <div className="relative">
        <input
          ref={inputRef}
          id="program-studi"
          type="text"
          value={search}
          required={required}
          autoComplete="off"
          placeholder="Ketik untuk mencari program studi..."
          onFocus={() => setIsOpen(true)}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-10 text-sm outline-none transition-all focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/20"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls="program-studi-options"
          aria-required={required}
          role="combobox"
        />

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600"
          aria-label="Tampilkan pilihan program studi"
          aria-expanded={isOpen}
        >
          <Search size={16} />
        </button>
      </div>

      {isOpen && (
        <div
          id="program-studi-options"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl"
        >
          <div className="max-h-56 overflow-y-auto p-1.5">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option, index) => (
                <button
                  key={option.id ?? option.value}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => chooseOption(option)}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    String(value) === String(option.value)
                      ? 'bg-green-50 font-semibold text-[#0a3d2e]'
                      : index === activeIndex
                        ? 'bg-gray-100 text-gray-800'
                        : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>

                  {String(value) === String(option.value) && (
                    <Check
                      size={15}
                      className="shrink-0 text-[#10C35D]"
                    />
                  )}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-xs text-gray-500">
                {options.length === 0
                  ? 'Data program studi belum tersedia.'
                  : 'Program studi tidak ditemukan.'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProdiCombobox;
