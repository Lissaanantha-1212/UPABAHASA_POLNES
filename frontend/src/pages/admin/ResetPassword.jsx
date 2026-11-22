import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import logoPolnes from '../../assets/logo-polnes.png';

import {
  supabase,
  isPasswordRecoverySession,
} from '../../supabaseClient';

import { clearAdminSession } from '../../adminSession';

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isChecking, setIsChecking] = useState(true);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ==========================================
  // PEMERIKSAAN SESI PEMULIHAN PASSWORD
  // ==========================================

  useEffect(() => {
    let active = true;

    const applyRecoverySession = (session) => {
      if (!active) return;

      const valid = isPasswordRecoverySession(session);

      setIsValidSession(valid);

      if (valid) {
        setError('');
      }
    };

    // Pasang listener sebelum memeriksa session.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (
        event === 'PASSWORD_RECOVERY' ||
        event === 'INITIAL_SESSION' ||
        event === 'SIGNED_IN' ||
        event === 'TOKEN_REFRESHED'
      ) {
        applyRecoverySession(session);
      }

      if (event === 'SIGNED_OUT') {
        setIsValidSession(false);
      }
    });

    const checkRecoverySession = async () => {
      try {
        const { data, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        applyRecoverySession(data.session);
      } catch (err) {
        console.error('Recovery Session Error:', err);

        if (active) {
          setError(
            'Sesi pemulihan tidak valid atau sudah kedaluwarsa.'
          );

          setIsValidSession(false);
        }
      } finally {
        if (active) {
          setIsChecking(false);
        }
      }
    };

    checkRecoverySession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // ==========================================
  // SIMPAN PASSWORD BARU
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess('');

    if (!isValidSession) {
      setError(
        'Sesi pemulihan tidak valid. Silakan minta tautan baru.'
      );
      return;
    }

    if (password.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setIsLoading(true);

    try {
      // Perbarui password melalui Supabase Auth.
      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      // Tampilkan keberhasilan terlebih dahulu.
      setSuccess(
        'Password berhasil diperbarui. Silakan login menggunakan password baru.'
      );

      // Bersihkan session aplikasi admin.
      clearAdminSession();

      // Akhiri session Supabase.
      try {
        const { error: signOutError } =
          await supabase.auth.signOut();

        if (signOutError) {
          console.warn(
            'Supabase Sign Out Warning:',
            signOutError
          );
        }
      } catch (signOutError) {
        console.warn(
          'Supabase Sign Out Error:',
          signOutError
        );
      }

      // Arahkan kembali ke halaman login.
      setTimeout(() => {
        navigate('/admin/login', {
          replace: true,
        });
      }, 2000);

    } catch (err) {
      console.error('Update Password Error:', err);

      setError(
        err.message ||
        'Password gagal diperbarui. Silakan buka kembali tautan pemulihan.'
      );

    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // TAMPILAN
  // ==========================================

  return (
    <main className="min-h-screen bg-[#F4F8F5] flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-xl shadow-green-950/5 p-7 sm:p-9">

        {/* HEADER LOGO */}

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

        {/* JUDUL */}

        <div className="mb-7">

          <h2 className="text-2xl font-bold text-[#0a3d2e]">
            Buat Password Baru
          </h2>

          <p className="text-gray-500 text-sm mt-1">
            Masukkan password baru untuk akun admin UPA Bahasa.
          </p>

        </div>

        {/* PEMERIKSAAN SESSION */}

        {isChecking ? (

          <div className="py-8 flex flex-col items-center gap-3 text-gray-500">

            <Loader2
              size={25}
              className="animate-spin text-[#10C35D]"
            />

            <p className="text-sm">
              Memeriksa tautan pemulihan...
            </p>

          </div>

        ) : success ? (

          /* PESAN SUKSES */

          <div
            role="status"
            className="flex items-start gap-2.5 rounded-lg border border-green-200 bg-green-50 p-4"
          >

            <CheckCircle2
              size={20}
              className="text-green-600 shrink-0 mt-0.5"
            />

            <div>

              <p className="text-sm font-semibold text-green-800">
                Password berhasil diperbarui!
              </p>

              <p className="text-xs text-green-700 mt-1">
                Silakan tunggu, kamu akan diarahkan kembali ke halaman login.
              </p>

            </div>

          </div>

        ) : !isValidSession ? (

          /* SESSION TIDAK VALID */

          <div>

            <div
              role="alert"
              className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
            >

              <AlertCircle
                size={17}
                className="text-red-500 shrink-0 mt-0.5"
              />

              <p className="text-xs text-red-700">
                {error ||
                  'Sesi pemulihan tidak ditemukan. Tautan mungkin sudah kedaluwarsa.'}
              </p>

            </div>

            <Link
              to="/lupa-password"
              className="w-full h-12 rounded-lg bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-semibold transition flex items-center justify-center"
            >
              Minta Tautan Baru
            </Link>

          </div>

        ) : (

          /* FORM PASSWORD BARU */

          <>

            {error && (

              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3"
              >

                <AlertCircle
                  size={17}
                  className="text-red-500 shrink-0 mt-0.5"
                />

                <p className="text-xs text-red-700">
                  {error}
                </p>

              </div>

            )}

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* PASSWORD BARU */}

              <div>

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Password Baru
                </label>

                <div className="relative">

                  <Lock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Minimal 8 karakter"
                    minLength={8}
                    disabled={isLoading || Boolean(success)}
                    required
                    className="w-full h-12 pl-11 pr-12 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#10C35D]"
                  >
                    {showPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />
                    }
                  </button>

                </div>

              </div>

              {/* KONFIRMASI PASSWORD */}

              <div>

                <label
                  htmlFor="confirmPassword"
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
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? 'text'
                        : 'password'
                    }
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    autoComplete="new-password"
                    placeholder="Ulangi password baru"
                    disabled={isLoading || Boolean(success)}
                    required
                    className="w-full h-12 pl-11 pr-12 rounded-lg border border-gray-200 bg-[#FAFCFA] text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword((prev) => !prev)
                    }
                    aria-label={
                      showConfirmPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#10C35D]"
                  >
                    {showConfirmPassword
                      ? <EyeOff size={18} />
                      : <Eye size={18} />
                    }
                  </button>

                </div>

              </div>

              {/* TOMBOL SIMPAN */}

              <button
                type="submit"
                disabled={isLoading || Boolean(success)}
                className="w-full h-12 rounded-lg bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-semibold shadow-md shadow-green-600/15 transition disabled:bg-gray-400 flex items-center justify-center gap-2"
              >

                {isLoading ? (

                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Memperbarui...
                  </>

                ) : (

                  'Simpan Password Baru'

                )}

              </button>

            </form>

          </>

        )}

        {/* KEMBALI KE LOGIN */}

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
