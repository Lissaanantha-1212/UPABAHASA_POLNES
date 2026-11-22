import React from 'react';

const MAX_GALLERIES = 3;

function formatDate(value) {
  if (!value) return 'Tanggal belum tersedia';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Tanggal belum tersedia';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  });
}

export default function GaleriPilihanForm({
  galleries,
  selectedIds,
  onChange,
  onSave,
  saving,
}) {
  const normalizedSelectedIds = selectedIds.map(Number);

  const selectedGalleries = normalizedSelectedIds
    .map((id) => galleries.find((item) => Number(item.id) === id))
    .filter(Boolean);

  const isOverLimit = normalizedSelectedIds.length > MAX_GALLERIES;
  const isAtLimit = normalizedSelectedIds.length >= MAX_GALLERIES;

  const toggleGallery = (galleryId) => {
    const id = Number(galleryId);
    const alreadySelected = normalizedSelectedIds.includes(id);

    if (alreadySelected) {
      onChange(normalizedSelectedIds.filter((item) => item !== id));
      return;
    }

    if (isAtLimit) return;

    onChange([...normalizedSelectedIds, id]);
  };

  const moveGallery = (index, direction) => {
    const next = [...normalizedSelectedIds];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h4 className="text-base font-bold text-[#0a3d2e]">
          Galeri Kegiatan Pilihan
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Pilih maksimal 3 dokumentasi kegiatan yang ingin ditampilkan di
          Beranda dan atur urutannya. Hanya galeri terbit yang tersedia.
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h5 className="text-sm font-semibold text-gray-800">
            Daftar Galeri Terbit
          </h5>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {normalizedSelectedIds.length}/{MAX_GALLERIES} dipilih
          </span>
        </div>

        {galleries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm text-gray-600">
              Belum ada dokumentasi yang diterbitkan.
            </p>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {galleries.map((gallery) => {
              const checked = normalizedSelectedIds.includes(Number(gallery.id));
              const disabled = !checked && isAtLimit;

              return (
                <label
                  key={gallery.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    checked
                      ? 'border-green-300 bg-green-50'
                      : disabled
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-50'
                        : 'cursor-pointer border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleGallery(gallery.id)}
                    className="mt-1 h-4 w-4 accent-[#10C35D] disabled:cursor-not-allowed"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800">
                      {gallery.title}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      Tanggal kegiatan: {formatDate(gallery.event_date)}
                    </span>
                    {gallery.description && (
                      <span className="mt-1 block text-xs text-gray-500 line-clamp-2">
                        {gallery.description}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}

        {isAtLimit && !isOverLimit && (
          <p className="mt-2 text-xs text-amber-700">
            Maksimal 3 galeri telah dipilih. Batalkan salah satu pilihan
            jika ingin menggantinya.
          </p>
        )}

        {isOverLimit && (
          <p className="mt-2 text-xs text-red-600">
            Pilihan saat ini melebihi batas 3 galeri. Batalkan pilihan
            hingga tersisa maksimal 3 sebelum menyimpan.
          </p>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h5 className="mb-3 text-sm font-semibold text-gray-800">
          Urutan Galeri di Beranda
        </h5>

        {selectedGalleries.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
            Belum ada galeri yang dipilih.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedGalleries.map((gallery, index) => (
              <div
                key={gallery.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 text-sm font-medium text-gray-800">
                  {gallery.title}
                </span>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => moveGallery(index, -1)}
                    disabled={index === 0}
                    aria-label="Naikkan urutan"
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveGallery(index, 1)}
                    disabled={index === selectedGalleries.length - 1}
                    aria-label="Turunkan urutan"
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={saving || isOverLimit}
          className="rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0a9f4b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pilihan Galeri'}
        </button>
      </div>
    </section>
  );
}
