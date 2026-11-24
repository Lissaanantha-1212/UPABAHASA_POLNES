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
  UserPlus,
  X,
  CheckCircle2,
} from 'lucide-react';

import logoPolnes from '../../assets/logo-polnes.png';
import { clearAdminSession } from '../../adminSession';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/admin';
const SUPABASE_URL = 'https://aquqdodntgzjdfcvxgbs.supabase.co';
const SUPABASE_KEY = 'sb_publishable_aaAmOWSAFRFfnXfPFqftQw_v948Hbr0';

// Helper hash SHA-256 (kompatibel dengan badge SHA-256 Encrypted di UI)
async function sha256Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function LoginAdmin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // State Modal Register Staf (tabel user_app)
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [regData, setRegData] = useState({
    nama: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [regError, setRegError] = useState('');
  const [isRegLoading, setIsRegLoading] = useState(false);

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
    setSuccessMsg('');
  };

  const handleRegChange = (e) => {
    setRegData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setRegError('');
  };

  // Cek kecocokan akun ke tabel user_app Supabase sebagai jalur login staf terdaftar
  const loginViaUserAppTable = async (identifier, plainPassword) => {
    const encodedId = encodeURIComponent(identifier);
    const queryUrl = `${SUPABASE_URL}/rest/v1/user_app?select=*&or=(email.ilike.${encodedId},username.ilike.${encodedId})&limit=1`;

    const res = await fetch(queryUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const found = rows[0];
    const hashedInput = await sha256Hex(plainPassword);
    const storedPass = String(found.password || '');

    if (storedPass !== plainPassword && storedPass !== hashedInput) {
      return { invalidPassword: true };
    }

    // Update last_login di tabel user_app (best-effort)
    fetch(`${SUPABASE_URL}/rest/v1/user_app?id=eq.${found.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ last_login: new Date().toISOString() }),
    }).catch(() => {});

    return {
      user: {
        id: found.id,
        fullName: found.nama || found.username || 'Staf UPA',
        username: found.username || '',
        email: found.email || identifier,
        role: (found.role || 'STAFF').toLowerCase(),
        staffNumber: found.id,
      },
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const identifier = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!identifier || !password) {
      setError('Email/Username dan password wajib diisi.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Jalur Utama: Login API Piya (jika input berbentuk email)
      let apiLoginSuccess = false;

      if (identifier.includes('@')) {
        try {
          const response = await fetch(`${API_URL}/login-supabase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email: identifier, password }),
          });

          const result = await response.json();
          const session = result.data;

          if (
            response.ok &&
            session?.token &&
            session?.refreshToken &&
            session?.user
          ) {
            clearAdminSession();
            localStorage.setItem('adminToken', session.token);
            localStorage.setItem('adminRefreshToken', session.refreshToken);
            localStorage.setItem(
              'adminTokenExpiresAt',
              session.expiresAt ? String(session.expiresAt) : ''
            );
            localStorage.setItem('adminUser', JSON.stringify(session.user));

            apiLoginSuccess = true;
            navigate('/admin/dashboard', { replace: true });
            return;
          }
        } catch (apiErr) {
          console.warn('Mengecek cadangan ke tabel user_app:', apiErr);
        }
      }

      // 2. Jalur Kedua: Cek ke tabel user_app Supabase (hasil Register)
      if (!apiLoginSuccess) {
        const staffCheck = await loginViaUserAppTable(identifier, password);

        if (staffCheck?.invalidPassword) {
          setError('Password yang Anda masukkan salah.');
          return;
        }

        if (staffCheck?.user) {
          clearAdminSession();
          const pseudoToken = btoa(
            unescape(
              encodeURIComponent(
                JSON.stringify({
                  sub: staffCheck.user.id,
                  email: staffCheck.user.email,
                  exp: Math.floor(Date.now() / 1000) + 86400,
                })
              )
            )
          );
          localStorage.setItem('adminToken', `staff.${pseudoToken}.local`);
          localStorage.setItem('adminRefreshToken', `refresh.${staffCheck.user.id}`);
          localStorage.setItem(
            'adminTokenExpiresAt',
            String(Math.floor(Date.now() / 1000) + 86400)
          );
          localStorage.setItem('adminUser', JSON.stringify(staffCheck.user));

          navigate('/admin/dashboard', { replace: true });
          return;
        }

        setError('Email/username atau password salah, atau akun belum terdaftar.');
      }
    } catch (err) {
      console.error('Login Error:', err);
      setError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  // Simpan akun staf baru ke tabel user_app Supabase
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegError('');

    const nama = regData.nama.trim();
    const username = regData.username.trim().toLowerCase().replace(/\s+/g, '');
    const email = regData.email.trim().toLowerCase();
    const password = regData.password;
    const confirmPassword = regData.confirmPassword;

    if (!nama || !username || !email || !password) {
      setRegError('Semua kolom wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setRegError('Password minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setRegError('Konfirmasi password tidak cocok.');
      return;
    }

    setIsRegLoading(true);

    try {
      // Cek apakah email atau username sudah dipakai
      const checkRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_app?select=id&or=(email.ilike.${encodeURIComponent(
          email
        )},username.ilike.${encodeURIComponent(username)})&limit=1`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
        }
      );

      if (checkRes.ok) {
        const existing = await checkRes.json();
        if (Array.isArray(existing) && existing.length > 0) {
          setRegError('Email atau username tersebut sudah terdaftar.');
          return;
        }
      }

      const hashedPassword = await sha256Hex(password);

      const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/user_app`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          nama,
          username,
          email,
          password: hashedPassword,
          role: 'STAFF',
          google_linked: false,
        }),
      });

      if (!insertRes.ok) {
        const errBody = await insertRes.text();
        console.error('Insert user_app gagal:', errBody);
        setRegError('Gagal menyimpan akun ke database. Pastikan RLS tabel user_app mengizinkan insert.');
        return;
      }

      setIsRegisterOpen(false);
      setFormData({ email, password: '' });
      setRegData({
        nama: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
      setSuccessMsg('Pendaftaran berhasil! Silakan login menggunakan akun yang baru dibuat.');
    } catch (err) {
      console.error('Register Error:', err);
      setRegError('Terjadi kesalahan koneksi saat mendaftar.');
    } finally {
      setIsRegLoading(false);
    }
  };

  return (
    <main
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      className="min-h-screen bg-[#0D743B] flex items-center justify-center p-4 sm:p-6 md:p-8"
    >
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
        
        {/* ==================== KOLOM KIRI ==================== */}
        <div className="bg-white p-8 sm:p-12 lg:px-14 lg:py-11 flex flex-col justify-between relative overflow-hidden">
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
              Silakan masuk menggunakan akun pengguna atau administrator terdaftar untuk mengelola penjadwalan ujian, penilaian otomatis, konten layanan, dan penerbitan sertifikat resmi.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 text-slate-600 text-[11.5px] font-bold">
                <Lock size={13} className="text-[#10C35D]" />
                SHA-256 Encrypted
              </span>
              <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100/90 text-slate-600 text-[11.5px] font-bold">
                <ShieldCheck size={13} className="text-[#10C35D]" />
                Supabase Verified
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

        {/* ==================== KOLOM KANAN ==================== */}
        <div className="bg-[#0F7A3E] text-white p-8 sm:p-12 lg:px-14 lg:py-11 flex flex-col justify-between">
          <div className="space-y-6 my-auto">
            <div>
              <h2 className="text-[28px] sm:text-[32px] font-extrabold tracking-tight leading-tight">
                Login User
              </h2>
              <p className="text-emerald-100/85 text-[13px] mt-1.5">
                Masuk dengan akun staf atau administrator terdaftar.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-white/15" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-100/75">
                AKUN SISTEM
              </span>
              <div className="flex-1 h-px bg-white/15" />
            </div>

            {successMsg && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-xl border border-emerald-300/40 bg-emerald-950/50 p-3.5 text-emerald-100"
              >
                <CheckCircle2
                  size={17}
                  className="text-emerald-300 shrink-0 mt-0.5"
                />
                <p className="text-xs leading-relaxed">{successMsg}</p>
              </div>
            )}

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
              {/* Input Username atau Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[10.5px] font-extrabold uppercase tracking-wider text-emerald-100 mb-2"
                >
                  USERNAME ATAU EMAIL
                </label>

                <input
                  id="email"
                  name="email"
                  type="text"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  placeholder="Masukkan username atau email"
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

            {/* Tautan Register Now */}
            <div className="text-center pt-1">
              <p className="text-xs text-emerald-100/85">
                Belum memiliki akun staf?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setRegError('');
                    setIsRegisterOpen(true);
                  }}
                  className="font-extrabold text-white underline underline-offset-4 hover:text-emerald-200 transition"
                >
                  Register Now
                </button>
              </p>
            </div>
          </div>

          {/* Footer Kolom Kanan */}
          <div className="pt-6 mt-6 flex items-center justify-between text-[11px] text-emerald-100/75">
            <span>Terms &amp; Security</span>
            <span>support@upabahasa.polnes.ac.id</span>
          </div>
        </div>

      </div>

      {/* ==================== MODAL REGISTER STAF (TABEL user_app) ==================== */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-[#0F7A3E] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">
                    Registrasi Akun Staf
                  </h3>
                  <p className="text-[11px] text-emerald-100/85">
                    Daftarkan akun baru ke sistem UPA Bahasa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/15 flex items-center justify-center text-white/80 hover:text-white transition"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {regError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                  <p className="text-xs">{regError}</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  name="nama"
                  value={regData.nama}
                  onChange={handleRegChange}
                  required
                  placeholder="Contoh: Lissa Anantha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#10C35D] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={regData.username}
                    onChange={handleRegChange}
                    required
                    placeholder="Contoh: lissa.upa"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#10C35D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={regData.email}
                    onChange={handleRegChange}
                    required
                    placeholder="nama@polnes.ac.id"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#10C35D] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={regData.password}
                    onChange={handleRegChange}
                    required
                    placeholder="Min. 6 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#10C35D] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-600 mb-1.5">
                    Konfirmasi Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={regData.confirmPassword}
                    onChange={handleRegChange}
                    required
                    placeholder="Ulangi password"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:border-[#10C35D] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isRegLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#10C35D] hover:bg-[#0DAA50] text-white text-xs font-extrabold shadow-sm transition flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isRegLoading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Mendaftarkan...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={15} />
                      <span>Daftar Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}