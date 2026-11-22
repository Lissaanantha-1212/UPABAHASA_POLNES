import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import HeroTentangForm from '../components/HeroTentangForm';
import { adminFetch } from '../../../../../adminSession';

const API_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/cms/admin';

const SETTING_KEYS = {
  title: 'tentang_hero_title',
  description: 'tentang_hero_description',
  buttonText: 'tentang_hero_button',
};

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Permintaan ke server gagal.');
  }

  return result;
}

export default function HeroSection() {
  const [hero, setHero] = useState({
    id: null,
    image_path: '',
    title: '',
    description: '',
    button_text: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const [heroResponse, settingsResponse] = await Promise.all([
        adminFetch(`${API_URL}/hero`),
        adminFetch(`${API_URL}/site-settings`),
      ]);

      const [heroResult, settingsResult] = await Promise.all([
        readResponse(heroResponse),
        readResponse(settingsResponse),
      ]);

      const heroRows = Array.isArray(heroResult.data)
        ? heroResult.data
        : [];

      const currentHero =
        heroRows.find((item) => item.page_name === 'about' && item.is_active) ||
        heroRows.find((item) => item.page_name === 'about') ||
        null;

      const settings = Array.isArray(settingsResult.data)
        ? settingsResult.data
        : [];

      const settingMap = Object.fromEntries(
        settings.map((item) => [
          item.setting_key,
          item.setting_value || '',
        ])
      );

      setHero({
        id: currentHero?.id || null,
        image_path: currentHero?.image_path || '',
        title: settingMap[SETTING_KEYS.title] || '',
        description: settingMap[SETTING_KEYS.description] || '',
        button_text: settingMap[SETTING_KEYS.buttonText] || '',
      });
    } catch (err) {
      setError(err.message || 'Gagal mengambil pengaturan Hero Tentang.');
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

  const handleSaveHero = async (formData) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (formData.image || !hero.id) {
        const body = new FormData();

        body.append('page_name', 'about');
        body.append('overlay_color', '#0a3d2e');
        body.append('is_active', 'true');

        if (formData.image) {
          body.append('image', formData.image);
        }

        const response = await adminFetch(
          hero.id ? `${API_URL}/hero/${hero.id}` : `${API_URL}/hero`,
          {
            method: hero.id ? 'PUT' : 'POST',
            body,
          }
        );

        await readResponse(response);
      }

      await Promise.all([
        saveSetting(SETTING_KEYS.title, formData.title),
        saveSetting(SETTING_KEYS.description, formData.description),
        saveSetting(SETTING_KEYS.buttonText, formData.button_text),
      ]);

      await loadData();
      setMessage('Pengaturan cover Tentang berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan cover Tentang.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Memuat pengaturan Hero Tentang...
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

      <HeroTentangForm
        key={hero.id || 'new-about-hero'}
        data={hero}
        onSave={handleSaveHero}
        saving={saving}
      />
    </div>
  );
}

