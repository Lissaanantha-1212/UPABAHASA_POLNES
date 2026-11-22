import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Tags,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';

import SubtopicModal from './components/SubtopicModal';
import { adminFetch } from '../../../../adminSession';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/quizzes';

const categoryLabels = {
  listening: 'Listening',
  reading: 'Reading',
  structure: 'Structure',
};

const SubtopicSection = ({ onNotify }) => {
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [selectedSubtopicIds, setSelectedSubtopicIds] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState(null);
  const [savingSubtopic, setSavingSubtopic] = useState(false);
  const [formError, setFormError] = useState('');

  const initialForm = {
    category: 'listening',
    name: '',
    description: '',
  };

  const [formSubtopic, setFormSubtopic] = useState(initialForm);

  const notify = (message, type = 'success') => {
    if (onNotify) {
      onNotify(message, type);
    }
  };

  // ==========================================
  // AMBIL DATA SUBTOPIK
  // ==========================================

  const fetchSubtopics = async () => {
    try {
      setLoading(true);

      const response = await adminFetch(`${API_URL}/subtopics`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data subtopik.');
      }

      const data = Array.isArray(result)
        ? result
        : result.data || result.subtopics || [];

      setSubtopics(data);

      const existingIds = data.map((item) => String(item.id));

      setSelectedSubtopicIds((previous) =>
        previous.filter((id) => existingIds.includes(String(id)))
      );
    } catch (error) {
      notify(error.message || 'Gagal mengambil data subtopik.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubtopics();
  }, []);

  // ==========================================
  // BUKA MODAL TAMBAH
  // ==========================================

  const handleAdd = () => {
    setEditingSubtopic(null);
    setFormSubtopic(initialForm);
    setFormError('');
    setShowModal(true);
  };

  // ==========================================
  // BUKA MODAL EDIT
  // ==========================================

  const handleEdit = (item) => {
    setEditingSubtopic(item);

    setFormSubtopic({
      category: item.category || 'listening',
      name: item.name || '',
      description: item.description || '',
    });

    setFormError('');
    setShowModal(true);
  };

  // ==========================================
  // UBAH FORM
  // ==========================================

  const handleFormChange = (field, value) => {
    setFormSubtopic((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // SIMPAN SUBTOPIK
  // ==========================================

  const handleSaveSubtopic = async () => {
    if (!formSubtopic.name.trim()) {
      setFormError('Nama subtopik wajib diisi.');
      return;
    }

    if (!formSubtopic.category) {
      setFormError('Kategori wajib dipilih.');
      return;
    }

    try {
      setSavingSubtopic(true);
      setFormError('');

      const isEditing = Boolean(editingSubtopic);

      const url = isEditing
        ? `${API_URL}/subtopics/${editingSubtopic.id}`
        : `${API_URL}/subtopics`;

      const response = await adminFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: formSubtopic.category,
          name: formSubtopic.name.trim(),
          description: formSubtopic.description.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan subtopik.');
      }

      setShowModal(false);
      setEditingSubtopic(null);
      setFormSubtopic(initialForm);

      await fetchSubtopics();

      notify(
        isEditing
          ? 'Subtopik berhasil diperbarui.'
          : 'Subtopik berhasil ditambahkan.'
      );
    } catch (error) {
      setFormError(error.message || 'Terjadi kesalahan saat menyimpan.');
    } finally {
      setSavingSubtopic(false);
    }
  };

  // ==========================================
  // HAPUS SUBTOPIK SATUAN
  // ==========================================

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus subtopik "${item.name}"?\n\nSubtopik yang sudah digunakan oleh soal atau rekomendasi tidak dapat dihapus.`
    );

    if (!confirmed) return;

    try {
      const response = await adminFetch(
        `${API_URL}/subtopics/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Subtopik gagal dihapus.');
      }

      setSelectedSubtopicIds((previous) =>
        previous.filter((id) => String(id) !== String(item.id))
      );

      await fetchSubtopics();
      notify('Subtopik berhasil dihapus.');
    } catch (error) {
      notify(error.message || 'Subtopik gagal dihapus.', 'error');
    }
  };

  // ==========================================
  // CHECKBOX SATUAN
  // ==========================================

  const handleSelectOne = (id) => {
    const normalizedId = String(id);

    setSelectedSubtopicIds((previous) => {
      if (previous.includes(normalizedId)) {
        return previous.filter((item) => item !== normalizedId);
      }

      return [...previous, normalizedId];
    });
  };

  // ==========================================
  // CHECKBOX PILIH SEMUA
  // ==========================================

  const filteredSubtopics = subtopics.filter((item) => {
    const keyword = searchTerm.toLowerCase();

    const matchesSearch =
      (item.name || '').toLowerCase().includes(keyword) ||
      (item.description || '').toLowerCase().includes(keyword);

    const matchesCategory =
      selectedCategory === 'semua' ||
      item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const isAllSelected =
    filteredSubtopics.length > 0 &&
    filteredSubtopics.every((item) =>
      selectedSubtopicIds.includes(String(item.id))
    );

  const handleSelectAll = () => {
    if (isAllSelected) {
      const visibleIds = filteredSubtopics.map((item) => String(item.id));

      setSelectedSubtopicIds((previous) =>
        previous.filter((id) => !visibleIds.includes(id))
      );
    } else {
      const visibleIds = filteredSubtopics.map((item) => String(item.id));

      setSelectedSubtopicIds((previous) =>
        [...new Set([...previous, ...visibleIds])]
      );
    }
  };

  // ==========================================
  // HAPUS SUBTOPIK TERPILIH
  // ==========================================

  const handleBulkDelete = async () => {
    const selectedItems = subtopics.filter((item) =>
      selectedSubtopicIds.includes(String(item.id))
    );

    if (selectedItems.length === 0) {
      notify('Pilih minimal satu subtopik terlebih dahulu.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus ${selectedItems.length} subtopik yang dipilih?`
    );

    if (!confirmed) return;

    let successCount = 0;
    let failedCount = 0;

    for (const item of selectedItems) {
      try {
        const response = await adminFetch(
          `${API_URL}/subtopics/${item.id}`,
          {
            method: 'DELETE',
          }
        );

        if (response.ok) {
          successCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    await fetchSubtopics();

    if (successCount > 0 && failedCount === 0) {
      notify(`${successCount} subtopik berhasil dihapus.`);
    } else if (successCount > 0 && failedCount > 0) {
      notify(
        `${successCount} berhasil dihapus, ${failedCount} gagal dihapus karena masih digunakan atau terjadi kesalahan.`,
        'error'
      );
    } else {
      notify(
        'Subtopik gagal dihapus. Beberapa subtopik mungkin masih digunakan oleh soal atau rekomendasi.',
        'error'
      );
    }
  };

  // ==========================================
  // RESET FILTER
  // ==========================================

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedCategory('semua');
  };

  return (
    <div className="space-y-5">
      {/* NOTIFICATION CADANGAN */}
      {/* Notifikasi utama ditampilkan melalui KuisSection */}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Tags size={21} className="text-[#10C35D]" />
            <h3 className="text-lg font-bold text-gray-800">
              Manajemen Subtopik
            </h3>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Kelola subtopik yang digunakan dalam soal dan rekomendasi kuis.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#10C35D] hover:bg-[#0eae53] text-white text-sm font-medium transition"
        >
          <Plus size={17} />
          Tambah Subtopik
        </button>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = subtopics.filter(
            (item) => item.category === key
          ).length;

          return (
            <div
              key={key}
              className="bg-white border border-gray-200 rounded-xl p-4"
            >
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {count}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Jumlah subtopik
              </p>
            </div>
          );
        })}
      </div>

      {/* FILTER DAN PENCARIAN */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau deskripsi subtopik..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D]"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30"
          >
            <option value="semua">Semua Kategori</option>
            <option value="listening">Listening</option>
            <option value="reading">Reading</option>
            <option value="structure">Structure</option>
          </select>

          <button
            type="button"
            onClick={handleResetFilter}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={16} />
            Reset
          </button>
        </div>

        {/* AKSI PILIHAN */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-gray-100">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={handleSelectAll}
              disabled={filteredSubtopics.length === 0}
              className="w-4 h-4 accent-[#10C35D]"
            />
            Pilih semua yang ditampilkan
          </label>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              {selectedSubtopicIds.length} dipilih
            </span>

            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={selectedSubtopicIds.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <Trash2 size={16} />
              Hapus Terpilih
            </button>
          </div>
        </div>
      </div>

      {/* TABEL SUBTOPIK */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-center w-12">
                  <span className="sr-only">Pilih</span>
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  No.
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Nama Subtopik
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Kategori
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Deskripsi
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <RefreshCw
                      size={22}
                      className="animate-spin mx-auto text-[#10C35D] mb-2"
                    />
                    <p className="text-sm text-gray-500">
                      Memuat data subtopik...
                    </p>
                  </td>
                </tr>
              ) : filteredSubtopics.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <Tags
                      size={32}
                      className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="font-medium text-gray-600">
                      Subtopik tidak ditemukan
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Coba ubah kata kunci atau filter kategori.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredSubtopics.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedSubtopicIds.includes(
                          String(item.id)
                        )}
                        onChange={() => handleSelectOne(item.id)}
                        className="w-4 h-4 accent-[#10C35D]"
                      />
                    </td>

                    <td className="px-4 py-3 text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.name}
                    </td>

                    <td className="px-4 py-3">
                      <span className="inline-flex px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                        {categoryLabels[item.category] || item.category}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-500 max-w-xs">
                      <p className="line-clamp-2">
                        {item.description || '-'}
                      </p>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          title="Edit subtopik"
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          title="Hapus subtopik"
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredSubtopics.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            Menampilkan {filteredSubtopics.length} dari {subtopics.length} subtopik
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT */}
      <SubtopicModal
        show={showModal}
        editingSubtopic={editingSubtopic}
        formSubtopic={formSubtopic}
        savingSubtopic={savingSubtopic}
        formError={formError}
        onClose={() => {
          if (!savingSubtopic) {
            setShowModal(false);
            setFormError('');
          }
        }}
        onChange={handleFormChange}
        onSave={handleSaveSubtopic}
      />
    </div>
  );
};

export default SubtopicSection;
