
import React, { useEffect, useState } from 'react';
import {
  Headphones,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';

import PaketListeningModal from './components/PaketListeningModal';
import { adminFetch } from '../../../../adminSession';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/quizzes';

const levelLabels = {
  singkat: 'Singkat',
  sedang: 'Sedang',
  panjang: 'Panjang',
};

export default function ListeningSection() {
  const [packages, setPackages] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [selectedPackageIds, setSelectedPackageIds] = useState([]);
  const [deletingMany, setDeletingMany] = useState(false);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);

  const [notification, setNotification] = useState(null);

  // ======================================
  // NOTIFIKASI
  // ======================================

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // ======================================
  // MENGAMBIL DATA PAKET LISTENING
  // ======================================

  const fetchPackages = async () => {
    setLoading(true);

    try {
      const response = await adminFetch(`${API_URL}/listening`);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil paket Listening.'
        );
      }

      const data = Array.isArray(result.data) ? result.data : [];

      setPackages(data);

      setSelectedPackageIds((prev) =>
        prev.filter((id) =>
          data.some((item) => String(item.id) === String(id))
        )
      );

    } catch (error) {
      console.error('Fetch Listening error:', error);
      showNotification(error.message, 'error');

    } finally {
      setLoading(false);
    }
  };

  // ======================================
  // MENGAMBIL SUBTOPIK LISTENING
  // ======================================

  const fetchSubtopics = async () => {
    try {
      const response = await adminFetch(
        `${API_URL}/listening-subtopics`,
        {
          cache: 'no-store',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil subtopik Listening.'
        );
      }

      const updatedSubtopics = Array.isArray(result.data)
        ? result.data.filter(
            (item) =>
              item.category === 'listening' &&
              Number(item.is_active) !== 0
          )
        : [];

      setSubtopics(updatedSubtopics);

      return updatedSubtopics;

    } catch (error) {
      console.error('Fetch Listening subtopics error:', error);
      showNotification(error.message, 'error');

      return null;
    }
  };

  // ======================================
  // LOAD DATA
  // ======================================

  useEffect(() => {
    fetchPackages();
    fetchSubtopics();
  }, []);

  // ======================================
  // TAMBAH PAKET
  // ======================================

  const handleAdd = async () => {
    const latestSubtopics = await fetchSubtopics();

    // Jangan buka modal jika data terbaru gagal diambil.
    if (latestSubtopics === null) return;

    setEditingPackage(null);
    setShowModal(true);
  };

  // ======================================
  // EDIT PAKET
  // ======================================

  const handleEdit = async (item) => {
    try {
      // Ambil subtopik terbaru terlebih dahulu.
      const latestSubtopics = await fetchSubtopics();

      if (latestSubtopics === null) return;

      const response = await adminFetch(
        `${API_URL}/listening/${item.id}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil detail paket.'
        );
      }

      setEditingPackage(result.data);
      setShowModal(true);

    } catch (error) {
      console.error('Edit Listening error:', error);
      showNotification(error.message, 'error');
    }
  };

  // ======================================
  // SIMPAN PAKET
  // ======================================

  const handleSave = async (formData) => {
    setSaving(true);

    try {
      const payload = new FormData();

      payload.append('name', formData.name);
      payload.append('level', formData.level);
      payload.append(
        'questions',
        JSON.stringify(formData.questions)
      );

      // Paket tidak menggunakan status aktif/nonaktif.

      if (formData.audioFile) {
        payload.append('audioFile', formData.audioFile);
      }

      if (formData.selectedAudioPath) {
        payload.append('audio_path', formData.selectedAudioPath);
      }

      const isEditing = Boolean(editingPackage);

      const url = isEditing
        ? `${API_URL}/listening/${editingPackage.id}`
        : `${API_URL}/listening`;

      const response = await adminFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        body: payload,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menyimpan paket Listening.'
        );
      }

      setShowModal(false);
      setEditingPackage(null);

      await fetchPackages();

      showNotification(
        isEditing
          ? 'Paket Listening berhasil diperbarui.'
          : 'Paket Listening berhasil ditambahkan.'
      );

    } catch (error) {
      console.error('Save Listening error:', error);
      showNotification(error.message, 'error');

    } finally {
      setSaving(false);
    }
  };

  // ======================================
  // HAPUS SATU PAKET
  // ======================================

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus paket "${item.name}" beserta seluruh soalnya?`
    );

    if (!confirmed) return;

    setDeletingId(item.id);

    try {
      const response = await adminFetch(
        `${API_URL}/listening/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menghapus paket.'
        );
      }

      setSelectedPackageIds((prev) =>
        prev.filter((id) => String(id) !== String(item.id))
      );

      await fetchPackages();

      showNotification('Paket Listening berhasil dihapus.');

    } catch (error) {
      console.error('Delete Listening error:', error);
      showNotification(error.message, 'error');

    } finally {
      setDeletingId(null);
    }
  };

  // ======================================
  // FILTER PAKET
  // ======================================

  const filteredPackages = packages.filter((item) => {
    const matchesSearch = (item.name || '')
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesLevel =
      levelFilter === 'all' ||
      item.level === levelFilter;

    return matchesSearch && matchesLevel;
  });

  // ======================================
  // CHECKBOX PILIH PAKET
  // ======================================

  const allVisibleSelected =
    filteredPackages.length > 0 &&
    filteredPackages.every((item) =>
      selectedPackageIds.includes(String(item.id))
    );

  const handleSelectPackage = (id) => {
    const normalizedId = String(id);

    setSelectedPackageIds((prev) =>
      prev.includes(normalizedId)
        ? prev.filter((itemId) => itemId !== normalizedId)
        : [...prev, normalizedId]
    );
  };

  // ======================================
  // PILIH SEMUA PAKET YANG DITAMPILKAN
  // ======================================

  const handleSelectAll = () => {
    const visibleIds = filteredPackages.map((item) =>
      String(item.id)
    );

    if (allVisibleSelected) {
      setSelectedPackageIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      setSelectedPackageIds((prev) =>
        [...new Set([...prev, ...visibleIds])]
      );
    }
  };

  // ======================================
  // HAPUS BANYAK PAKET
  // ======================================

  const handleBulkDelete = async () => {
    if (selectedPackageIds.length === 0) {
      showNotification(
        'Pilih paket yang ingin dihapus terlebih dahulu.',
        'error'
      );
      return;
    }

    const selectedPackages = packages.filter((item) =>
      selectedPackageIds.includes(String(item.id))
    );

    if (selectedPackages.length === 0) {
      setSelectedPackageIds([]);
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus ${selectedPackages.length} paket Listening beserta seluruh soalnya?`
    );

    if (!confirmed) return;

    setDeletingMany(true);

    const failedIds = [];
    let successCount = 0;

    try {
      for (const item of selectedPackages) {
        try {
          const response = await adminFetch(
            `${API_URL}/listening/${item.id}`,
            {
              method: 'DELETE',
            }
          );

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(
              result.message || 'Gagal menghapus paket.'
            );
          }

          successCount++;

        } catch (error) {
          console.error(
            `Gagal menghapus paket ${item.name}:`,
            error
          );

          failedIds.push(String(item.id));
        }
      }

      await fetchPackages();

      setSelectedPackageIds(failedIds);

      if (failedIds.length === 0) {
        showNotification(
          `${successCount} paket Listening berhasil dihapus.`
        );
      } else if (successCount > 0) {
        showNotification(
          `${successCount} paket berhasil dihapus, ${failedIds.length} paket gagal dihapus.`,
          'error'
        );
      } else {
        showNotification(
          'Semua paket gagal dihapus. Silakan periksa kembali.',
          'error'
        );
      }

    } catch (error) {
      console.error('Bulk delete Listening error:', error);
      showNotification(
        'Terjadi kesalahan saat menghapus paket.',
        'error'
      );

    } finally {
      setDeletingMany(false);
    }
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <div className="space-y-5">

      {/* NOTIFIKASI */}

      {notification && (
        <div
          className={`fixed top-5 right-5 z-[110] max-w-sm w-[calc(100%-2rem)] flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white ${
            notification.type === 'success'
              ? 'border-green-200'
              : 'border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle
              size={20}
              className="text-green-600 shrink-0"
            />
          ) : (
            <AlertCircle
              size={20}
              className="text-red-500 shrink-0"
            />
          )}

          <p className="text-sm text-gray-700 flex-1">
            {notification.message}
          </p>
        </div>
      )}

      {/* HEADER */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-[#0a3d2e]">
            Daftar Paket Listening
          </h3>

          <p className="text-sm text-gray-500 mt-1">
            Kelola paket audio beserta soal yang berkaitan dengan audio tersebut.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          {/* TOMBOL HAPUS TERPILIH */}

          <button
            type="button"
            onClick={handleBulkDelete}
            disabled={
              selectedPackageIds.length === 0 ||
              deletingMany ||
              loading
            }
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 border border-red-100 text-sm font-semibold hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {deletingMany ? (
              <RefreshCw
                size={16}
                className="animate-spin"
              />
            ) : (
              <Trash2 size={16} />
            )}

            {deletingMany
              ? 'Menghapus...'
              : `Hapus Terpilih (${selectedPackageIds.length})`}
          </button>

          {/* TOMBOL TAMBAH PAKET */}

          <button
            type="button"
            onClick={handleAdd}
            disabled={deletingMany}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#10C35D] text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            <Plus size={17} />
            Tambah Paket
          </button>

        </div>
      </div>

      {/* PENCARIAN DAN FILTER */}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama paket..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#10C35D]"
          />
        </div>

        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:border-[#10C35D]"
        >
          <option value="all">Semua Level</option>
          <option value="singkat">Singkat</option>
          <option value="sedang">Sedang</option>
          <option value="panjang">Panjang</option>
        </select>

        <button
          type="button"
          onClick={fetchPackages}
          disabled={loading || deletingMany}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* TABEL PAKET */}

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">

            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleSelectAll}
                    disabled={
                      loading ||
                      deletingMany ||
                      filteredPackages.length === 0
                    }
                    className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                    title="Pilih semua paket"
                  />
                </th>

                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  No.
                </th>

                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Nama Paket
                </th>

                <th className="text-left px-5 py-3 font-semibold text-gray-600">
                  Level
                </th>

                <th className="text-center px-5 py-3 font-semibold text-gray-600">
                  Jumlah Soal
                </th>

                <th className="text-center px-5 py-3 font-semibold text-gray-600">
                  Audio
                </th>

                <th className="text-center px-5 py-3 font-semibold text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <RefreshCw
                      size={25}
                      className="animate-spin mx-auto text-[#10C35D] mb-2"
                    />

                    <p className="text-sm text-gray-500">
                      Memuat paket Listening...
                    </p>
                  </td>
                </tr>
              ) : filteredPackages.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <Headphones
                      size={35}
                      className="mx-auto mb-3 text-gray-300"
                    />

                    <p className="font-semibold text-gray-700">
                      {packages.length === 0
                        ? 'Belum Ada Paket Listening'
                        : 'Paket Tidak Ditemukan'}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {packages.length === 0
                        ? 'Silakan tambahkan paket Listening untuk mulai mengelola kuis.'
                        : 'Coba ubah kata pencarian atau filter level.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPackages.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedPackageIds.includes(String(item.id))}
                        onChange={() =>
                          handleSelectPackage(item.id)
                        }
                        disabled={
                          deletingMany ||
                          deletingId === item.id
                        }
                        className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                      />
                    </td>

                    <td className="px-5 py-4 text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-800">
                        {item.name}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex px-2.5 py-1 rounded-md bg-green-50 text-[#0a3d2e] text-xs font-semibold">
                        {levelLabels[item.level] || item.level}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center text-gray-600">
                      {item.totalQuestions ??
                        item.questions?.length ??
                        0}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {item.audioUrl ? (
                        <audio
                          controls
                          preload="none"
                          className="w-40"
                        >
                          <source src={item.audioUrl} />
                        </audio>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Tidak tersedia
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5">

                        <button
                          type="button"
                          title="Edit paket"
                          onClick={() => handleEdit(item)}
                          disabled={deletingMany}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 disabled:opacity-50"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title="Hapus paket"
                          onClick={() => handleDelete(item)}
                          disabled={
                            deletingId === item.id ||
                            deletingMany
                          }
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === item.id ? (
                            <RefreshCw
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              )}

            </tbody>
          </table>
        </div>

        {!loading && filteredPackages.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-gray-500">
              Menampilkan {filteredPackages.length} dari {packages.length} paket Listening
            </p>

            {selectedPackageIds.length > 0 && (
              <p className="text-xs font-medium text-[#0a3d2e]">
                {selectedPackageIds.length} paket dipilih
              </p>
            )}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT */}

      {showModal && (
        <PaketListeningModal
          initialData={editingPackage}
          subtopics={subtopics}
          saving={saving}
          onClose={() => {
            if (!saving) {
              setShowModal(false);
              setEditingPackage(null);
            }
          }}
          onSave={handleSave}
        />
      )}

    </div>
  );
}

