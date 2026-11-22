import React, { useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Users,
  CalendarDays,
  RefreshCw,
} from 'lucide-react';
import { adminFetch } from '../../../../../adminSession';

const API_URL = 'http://localhost:5000/api/cms/admin/head-history';
const API_ORIGIN = 'http://localhost:5000';

const emptyForm = {
  name: '',
  start_period: '',
  end_period: '',
  sort_order: '1',
};

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#10C35D] focus:ring-2 focus:ring-green-100';

const labelClass = 'mb-1.5 block text-sm font-semibold text-gray-700';

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Permintaan ke server gagal.');
  }

  return result;
}

function getImageUrl(path) {
  if (!path) return '';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith('/') ? '' : '/'}${path}`;
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? 'bg-green-50 text-green-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isActive ? 'Published' : 'Draft'}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#0a3d2e]">
        <Users size={23} />
      </div>

      <p className="font-semibold text-gray-700">{title}</p>

      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

function formatPeriod(item) {
  const start = item.start_period?.trim();
  const end = item.end_period?.trim();

  if (start && end) {
    return `${start} – ${end}`;
  }

  if (start) {
    return `Sejak ${start}`;
  }

  if (end) {
    return `Sampai ${end}`;
  }

  return 'Periode belum dilengkapi';
}

export default function LeadershipHistorySection() {
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }

    setError('');

    try {
      const response = await adminFetch(API_URL);

      const result = await readResponse(response);

      setHistory(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err.message || 'Gagal memuat riwayat kepemimpinan.'
      );

      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timer = setTimeout(() => {
      setMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);

    setPhotoPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  const refreshData = async () => {
    setRefreshing(true);

    try {
      await loadData(false);
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setShowForm(false);
  };

  const openAddForm = () => {
    setError('');

    const nextOrder =
      history.reduce(
        (max, item) =>
          Math.max(max, Number(item.sort_order) || 0),
        0
      ) + 1;

    setForm({
      ...emptyForm,
      sort_order: String(nextOrder),
    });

    setEditing(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setShowForm(true);
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveHistory = async (event) => {
    event.preventDefault();

    const sortOrder = Number(form.sort_order);

    if (!Number.isInteger(sortOrder) || sortOrder < 1) {
      setError(
        'Urutan Tampil harus berupa bilangan bulat mulai dari 1.'
      );
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const isUpdate = Boolean(editing);

      const body = new FormData();

      body.append('name', form.name.trim());
      body.append(
        'start_period',
        form.start_period.trim()
      );
      body.append(
        'end_period',
        form.end_period.trim()
      );
      body.append(
        'sort_order',
        String(sortOrder)
      );

      if (photoFile) {
        body.append('photo', photoFile);
      }

      const response = await adminFetch(
        isUpdate
          ? `${API_URL}/${editing.id}`
          : API_URL,
        {
          method: isUpdate ? 'PUT' : 'POST',
          body,
        }
      );

      await readResponse(response);

      await loadData(false);

      resetForm();

      setMessage(
        isUpdate
          ? 'Riwayat kepemimpinan berhasil diperbarui.'
          : 'Riwayat kepemimpinan berhasil ditambahkan sebagai Draft.'
      );
    } catch (err) {
      setError(
        err.message ||
          'Gagal menyimpan riwayat kepemimpinan.'
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    if (item.is_active) {
      return;
    }

    setForm({
      name: item.name || '',
      start_period: item.start_period || '',
      end_period: item.end_period || '',
      sort_order: String(item.sort_order ?? 1),
    });

    setEditing(item);
    setPhotoFile(null);
    setPhotoPreview('');
    setShowForm(true);
    setError('');
  };

  const toggleStatus = async (item) => {
    const nextAction = item.is_active
      ? 'unpublish'
      : 'publish';

    const confirmation = item.is_active
      ? `Unpublish riwayat "${item.name}"? Data tidak lagi ditampilkan di halaman publik.`
      : `Publish riwayat "${item.name}"? Data akan ditampilkan di halaman publik.`;

    if (!window.confirm(confirmation)) {
      return;
    }

    try {
      setUpdatingStatus(String(item.id));
      setError('');
      setMessage('');

      const response = await adminFetch(
        `${API_URL}/${item.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: nextAction,
          }),
        }
      );

      await readResponse(response);

      await loadData(false);

      setMessage(
        nextAction === 'publish'
          ? 'Riwayat kepemimpinan berhasil dipublikasikan.'
          : 'Riwayat kepemimpinan berhasil di-unpublish.'
      );
    } catch (err) {
      setError(
        err.message ||
          'Gagal memperbarui status publikasi.'
      );
    } finally {
      setUpdatingStatus('');
    }
  };

  const deleteHistory = async (item) => {
    if (item.is_active) {
      setError(
        'Unpublish riwayat terlebih dahulu sebelum menghapus.'
      );
      return;
    }

    if (
      !window.confirm(
        `Hapus riwayat "${item.name}"? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return;
    }

    try {
      setError('');
      setMessage('');

      const response = await adminFetch(
        `${API_URL}/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      await readResponse(response);

      await loadData(false);

      setMessage(
        'Riwayat kepemimpinan berhasil dihapus.'
      );
    } catch (err) {
      setError(
        err.message ||
          'Gagal menghapus riwayat kepemimpinan.'
      );
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Memuat riwayat kepemimpinan...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError('')}
            className="shrink-0 text-red-500 hover:text-red-700"
            aria-label="Tutup pesan error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-[100] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 text-sm font-medium text-green-700 shadow-lg"
        >
          <CheckCircle2
            size={21}
            className="shrink-0 text-green-600"
          />

          <span>{message}</span>
        </div>
      )}

      {!showForm ? (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-[#0a3d2e]">
                Daftar Riwayat Kepemimpinan
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Kelola nama Kepala UPA Bahasa, periode jabatan,
                foto, dan publikasinya.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={refreshData}
                disabled={refreshing}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing ? 'animate-spin' : ''
                  }
                />

                {refreshing
                  ? 'Memuat...'
                  : 'Muat Ulang'}
              </button>

              <button
                type="button"
                onClick={openAddForm}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50]"
              >
                <Plus size={17} />
                Tambah Riwayat
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            {history.length === 0 ? (
              <div className="p-5">
                <EmptyState
                  title="Belum ada riwayat kepemimpinan"
                  description="Tambahkan data Kepala UPA Bahasa untuk memulai riwayat kepemimpinan."
                />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[950px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4">
                        Kepala UPA
                      </th>

                      <th className="px-5 py-4">
                        Urutan
                      </th>

                      <th className="px-5 py-4">
                        Periode Jabatan
                      </th>

                      <th className="px-5 py-4">
                        Status
                      </th>

                      <th className="px-5 py-4 text-right">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {history.map((item) => {
                      const isUpdating =
                        updatingStatus ===
                        String(item.id);

                      return (
                        <tr
                          key={item.id}
                          className="transition hover:bg-gray-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {item.photo ? (
                                <img
                                  src={getImageUrl(
                                    item.photo
                                  )}
                                  alt={item.name}
                                  className="h-12 w-12 shrink-0 rounded-full border border-gray-200 object-cover"
                                />
                              ) : (
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#0a3d2e]">
                                  <Users size={20} />
                                </div>
                              )}

                              <p className="font-semibold text-gray-800">
                                {item.name}
                              </p>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg bg-green-50 px-2 font-bold text-[#0a3d2e]">
                              {item.sort_order}
                            </span>
                          </td>

                          <td className="px-5 py-4 text-gray-600">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={15}
                                className="text-[#10C35D]"
                              />

                              {formatPeriod(item)}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <StatusBadge
                              isActive={item.is_active}
                            />
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleStatus(item)
                                }
                                disabled={isUpdating}
                                className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                                  item.is_active
                                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                    : 'border-green-200 text-green-700 hover:bg-green-50'
                                }`}
                              >
                                {isUpdating
                                  ? 'Memproses...'
                                  : item.is_active
                                    ? 'Unpublish'
                                    : 'Publish'}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  startEdit(item)
                                }
                                disabled={item.is_active}
                                className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Edit riwayat"
                              >
                                <Pencil size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteHistory(item)
                                }
                                disabled={item.is_active}
                                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                                title="Hapus riwayat"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <form
          onSubmit={saveHistory}
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-[#0a3d2e]">
                {editing
                  ? 'Edit Riwayat Kepemimpinan'
                  : 'Tambah Riwayat Kepemimpinan'}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Lengkapi identitas Kepala UPA Bahasa dan
                periode jabatannya.
              </p>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
              aria-label="Tutup form"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div>
              <label className={labelClass}>
                Nama Kepala UPA
              </label>

              <input
                value={form.name}
                onChange={(event) =>
                  updateField(
                    'name',
                    event.target.value
                  )
                }
                required
                maxLength={255}
                className={inputClass}
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>
                  Periode Awal
                </label>

                <input
                  value={form.start_period}
                  onChange={(event) =>
                    updateField(
                      'start_period',
                      event.target.value
                    )
                  }
                  maxLength={50}
                  className={inputClass}
                  placeholder="Contoh: 2018"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Periode Akhir
                </label>

                <input
                  value={form.end_period}
                  onChange={(event) =>
                    updateField(
                      'end_period',
                      event.target.value
                    )
                  }
                  maxLength={50}
                  className={inputClass}
                  placeholder="Contoh: 2022"
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Urutan Tampil
              </label>

              <input
                type="number"
                min="1"
                step="1"
                required
                value={form.sort_order}
                onChange={(event) =>
                  updateField(
                    'sort_order',
                    event.target.value
                  )
                }
                className={inputClass}
                placeholder="Contoh: 1"
              />

              <p className="mt-1.5 text-xs text-gray-500">
                Angka lebih kecil akan ditampilkan lebih
                dahulu di halaman publik.
              </p>
            </div>

            <div>
              <label className={labelClass}>
                Foto Kepala UPA
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-600 transition hover:border-[#10C35D] hover:bg-green-50">
                <ImagePlus
                  size={19}
                  className="text-[#10C35D]"
                />

                {photoFile
                  ? photoFile.name
                  : 'Pilih foto JPG, PNG, atau WebP'}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file =
                      event.target.files?.[0];

                    if (!file) {
                      return;
                    }

                    if (
                      ![
                        'image/jpeg',
                        'image/png',
                        'image/webp',
                      ].includes(file.type)
                    ) {
                      setError(
                        'Format foto harus JPG, PNG, atau WebP.'
                      );

                      event.target.value = '';

                      return;
                    }

                    setError('');
                    setPhotoFile(file);
                  }}
                  className="hidden"
                />
              </label>

              <p className="mt-1.5 text-xs text-gray-500">
                Foto bersifat opsional. Jika mengedit tanpa
                memilih foto baru, foto sebelumnya tetap
                digunakan.
              </p>

              {(photoPreview || editing?.photo) && (
                <div className="mt-3">
                  <img
                    src={
                      photoPreview ||
                      getImageUrl(editing.photo)
                    }
                    alt="Preview foto Kepala UPA"
                    className="h-36 w-36 rounded-xl border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <StatusBadge isActive={false} />

                <span className="text-xs text-gray-500">
                  Data disimpan sebagai Draft.
                  Publikasikan melalui daftar riwayat.
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 px-5 py-4">
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
              disabled={
                saving || !form.name.trim()
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50] disabled:opacity-50"
            >
              <CheckCircle2 size={17} />

              {saving
                ? 'Menyimpan...'
                : editing
                  ? 'Simpan Perubahan'
                  : 'Simpan sebagai Draft'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}