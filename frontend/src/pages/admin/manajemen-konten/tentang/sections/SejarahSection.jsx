import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import SejarahForm from '../components/SejarahForm';
import { adminFetch } from '../../../../../adminSession';

const API_URL = 'http://localhost:5000/api/cms/admin/about-profiles';

async function readResponse(response) {
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Permintaan gagal diproses.');
  }

  return result;
}

export default function SejarahSection() {
  const [record, setRecord] = useState(null);
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
      const sejarah = rows.find((item) => item.type === 'sejarah');

      setRecord(sejarah || null);
    } catch (err) {
      setError(err.message || 'Gagal memuat data sejarah.');
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

  const handleSave = async (form) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const payload = new FormData();
      payload.append('type', 'sejarah');
      payload.append('title', form.title.trim());
      payload.append('content', form.content.trim());

      if (form.imageFile) {
        payload.append('image', form.imageFile);
      }

      const isUpdate = Boolean(record?.id);
      const response = await adminFetch(
        isUpdate ? `${API_URL}/${record.id}` : API_URL,
        {
          method: isUpdate ? 'PUT' : 'POST',
          body: payload,
        }
      );

      await readResponse(response);
      await loadData();

      setMessage(
        isUpdate
          ? 'Informasi sejarah berhasil diperbarui.'
          : 'Informasi sejarah berhasil ditambahkan.'
      );
    } catch (err) {
      setError(err.message || 'Gagal menyimpan informasi sejarah.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Memuat data sejarah...
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

      <SejarahForm
        data={record || {}}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}