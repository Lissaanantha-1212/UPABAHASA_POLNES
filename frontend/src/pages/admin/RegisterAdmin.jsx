import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

import logoPolnes from '../../assets/logo-polnes.png';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/admin';

export default function RegisterAdmin() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code'
        ? value.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 24)
        : value,
    }));

    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const code = formData.code.trim().toUpperCase();

    if (!email || !password || !formData.confirmPassword || !code) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    if (password.length < 12 || password.length > 128) {
      setError('Password harus terdiri dari 12–128 karakter.');
      return;
    }

    if (password !== formData.confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    if (!/^[A-F0-9]{24}$/.test(code)) {
      setError('Kode registrasi harus terdiri dari 24 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          code,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.success === false) {
        throw new Error(
          result.message || 'Registrasi gagal. Periksa kembali data kamu.'
        );
      }

      setSuccess(
        result.message || 'Registrasi berhasil. Silakan login.'
      );

      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        code: '',
      });
    } catch (err) {
      console.error('Register Admin Error:', err);
      setError(
        err.message || 'Tidak dapat terhubung ke server.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F8F5] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl shadow-green-950/5 p-7 sm:p-9">

        {/* Kembali */}
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#10C35D] transition mb-7"
        >
          <ArrowLeft size={14} />
          Kembali ke Login
        </Link>

        {/* Identitas */}
        <div className="flex items-center justify-center gap-3 mb-7">
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
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck size={21} className="text-[#10C35D]" />
            <h2 className="text-2xl font-bold text-[#0a3d2e]">
              Registrasi Admin/Staf
            </h2>
          </div>

          <p className="text-gray-500 text-sm mt-1">
            Buat akun pengelola UPA Bahasa menggunakan kode registrasi.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {success && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3"
          >
            <p className="text-sm text-green-700">{success}</p>
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="mt-3 text-sm font-semibold text-[#0a3d2e] hover:text-[#10C35D]"
            >
              Lanjut ke Login
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Email */}
          <div>
            <label
              htmlFor="register-email"
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
                id="register-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="Masukkan email"
                maxLength={254}
                disabled={isLoading}
                required
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="register-password"
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
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Minimal 12 karakter"
                minLength={12}
                maxLength={128}
                disabled={isLoading}
                required
                className="w-full h-12 pl-11 pr-12 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#10C35D]"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-1">
              Gunakan 12–128 karakter.
            </p>
          </div>

          {/* Konfirmasi Password */}
          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Konfirmasi Password
            </label>

            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                placeholder="Ulangi password"
                disabled={isLoading}
                required
                className="w-full h-12 pl-11 pr-12 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                disabled={isLoading}
                aria-label={showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#10C35D]"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Kode Registrasi */}
          <div>
            <label
              htmlFor="register-code"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Kode Registrasi
            </label>

            <input
              id="register-code"
              name="code"
              type="text"
              value={formData.code}
              onChange={handleChange}
              autoComplete="off"
              placeholder="Masukkan kode registrasi"
              maxLength={24}
              disabled={isLoading}
              required
              className="w-full h-12 px-4 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm font-mono tracking-wider text-gray-700 uppercase outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
            />

            <p className="text-xs text-gray-400 mt-1">
              Minta kode kepada pengelola UPA Bahasa.
            </p>
          </div>

          {/* Tombol */}
          <button
            type="submit"
            disabled={isLoading || !!success}
            className="w-full h-12 rounded-lg bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-semibold shadow-md shadow-green-600/15 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Memproses Registrasi...
              </>
            ) : (
              'Daftar Akun'
            )}
          </button>
        </form>

        <div className="mt-7 text-center">
          <p className="text-xs text-gray-500">
            Sudah memiliki akun?{' '}
            <Link
              to="/admin/login"
              className="font-semibold text-[#10C35D] hover:text-[#0a3d2e] transition"
            >
              Login di sini
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}