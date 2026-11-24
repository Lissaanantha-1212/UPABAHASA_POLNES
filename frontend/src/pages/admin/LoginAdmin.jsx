import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
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

  // Muat font Plus Jakarta Sans agar tipografi 100% sama persis dengan desain acuan
  useEffect(() => {
    const fontId = 'plus-jakarta-sans-font';
    if (!document.getElementById(fontId)) {
      const link = document.createElement('link');
      link.id = fontId;
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap';
      document.head.appendChild(link);
    }
  }, []);

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
    <main
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#0D743B] flex items-center justify-center p-4 sm:p-6 md:p-8"
    >
      {/* Style khusus agar autofill browser tetap hijau gelap seperti desain acuan */}
      <style>{`
        input.upa-dark-input:-webkit-autofill,
        input.upa-dark-input:-webkit-autofill:hover,
        input.upa-dark-input:-webkit-autofill:focus,
        input.upa-dark-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px #0B6131 inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Kartu Utama 50% : 50% */}
      <div className="w-full max-w-[1160px] min-h-[630px] bg-white rounded-[32px] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        
        {/* ==================== KOLOM KIRI (PUTIH + LENGKUNG MINT) ==================== */}
        <div className="bg-white p-8 sm:p-12 lg:px-14 lg:py-11 flex flex-col justify-between relative overflow-hidden">
          {/* Lengkung Dekorasi Persis Seperti Desain Acuan */}
          <div className="hidden sm:block absolute top-0 right-0 bottom-0 w-[68%] bg-[#F2FBF6] rounded-tl-[220px] pointer-events-none" />

          {/* Header Logo */}
          <div className="relative z-10 flex items-center gap-3.5">
            <img
              src={logoPolnes}
              alt="Logo POLNES"
              className="w-11 h-11 object-contain"
            />
            <div>
              <h1 className="text-[#0F172A] font-extrabold text-[15px] tracking-wide leading-tight">
                UPA BAHASA
              </h1>
              <p className="text-[#10C35D] text-[10.5px] font-bold tracking-wider uppercase mt-0.5">
                POLITEKNIK NEGERI SAMARINDA
              </p>
            </div>
          </div>

          {/* Konten Tengah */}
          <div className="relative z-10 my-10 lg:my-0 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DCF7E7] text-[#10A352] text-[10.5px] font-extrabold uppercase tracking-wider">
              <ShieldCheck size={14} />
              <span>PORTAL MANAJEMEN PENGGUNA &amp; ADMIN</span>
            </div>

            <h2 className="text-[32px] sm:text-[38px] font-extrabold text-[#111827] leading-[1.18] tracking-tight">
              Sistem Pengelolaan Tes &amp; Rekapan Akademik
            </h2>

            <p className="text-[13.5px] text-slate-500 leading-relaxed max-w-[430px]">
              Silakan masuk menggunakan akun administrator terdaftar untuk mengelola penjadwalan ujian, penilaian otomatis, konten layanan, dan penerbitan sertifikat resmi.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 text-slate-600 text-[11.5px] font-bold">
                <Lock size={13} className="text-[#10C35D]" />
                Supabase Auth Encrypted
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 text-slate-600 text-[11.5px] font-bold">
                <ShieldCheck size={13} className="text-[#10C35D]" />
                Admin Verified
              </span>
            </div>
          </div>

          {/* Footer Kolom Kiri */}
          <div className="relative z-10 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11.5px]">
            <span className="text-slate-400 font-medium">
              © 2026 Politeknik Negeri Samarinda • UPA Bahasa
            </span>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 font-extrabold text-[#10A352] hover:text-[#0D743B] transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Kembali ke Beranda Utama</span>
            </Link>
          </div>
        </div>

        {/* ==================== KOLOM KANAN (HIJAU TUA) ==================== */}
        <div className="bg-[#0F7A3E] text-white p-8 sm:p-12 lg:px-14 lg:py-11 flex flex-col justify-between">
          <div className="space-y-6 my-auto">
            <div>
              <h2 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-tight">
                Login Admin
              </h2>
              <p className="text-emerald-100/85 text-[13px] mt-1.5">
                Masuk dengan akun pengelola UPA Bahasa terdaftar.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100/75">
                AKUN ADMINISTRATOR SISTEM
              </span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

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
                  className="block text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-100 mb-2"
                >
                  EMAIL ADMIN
                </label>

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
                  className="upa-dark-input w-full h-[50px] px-4 rounded-xl border border-white/10 bg-[#0B6131] text-[13.5px] text-white placeholder:text-emerald-100/45 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/15 disabled:opacity-60"
                />
              </div>

              {/* Input Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="password"
                    className="block text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-100"
                  >
                    PASSWORD
                  </label>

                  <Link
                    to="/lupa-password"
                    className="text-[11.5px] font-bold text-emerald-100/90 hover:text-white transition"
                  >
                    Lupa Password?
                  </Link>
                </div>

                <div className="relative">
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
                    className="upa-dark-input w-full h-[50px] pl-4 pr-12 rounded-xl border border-white/10 bg-[#0B6131] text-[13.5px] text-white placeholder:text-emerald-100/45 outline-none transition focus:border-white/50 focus:ring-2 focus:ring-white/15 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={isLoading}
                    aria-label={
                      showPassword ? 'Sembunyikan password' : 'Tampilkan password'
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-100/70 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Tombol Masuk */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] mt-3 rounded-xl bg-white hover:bg-emerald-50 text-[#0F7A3E] text-[14px] font-extrabold shadow-lg transition disabled:bg-gray-300 disabled:text-gray-600 flex items-center justify-center gap-2"
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
          <div className="pt-6 mt-6 flex items-center justify-between text-[11px] text-emerald-100/75">
            <span>Akses Khusus Pengelola</span>
            <span>upabahasa@polnes.ac.id</span>
          </div>
        </div>

      </div>
    </main>
  );
}