import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Lightbulb,
  RefreshCw,
  ExternalLink,
  X,
  BookOpen,
} from 'lucide-react';

import { adminFetch } from '../../../../adminSession';

const API_URL = 'http://localhost:5000/api/quizzes';

const categoryLabels = {
  listening: 'Listening',
  reading: 'Reading',
  structure: 'Structure',
};

const initialForm = {
  subtopic_id: '',
  title: '',
  description: '',
  link: '',
};

const getArray = (result, keys = []) => {
  if (Array.isArray(result)) return result;

  for (const key of keys) {
    if (Array.isArray(result?.[key])) return result[key];
  }

  return [];
};

const RecommendationSection = ({ onNotify }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [subtopics, setSubtopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');

  const notify = (message, type = 'success') => {
    onNotify?.(message, type);
  };

  // ==========================================
  // AMBIL DATA REKOMENDASI DAN SUBTOPIK
  // ==========================================

  const fetchData = async () => {
    try {
      setLoading(true);

      const [recommendationResponse, subtopicResponse] =
        await Promise.all([
          adminFetch(`${API_URL}/bank/recommendations`),
          adminFetch(`${API_URL}/subtopics`),
        ]);

      const [recommendationResult, subtopicResult] =
        await Promise.all([
          recommendationResponse.json(),
          subtopicResponse.json(),
        ]);

      if (!recommendationResponse.ok) {
        throw new Error(
          recommendationResult.message ||
          'Gagal mengambil rekomendasi materi.'
        );
      }

      if (!subtopicResponse.ok) {
        throw new Error(
          subtopicResult.message ||
          'Gagal mengambil data subtopik.'
        );
      }

      setRecommendations(
        getArray(recommendationResult, [
          'data',
          'recommendations',
        ])
      );

      setSubtopics(
        getArray(subtopicResult, [
          'data',
          'subtopics',
        ])
      );
    } catch (error) {
      notify(
        error.message || 'Gagal mengambil data rekomendasi.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // SUBTOPIK AKTIF
  // ==========================================

  const activeSubtopics = useMemo(
    () => subtopics.filter((item) => item.is_active !== false),
    [subtopics]
  );

  // ==========================================
  // FILTER REKOMENDASI
  // ==========================================

  const filteredRecommendations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return recommendations.filter((item) => {
      const matchesSearch =
        (item.title || '').toLowerCase().includes(keyword) ||
        (item.description || '').toLowerCase().includes(keyword) ||
        (item.subtopic_name || '').toLowerCase().includes(keyword);

      const matchesCategory =
        selectedCategory === 'semua' ||
        item.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [recommendations, searchTerm, selectedCategory]);

  // ==========================================
  // MODAL TAMBAH
  // ==========================================

  const handleAdd = () => {
    setEditingItem(null);
    setForm(initialForm);
    setFormError('');
    setShowModal(true);
  };

  // ==========================================
  // MODAL EDIT
  // ==========================================

  const handleEdit = (item) => {
    const currentSubtopic = activeSubtopics.find(
      (subtopic) =>
        String(subtopic.id) === String(item.subtopic_id)
    );

    setEditingItem(item);

    setForm({
      subtopic_id: currentSubtopic
        ? String(item.subtopic_id)
        : '',
      title: item.title || '',
      description: item.description || '',
      link: item.link || item.resource_url || '',
    });

    setFormError('');
    setShowModal(true);
  };

  // ==========================================
  // PERUBAHAN FORM
  // ==========================================

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  // ==========================================
  // SIMPAN REKOMENDASI
  // ==========================================

  const handleSave = async () => {
    if (!form.subtopic_id) {
      setFormError('Subtopik wajib dipilih.');
      return;
    }

    if (!form.title.trim()) {
      setFormError('Judul rekomendasi wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setFormError('');

      const isEditing = Boolean(editingItem);

      const url = isEditing
        ? `${API_URL}/bank/recommendations/${editingItem.id}`
        : `${API_URL}/bank/recommendations`;

      const response = await adminFetch(url, {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subtopic_id: Number(form.subtopic_id),
          title: form.title.trim(),
          description: form.description.trim(),
          link: form.link.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal menyimpan rekomendasi.'
        );
      }

      setShowModal(false);
      setEditingItem(null);
      setForm(initialForm);

      await fetchData();

      notify(
        isEditing
          ? 'Rekomendasi berhasil diperbarui.'
          : 'Rekomendasi berhasil ditambahkan.'
      );
    } catch (error) {
      setFormError(
        error.message || 'Terjadi kesalahan saat menyimpan.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // HAPUS REKOMENDASI
  // ==========================================

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Yakin ingin menghapus rekomendasi "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      const response = await adminFetch(
        `${API_URL}/bank/recommendations/${item.id}`,
        { method: 'DELETE' }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal menghapus rekomendasi.'
        );
      }

      await fetchData();
      notify('Rekomendasi berhasil dihapus.');
    } catch (error) {
      notify(
        error.message || 'Gagal menghapus rekomendasi.',
        'error'
      );
    }
  };

  return (
    <div className="space-y-5">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Lightbulb size={21} className="text-[#10C35D]" />
            <h3 className="text-lg font-bold text-gray-800">
              Manajemen Rekomendasi Materi
            </h3>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            Kelola materi pembelajaran yang terhubung dengan subtopik kuis.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          disabled={activeSubtopics.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#10C35D] hover:bg-[#0eae53] text-white text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus size={17} />
          Tambah Rekomendasi
        </button>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Total Rekomendasi
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {recommendations.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Seluruh materi tersimpan
          </p>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <p className="text-sm text-gray-500">
            Subtopik Aktif
          </p>
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {activeSubtopics.length}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Dapat dipilih untuk rekomendasi
          </p>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Cari judul, deskripsi, atau subtopik..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D]"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(event) => setSelectedCategory(event.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30"
        >
          <option value="semua">Semua Kategori</option>
          <option value="listening">Listening</option>
          <option value="reading">Reading</option>
          <option value="structure">Structure</option>
        </select>

        <button
          type="button"
          onClick={fetchData}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Muat Ulang
        </button>
      </div>

      {/* TABEL REKOMENDASI */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  No.
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Judul Materi
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Subtopik
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Deskripsi
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">
                  Link
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
                      Memuat rekomendasi materi...
                    </p>
                  </td>
                </tr>
              ) : filteredRecommendations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <BookOpen
                      size={32}
                      className="mx-auto text-gray-300 mb-2"
                    />
                    <p className="font-medium text-gray-600">
                      Belum Ada Rekomendasi Materi
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Tambahkan materi dan hubungkan dengan subtopik.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecommendations.map((item, index) => {
                  const link = item.link || item.resource_url || '';
                  const safeLink = /^https?:\/\//i.test(link);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 font-medium text-gray-800 min-w-40">
                        {item.title}
                      </td>

                      <td className="px-4 py-3 min-w-36">
                        <p className="font-medium text-gray-700">
                          {item.subtopic_name || '-'}
                        </p>
                        <span className="inline-flex mt-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs">
                          {categoryLabels[item.category] || item.category || '-'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-500 min-w-48 max-w-xs">
                        <p className="line-clamp-2">
                          {item.description || '-'}
                        </p>
                      </td>

                      <td className="px-4 py-3 min-w-28">
                        {safeLink ? (
                          <a
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[#0a8f48] hover:underline"
                          >
                            Buka link
                            <ExternalLink size={13} />
                          </a>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            title="Edit rekomendasi"
                            className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            title="Hapus rekomendasi"
                            className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredRecommendations.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            Menampilkan {filteredRecommendations.length} dari {recommendations.length} rekomendasi
          </div>
        )}
      </div>

      {/* MODAL TAMBAH / EDIT */}
      {showModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h4 className="font-bold text-[#0a3d2e]">
                  {editingItem ? 'Edit Rekomendasi' : 'Tambah Rekomendasi'}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Hubungkan materi pembelajaran dengan subtopik.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setShowModal(false);
                    setFormError('');
                  }
                }}
                disabled={saving}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Subtopik <span className="text-red-500">*</span>
                </label>

                <select
                  value={form.subtopic_id}
                  onChange={(event) =>
                    handleChange('subtopic_id', event.target.value)
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D]"
                >
                  <option value="">Pilih subtopik</option>
                  {activeSubtopics.map((item) => (
                    <option key={item.id} value={item.id}>
                      {categoryLabels[item.category] || item.category} — {item.name}
                    </option>
                  ))}
                </select>

                {editingItem && !form.subtopic_id && (
                  <p className="text-xs text-amber-600 mt-1.5">
                    Subtopik sebelumnya tidak aktif. Pilih subtopik aktif untuk menyimpan perubahan.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Judul Materi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    handleChange('title', event.target.value)
                  }
                  placeholder="Contoh: Present Perfect Tense"
                  maxLength={255}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deskripsi <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(event) =>
                    handleChange('description', event.target.value)
                  }
                  placeholder="Jelaskan materi yang direkomendasikan..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Link Materi <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="url"
                  value={form.link}
                  onChange={(event) =>
                    handleChange('link', event.target.value)
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D]"
                />
              </div>

              {formError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setShowModal(false);
                    setFormError('');
                  }
                }}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-white disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#10C35D] hover:bg-[#0eae53] text-white text-sm font-medium disabled:opacity-50"
              >
                {saving && (
                  <RefreshCw size={15} className="animate-spin" />
                )}
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationSection;
