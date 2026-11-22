import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Layers, FileQuestion, ClipboardList, RefreshCw, Power, Package,
  Headphones, BookOpen, AlertCircle, Plus, Pencil, Trash2,
  FileSpreadsheet, Download, Upload, Play, Pause,
} from 'lucide-react';

import { adminFetch } from '../../../../adminSession';
import PaketKuisModal from './components/PaketKuisModal';
import SoalMandiriModal from './components/SoalMandiriModal';

const API_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/quizzes';

const tabs = [
  { id: 'package', label: 'Paket Soal', icon: Package },
  { id: 'standalone', label: 'Soal Mandiri', icon: FileQuestion },
  { id: 'all', label: 'Daftar Bank Soal', icon: ClipboardList },
];

const categoryLabels = {
  listening: 'Listening',
  reading: 'Reading',
  structure: 'Grammar',
};

function extractItems(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  return [];
}

export default function QuizCategorySection({ category, onNotify }) {
  const visibleTabs = category === 'structure'
    ? tabs.filter((tab) => tab.id !== 'package')
    : category === 'reading'
      ? tabs.filter((tab) => tab.id !== 'standalone')
      : tabs;

  const [activeTab, setActiveTab] = useState(category === 'structure' ? 'standalone' : 'package');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showPackageModal, setShowPackageModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [savingPackage, setSavingPackage] = useState(false);
  const [loadingPackage, setLoadingPackage] = useState(false);

  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [savingQuestion, setSavingQuestion] = useState(false);

  const [excelFile, setExcelFile] = useState(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const excelInputRef = useRef(null);
  const [selectedKeys, setSelectedKeys] = useState([]);
  const audioRef = useRef(null);
  const [playingAudioKey, setPlayingAudioKey] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ category });
      if (activeTab === 'package') params.set('type', 'package');
      if (activeTab === 'standalone') params.set('type', 'standalone');

      const response = await adminFetch(`${API_URL}/bank/items?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal mengambil daftar bank soal.');
      }
      setItems(extractItems(payload));
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [category, activeTab]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const toggleStatus = async (item) => {
    const endpoint = item.type === 'package'
      ? `${API_URL}/bank/packages/${item.id}/status`
      : `${API_URL}/bank/questions/${item.id}/status`;

    try {
      const response = await adminFetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal mengubah status item.');
      }
      onNotify?.(
        item.is_active ? 'Item berhasil dinonaktifkan.' : 'Item berhasil diaktifkan.',
        'success'
      );
      await loadItems();
    } catch (err) {
      onNotify?.(err.message || 'Gagal mengubah status item.', 'error');
    }
  };

  // Preview audio untuk paket dan soal mandiri
  const toggleAudioPreview = async (item) => {
    const audio = audioRef.current;
    const audioUrl = item.audio_url;
    const audioKey = `${item.type}-${item.id}`;

    if (!audio || !audioUrl) return;

    if (playingAudioKey === audioKey && !audio.paused) {
      audio.pause();
      setPlayingAudioKey(null);
      return;
    }

    audio.pause();
    audio.src = audioUrl;
    audio.currentTime = 0;

    try {
      await audio.play();
      setPlayingAudioKey(audioKey);
    } catch {
      setPlayingAudioKey(null);
      onNotify?.(
        'Audio tidak dapat diputar. Periksa file audio atau koneksi.',
        'error'
      );
    }
  };

  // Paket soal
  const openCreatePackage = () => {
    setEditingPackage(null);
    setShowPackageModal(true);
  };

  const openEditPackage = async (item) => {
    setLoadingPackage(true);
    try {
      const response = await adminFetch(`${API_URL}/bank/packages/${item.id}`);
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal mengambil detail paket soal.');
      }
      const packageData = payload?.data?.data || payload?.data || payload?.item;
      if (!packageData || !Array.isArray(packageData.questions)) {
        throw new Error('Format detail paket soal dari server tidak sesuai.');
      }
      setEditingPackage(packageData);
      setShowPackageModal(true);
    } catch (err) {
      onNotify?.(err.message || 'Gagal membuka paket soal.', 'error');
    } finally {
      setLoadingPackage(false);
    }
  };

  const savePackage = async (formData) => {
    setSavingPackage(true);
    try {
      const body = new FormData();
      body.append('category', category);
      body.append('name', formData.name || '');
      body.append('stimulus_note', formData.stimulus_note || '');
      body.append('reading_text', formData.reading_text || '');
      body.append('reading_instruction', formData.reading_instruction || '');
      body.append('questions', JSON.stringify(formData.questions || []));
      if (formData.audioFile) body.append('audioFile', formData.audioFile);


      const isEditing = Boolean(editingPackage?.id);
      const response = await adminFetch(
        isEditing
          ? `${API_URL}/bank/packages/${editingPackage.id}`
          : `${API_URL}/bank/packages`,
        { method: isEditing ? 'PUT' : 'POST', body }
      );
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal menyimpan paket soal.');
      }

      setShowPackageModal(false);
      setEditingPackage(null);
      onNotify?.(
        isEditing ? 'Paket soal berhasil diperbarui.' : 'Paket soal berhasil ditambahkan.',
        'success'
      );
      await loadItems();
    } catch (err) {
      onNotify?.(err.message || 'Gagal menyimpan paket soal.', 'error');
    } finally {
      setSavingPackage(false);
    }
  };

  const deletePackage = async (item) => {
    if (!window.confirm(
      `Hapus paket "${item.name || 'Paket Soal'}"? Seluruh soal di dalam paket ini juga akan terhapus.`
    )) return;

    try {
      const response = await adminFetch(`${API_URL}/bank/packages/${item.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal menghapus paket soal.');
      }
      onNotify?.('Paket soal berhasil dihapus.', 'success');
      await loadItems();
    } catch (err) {
      onNotify?.(err.message || 'Gagal menghapus paket soal.', 'error');
    }
  };

  // Soal mandiri: fitur lama dipertahankan
  const openCreateQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionModal(true);
  };

  const openEditQuestion = async (item) => {
    try {
      const response = await adminFetch(`${API_URL}/bank/questions/${item.id}`);
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal mengambil detail soal.');
      }
      const questionData = payload?.data?.data || payload?.data || payload?.item;
      if (!questionData) throw new Error('Detail soal tidak ditemukan.');
      setEditingQuestion(questionData);
      setShowQuestionModal(true);
    } catch (err) {
      onNotify?.(err.message || 'Gagal membuka soal mandiri.', 'error');
    }
  };

  const saveQuestion = async (formData) => {
    setSavingQuestion(true);

    try {
      const isEditing = Boolean(editingQuestion?.id);
      const body = new FormData();

      body.append('category', category);
      body.append('subtopic', formData.subtopic);
      body.append('question_text', formData.question_text);
      body.append('options', JSON.stringify(formData.options));
      body.append('correct_answer', JSON.stringify(formData.correct_answer));
      body.append('explanation', formData.explanation);
      body.append('recommendation_material', formData.recommendation_material);

      if (category === 'listening' && formData.audioFile) {
        body.append('audioFile', formData.audioFile);
      }

      const response = await adminFetch(
        isEditing
          ? `${API_URL}/bank/questions/${editingQuestion.id}`
          : `${API_URL}/bank/questions`,
        {
          method: isEditing ? 'PUT' : 'POST',
          body,
        }
      );

      const payload = await response.json();

      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal menyimpan soal mandiri.');
      }

      setShowQuestionModal(false);
      setEditingQuestion(null);

      onNotify?.(
        isEditing
          ? 'Soal mandiri berhasil diperbarui.'
          : 'Soal mandiri berhasil ditambahkan.',
        'success'
      );

      await loadItems();
    } catch (err) {
      onNotify?.(err.message || 'Gagal menyimpan soal mandiri.', 'error');
    } finally {
      setSavingQuestion(false);
    }
  };
  const deleteQuestion = async (item) => {
    if (!window.confirm('Yakin ingin menghapus soal mandiri ini?')) return;
    try {
      const response = await adminFetch(`${API_URL}/bank/questions/${item.id}`, { method: 'DELETE' });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal menghapus soal mandiri.');
      }
      onNotify?.('Soal mandiri berhasil dihapus.', 'success');
      await loadItems();
    } catch (err) {
      onNotify?.(err.message || 'Gagal menghapus soal mandiri.', 'error');
    }
  };

  // Aksi massal untuk paket dan soal mandiri
  const selectableItems = items;

  const selectedItems = items.filter((item) =>
    selectedKeys.includes(`${item.type}-${item.id}`)
  );

  const selectedActiveItems = selectedItems.filter(
    (item) => item.is_active
  );

  const selectedInactiveItems = selectedItems.filter(
    (item) => !item.is_active
  );

  const allSelectableSelected =
    selectableItems.length > 0 &&
    selectableItems.every((item) =>
      selectedKeys.includes(`${item.type}-${item.id}`)
    );

  const toggleSelectAll = (checked) => {
    const visibleKeys = selectableItems.map(
      (item) => `${item.type}-${item.id}`
    );

    setSelectedKeys((current) => {
      if (checked) {
        return [...new Set([...current, ...visibleKeys])];
      }

      return current.filter((key) => !visibleKeys.includes(key));
    });
  };

  const toggleSelectItem = (item, checked) => {
    const key = `${item.type}-${item.id}`;

    setSelectedKeys((current) => {
      if (checked) {
        return [...new Set([...current, key])];
      }

      return current.filter((value) => value !== key);
    });
  };

  const updateSelectedStatus = async (targetStatus) => {
    const targets = selectedItems.filter(
      (item) => item.is_active !== targetStatus
    );

    if (targets.length === 0) {
      onNotify?.(
        targetStatus
          ? 'Tidak ada item nonaktif yang perlu diaktifkan.'
          : 'Tidak ada item aktif yang perlu dinonaktifkan.',
        'error'
      );
      return;
    }

    const actionLabel = targetStatus ? 'mengaktifkan' : 'menonaktifkan';

    if (!window.confirm(
      `Yakin ingin ${actionLabel} ${targets.length} item terpilih?`
    )) return;

    let successCount = 0;
    const failedItems = [];

    for (const item of targets) {
      const endpoint = item.type === 'package'
        ? `${API_URL}/bank/packages/${item.id}/status`
        : `${API_URL}/bank/questions/${item.id}/status`;

      try {
        const response = await adminFetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_active: targetStatus }),
        });

        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || 'Perubahan status ditolak oleh server.'
          );
        }

        successCount += 1;
      } catch (err) {
        failedItems.push(
          `${item.name || (item.type === 'package' ? 'Paket Soal' : 'Soal Mandiri')}: ${err.message}`
        );
      }
    }

    setSelectedKeys([]);
    await loadItems();

    if (failedItems.length === 0) {
      onNotify?.(
        `${successCount} item berhasil ${targetStatus ? 'diaktifkan' : 'dinonaktifkan'}.`,
        'success'
      );
    } else {
      onNotify?.(
        `${successCount} item berhasil diproses, ${failedItems.length} item gagal. ${failedItems.join(' | ')}`,
        'error'
      );
    }
  };

  const deleteSelectedItems = async () => {
    if (selectedInactiveItems.length === 0) {
      onNotify?.('Pilih minimal satu item nonaktif untuk dihapus.', 'error');
      return;
    }

    const targets = selectedInactiveItems;

    const affectedQuestions = targets.reduce((total, item) => {
      return total + (
        item.type === 'package'
          ? Number(item.question_count) || 0
          : 1
      );
    }, 0);

    const packageCount = targets.filter(
      (item) => item.type === 'package'
    ).length;

    const standaloneCount = targets.filter(
      (item) => item.type === 'standalone'
    ).length;

    const confirmed = window.confirm(
      `Hapus ${targets.length} item nonaktif terpilih?\n\n` +
      `Paket soal: ${packageCount}\n` +
      `Soal mandiri: ${standaloneCount}\n` +
      `Total soal yang terdampak: ${affectedQuestions}\n\n` +
      `Item aktif yang ikut dipilih tidak akan dihapus. ` +
      `Menghapus paket juga akan menghapus seluruh soal di dalamnya. ` +
      `Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    let successCount = 0;
    const failedItems = [];

    for (const item of targets) {
      const endpoint = item.type === 'package'
        ? `${API_URL}/bank/packages/${item.id}`
        : `${API_URL}/bank/questions/${item.id}`;

      try {
        const response = await adminFetch(endpoint, {
          method: 'DELETE',
        });

        let payload = {};
        try {
          payload = await response.json();
        } catch {
          payload = {};
        }

        if (!response.ok || payload?.success === false) {
          throw new Error(
            payload?.message || 'Penghapusan ditolak oleh server.'
          );
        }

        successCount += 1;
      } catch (err) {
        failedItems.push(
          `${item.name || (item.type === 'package' ? 'Paket Soal' : 'Soal Mandiri')}: ${err.message}`
        );
      }
    }

    setSelectedKeys([]);
    await loadItems();

    if (failedItems.length === 0) {
      onNotify?.(
        `${successCount} item berhasil dihapus (${affectedQuestions} soal terdampak).`,
        'success'
      );
    } else {
      onNotify?.(
        `${successCount} item berhasil dihapus, ${failedItems.length} item gagal. ${failedItems.join(' | ')}`,
        'error'
      );
    }
  };
  const downloadExcelTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const response = await adminFetch(`${API_URL}/bank/excel/template`);
      if (!response.ok) {
        let message = 'Gagal mengunduh template Excel.';
        try {
          const payload = await response.json();
          message = payload?.message || message;
        } catch { /* response bukan JSON */ }
        throw new Error(message);
      }
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'Template-Soal-Kuis.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      onNotify?.(err.message || 'Gagal mengunduh template Excel.', 'error');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const importExcel = async () => {
    if (!excelFile) {
      onNotify?.('Pilih file Excel terlebih dahulu.', 'error');
      return;
    }
    const body = new FormData();
    body.append('excelFile', excelFile);
    body.append('category', category);

    setImporting(true);
    try {
      const response = await adminFetch(`${API_URL}/bank/questions/import`, {
        method: 'POST',
        body,
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || 'Gagal mengimpor soal dari Excel.');
      }
      onNotify?.(payload?.message || 'Soal dari Excel berhasil diimpor.', 'success');
      setExcelFile(null);
      if (excelInputRef.current) excelInputRef.current.value = '';
      setShowExcelModal(false);
      await loadItems();
    } catch (err) {
      onNotify?.(err.message || 'Gagal mengimpor soal dari Excel.', 'error');
    } finally {
      setImporting(false);
    }
  };

  const closePackageModal = () => {
    if (savingPackage) return;
    setShowPackageModal(false);
    setEditingPackage(null);
  };

  const closeQuestionModal = () => {
    if (savingQuestion) return;
    setShowQuestionModal(false);
    setEditingQuestion(null);
  };

  const activeCount = items.filter((item) => item.is_active).length;
  const isPackageTab = activeTab === 'package';
  const isStandaloneTab = activeTab === 'standalone';

  const totalQuestionCount = items.reduce(
    (total, item) => total + (
      Number(item.question_count) ||
      (item.type === 'standalone' ? 1 : 0)
    ),
    0
  );

  const totalPackageCount = items.filter(
    (item) => item.type === 'package'
  ).length;

  const totalStandaloneCount = items.filter(
    (item) => item.type === 'standalone'
  ).length;

  return (
    <div className="space-y-5">
      <audio
        ref={audioRef}
        preload="none"
        className="hidden"
        onEnded={() => setPlayingAudioKey(null)}
        onError={() => {
          setPlayingAudioKey(null);
          onNotify?.(
            'Audio tidak dapat dimuat atau diputar.',
            'error'
          );
        }}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h4 className="font-bold text-[#0a3d2e]">Manajemen {categoryLabels[category]}</h4>
          <p className="text-sm text-gray-500 mt-1">
            Kelola item soal dan status publikasinya dalam satu bank soal.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="px-3 py-1.5 rounded-full bg-green-50 text-green-700 font-semibold">{activeCount} aktif</span>
          <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 font-semibold">{items.length} item</span>
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-green-200 bg-green-50 p-4">
            <p className="text-xs font-medium text-green-700">Total Soal</p>
            <p className="mt-1 text-2xl font-bold text-[#0a3d2e]">
              {totalQuestionCount}
            </p>
            <p className="text-xs text-green-700">Seluruh soal dalam bank</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Paket Soal</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">
              {totalPackageCount}
            </p>
            <p className="text-xs text-gray-500">Jumlah paket tersimpan</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-medium text-gray-500">Soal Mandiri</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">
              {totalStandaloneCount}
            </p>
            <p className="text-xs text-gray-500">Jumlah soal mandiri tersimpan</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-gray-200 pb-3">
        {visibleTabs.map((tab) => {
          const Icon = tab.icon;
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedKeys([]);
                setExcelFile(null);
                if (excelInputRef.current) excelInputRef.current.value = '';
              }}
              className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition-colors ${
                selected
                  ? 'bg-green-50 text-[#0a3d2e] border border-green-200'
                  : 'text-gray-500 hover:bg-gray-50 border border-transparent'
              }`}
            >
              <Icon size={17} />{tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h5 className="font-semibold text-gray-800">{tabs.find((tab) => tab.id === activeTab)?.label}</h5>
          <p className="text-xs text-gray-500 mt-1">Item yang dinonaktifkan tidak digunakan untuk kuis baru.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isPackageTab && (
            <button type="button" onClick={openCreatePackage} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#10C35D] text-white text-sm font-semibold hover:bg-green-600">
              <Plus size={16} />Tambah Paket
            </button>
          )}
          {isStandaloneTab && (
            <>
              <button type="button" onClick={openCreateQuestion} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#10C35D] text-white text-sm font-semibold hover:bg-green-600">
                <Plus size={16} />Tambah Soal
              </button>
              <button
                type="button"
                onClick={() => setShowExcelModal(true)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 text-sm font-semibold text-green-700 hover:bg-green-50"
              >
                <FileSpreadsheet size={15} />Impor Excel
              </button>
            </>
          )}
          <button type="button" onClick={loadItems} disabled={loading} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Muat ulang
          </button>
        </div>
      </div>

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={allSelectableSelected}
              onChange={(event) => toggleSelectAll(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 accent-[#10C35D]"
            />
            Pilih semua item
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-gray-500">
              {selectedItems.length} item dipilih
            </span>
            <button
              type="button"
              onClick={() => updateSelectedStatus(true)}
              disabled={selectedInactiveItems.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10C35D] px-3 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Power size={15} />
              Aktifkan ({selectedInactiveItems.length})
            </button>
            <button
              type="button"
              onClick={() => updateSelectedStatus(false)}
              disabled={selectedActiveItems.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Power size={15} />
              Nonaktifkan ({selectedActiveItems.length})
            </button>
            <button
              type="button"
              onClick={deleteSelectedItems}
              disabled={selectedInactiveItems.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 size={15} />
              Hapus ({selectedInactiveItems.length})
            </button>
          </div>
        </div>
      )}
      {loading || loadingPackage ? (
        <div className="py-12 text-center text-sm text-gray-500">
          {loadingPackage ? 'Memuat detail paket...' : 'Memuat bank soal...'}
        </div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">
          <Layers size={36} className="mx-auto mb-3 text-gray-300" />
          <h5 className="font-semibold text-gray-700">Belum Ada Item Soal</h5>
          <p className="text-sm text-gray-500 mt-1">
            {isPackageTab ? 'Tambahkan paket soal pertama untuk kategori ini.' : 'Item pada kategori ini akan ditampilkan di sini setelah dibuat.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const isPackage = item.type === 'package';
            const audioKey = `${item.type}-${item.id}`;
            const isPlayingAudio = playingAudioKey === audioKey;

            return (
              <div key={`${item.type}-${item.id}`} className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedKeys.includes(`${item.type}-${item.id}`)}
                  onChange={(event) => toggleSelectItem(item, event.target.checked)}
                  aria-label={`Pilih ${item.name || (isPackage ? 'Paket Soal' : 'Soal Mandiri')}`}
                  title='Pilih item untuk aksi massal'
                  className="h-4 w-4 shrink-0 rounded border-gray-300 accent-[#10C35D] disabled:cursor-not-allowed disabled:opacity-30"
                />
                <div className="w-10 h-10 rounded-lg bg-green-50 text-[#10C35D] flex items-center justify-center shrink-0">
                  {isPackage ? (category === 'listening' ? <Headphones size={20} /> : <BookOpen size={20} />) : <FileQuestion size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400">#{item.bank_number}</span>
                    <h6 className="font-semibold text-gray-800">{item.name || (isPackage ? 'Paket Soal' : 'Soal Mandiri')}</h6>
                    <span className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600">{isPackage ? 'Paket Soal' : 'Soal Mandiri'}</span>
                    <span className={`text-[11px] px-2 py-1 rounded-full font-semibold ${item.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <p className="text-xs text-gray-500">
                      {item.question_count || 0} soal
                    </p>

                    {category === 'listening' && item.audio_url && (
                      <button
                        type="button"
                        onClick={() => toggleAudioPreview(item)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-green-700 bg-green-50 hover:bg-green-100 transition-colors"
                        title={isPlayingAudio ? 'Jeda audio' : 'Preview audio'}
                      >
                        {isPlayingAudio
                          ? <Pause size={14} />
                          : <Play size={14} />}
                        {isPlayingAudio ? 'Jeda' : 'Putar Audio'}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {isPackage ? (
                    <>
                      <button type="button" onClick={() => openEditPackage(item)} disabled={item.is_active || loadingPackage} title={item.is_active ? 'Nonaktifkan paket sebelum mengedit' : 'Edit paket'} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                        <Pencil size={15} />Edit
                      </button>
                      <button type="button" onClick={() => deletePackage(item)} disabled={item.is_active} title={item.is_active ? 'Nonaktifkan paket sebelum menghapus' : 'Hapus paket'} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40">
                        <Trash2 size={15} />Hapus
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => openEditQuestion(item)} disabled={item.is_active} title={item.is_active ? 'Nonaktifkan soal sebelum mengedit' : 'Edit soal'} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                        <Pencil size={15} />Edit
                      </button>
                      <button type="button" onClick={() => deleteQuestion(item)} disabled={item.is_active} title={item.is_active ? 'Nonaktifkan soal sebelum menghapus' : 'Hapus soal'} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-sm text-red-600 hover:bg-red-50 disabled:opacity-40">
                        <Trash2 size={15} />Hapus
                      </button>
                    </>
                  )}
                  <button type="button" onClick={() => toggleStatus(item)} className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${item.is_active ? 'border border-amber-200 text-amber-700 hover:bg-amber-50' : 'bg-[#10C35D] text-white hover:bg-green-600'}`}>
                    <Power size={15} />{item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showExcelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-lg font-bold text-[#0a3d2e]">Impor Soal dari Excel</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tambahkan beberapa soal {categoryLabels[category]} sekaligus ke bank soal.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (importing) return;
                  setShowExcelModal(false);
                  setExcelFile(null);
                  if (excelInputRef.current) excelInputRef.current.value = '';
                }}
                disabled={importing}
                aria-label="Tutup modal"
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-40"
              >
                <span className="text-xl leading-none">Ãƒâ€”</span>
              </button>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-100 text-green-700">
                    <FileSpreadsheet size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-800">Template Soal Kuis</p>
                    <p className="text-xs text-gray-500">
                      Gunakan format kolom yang telah disediakan.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={downloadExcelTemplate}
                    disabled={downloadingTemplate}
                    className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-green-200 bg-white px-3 py-2 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:opacity-50"
                  >
                    {downloadingTemplate
                      ? <RefreshCw size={15} className="animate-spin" />
                      : <Download size={15} />}
                    Unduh
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Pilih file Excel
                </label>
                <input
                  ref={excelInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;

                    if (file && !file.name.toLowerCase().endsWith('.xlsx')) {
                      onNotify?.('File harus menggunakan format .xlsx.', 'error');
                      event.target.value = '';
                      setExcelFile(null);
                      return;
                    }

                    if (file && file.size > 5 * 1024 * 1024) {
                      onNotify?.('Ukuran file maksimal 5 MB.', 'error');
                      event.target.value = '';
                      setExcelFile(null);
                      return;
                    }

                    setExcelFile(file);
                  }}
                />

                <button
                  type="button"
                  onClick={() => excelInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 px-4 py-7 text-center hover:border-green-500 hover:bg-green-50"
                >
                  <Upload size={28} className="mb-2 text-green-700" />
                  <span className="text-sm font-semibold text-gray-800">
                    {excelFile ? 'Ganti file Excel' : 'Klik untuk memilih file Excel'}
                  </span>
                  <span className="mt-1 text-xs text-gray-500">
                    Format .xlsx · Maksimal 5 MB
                  </span>
                </button>

                {excelFile && (
                  <div className="mt-3 flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                    <FileSpreadsheet size={22} className="shrink-0 text-green-700" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">
                        {excelFile.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(excelFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setExcelFile(null);
                        if (excelInputRef.current) excelInputRef.current.value = '';
                      }}
                      className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
                Soal yang berhasil diimpor akan masuk sebagai <strong>Soal Mandiri</strong>
                {' '}dengan status <strong>Nonaktif</strong>. Pastikan setiap baris Excel
                berisi satu soal dan nama kolom tidak diubah.
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (importing) return;
                  setShowExcelModal(false);
                  setExcelFile(null);
                  if (excelInputRef.current) excelInputRef.current.value = '';
                }}
                disabled={importing}
                className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={importExcel}
                disabled={!excelFile || importing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {importing
                  ? <RefreshCw size={16} className="animate-spin" />
                  : <Upload size={16} />}
                {importing ? 'Mengimpor...' : 'Impor Soal'}
              </button>
            </div>
          </div>
        </div>
      )}
      {showPackageModal && (
        <PaketKuisModal
          category={category}
          initialData={editingPackage}
          saving={savingPackage}
          onClose={closePackageModal}
          onSave={savePackage}
        />
      )}

      {showQuestionModal && (
        <SoalMandiriModal
          initialData={editingQuestion}
          category={category}
          categoryLabel={categoryLabels[category]}
          saving={savingQuestion}
          onClose={closeQuestionModal}
          onSave={saveQuestion}
        />
      )}
    </div>
  );
}





