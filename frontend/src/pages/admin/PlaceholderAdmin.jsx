import React from 'react';
import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';

export default function PlaceholderAdmin() {
  const location = useLocation();
  
  // Ambil nama menu dari URL untuk ditampilkan di judul
  const pathName = location.pathname.split('/').pop();
  const title = pathName.charAt(0).toUpperCase() + pathName.slice(1).replace('-', ' ');

  return (
    <AdminLayout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-20 h-20 bg-[#F2FAF4] rounded-full flex items-center justify-center mb-6">
          <Construction className="text-[#10C35D]" size={40} />
        </div>
        <h1 className="text-2xl font-bold text-[#0a3d2e] mb-3">
          Halaman {title}
        </h1>
        <p className="text-gray-600 max-w-md mb-8 leading-relaxed">
          Fitur <strong>{title}</strong> sedang dalam tahap pengembangan frontend. 
          Halaman ini akan segera diisi dengan tabel, form, dan fitur manajemen sesuai alur sistem.
        </p>
        <div className="flex gap-3">
          <a 
            href="/admin/dashboard" 
            className="bg-[#10C35D] hover:bg-[#0DAA50] text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
          >
            Kembali ke Dashboard
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}