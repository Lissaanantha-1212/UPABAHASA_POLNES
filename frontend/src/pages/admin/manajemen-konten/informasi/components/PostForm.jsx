
import React, { useEffect, useState } from 'react';
import {
  X,
  Save,
  Image as ImageIcon,
} from 'lucide-react';

function getCmsImage(path) {
  if (!path) return null;

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `https://upabahasa-polnes-4p4a.vercel.app${path}`;
}

export default function PostForm({
  editingId,
  currentTab,
  closeForm,
  saving,
  handleSubmit,
  form,
  handleTitleChange,
  handleSlugChange,
  updateField,
  activeTab,
  posts,
}) {
  const editingPost = posts.find((item) => item.id === editingId);

  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!form.image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(form.image);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [form.image]);

  const today = new Date().toLocaleDateString('en-CA', {
    timeZone: 'Asia/Makassar',
  });

  const currentImage =
    previewUrl ||
    (editingPost?.image ? getCmsImage(editingPost.image) : null);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-[#0a3d2e]">
            {editingId ? 'Edit' : 'Tambah'} {currentTab.label}
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            Lengkapi informasi konten di bawah ini.
          </p>
        </div>

        <button
          type="button"
          onClick={closeForm}
          disabled={saving}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Tutup formulir"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Judul <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(event) => handleTitleChange(event.target.value)}
              required
              maxLength={255}
              placeholder="Masukkan judul konten"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.slug}
              onChange={(event) => handleSlugChange(event.target.value)}
              required
              placeholder="judul-konten"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
            />
            <p className="mt-1 text-xs text-gray-400">
              Dibuat otomatis dari judul, tetapi bisa diubah.
            </p>
          </div>

          {activeTab === 'berita' && (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-gray-700">
                Kategori Konten
              </label>
              <select
                value={form.content_category}
                onChange={(event) =>
                  updateField('content_category', event.target.value)
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
              >
                <option value="">Pilih kategori konten</option>
                <option value="Kegiatan">Kegiatan</option>
                <option value="Prestasi">Prestasi</option>
                <option value="Kerja Sama">Kerja Sama</option>
                <option value="Informasi Umum">Informasi Umum</option>
              </select>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Tanggal Publikasi
            </label>
            <input
              type="date"
              min={today}
              value={
                form.published_at
                  ? String(form.published_at).slice(0, 10)
                  : ''
              }
              onChange={(event) =>
                updateField('published_at', event.target.value)
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Ringkasan
            </label>
            <textarea
              value={form.summary}
              onChange={(event) => updateField('summary', event.target.value)}
              rows={3}
              placeholder="Ringkasan singkat untuk ditampilkan pada daftar berita"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Isi Konten <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.content}
              onChange={(event) => updateField('content', event.target.value)}
              rows={9}
              required
              placeholder="Tulis isi berita atau pengumuman di sini..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Gambar Sampul
            </label>

            <div className="rounded-lg border border-dashed border-gray-300 p-4">
              {currentImage && (
                <div className="mb-3">
                  <p className="mb-2 text-xs text-gray-500">
                    {previewUrl ? 'Preview gambar baru:' : 'Gambar saat ini:'}
                  </p>

                  <div className="flex items-center justify-start rounded-lg bg-gray-50 p-3">
                    <img
                      src={currentImage}
                      alt={
                        previewUrl
                          ? 'Preview gambar baru'
                          : 'Gambar konten saat ini'
                      }
                      className="block h-auto max-h-48 w-auto max-w-full rounded-lg object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <ImageIcon size={18} />
                <span>
                  Pilih gambar JPG, PNG, atau WEBP (maksimal 5 MB).
                </span>
              </div>

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(event) => {
                  updateField('image', event.target.files?.[0] || null);
                  event.target.value = '';
                }}
                className="mt-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-green-50 file:px-3 file:py-2 file:font-semibold file:text-green-700 hover:file:bg-green-100"
              />

              {form.image && (
                <p className="mt-2 text-xs text-green-700">
                  File dipilih: {form.image.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={closeForm}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0eaa50] disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </form>
    </section>
  );
}
