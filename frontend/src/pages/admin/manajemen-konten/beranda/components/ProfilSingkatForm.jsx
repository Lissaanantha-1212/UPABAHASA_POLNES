import React, { useEffect, useState } from 'react';
import { ImagePlus, Save, X } from 'lucide-react';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app';

const getCmsImage = (imagePath) => {
    if (!imagePath) return '';

    if (
        imagePath.startsWith('http://') ||
        imagePath.startsWith('https://')
    ) {
        return imagePath;
    }

    return `${API_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

export default function ProfilSingkatForm({
    data,
    onChange,
    onSave,
    saving
}) {
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        if (!data?.image) {
            setPreviewUrl('');
            return;
        }

        const objectUrl = URL.createObjectURL(data.image);
        setPreviewUrl(objectUrl);

        return () => {
            URL.revokeObjectURL(objectUrl);
        };
    }, [data?.image]);

    const currentImage =
        previewUrl ||
        getCmsImage(data?.image_path);

    const handleImageChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (!allowedTypes.includes(file.type)) {
            alert('Format foto harus JPG, PNG, atau WEBP.');
            event.target.value = '';
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Ukuran foto maksimal 5 MB.');
            event.target.value = '';
            return;
        }

        onChange('image', file);
    };

    const handleRemoveSelectedImage = () => {
        onChange('image', null);
    };

    return (
        <form
            onSubmit={onSave}
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
            <div className="border-b border-gray-100 px-6 py-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF5EE] text-[#0a3d2e]">
                        <ImagePlus size={22} />
                    </div>

                    <div>
                        <h4 className="font-bold text-[#0a3d2e]">
                            Profil Singkat UPA Bahasa
                        </h4>

                        <p className="mt-1 text-sm text-gray-500">
                            Kelola foto, judul, dan deskripsi yang tampil di Beranda.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6 p-6">
                {/* Foto Profil */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Foto Profil Singkat
                    </label>

                    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
                        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-50">
                            {currentImage ? (
                                <img
                                    src={currentImage}
                                    alt="Preview Profil Singkat"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-gray-400">
                                    <ImagePlus size={36} />
                                    <span className="text-xs">
                                        Belum ada foto
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col justify-center">
                            <p className="text-sm leading-relaxed text-gray-600">
                                Unggah foto yang menggambarkan UPA Bahasa.
                                Gunakan foto dengan kualitas baik agar tampilan
                                Beranda terlihat lebih profesional.
                            </p>

                            <div className="mt-4 flex flex-wrap gap-2">
                                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#0a3d2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10543e]">
                                    <ImagePlus size={17} />
                                    Pilih Foto

                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>

                                {data?.image && (
                                    <button
                                        type="button"
                                        onClick={handleRemoveSelectedImage}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
                                    >
                                        <X size={16} />
                                        Batalkan Pilihan
                                    </button>
                                )}
                            </div>

                            <p className="mt-3 text-xs text-gray-400">
                                Format JPG, PNG, atau WEBP. Maksimal 5 MB.
                            </p>

                            {data?.image && (
                                <p className="mt-2 break-all text-xs text-green-700">
                                    Foto baru: {data.image.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Judul */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Judul Profil Singkat
                    </label>

                    <input
                        type="text"
                        value={data?.title || ''}
                        onChange={(event) =>
                            onChange('title', event.target.value)
                        }
                        placeholder="Contoh: Mengenal UPA Bahasa POLNES"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/10"
                    />
                </div>

                {/* Deskripsi */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                        Deskripsi Profil Singkat
                    </label>

                    <textarea
                        rows={6}
                        value={data?.description || ''}
                        onChange={(event) =>
                            onChange('description', event.target.value)
                        }
                        placeholder="Tuliskan deskripsi singkat mengenai UPA Bahasa..."
                        className="w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm leading-relaxed outline-none transition focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/10"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                        Gunakan deskripsi yang singkat, jelas, dan informatif.
                    </p>
                </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <Save size={17} />
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>
        </form>
    );
}
