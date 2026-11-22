import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ensureAdminSession } from './adminSession';

export default function ProtectedAdminRoute() {
  const [status, setStatus] = useState('checking');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;

    const handleSessionExpired = () => {
      if (active) {
        setStatus('unauthenticated');
      }
    };

    window.addEventListener(
      'admin-session-expired',
      handleSessionExpired
    );

    const checkSession = async () => {
      setStatus('checking');

      try {
        const valid = await ensureAdminSession();

        if (active) {
          setStatus(valid ? 'authenticated' : 'unauthenticated');
        }
      } catch (error) {
        console.error('Pemeriksaan sesi gagal:', error);

        if (active) {
          setStatus('error');
        }
      }
    };

    checkSession();

    return () => {
      active = false;

      window.removeEventListener(
        'admin-session-expired',
        handleSessionExpired
      );
    };
  }, [retryKey]);

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF8] gap-3">
        <Loader2 size={32} className="animate-spin text-[#10C35D]" />
        <p className="text-sm text-gray-500">Memeriksa sesi admin...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7FAF8] px-4 text-center">
        <p className="text-[#0a3d2e] font-semibold mb-2">
          Tidak dapat memeriksa sesi
        </p>
        <p className="text-sm text-gray-500 mb-5">
          Periksa koneksi dan pastikan server backend berjalan.
        </p>
        <button
          onClick={() => setRetryKey((prev) => prev + 1)}
          className="px-5 py-2.5 rounded-lg bg-[#10C35D] text-white text-sm font-semibold"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
