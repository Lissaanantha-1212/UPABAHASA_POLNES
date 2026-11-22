import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import VisiMisiTugasFungsiForm from '../components/VisiMisiTugasFungsiForm';
import { adminFetch } from '../../../../../adminSession';

const API_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/cms/admin/about-items';

async function readResponse(response) {
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Permintaan gagal diproses.');
  }

  return result;
}

export default function VisiMisiTugasFungsiSection() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminFetch(API_URL);
      const result = await readResponse(response);
      const rows = Array.isArray(result.data) ? result.data : [];

      setRecords(rows);
      return rows;
    } catch (err) {
      setError(err.message || 'Gagal memuat data visi, misi, tugas, dan fungsi.');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  const handleSave = async (formData) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (!Array.isArray(formData)) {
        throw new Error('Format data formulir tidak sesuai.');
      }

      for (const item of formData) {
        const payload = {
          section_type: item.section_type,
          content: item.content.trim(),
          sort_order: item.sort_order,
          is_active: true,
        };

        const isUpdate = Boolean(item.id);

        const response = await adminFetch(
          isUpdate ? `${API_URL}/${item.id}` : API_URL,
          {
            method: isUpdate ? 'PUT' : 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        );

        await readResponse(response);
      }

      const refreshedRecords = await loadData();

      if (!refreshedRecords) {
        throw new Error(
          'Data berhasil dikirim, tetapi daftar terbaru gagal dimuat. Silakan muat ulang halaman.'
        );
      }

      setMessage('Visi, misi, tugas, dan fungsi berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan data visi, misi, tugas, dan fungsi.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Memuat data visi, misi, tugas, dan fungsi...
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      <VisiMisiTugasFungsiForm
        data={records}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
