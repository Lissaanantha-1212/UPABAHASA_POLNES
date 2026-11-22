import React, { useEffect, useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';

const DEFAULT_DATA = {
  title: 'Mengenal Lebih Dekat UPA Bahasa POLNES',
  description: '',
  image_path: '',
};

function getImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `http://upabahasa-polnes-4p4a.vercel.app${path.startsWith('/') ? '' : '/'}${path}`;
}

export default function ProfilTentangForm({ data, onSave, saving }) {
  const [form, setForm] = useState(DEFAULT_DATA);
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    setForm({
      title: data?.title || DEFAULT_DATA.title,
      description: data?.description || DEFAULT_DATA.description,
      image_path: data?.image_path || '',
    });
    setImage(null);
  }, [data]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ ...form, image });
  };

  const currentImage = previewUrl || getImageUrl(form.image_path);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <h4 className="font-bold text-[#0a3d2e]">Pengaturan Profil Singkat</h4>
        <p className="mt-1 text-sm text-gray-500">
          Atur judul, deskripsi, dan gambar pada bagian Profil halaman Tentang.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Judul Profil
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            maxLength={255}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            placeholder="Masukkan judul profil"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Deskripsi Profil
          </label>
          <textarea
            rows={7}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            placeholder="Masukkan deskripsi profil"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Gambar Profil
          </label>

          {currentImage && (
            <img
              src={currentImage}
              alt={image ? 'Preview gambar Profil baru' : 'Gambar Profil saat ini'}
              className="mb-3 h-48 w-full max-w-md rounded-lg object-cover object-center"
            />
          )}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 p-4 transition hover:border-[#10C35D]">
            <ImagePlus className="text-[#10C35D]" size={24} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">
                {image ? image.name : 'Pilih gambar Profil'}
              </p>
              <p className="text-xs text-gray-500">
                Pilih gambar untuk bagian Profil halaman Tentang.
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </div>
    </form>
  );
}

