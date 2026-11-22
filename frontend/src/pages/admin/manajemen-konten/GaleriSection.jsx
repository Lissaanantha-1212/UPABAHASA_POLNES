import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '../../../adminSession';
import {
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Images,
  CalendarDays,
  Eye,
  EyeOff,
} from 'lucide-react';

const API_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/cms/admin/galleries';
const API_ORIGIN = 'http://upabahasa-polnes-4p4a.vercel.app';

const initialForm = {
  title: '',
  description: '',
  event_date: '',
  image: null,
};

const getImageUrl = (image) => {
  if (!image) return '';
  if (/^https?:\/\//i.test(image)) return image;
  return `${API_ORIGIN}${image.startsWith('/') ? '' : '/'}${image}`;
};

const formatDate = (value) => {
  if (!value) return 'Tidak dicantumkan';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal tidak valid';

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(date);
};

export default function GaleriSection() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    return () => {
      if (imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);


  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response = await adminFetch(API_URL);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data galeri.');
      }

      const data = Array.isArray(result.data)
        ? result.data
        : result.data?.rows || [];

      setItems(data);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(initialForm);
    setImagePreview('');
    setError('');
    setFormOpen(true);
  };

  const openEditForm = (item) => {
    if (item.status === 'published') return;

    setEditingId(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      event_date: item.event_date
        ? String(item.event_date).slice(0, 10)
        : '',
      image: null,
    });
    setImagePreview(item.image ? getImageUrl(item.image) : '');
    setError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingId(null);
    setForm(initialForm);
    setImagePreview('');
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0] || null;

    setForm((prev) => ({ ...prev, image: file }));
    setImagePreview(file ? URL.createObjectURL(file) : '');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();


    if (!form.title.trim()) {
      setError('Judul dokumentasi wajib diisi.');
      return;
    }

    if (!editingId && !form.image) {
      setError('Foto dokumentasi wajib diunggah.');
      return;
    }

    const payload = new FormData();
    payload.append('title', form.title.trim());
    payload.append('description', form.description.trim());

    if (form.event_date) {
      payload.append('event_date', form.event_date);
    }

    if (form.image) {
      payload.append('image', form.image);
    }

    setSaving(true);
    setError('');

    try {
      const response = await adminFetch(
        editingId ? `${API_URL}/${editingId}` : API_URL,
        {
          method: editingId ? 'PUT' : 'POST',
          body: payload,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan dokumentasi.');
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(initialForm);
      setImagePreview('');
      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan dokumentasi.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (item, action) => {
    const isPublish = action === 'publish';

    const confirmed = window.confirm(
      isPublish
        ? `Publikasikan dokumentasi "${item.title}"?`
        : `Unpublish dokumentasi "${item.title}"? Dokumentasi tidak akan tampil di halaman publik.`
    );

    if (!confirmed) return;


    setProcessingId(item.id);
    setError('');

    try {
      const response = await adminFetch(`${API_URL}/${item.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengubah status dokumentasi.');
      }

      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengubah status.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (item) => {
    if (item.status === 'published') return;

    const confirmed = window.confirm(
      `Yakin ingin menghapus dokumentasi "${item.title}"? Foto dan data terkait akan dihapus.`
    );

    if (!confirmed) return;


    setProcessingId(item.id);
    setError('');

    try {
      const response = await adminFetch(`${API_URL}/${item.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus dokumentasi.');
      }

      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus dokumentasi.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Muat Ulang
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0eaa50]"
          >
            <Plus size={17} />
            Tambah Dokumentasi
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h4 className="font-bold text-[#0a3d2e]">
                {editingId ? 'Edit Dokumentasi' : 'Tambah Dokumentasi'}
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                Lengkapi informasi dokumentasi kegiatan.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Tutup formulir"
            >
              <X size={19} />
            </button>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Judul Dokumentasi *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Masukkan judul dokumentasi"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Deskripsi
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Tuliskan deskripsi singkat kegiatan..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Tanggal Kegiatan
            </label>
            <input
              type="date"
              value={form.event_date}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, event_date: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Foto Dokumentasi {editingId ? '(opsional jika tidak diganti)' : '*'}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              required={!editingId}
              onChange={handleImageChange}
              className="block w-full rounded-lg border border-gray-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#0a3d2e]"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Format JPG, PNG, atau WEBP. Maksimal 5 MB.
            </p>

            {imagePreview && (
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-gray-600">
                  Pratinjau foto
                </p>
                <img
                  src={imagePreview}
                  alt="Pratinjau dokumentasi"
                  className="max-h-56 w-full rounded-lg border border-gray-200 object-contain"
                />
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0eaa50] disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Dokumentasi'}
            </button>
          </div>
        </form>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-bold text-[#0a3d2e]">Daftar Dokumentasi</h4>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {items.length} data
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Memuat data galeri...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
            <Images size={30} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              Belum ada data dokumentasi.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] table-fixed text-left text-sm">
              <colgroup>
                <col style={{ width: '52%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
                  <th className="px-3 py-3">Judul</th>
                  <th className="whitespace-nowrap px-3 py-3">Tanggal Kegiatan</th>
                  <th className="whitespace-nowrap px-3 py-3">Status</th>
                  <th className="whitespace-nowrap px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-3 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.title || 'Dokumentasi UPA Bahasa'}
                            className="h-14 w-20 shrink-0 rounded-md border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                            <Images size={22} />
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="break-words font-semibold leading-snug text-gray-800">
                            {item.title}
                          </p>
                          <p className="mt-1 line-clamp-2 max-w-xl text-xs leading-relaxed text-gray-500">
                            {item.description || 'Tidak ada deskripsi.'}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-gray-600">
                      {formatDate(item.event_date)}
                    </td>

                    <td className="px-3 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === 'published'
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.status || 'draft'}
                      </span>
                    </td>

                    <td className="px-3 py-4">
                      <div className="flex flex-nowrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleStatus(
                            item,
                            item.status === 'published' ? 'unpublish' : 'publish'
                          )}
                          disabled={processingId === item.id}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                            item.status === 'published'
                              ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                              : 'border-green-200 text-green-700 hover:bg-green-50'
                          }`}
                          title={item.status === 'published' ? 'Batalkan publikasi' : 'Publikasikan dokumentasi'}
                        >
                          {processingId === item.id
                            ? 'Memproses...'
                            : item.status === 'published'
                              ? 'Unpublish'
                              : 'Publish'}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditForm(item)}
                          disabled={item.status === 'published'}
                          className="rounded-lg border border-blue-200 p-2 text-blue-600 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title={item.status === 'published' ? 'Unpublish terlebih dahulu untuk mengedit' : 'Edit dokumentasi'}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={item.status === 'published'}
                          className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                          title={item.status === 'published' ? 'Unpublish terlebih dahulu untuk menghapus' : 'Hapus dokumentasi'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}


