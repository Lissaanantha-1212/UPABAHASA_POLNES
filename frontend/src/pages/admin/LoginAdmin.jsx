import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAdminSession, saveAdminSession } from '../../adminSession';
import logoPolnes from '../../assets/logo-polnes.png';

const API_BASE_URL = 'https://upabahasa-polnes-4p4a.vercel.app';

export default function LoginAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    clearAdminSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          username: email.trim(),
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        throw new Error(result.message || result.error || 'Email atau password salah.');
      }

      const sessionData = result.data || result;
      saveAdminSession({
        token: sessionData.token || sessionData.accessToken,
        refreshToken: sessionData.refreshToken || '',
        expiresAt: sessionData.expiresAt || '',
        user: sessionData.user || { email: email.trim(), role: 'admin' },
      });

      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Gagal terhubung ke server login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
        <div className="flex flex-col items-center text-center mb-6">
          <img src={logoPolnes} alt="Logo POLNES" className="w-16 h-16 object-contain mb-3" />
          <h1 className="text-xl font-bold text-[#0a3d2e]">Login Admin UPA Bahasa</h1>
          <p className="text-xs text-gray-500 mt-1">Politeknik Negeri Samarinda</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email Admin
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email admin"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#10C35D]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#10C35D]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#10C35D] hover:bg-[#0ea84f] text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Masuk ke Dashboard Admin'}
          </button>
        </form>
      </div>
    </div>
  );
}