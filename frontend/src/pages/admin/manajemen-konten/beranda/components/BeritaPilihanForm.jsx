import React from 'react';

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

export default function BeritaPilihanForm({
  posts,
  selectedIds,
  onChange,
  onSave,
  saving,
}) {
  const selectedPosts = selectedIds
    .map((id) => posts.find((post) => Number(post.id) === Number(id)))
    .filter(Boolean);

  const togglePost = (postId) => {
    const id = Number(postId);

    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const movePost = (index, direction) => {
    const next = [...selectedIds];
    const target = index + direction;

    if (target < 0 || target >= next.length) return;

    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h4 className="text-base font-bold text-[#0a3d2e]">
          Berita & Pengumuman Pilihan
        </h4>
        <p className="mt-1 text-sm text-gray-500">
          Pilih berita yang ingin ditampilkan di Beranda dan atur urutannya.
          Hanya berita yang sudah diterbitkan yang tersedia.
        </p>
      </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h5 className="text-sm font-semibold text-gray-800">
            Daftar Berita Terbit
          </h5>
          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {selectedIds.length} dipilih
          </span>
        </div>

        {posts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-gray-600">
              Belum ada berita atau pengumuman yang diterbitkan.
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Terbitkan konten melalui Manajemen Informasi terlebih dahulu.
            </p>
          </div>
        ) : (
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {posts.map((post) => {
              const checked = selectedIds.includes(Number(post.id));

              return (
                <label
                  key={post.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                    checked
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePost(post.id)}
                    className="mt-1 h-4 w-4 accent-[#10C35D]"
                  />

                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-gray-800">
                      {post.title}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {post.category || 'Tanpa kategori'} ·{' '}
                      {formatDate(post.published_at || post.created_at)}
                    </span>
                    {post.summary && (
                      <span className="mt-1 block text-xs text-gray-500 line-clamp-2">
                        {post.summary}
                      </span>
                    )}
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h5 className="mb-3 text-sm font-semibold text-gray-800">
          Urutan Berita di Beranda
        </h5>

        {selectedPosts.length === 0 ? (
          <p className="rounded-lg bg-gray-50 px-4 py-5 text-center text-sm text-gray-500">
            Belum ada berita yang dipilih. Beranda akan menampilkan kondisi
            kosong setelah pengaturan ini disimpan.
          </p>
        ) : (
          <div className="space-y-2">
            {selectedPosts.map((post, index) => (
              <div
                key={post.id}
                className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-800">
                  {index + 1}
                </span>

                <span className="min-w-0 flex-1 text-sm font-medium text-gray-800">
                  {post.title}
                </span>

                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => movePost(index, -1)}
                    disabled={index === 0}
                    aria-label="Naikkan urutan"
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => movePost(index, 1)}
                    disabled={index === selectedPosts.length - 1}
                    aria-label="Turunkan urutan"
                    className="rounded-md border border-gray-200 px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
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
          disabled={saving}
          className="rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#0a9f4b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pilihan Berita'}
        </button>
      </div>
    </section>
  );
}
