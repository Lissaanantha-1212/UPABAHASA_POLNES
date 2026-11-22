
import React, { useEffect, useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';

function getCmsImage(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://upabahasa-polnes-4p4a.vercel.app${path}`;
}

export default function HeroForm({ data, onSave, saving }) {
  const [form, setForm] = useState({
    title: data.title || '',
    description: data.description || '',
    overlay_color: data.overlay_color || '#0a3d2e',
  });

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  const handleImageChange = (event) => {
    const selectedImage = event.target.files?.[0] || null;

    if (selectedImage) {
      setImage(selectedImage);
    }

    event.target.value = '';
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({ ...form, image });
  };

  const currentImage = previewUrl || getCmsImage(data.image_path);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <h4 className="font-bold text-[#0a3d2e]">Pengaturan Cover Halaman Beranda</h4>
        <p className="mt-1 text-sm text-gray-500">
          Atur gambar latar dan teks utama halaman Beranda.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Judul Cover
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => updateField('title', e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            placeholder="Masukkan judul utama"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Deskripsi Cover
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            placeholder="Masukkan deskripsi singkat"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Gambar Latar
          </label>

          {currentImage && (
            <img
              src={currentImage}
              alt={image ? 'Preview gambar Hero baru' : 'Hero saat ini'}
              className="mb-3 h-48 w-full max-w-md rounded-lg object-cover object-center"
            />
          )}

          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 p-4 transition hover:border-[#10C35D]">
            <ImagePlus className="text-[#10C35D]" size={24} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-700">
                {image ? image.name : 'Pilih gambar cover'}
              </p>
              <p className="text-xs text-gray-500">
                Format gambar mengikuti ketentuan upload server.
              </p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>


      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving || (!data.id && !image)}
          className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan Hero'}
        </button>
      </div>
    </form>
  );
}

