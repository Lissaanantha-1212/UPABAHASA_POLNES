import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../../../../adminSession';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  Power,
  ClipboardList
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/surveys';

const initialForm = {
  label: '',
  englishLabel: '',
  description: '',
  displayOrder: 0,
  isActive: true
};

export default function KelolaAspek({ onDataChanged }) {
  const [aspects, setAspects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  const fetchAspects = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminFetch(`${API_URL}/admin/aspects`, {
        method: 'GET'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil daftar aspek.');
      }

      setAspects(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data aspek.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAspects();
  }, [fetchAspects]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setFormOpen(false);
  };

  const openAddForm = () => {
    setError('');
    setSuccess('');
    setForm(initialForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEditForm = (aspect) => {
    setError('');
    setSuccess('');
    setEditingId(aspect.id);
    setForm({
      label: aspect.label || '',
      englishLabel: aspect.englishLabel || '',
      description: aspect.description || '',
      displayOrder: aspect.displayOrder ?? 0,
      isActive: Boolean(aspect.isActive)
    });
    setFormOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.label.trim()) {
      setError('Nama aspek wajib diisi.');
      return;
    }

    const displayOrder = Number(form.displayOrder);

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setError('Urutan tampilan harus berupa bilangan bulat minimal 0.');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      label: form.label.trim(),
      englishLabel: form.englishLabel.trim(),
      description: form.description.trim(),
      displayOrder,
      isActive: Boolean(form.isActive)
    };

    try {
      const url = editingId
        ? `${API_URL}/admin/aspects/${editingId}`
        : `${API_URL}/admin/aspects`;

      const response = await adminFetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan aspek.');
      }

      resetForm();
      setSuccess(result.message || 'Aspek berhasil disimpan.');

      await fetchAspects();

      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan aspek.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (aspect) => {
    if (Number(aspect.responseCount) > 0) {
      setError(
        'Aspek ini sudah memiliki tanggapan. Nonaktifkan aspek untuk mempertahankan riwayat.'
      );
      return;
    }

    const confirmed = window.confirm(
      `Hapus aspek "${aspect.label}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    setDeletingId(aspect.id);
    setError('');
    setSuccess('');

    try {
      const response = await adminFetch(
        `${API_URL}/admin/aspects/${aspect.id}`,
        {
          method: 'DELETE'
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus aspek.');
      }

      setSuccess(result.message || 'Aspek berhasil dihapus.');
      await fetchAspects();

      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus aspek.');
    } finally {
      setDeletingId(null);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/20';

  const activeCount = aspects.filter((item) => item.isActive).length;
  const inactiveCount = aspects.length - activeCount;

  return (
    <div className="space-y-6">
      {/* Ringkasan aspek */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Aspek</p>
              <p className="mt-2 text-2xl font-bold text-gray-800">
                {aspects.length}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-[#10C35D]">
              <ClipboardList size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aspek Aktif</p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {activeCount}
              </p>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={23} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aspek Nonaktif</p>
              <p className="mt-2 text-2xl font-bold text-gray-600">
                {inactiveCount}
              </p>
            </div>
            <div className="rounded-xl bg-gray-100 p-3 text-gray-500">
              <Power size={23} />
            </div>
          </div>
        </div>
      </div>

      {/* Header dan tombol aksi */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            Daftar Aspek Penilaian
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Atur aspek yang digunakan dalam formulir survei kepuasan.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchAspects}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Muat Ulang
          </button>

          <button
            type="button"
            onClick={openAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0da94f]"
          >
            <Plus size={17} />
            Tambah Aspek
          </button>
        </div>
      </div>

      {/* Notifikasi */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            className="ml-auto"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <span>{success}</span>
          <button
            type="button"
            onClick={() => setSuccess('')}
            className="ml-auto"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* Form tambah/edit */}
      {formOpen && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-gray-800">
                {editingId ? 'Edit Aspek Penilaian' : 'Tambah Aspek Penilaian'}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Lengkapi informasi aspek survei di bawah ini.
              </p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
            >
              <X size={19} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Nama Aspek <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="label"
                  value={form.label}
                  onChange={handleFormChange}
                  placeholder="Contoh: Keandalan"
                  className={inputClass}
                  maxLength={100}
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Nama Aspek (Inggris)
                </label>
                <input
                  type="text"
                  name="englishLabel"
                  value={form.englishLabel}
                  onChange={handleFormChange}
                  placeholder="Contoh: Reliability"
                  className={inputClass}
                  maxLength={100}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Deskripsi
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Jelaskan aspek yang akan dinilai oleh pengguna..."
                rows={3}
                className={inputClass}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                  Urutan Tampilan
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  min="0"
                  step="1"
                  value={form.displayOrder}
                  onChange={handleFormChange}
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Angka lebih kecil ditampilkan lebih dahulu.
                </p>
              </div>

              <div className="flex items-center">
                <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={form.isActive}
                    onChange={handleFormChange}
                    className="h-4 w-4 accent-[#10C35D]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-700">
                      Aktifkan aspek
                    </span>
                    <span className="block text-xs text-gray-500">
                      Aspek aktif muncul di formulir survei mahasiswa.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0da94f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabel aspek */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-5 py-4">No.</th>
                <th className="px-5 py-4">Aspek Penilaian</th>
                <th className="px-5 py-4">Urutan</th>
                <th className="px-5 py-4 text-center">Tanggapan</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-gray-500">
                    Memuat data aspek...
                  </td>
                </tr>
              ) : aspects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-12 text-center text-gray-500">
                    Belum ada aspek penilaian.
                  </td>
                </tr>
              ) : (
                aspects.map((aspect, index) => (
                  <tr key={aspect.id} className="transition hover:bg-gray-50/70">
                    <td className="px-5 py-4 text-gray-500">{index + 1}</td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">
                        {aspect.label}
                      </p>
                      {aspect.englishLabel && (
                        <p className="mt-1 text-xs text-gray-500">
                          {aspect.englishLabel}
                        </p>
                      )}
                      {aspect.description && (
                        <p className="mt-1 max-w-md text-xs text-gray-500">
                          {aspect.description}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {aspect.displayOrder}
                    </td>

                    <td className="px-5 py-4 text-center font-semibold text-gray-700">
                      {Number(aspect.responseCount) || 0}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          aspect.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {aspect.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(aspect)}
                          title="Edit aspek"
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(aspect)}
                          disabled={
                            Number(aspect.responseCount) > 0 ||
                            deletingId === aspect.id
                          }
                          title={
                            Number(aspect.responseCount) > 0
                              ? 'Aspek memiliki riwayat tanggapan. Nonaktifkan jika tidak digunakan.'
                              : 'Hapus aspek'
                          }
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-100 px-5 py-3">
          <p className="text-xs text-gray-500">
            Aspek yang sudah memiliki tanggapan tidak dapat dihapus agar
            riwayat survei tetap terjaga. Gunakan fitur edit untuk
            menonaktifkannya.
          </p>
        </div>
      </div>
    </div>
  );
}
