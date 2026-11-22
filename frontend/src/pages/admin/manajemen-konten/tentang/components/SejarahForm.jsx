import React, { useEffect, useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';

const API_BASE_URL = 'http://upabahasa-polnes-4p4a.vercel.app';

const defaultData = {
  title: 'Sejarah UPA Bahasa',
  content: 'UPA Bahasa POLNES terus berkembang dalam mendukung pengembangan kemampuan bahasa dan pelayanan kebahasaan bagi sivitas akademika Politeknik Negeri Samarinda.\n\nPerjalanan UPA Bahasa menjadi bagian dari upaya institusi dalam menyediakan fasilitas pembelajaran, peningkatankompetensi, dan pelayanan uji kemampuan bahasa.',
};

function getImageUrl(image) {
  if (!image) return '';
  if (image.startsWith('http')) return image;
  return `${API_BASE_URL}${image}`;
}

export default function SejarahForm({ data, onSave, saving }) {
  const [form, setForm] = useState(defaultData);
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    setForm({
      title: data?.title || defaultData.title,
      content: data?.content || defaultData.content,
    });
    setImageFile(null);
  }, [data]);

  useEffect(() => {
    if (!imageFile) {
      setPreview(getImageUrl(data?.image));
      return undefined;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile, data?.image]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...form,
      imageFile,
    });
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      event.target.value = '';
      return;
    }

    setImageFile(file);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
    >
      <div className="mb-5">
        <h4 className="font-bold text-[#0a3d2e]">
          Pengaturan Sejarah UPA Bahasa
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Kelola judul dan informasi sejarah yang ditampilkan pada halaman Tentang UPA Bahasa.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Judul Sejarah
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(event) => updateField('title', event.target.value)}
            required
            maxLength={255}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            placeholder="Masukkan judul sejarah"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Isi Sejarah
          </label>
          <textarea
            rows={8}
            value={form.content}
            onChange={(event) => updateField('content', event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#10C35D]"
            placeholder="Masukkan informasi sejarah UPA Bahasa"
          />
          <p className="mt-1.5 text-xs text-gray-500">
            Pisahkan paragraf menggunakan baris kosong.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Gambar Sejarah
          </label>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-4 text-sm font-medium text-gray-600 transition hover:border-[#10C35D] hover:bg-green-50">
            <ImagePlus size={18} className="text-[#10C35D]" />
            {imageFile ? 'Ganti gambar' : 'Pilih gambar'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <p className="mt-1.5 text-xs text-gray-500">
            Format JPG, PNG, atau WebP. Jika tidak memilih gambar baru, gambar sebelumnya tetap digunakan.
          </p>

          {preview && (
            <div className="mt-3">
              <p className="mb-2 text-xs font-medium text-gray-600">
                Preview gambar
              </p>
              <img
                src={preview}
                alt="Preview gambar sejarah UPA Bahasa"
                className="max-h-64 w-full max-w-md rounded-lg border border-gray-200 object-cover"
              />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={saving || !form.title.trim() || !form.content.trim()}
          className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan Sejarah'}
        </button>
      </div>
    </form>
  );
}
