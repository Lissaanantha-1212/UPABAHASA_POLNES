import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

export default function SearchableSelect({ label, required = false, value, onChange, options, placeholder = 'Cari program studi...' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  // Tutup dropdown jika klik di luar komponen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm(''); // Reset search saat ditutup
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter opsi berdasarkan pencarian
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {/* Input Field */}
      <div 
        className={`w-full px-4 py-3 rounded-xl border bg-white text-sm text-gray-700 outline-none transition-all flex items-center justify-between cursor-text ${
          isOpen ? 'border-[#10C35D] ring-2 ring-[#10C35D]/10' : 'border-gray-200'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <input
          type="text"
          value={isOpen ? searchTerm : (value || '')}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            onChange(''); // Reset value saat mengetik
          }}
          placeholder={value && !isOpen ? value : placeholder}
          className="w-full bg-transparent outline-none"
        />
        <div className="flex items-center gap-1 ml-2 text-gray-400">
          {value && !isOpen && <X size={16} onClick={(e) => { e.stopPropagation(); onChange(''); }} className="hover:text-red-500 cursor-pointer" />}
          <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={index}
                className={`px-4 py-3 text-sm cursor-pointer hover:bg-green-50 hover:text-[#0a3d2e] transition-colors ${
                  value === option ? 'bg-green-50 text-[#10C35D] font-semibold' : 'text-gray-700'
                }`}
                onClick={() => handleSelect(option)}
              >
                {option}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-gray-400 text-center flex items-center justify-center gap-2">
              <Search size={14} /> Program studi tidak ditemukan
            </div>
          )}
        </div>
      )}
    </div>
  );
}