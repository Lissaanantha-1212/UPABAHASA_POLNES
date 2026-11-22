
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';

import logoPolnes from '../../assets/logo-polnes.png';
import { clearAdminSession } from '../../adminSession';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/admin';

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/login-supabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      const session = result.data;

      if (!response.ok) {
        setError(result.message || 'Email atau password salah.');
        return;
      }

      const { token, refreshToken, expiresAt, user } = session || {};

      if (!token || !refreshToken || !user) {
        setError('Data sesi login tidak lengkap. Silakan coba kembali.');
        return;
      }

      // Bersihkan sesi lama dan batalkan proses refresh sebelumnya.
      clearAdminSession();

      // Simpan sesi Supabase.
      localStorage.setItem('adminToken', token);
      localStorage.setItem('adminRefreshToken', refreshToken);
      localStorage.setItem(
        'adminTokenExpiresAt',
        expiresAt ? String(expiresAt) : ''
      );
      localStorage.setItem('adminUser', JSON.stringify(user));

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Login Error:', err);
      setError(
        'Tidak dapat terhubung ke server. Pastikan backend berjalan.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F8F5] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl shadow-green-950/5 p-7 sm:p-9">

        {/* Identitas */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 p-1.5 shrink-0">
            <img
              src={logoPolnes}
              alt="Logo POLNES"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <h1 className="text-[#0a3d2e] font-bold text-base tracking-wide">
              UPA BAHASA
            </h1>
            <p className="text-gray-500 text-[10px] tracking-wide">
              POLITEKNIK NEGERI SAMARINDA
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 mb-7" />

        {/* Judul */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-[#0a3d2e]">
            Login Admin
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Masuk ke akun pengelola UPA Bahasa.
          </p>
        </div>

        {/* Pesan Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle
              size={17}
              className="text-red-500 shrink-0 mt-0.5"
            />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="username"
                placeholder="Masukkan email"
                disabled={isLoading}
                required
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Masukkan password"
                disabled={isLoading}
                required
                className="w-full h-12 pl-11 pr-12 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={
                  showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                }
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#10C35D]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

                    <div className="flex justify-end -mt-2">
            <Link
              to="/lupa-password"
              className="text-xs font-medium text-[#10C35D] hover:text-[#0a3d2e] transition"
            >
              Lupa Password?
            </Link>
          </div>
<button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-lg bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-semibold shadow-md shadow-green-600/15 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memproses...
              </>
            ) : (
          
              'Masuk'
            )}
          </button>

        </form>

      </div>
    </main>
  );
}



