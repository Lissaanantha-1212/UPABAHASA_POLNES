import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { adminFetch } from '../../../../../adminSession';
import ProfilTentangForm from '../components/ProfilTentangForm';

const API_URL = 'http://localhost:5000/api/cms/admin';

const SETTING_KEYS = {
  title: 'tentang_profil_title',
  description: 'tentang_profil_description',
  image: 'tentang_profil_image',
};

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Permintaan ke server gagal.');
  }

  return result;
}

export default function ProfilTentangSection() {
  const [profile, setProfile] = useState({
    title: '',
    description: '',
    image_path: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminFetch(`${API_URL}/site-settings`);
      const result = await readResponse(response);
      const settings = Array.isArray(result.data) ? result.data : [];

      const settingMap = Object.fromEntries(
        settings.map((item) => [
          item.setting_key,
          item.setting_value || '',
        ])
      );

      setProfile({
        title: settingMap[SETTING_KEYS.title] || '',
        description: settingMap[SETTING_KEYS.description] || '',
        image_path: settingMap[SETTING_KEYS.image] || '',
      });
    } catch (err) {
      setError(err.message || 'Gagal mengambil data Profil Tentang.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  const saveSetting = async (settingKey, settingValue) => {
    const response = await adminFetch(`${API_URL}/site-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        setting_key: settingKey,
        setting_value: settingValue,
        setting_type: 'text',
      }),
    });

    return readResponse(response);
  };

  const handleSaveProfile = async (formData) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (formData.image) {
        const body = new FormData();
        body.append('image', formData.image);

        const response = await adminFetch(
          `${API_URL}/about-profile-image`,
          {
            method: 'PUT',
            body,
          }
        );

        await readResponse(response);
      }

      await Promise.all([
        saveSetting(SETTING_KEYS.title, formData.title),
        saveSetting(SETTING_KEYS.description, formData.description),
      ]);

      await loadData();
      setMessage('Profil Singkat Tentang berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan Profil Singkat Tentang.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Memuat pengaturan Profil Tentang...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-[100] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 text-sm font-medium text-green-700 shadow-lg"
        >
          <CheckCircle2 size={21} className="shrink-0 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      <ProfilTentangForm
        data={profile}
        onSave={handleSaveProfile}
        saving={saving}
      />
    </div>
  );
}