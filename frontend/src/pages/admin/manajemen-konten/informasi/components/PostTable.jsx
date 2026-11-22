import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';

export default function PostTable({
  filteredPosts,
  activeTab,
  currentTab,
  CurrentIcon,
  formatDate,
  updatingStatusId,
  handlePostStatus,
  openEditForm,
  handleDelete,
}) {
  if (filteredPosts.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
        <CurrentIcon size={30} className="mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">
          Belum ada data {currentTab.label.toLowerCase()}.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase text-gray-500">
            <th className="px-3 py-3">Judul</th>

            {activeTab === 'berita' && (
              <th className="px-3 py-3">Kategori</th>
            )}

            <th className="px-3 py-3">Tanggal Publikasi</th>
            <th className="px-3 py-3">Status</th>
            <th className="px-3 py-3 text-right">Aksi</th>
          </tr>
        </thead>

        <tbody>
          {filteredPosts.map((item) => (
            <tr
              key={item.id}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="px-3 py-4">
                <p className="font-semibold text-gray-800">
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {item.slug}
                </p>
              </td>

              {activeTab === 'berita' && (
                <td className="px-3 py-4 text-gray-600">
                  {item.content_category || '-'}
                </td>
              )}

              <td className="px-3 py-4 text-gray-600">
                {formatDate(item.published_at || item.created_at)}
              </td>

              <td className="px-3 py-4">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    item.status === 'published'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {item.status || 'draft'}
                </span>
              </td>

              <td className="px-3 py-4">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handlePostStatus(item)}
                    disabled={updatingStatusId === item.id}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 ${
                      item.status === 'published'
                        ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                        : 'border-green-200 text-green-700 hover:bg-green-50'
                    }`}
                    title={
                      item.status === 'published'
                        ? 'Batalkan publikasi'
                        : 'Publikasikan konten'
                    }
                  >
                    {updatingStatusId === item.id
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
                    title={
                      item.status === 'published'
                        ? 'Unpublish terlebih dahulu untuk mengedit'
                        : 'Edit konten'
                    }
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    disabled={item.status === 'published'}
                    className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      item.status === 'published'
                        ? 'Unpublish terlebih dahulu untuk menghapus'
                        : 'Hapus konten'
                    }
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
  );
}
