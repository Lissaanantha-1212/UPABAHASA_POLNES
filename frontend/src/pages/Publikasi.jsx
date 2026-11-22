import React from 'react';
import { Construction, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Publikasi() {
  return (
    <main className="bg-[#F7FAF8] min-h-screen flex items-center justify-center p-5">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 bg-[#F2FAF4] rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="text-[#10C35D]" size={48} />
        </div>
        <h1 className="text-3xl font-bold text-[#0a3d2e] mb-3">Halaman Under Maintenance</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Halaman Publikasi saat ini sedang dalam tahap pengembangan. 
          Kami sedang menyiapkan akses jurnal dan publikasi ilmiah UPA Bahasa POLNES untuk Anda.
        </p>
        <Link to="/" className="inline-flex items-center gap-2 bg-[#10C35D] hover:bg-[#0DAA50] text-white font-bold py-3 px-6 rounded-xl transition-all">
          <ArrowLeft size={18} /> Kembali ke Beranda
        </Link>
      </div>
    </main>
  );
}