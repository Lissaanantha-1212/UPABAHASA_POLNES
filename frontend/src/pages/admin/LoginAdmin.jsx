import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
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

      clearAdminSession();

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
    <main className="min-h-screen bg-[#0D6E34] flex items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="w-full max-w-5xl bg-white rounded-[28px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* KOLOM KIRI: BRANDING & INFORMASI SISTEM */}
        <div className="lg:col-span-7 bg-[#F8FCF9] p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Dekorasi Lengkung Halus */}
          <div className="hidden sm:block absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#E8F8EF]/70 pointer-events-none" />

          {/* Header Logo */}
          <div className="relative z-10 flex items-center gap-3.5">
            <img
              src={logoPolnes}
              alt="Logo POLNES"
              className="w-11 h-11 object-contain"
            />
            <div>
              <h1 className="text-[#0a3d2e] font-extrabold text-base tracking-wide leading-none">
                UPA BAHASA
              </h1>
              <p className="text-[#10C35D] text-[11px] font-semibold tracking-wider mt-1">
                POLITEKNIK NEGERI SAMARINDA
              </p>
            </div>
          </div>

          {/* Konten Tengah */}
          <div className="relative z-10 my-10 lg:my-14 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2F6EB] text-[#0E7A3F] text-[11px] font-bold uppercase tracking-wider">
              <ShieldCheck size={15} />
              <span>PORTAL MANAJEMEN PENGGUNA &amp; ADMIN</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Sistem Pengelolaan Tes &amp; Rekapan Akademik
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              Silakan masuk menggunakan akun administrator terdaftar untuk mengelola penjadwalan ujian, penilaian otomatis, konten layanan, dan penerbitan sertifikat resmi.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                <Lock size={13} className="text-[#10C35D]" />
                Supabase Auth Encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                <ShieldCheck size={13} className="text-[#10C35D]" />
                Admin Verified
              </span>
            </div>
          </div>

          {/* Footer Kolom Kiri */}
          <div className="relative z-10 pt-4 border-t border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-medium">
              © 2026 Politeknik Negeri Samarinda • UPA Bahasa
            </span>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-bold text-[#0E7A3F] hover:text-[#10C35D] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda Utama</span>
            </Link>
          </div>
        </div>

        {/* KOLOM KANAN: FORM LOGIN ADMIN (HIJAU TUA) */}
        <div className="lg:col-span-5 bg-[#0F7A3A] text-white p-8 sm:p-11 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Login Admin
              </h2>
              <p className="text-emerald-100/80 text-xs sm:text-sm mt-1.5">
                Masuk ke akun pengelola resmi UPA Bahasa.
              </p>
            </div>

            <div className="border-t border-white/15" />

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-300/40 bg-red-950/50 p-3.5 text-red-100"
              >
                <AlertCircle
                  size={17}
                  className="text-red-300 shrink-0 mt-0.5"
                />
                <p className="text-xs leading-relaxed">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Input Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[11px] font-bold uppercase tracking-wider text-emerald-100 mb-2"
                >
                  EMAIL ADMIN
                </label>

                <div className="relative">
                  <Mail
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-200/70"
                  />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="username"
                    placeholder="Masukkan email admin"
                    disabled={isLoading}
                    required
                    className="w-full h-12 pl-11 pr-4 rounded-xl border border-white/15 bg-[#0A5C2B] text-sm text-white placeholder:text-emerald-200/50 outline-none transition focus:border-white focus:ring-2 focus:ring-white/20 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Input Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-[11px] font-bold uppercase tracking-wider text-emerald-100"
                  >
                    PASSWORD
                  </label>

                  <Link
                    to="/lupa-password"
                    className="text-xs font-semibold text-emerald-200 hover:text-white transition"
                  >
                    Lupa Password?
                  </Link>
                </div>

                <div className="relative">
                  <Lock
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-200/70"
                  />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                    placeholder="Masukkan password Anda"
                    disabled={isLoading}
                    required
                    className="w-full h-12 pl-11 pr-12 rounded-xl border border-white/15 bg-[#0A5C2B] text-sm text-white placeholder:text-emerald-200/50 outline-none transition focus:border-white focus:ring-2 focus:ring-white/20 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                    aria-label={
                      showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-200/70 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Tombol Masuk */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 mt-2 rounded-xl bg-white hover:bg-emerald-50 text-[#0F7A3A] text-sm font-extrabold shadow-lg transition disabled:bg-gray-300 disabled:text-gray-600 flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Login to System</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer Kolom Kanan */}
          <div className="pt-8 mt-8 border-t border-white/15 flex items-center justify-between text-[11px] text-emerald-100/75">
            <span>Akses Khusus Pengelola</span>
            <span>upabahasa@polnes.ac.id</span>
          </div>
        </div>

      </div>
    </main>
  );
}