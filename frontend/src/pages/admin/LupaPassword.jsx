
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import logoPolnes from '../../assets/logo-polnes.png';
import { supabase } from '../../supabaseClient';

export default function LupaPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Mengurangi hitung mundur cooldown setiap detik.
  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = setTimeout(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading || cooldown > 0) return;

    setError('');
    setSuccess('');

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Email wajib diisi.');
      return;
    }

    // Mencegah permintaan berulang dalam waktu berdekatan.
    setCooldown(8);
    setIsLoading(true);

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(normalizedEmail, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

      if (resetError) {
        throw resetError;
      }

      setSuccess(
        'Jika email tersebut terdaftar, tautan pemulihan password akan dikirim. Silakan periksa kotak masuk atau folder spam.'
      );
    } catch (err) {
      console.error('Reset Password Request Error:', err);

      const isRateLimit =
        err.status === 429 ||
        err.code === 'over_email_send_rate_limit' ||
        /rate limit|after 8 seconds/i.test(err.message || '');

      if (isRateLimit) {
        setError(
          'Permintaan terlalu sering. Silakan tunggu beberapa saat sebelum mencoba kembali.'
        );
      } else {
        setError(
          'Permintaan pemulihan password belum berhasil. Silakan coba kembali.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F4F8F5] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl shadow-green-950/5 p-7 sm:p-9">

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

        <div className="mb-7">
          <h2 className="text-2xl font-bold text-[#0a3d2e]">
            Lupa Password?
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Masukkan email akun admin untuk menerima tautan pemulihan password.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <AlertCircle size={17} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-3"
          >
            <CheckCircle2 size={17} className="text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Email Admin
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                  setSuccess('');
                }}
                autoComplete="email"
                placeholder="Masukkan email admin"
                disabled={isLoading}
                required
                className="w-full h-12 pl-11 pr-4 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || cooldown > 0}
            className="w-full h-12 rounded-lg bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-semibold shadow-md shadow-green-600/15 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Mengirim...
              </>
            ) : cooldown > 0 ? (
              `Tunggu ${cooldown} detik`
            ) : (
              'Kirim Tautan Pemulihan'
            )}
          </button>
        </form>

        <div className="mt-7 text-center">
          <Link
            to="/admin/login"
            className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-[#10C35D] transition"
          >
            <ArrowLeft size={14} />
            Kembali ke Login
          </Link>
        </div>
      </div>
    </main>
  );
}
