import { adminFetch } from '../../../../adminSession';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  RefreshCw,
  Eye,
  Pencil,
  Trash2,
  X,
  Upload,
  FileText,
  ExternalLink,
  FolderOpen,
  BookMarked,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Filter,
} from 'lucide-react';

// ==========================================
// KONFIGURASI API
// ==========================================
const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/ebooks';

const CATEGORIES = [
  'Bahasa Inggris',
  'Bahasa Mandarin',
  'Bahasa Indonesia',
  'Umum',
];

// ==========================================
// KOMPONEN UTAMA
// ==========================================
export default function EBookSection() {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // STATE HAPUS BANYAK
  const [selectedIds, setSelectedIds] = useState([]);
  const [deletingMultiple, setDeletingMultiple] = useState(false);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const [activeModal, setActiveModal] = useState(null);
  const [selectedEbook, setSelectedEbook] = useState(null);

  const [toast, setToast] = useState(null);

  // ==========================================
  // FORM STATE
  // ==========================================
  const initialForm = {
    title: '',
    author: '',
    category: 'Bahasa Inggris',
    description: '',
    accessType: 'file',
    external_link: '',
    cover: null,
    ebookFile: null,
  };

  const [form, setForm] = useState(initialForm);

  const [coverPreview, setCoverPreview] = useState('');
  const coverInputRef = useRef(null);
  const ebookInputRef = useRef(null);

  // ==========================================
  // NOTIFIKASI
  // ==========================================
  const showToast = (message, type = 'success') => {
    setToast({ message, type });

    window.setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // ==========================================
  // AMBIL DATA E-BOOK DARI DATABASE
  // ==========================================
  const fetchEbooks = async () => {
    try {
      setLoading(true);

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal mengambil data E-Book.');
      }

      const ebookData = result.data || [];

      setEbooks(ebookData);

      // Bersihkan pilihan yang datanya sudah tidak tersedia
      setSelectedIds((prev) =>
        prev.filter((id) =>
          ebookData.some((ebook) => ebook.id === id)
        )
      );

    } catch (error) {
      console.error('Fetch E-Book Error:', error);

      showToast(
        error.message || 'Tidak dapat mengambil data E-Book.',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbooks();
  }, []);

  // ==========================================
  // STATISTIK
  // ==========================================
  const totalCategories = useMemo(() => {
    return new Set(
      ebooks.map((item) => item.category).filter(Boolean)
    ).size;
  }, [ebooks]);

  // ==========================================
  // FILTER DAN PENCARIAN
  // ==========================================
  const filteredEbooks = useMemo(() => {
    return ebooks.filter((ebook) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        (ebook.title || '').toLowerCase().includes(keyword) ||
        (ebook.author || '').toLowerCase().includes(keyword);

      const matchesCategory =
        selectedCategory === 'Semua' ||
        ebook.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [ebooks, search, selectedCategory]);

  // ==========================================
  // PILIH SATU E-BOOK
  // ==========================================
  const handleSelectEbook = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  // ==========================================
  // PILIH SEMUA E-BOOK YANG TAMPIL
  // ==========================================
  const handleSelectAll = () => {
    const visibleIds = filteredEbooks.map((ebook) => ebook.id);

    if (visibleIds.length === 0) return;

    const allSelected = visibleIds.every((id) =>
      selectedIds.includes(id)
    );

    if (allSelected) {
      // Batalkan pilihan untuk data yang sedang tampil saja
      setSelectedIds((prev) =>
        prev.filter((id) => !visibleIds.includes(id))
      );
    } else {
      // Pilih semua data yang sedang tampil
      setSelectedIds((prev) =>
        [...new Set([...prev, ...visibleIds])]
      );
    }
  };

  // ==========================================
  // STATUS PILIH SEMUA
  // ==========================================
  const isAllSelected =
    filteredEbooks.length > 0 &&
    filteredEbooks.every((ebook) =>
      selectedIds.includes(ebook.id)
    );

  // ==========================================
  // FORMAT TANGGAL
  // ==========================================
  const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // ==========================================
  // MENGAMBIL NAMA FILE DARI PATH
  // ==========================================
  const getFileName = (filePath) => {
    if (!filePath) return '';

    const normalizedPath = filePath.replace(/\\/g, '/');
    return decodeURIComponent(normalizedPath.split('/').pop());
  };

  // ==========================================
  // RESET FORM
  // ==========================================
  const resetForm = () => {
    setForm(initialForm);
    setCoverPreview('');

    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }

    if (ebookInputRef.current) {
      ebookInputRef.current.value = '';
    }
  };

  // ==========================================
  // BUKA MODAL TAMBAH
  // ==========================================
  const openAddModal = () => {
    resetForm();
    setSelectedEbook(null);
    setActiveModal('add');
  };

  // ==========================================
  // BUKA MODAL EDIT
  // ==========================================
  const openEditModal = (ebook) => {
    setSelectedEbook(ebook);

    setForm({
      title: ebook.title || '',
      author: ebook.author || '',
      category: ebook.category || 'Umum',
      description: ebook.description || '',
      accessType:
        ebook.accessType || (ebook.external_link ? 'link' : 'file'),
      external_link: ebook.external_link || '',
      cover: null,
      ebookFile: null,
    });

    setCoverPreview(ebook.cover || '');
    setActiveModal('edit');
  };

  // ==========================================
  // BUKA MODAL DETAIL
  // ==========================================
  const openDetailModal = (ebook) => {
    setSelectedEbook(ebook);
    setActiveModal('detail');
  };

  // ==========================================
  // TUTUP MODAL
  // ==========================================
  const closeModal = () => {
    if (submitting) return;

    setActiveModal(null);
    setSelectedEbook(null);
    resetForm();
  };

  // ==========================================
  // HANDLE INPUT
  // ==========================================
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // HANDLE COVER
  // ==========================================
  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png'];

    if (!allowedTypes.includes(file.type)) {
      showToast('Cover harus berupa JPG, JPEG, atau PNG.', 'error');
      e.target.value = '';
      return;
    }

    setForm((prev) => ({
      ...prev,
      cover: file,
    }));

    setCoverPreview(URL.createObjectURL(file));
  };

  // ==========================================
  // HANDLE FILE E-BOOK
  // ==========================================
  const handleEbookFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      showToast('File E-Book harus berformat PDF.', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      showToast('Ukuran PDF maksimal 25 MB.', 'error');
      e.target.value = '';
      return;
    }

    setForm((prev) => ({
      ...prev,
      ebookFile: file,
    }));
  };

  // ==========================================
  // VALIDASI FORM
  // ==========================================
  const validateForm = () => {
    if (!form.title.trim()) {
      showToast('Judul E-Book wajib diisi.', 'error');
      return false;
    }

    if (!form.author.trim()) {
      showToast('Nama penulis wajib diisi.', 'error');
      return false;
    }

    if (!form.category) {
      showToast('Kategori wajib dipilih.', 'error');
      return false;
    }

    if (form.accessType === 'file') {
      if (activeModal === 'add' && !form.ebookFile) {
        showToast('Silakan upload file PDF E-Book.', 'error');
        return false;
      }

      if (
        activeModal === 'edit' &&
        !form.ebookFile &&
        !selectedEbook?.file_path
      ) {
        showToast('Silakan upload file PDF E-Book.', 'error');
        return false;
      }
    }

    if (form.accessType === 'link') {
      if (!form.external_link.trim()) {
        showToast('Tautan eksternal wajib diisi.', 'error');
        return false;
      }

      try {
        const url = new URL(form.external_link);

        if (!['http:', 'https:'].includes(url.protocol)) {
          throw new Error('URL tidak valid');
        }
      } catch {
        showToast('Masukkan tautan eksternal yang valid.', 'error');
        return false;
      }
    }

    return true;
  };

  // ==========================================
  // TAMBAH E-BOOK
  // ==========================================
  const handleAddEbook = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append('title', form.title.trim());
      formData.append('author', form.author.trim());
      formData.append('category', form.category);
      formData.append('description', form.description.trim());
      formData.append('accessType', form.accessType);

      if (form.cover) {
        formData.append('cover', form.cover);
      }

      if (form.accessType === 'file') {
        formData.append('ebookFile', form.ebookFile);
      } else {
        formData.append('external_link', form.external_link.trim());
      }

      const response = await adminFetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menambahkan E-Book.');
      }

      showToast('E-Book berhasil ditambahkan.');

      setActiveModal(null);
      resetForm();

      await fetchEbooks();
    } catch (error) {
      console.error('Add E-Book Error:', error);
      showToast(error.message || 'Gagal menambahkan E-Book.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // EDIT E-BOOK
  // ==========================================
  const handleUpdateEbook = async (e) => {
    e.preventDefault();

    if (!validateForm() || !selectedEbook) return;

    try {
      setSubmitting(true);

      const formData = new FormData();

      formData.append('title', form.title.trim());
      formData.append('author', form.author.trim());
      formData.append('category', form.category);
      formData.append('description', form.description.trim());
      formData.append('accessType', form.accessType);

      if (form.cover) {
        formData.append('cover', form.cover);
      }

      if (form.accessType === 'file') {
        if (form.ebookFile) {
          formData.append('ebookFile', form.ebookFile);
        }
      } else {
        formData.append('external_link', form.external_link.trim());
      }

      const response = await adminFetch(`${API_URL}/${selectedEbook.id}`, {
        method: 'PUT',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal memperbarui E-Book.');
      }

      showToast('E-Book berhasil diperbarui.');

      setActiveModal(null);
      resetForm();

      await fetchEbooks();
    } catch (error) {
      console.error('Update E-Book Error:', error);
      showToast(error.message || 'Gagal memperbarui E-Book.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // HAPUS SATU E-BOOK
  // ==========================================
  const handleDeleteEbook = async () => {
    if (!selectedEbook) return;

    try {
      setSubmitting(true);

      const response = await adminFetch(`${API_URL}/${selectedEbook.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Gagal menghapus E-Book.');
      }

      // Hapus ID dari daftar pilihan jika sebelumnya dipilih
      setSelectedIds((prev) =>
        prev.filter((id) => id !== selectedEbook.id)
      );

      showToast('E-Book berhasil dihapus.');

      setActiveModal(null);
      setSelectedEbook(null);

      await fetchEbooks();
    } catch (error) {
      console.error('Delete E-Book Error:', error);
      showToast(error.message || 'Gagal menghapus E-Book.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // HAPUS BEBERAPA E-BOOK
  // ==========================================
  const handleDeleteMultipleEbooks = async () => {
    if (selectedIds.length === 0) {
      showToast('Pilih E-Book yang ingin dihapus.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus ${selectedIds.length} E-Book yang dipilih? Data dan file yang tersimpan akan dihapus secara permanen.`
    );

    if (!confirmed) return;

    try {
      setDeletingMultiple(true);

      const response = await adminFetch(`${API_URL}/bulk`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: selectedIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menghapus beberapa E-Book.'
        );
      }

      setSelectedIds([]);

      showToast(
        `${result.deletedCount} E-Book berhasil dihapus.`
      );

      await fetchEbooks();
    } catch (error) {
      console.error('Delete Multiple E-Books Error:', error);

      showToast(
        error.message || 'Gagal menghapus beberapa E-Book.',
        'error'
      );
    } finally {
      setDeletingMultiple(false);
    }
  };

  // ==========================================
  // KOMPONEN INPUT
  // ==========================================
  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-gray-700 outline-none transition focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/10';

  const labelClass =
    'block text-sm font-semibold text-[#0a3d2e] mb-1.5';

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <div className="w-full space-y-6">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-[#0a3d2e]">
            Manajemen E-Book
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Kelola koleksi E-Book UPA Bahasa.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 bg-[#10C35D] hover:bg-[#0eaa50] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <Plus size={18} />
          Tambah E-Book
        </button>
      </div>

      {/* STATISTIK */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
            <BookOpen className="text-[#10C35D]" size={23} />
          </div>

          <div>
            <p className="text-sm text-gray-500">Total E-Book</p>
            <h3 className="text-2xl font-bold text-[#0a3d2e]">
              {ebooks.length}
            </h3>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
            <FolderOpen className="text-blue-500" size={23} />
          </div>

          <div>
            <p className="text-sm text-gray-500">Kategori Tersedia</p>
            <h3 className="text-2xl font-bold text-[#0a3d2e]">
              {totalCategories}
            </h3>
          </div>
        </div>
      </div>

      {/* DAFTAR E-BOOK */}
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">

        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="font-bold text-[#0a3d2e] text-base">
                Daftar E-Book
              </h2>

              <p className="text-xs text-gray-500 mt-1">
                Daftar koleksi E-Book yang tersimpan di database.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">

              {/* TOMBOL HAPUS BANYAK */}
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteMultipleEbooks}
                  disabled={deletingMultiple || loading}
                  className="inline-flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                >
                  {deletingMultiple ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <Trash2 size={15} />
                  )}

                  {deletingMultiple
                    ? 'Menghapus...'
                    : `Hapus ${selectedIds.length} E-Book`}
                </button>
              )}

              {/* REFRESH */}
              <button
                type="button"
                onClick={fetchEbooks}
                disabled={loading || deletingMultiple}
                className="inline-flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 px-3.5 py-2 rounded-lg text-sm transition disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? 'animate-spin' : ''}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* SEARCH DAN FILTER */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 mt-5">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari judul atau penulis E-Book..."
                className={`${inputClass} pl-10`}
              />
            </div>

            <div className="relative">
              <Filter
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={`${inputClass} pl-9 bg-white`}
              >
                <option value="Semua">Semua Kategori</option>

                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* TABEL */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>

                {/* CHECKBOX PILIH SEMUA */}
                <th className="px-5 py-3.5 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={
                      filteredEbooks.length === 0 ||
                      loading ||
                      deletingMultiple
                    }
                    className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                    title="Pilih semua E-Book yang tampil"
                  />
                </th>

                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">
                  E-Book
                </th>

                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">
                  Penulis
                </th>

                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">
                  Kategori
                </th>

                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">
                  Akses
                </th>

                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase">
                  Tanggal
                </th>

                <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <Loader2
                      size={28}
                      className="animate-spin text-[#10C35D] mx-auto mb-3"
                    />

                    <p className="text-sm text-gray-500">
                      Memuat data E-Book...
                    </p>
                  </td>
                </tr>
              ) : filteredEbooks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-16 text-center">
                    <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <BookMarked size={25} className="text-gray-400" />
                    </div>

                    <p className="text-sm font-semibold text-gray-600">
                      {ebooks.length === 0
                        ? 'Belum ada E-Book'
                        : 'E-Book tidak ditemukan'}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      {ebooks.length === 0
                        ? 'Silakan tambahkan koleksi E-Book pertama.'
                        : 'Coba gunakan kata kunci atau kategori lain.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEbooks.map((ebook) => (
                  <tr
                    key={ebook.id}
                    className={`hover:bg-gray-50/70 transition ${
                      selectedIds.includes(ebook.id)
                        ? 'bg-green-50/40'
                        : ''
                    }`}
                  >

                    {/* CHECKBOX SETIAP E-BOOK */}
                    <td className="px-5 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(ebook.id)}
                        onChange={() => handleSelectEbook(ebook.id)}
                        disabled={deletingMultiple}
                        className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                        aria-label={`Pilih ${ebook.title}`}
                      />
                    </td>

                    {/* COVER DAN JUDUL */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {ebook.cover ? (
                            <img
                              src={ebook.cover}
                              alt={ebook.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BookOpen
                              size={21}
                              className="text-gray-400"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#0a3d2e] line-clamp-2">
                            {ebook.title}
                          </p>

                          <p className="text-xs text-gray-400 mt-1">
                            ID: {ebook.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* PENULIS */}
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {ebook.author}
                      </span>
                    </td>

                    {/* KATEGORI */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-50 text-[#0a8f49] text-xs font-medium">
                        {ebook.category || 'Umum'}
                      </span>
                    </td>

                    {/* AKSES */}
                    <td className="px-5 py-4">
                      {ebook.file_path || ebook.accessType === 'file' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-blue-600">
                          <FileText size={15} />
                          PDF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs text-purple-600">
                          <ExternalLink size={15} />
                          Tautan
                        </span>
                      )}
                    </td>

                    {/* TANGGAL */}
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">
                        {formatDate(ebook.created_at)}
                      </span>
                    </td>

                    {/* AKSI */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openDetailModal(ebook)}
                          title="Lihat detail"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-blue-50 hover:text-blue-600 transition"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(ebook)}
                          title="Edit E-Book"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-green-50 hover:text-[#10C35D] transition"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedEbook(ebook);
                            setActiveModal('delete');
                          }}
                          title="Hapus E-Book"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-red-50 hover:text-red-600 transition"
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

        {/* FOOTER TABEL */}
        {!loading && (
          <div className="px-5 py-3.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-xs text-gray-500">
              Menampilkan {filteredEbooks.length} dari {ebooks.length} E-Book
            </p>

            {selectedIds.length > 0 && (
              <p className="text-xs font-medium text-[#0a8f49]">
                {selectedIds.length} E-Book dipilih
              </p>
            )}
          </div>
        )}
      </div>

      {/* MODAL TAMBAH DAN EDIT */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

            {/* HEADER MODAL */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#0a3d2e] text-lg">
                  {activeModal === 'add'
                    ? 'Tambah E-Book'
                    : 'Edit E-Book'}
                </h2>

                <p className="text-xs text-gray-500 mt-1">
                  Lengkapi informasi koleksi E-Book.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={19} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={
                activeModal === 'add'
                  ? handleAddEbook
                  : handleUpdateEbook
              }
              className="overflow-y-auto p-5 space-y-4"
            >
              {/* JUDUL */}
              <div>
                <label className={labelClass}>
                  Judul E-Book <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="Masukkan judul E-Book"
                  className={inputClass}
                  required
                />
              </div>

              {/* PENULIS DAN KATEGORI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Penulis <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="text"
                    name="author"
                    value={form.author}
                    onChange={handleInputChange}
                    placeholder="Nama penulis"
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Kategori <span className="text-red-500">*</span>
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    className={`${inputClass} bg-white`}
                    required
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DESKRIPSI */}
              <div>
                <label className={labelClass}>Deskripsi</label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Tuliskan deskripsi singkat E-Book..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* COVER */}
              <div>
                <label className={labelClass}>Cover E-Book</label>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-24 h-32 rounded-lg border border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
                    {coverPreview ? (
                      <img
                        src={coverPreview}
                        alt="Preview cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <ImageIcon size={25} className="mx-auto mb-1" />
                        <span className="text-[10px]">Preview</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 w-full">
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleCoverChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="inline-flex items-center gap-2 border border-gray-200 hover:bg-gray-50 rounded-lg px-3.5 py-2 text-sm text-gray-600 transition"
                    >
                      <Upload size={15} />
                      Pilih Cover
                    </button>

                    <p className="text-xs text-gray-400 mt-2">
                      Format JPG, JPEG, atau PNG.
                    </p>

                    {form.cover && (
                      <p className="text-xs text-green-600 mt-2 break-all">
                        {form.cover.name}
                      </p>
                    )}

                    {activeModal === 'edit' &&
                      !form.cover &&
                      selectedEbook?.cover && (
                        <p className="text-xs text-gray-400 mt-2">
                          Cover lama akan tetap digunakan jika tidak diganti.
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* JENIS AKSES */}
              <div>
                <label className={labelClass}>
                  Akses E-Book <span className="text-red-500">*</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        accessType: 'file',
                        external_link: '',
                      }));
                    }}
                    className={`border rounded-lg p-3 flex items-center gap-2 text-sm transition ${
                      form.accessType === 'file'
                        ? 'border-[#10C35D] bg-green-50 text-[#0a8f49]'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <FileText size={18} />
                    <span className="font-semibold">Upload PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        accessType: 'link',
                        ebookFile: null,
                      }));

                      if (ebookInputRef.current) {
                        ebookInputRef.current.value = '';
                      }
                    }}
                    className={`border rounded-lg p-3 flex items-center gap-2 text-sm transition ${
                      form.accessType === 'link'
                        ? 'border-[#10C35D] bg-green-50 text-[#0a8f49]'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    <ExternalLink size={18} />
                    <span className="font-semibold">Tautan</span>
                  </button>
                </div>
              </div>

              {/* UPLOAD PDF */}
              {form.accessType === 'file' && (
                <div>
                  <label className={labelClass}>
                    File PDF E-Book <span className="text-red-500">*</span>
                  </label>

                  <input
                    ref={ebookInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleEbookFileChange}
                    className="hidden"
                  />

                  <div className="border border-dashed border-gray-300 rounded-lg p-4">
                    <button
                      type="button"
                      onClick={() => ebookInputRef.current?.click()}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a8f49] hover:text-[#0a3d2e]"
                    >
                      <Upload size={17} />
                      Pilih File PDF
                    </button>

                    {form.ebookFile ? (
                      <div className="mt-3 flex items-center gap-2 bg-green-50 p-3 rounded-lg">
                        <FileText
                          size={19}
                          className="text-green-600 flex-shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-green-700 break-all">
                            {form.ebookFile.name}
                          </p>

                          <p className="text-[11px] text-green-600">
                            {(form.ebookFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    ) : activeModal === 'edit' &&
                      selectedEbook?.file_path ? (
                      <div className="mt-3 flex items-center gap-2 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                        <FileText
                          size={19}
                          className="text-gray-500 flex-shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-500 mb-1">
                            File PDF saat ini
                          </p>

                          <p className="text-xs font-semibold text-gray-700 break-all">
                            {getFileName(selectedEbook.file_path)}
                          </p>

                          {selectedEbook.fileUrl && (
                            <a
                              href={selectedEbook.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#0a8f49] hover:underline mt-1"
                            >
                              <Eye size={12} />
                              Lihat file PDF
                            </a>
                          )}

                          <p className="text-[11px] text-gray-400 mt-1">
                            File lama tetap digunakan jika tidak diganti.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 mt-2">
                        Belum ada file PDF yang dipilih.
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-3">
                      Format PDF, maksimal 25 MB.
                    </p>
                  </div>
                </div>
              )}

              {/* TAUTAN EKSTERNAL */}
              {form.accessType === 'link' && (
                <div>
                  <label className={labelClass}>
                    Tautan E-Book <span className="text-red-500">*</span>
                  </label>

                  <input
                    type="url"
                    name="external_link"
                    value={form.external_link}
                    onChange={handleInputChange}
                    placeholder="https://contoh.com/ebook"
                    className={inputClass}
                    required
                  />

                  {activeModal === 'edit' &&
                    selectedEbook?.external_link && (
                      <div className="mt-3 flex items-start gap-2 bg-gray-50 border border-gray-100 p-3 rounded-lg">
                        <ExternalLink
                          size={18}
                          className="text-gray-500 flex-shrink-0 mt-0.5"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-500 mb-1">
                            Tautan yang tersimpan saat ini
                          </p>

                          <a
                            href={selectedEbook.external_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-[#0a8f49] hover:underline break-all"
                          >
                            {selectedEbook.external_link}
                          </a>

                          <p className="text-[11px] text-gray-400 mt-1">
                            Tautan lama tetap digunakan jika tidak diubah.
                          </p>
                        </div>
                      </div>
                    )}

                  <p className="text-xs text-gray-400 mt-1.5">
                    Masukkan tautan yang dapat digunakan mahasiswa untuk
                    mengakses E-Book.
                  </p>
                </div>
              )}

              {/* FOOTER FORM */}
              <div className="pt-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-lg bg-[#10C35D] hover:bg-[#0eaa50] text-white text-sm font-semibold flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      {activeModal === 'add'
                        ? 'Simpan E-Book'
                        : 'Simpan Perubahan'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {activeModal === 'detail' && selectedEbook && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-[#0a3d2e]">
                Detail E-Book
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-28 h-36 rounded-lg border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                  {selectedEbook.cover ? (
                    <img
                      src={selectedEbook.cover}
                      alt={selectedEbook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen size={32} className="text-gray-400" />
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-lg font-bold text-[#0a3d2e]">
                    {selectedEbook.title}
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    {selectedEbook.author}
                  </p>

                  <span className="inline-flex mt-3 px-2.5 py-1 rounded-full bg-green-50 text-[#0a8f49] text-xs font-medium">
                    {selectedEbook.category || 'Umum'}
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-1">
                    DESKRIPSI
                  </p>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedEbook.description || 'Belum ada deskripsi.'}
                  </p>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-400 mb-2">
                    AKSES E-BOOK
                  </p>

                  {selectedEbook.fileUrl ? (
                    <a
                      href={selectedEbook.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#0a8f49] hover:underline break-all"
                    >
                      {selectedEbook.accessType === 'link'
                        ? <ExternalLink size={16} />
                        : <FileText size={16} />}

                      {selectedEbook.accessType === 'link'
                        ? 'Buka tautan E-Book'
                        : 'Lihat file PDF'}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Belum ada file atau tautan.
                    </p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Tanggal Ditambahkan
                    </p>

                    <p className="text-sm font-medium text-gray-600">
                      {formatDate(selectedEbook.created_at)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Terakhir Diperbarui
                    </p>

                    <p className="text-sm font-medium text-gray-600">
                      {formatDate(selectedEbook.updated_at)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-semibold transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS SATU */}
      {activeModal === 'delete' && selectedEbook && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle size={24} className="text-red-500" />
            </div>

            <h2 className="text-lg font-bold text-[#0a3d2e]">
              Hapus E-Book?
            </h2>

            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Apakah kamu yakin ingin menghapus E-Book{' '}
              <span className="font-semibold text-gray-700">
                "{selectedEbook.title}"
              </span>
              ? Data dan file yang tersimpan akan dihapus secara permanen.
            </p>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleDeleteEbook}
                disabled={submitting}
                className="px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold flex items-center gap-2 transition disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[200] max-w-sm w-[calc(100%-40px)]">
          <div
            className={`flex items-start gap-3 p-4 rounded-xl shadow-lg border bg-white ${
              toast.type === 'success'
                ? 'border-green-100'
                : 'border-red-100'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle
                size={20}
                className="text-green-500 flex-shrink-0"
              />
            ) : (
              <AlertCircle
                size={20}
                className="text-red-500 flex-shrink-0"
              />
            )}

            <p className="text-sm text-gray-700 flex-1">
              {toast.message}
            </p>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
