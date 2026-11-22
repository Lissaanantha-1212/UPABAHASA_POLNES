
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminFetch } from '../../../adminSession';
import {
  ClipboardList,
  Users,
  Star,
  TrendingUp,
  Download,
  RefreshCw,
  MessageSquare,
  CalendarDays,
  AlertCircle,
  Loader2,
  FileSpreadsheet,
  BarChart3,
  Smile,
  Trash2,
  Eye,
  X
} from 'lucide-react';

import AdminLayout from '../../../layouts/AdminLayout';
import SurveiTabs from './components/SurveiTabs';
import KelolaAspek from './components/KelolaAspek';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/surveys';

const ratingColors = {
  'Sangat Baik': '#10C35D',
  'Baik': '#75B798',
  'Kurang Baik': '#F5B942',
  'Tidak Baik': '#EF6461'
};

// ======================================
// FORMAT TANGGAL
// ======================================
const formatDate = (date) => {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar'
  });
};

// ======================================
// FORMAT WAKTU
// ======================================
const formatTime = (date) => {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Makassar'
  }) + ' WITA';
};

// ======================================
// LABEL PENILAIAN
// ======================================
const getRatingLabel = (value) => {
  const labels = {
    4: 'Sangat Baik',
    3: 'Baik',
    2: 'Kurang Baik',
    1: 'Tidak Baik'
  };

  return labels[Number(value)] || '-';
};

// ======================================
// LABEL RATA-RATA
// ======================================
const getAverageLabel = (value) => {
  const average = Number(value) || 0;

  if (average >= 3.5) return 'Sangat Baik';
  if (average >= 2.5) return 'Baik';
  if (average >= 1.5) return 'Kurang Baik';
  if (average > 0) return 'Tidak Baik';

  return 'Belum ada penilaian';
};

// ======================================
// MEMBACA NILAI ASPEK RESPONDEN
// ======================================
const getSurveyRating = (survey, aspectKey) => {
  return survey?.aspects?.find(
    (aspect) => aspect.aspectKey === aspectKey
  )?.rating ?? null;
};

export default function AdminSurvei() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [aspects, setAspects] = useState([]);

  const [surveyData, setSurveyData] = useState([]);

  const [summary, setSummary] = useState({
    totalResponses: 0,
    averages: {},
    overallAverage: 0
  });

  const [distribution, setDistribution] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedSurvey, setSelectedSurvey] = useState(null);

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');


  // ======================================
  // MENGAMBIL DATA REKAP SURVEI ADMIN
  // ======================================
  const fetchSurveyData = useCallback(async (isRefresh = false) => {

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const response = await adminFetch(`${API_URL}/admin`, {
        method: 'GET'
      });

      const result = await response.json();


      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil data survei.'
        );
      }

      const responses = Array.isArray(result.data)
        ? result.data
        : [];

      setSurveyData(responses);
      setSummary(result.summary || {
        totalResponses: 0,
        averages: {},
        overallAverage: 0
      });

      setDistribution(result.distribution || {});
      setAspects(Array.isArray(result.aspects) ? result.aspects : []);

      // Bersihkan pilihan yang sudah tidak ada
      const currentIds = new Set(
        responses.map((item) => item.id)
      );

      setSelectedIds((prev) =>
        prev.filter((id) => currentIds.has(id))
      );

      // Perbarui data modal jika masih tersedia
      setSelectedSurvey((prev) => {
        if (!prev) return null;

        const updatedSurvey = responses.find(
          (item) => item.id === prev.id
        );

        return updatedSurvey || null;
      });

    } catch (err) {
      console.error('Gagal mengambil data survei:', err);
      setError(
        err.message || 'Terjadi kesalahan saat mengambil data survei.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchSurveyData();
  }, [fetchSurveyData]);

  // ======================================
  // PILIH SATU TANGGAPAN
  // ======================================
  const handleSelectSurvey = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : [...prev, id]
    );
  };

  // ======================================
  // PILIH SEMUA TANGGAPAN
  // ======================================
  const handleSelectAll = () => {
    if (selectedIds.length === surveyData.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(surveyData.map((item) => item.id));
    }
  };

  const isAllSelected =
    surveyData.length > 0 &&
    selectedIds.length === surveyData.length;

  // ======================================
  // HAPUS SATU ATAU BEBERAPA TANGGAPAN
  // ======================================
  const handleDeleteSurveys = async (ids) => {
    if (!ids.length || deleting) return;

    const confirmation = window.confirm(
      ids.length === 1
        ? 'Apakah kamu yakin ingin menghapus tanggapan survei ini? Data yang dihapus tidak dapat dikembalikan.'
        : `Apakah kamu yakin ingin menghapus ${ids.length} tanggapan survei yang dipilih? Data yang dihapus tidak dapat dikembalikan.`
    );

    if (!confirmation) return;


    try {
      setDeleting(true);
      setError('');
      setSuccessMessage('');

      const response = await adminFetch(`${API_URL}/admin`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ids })
      });

      const result = await response.json();


      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menghapus tanggapan survei.'
        );
      }

      setSelectedIds([]);

      if (selectedSurvey && ids.includes(selectedSurvey.id)) {
        setSelectedSurvey(null);
      }

      await fetchSurveyData(true);

      setSuccessMessage(
        result.message || 'Tanggapan survei berhasil dihapus.'
      );

    } catch (err) {
      console.error('Error menghapus survei:', err);
      setError(err.message || 'Gagal menghapus tanggapan survei.');
    } finally {
      setDeleting(false);
    }
  };

  // ======================================
  // EKSPOR DATA KE EXCEL
  // ======================================
  const handleExportExcel = async () => {

    try {
      setExporting(true);
      setError('');

      const response = await adminFetch(`${API_URL}/admin/export`, {
        method: 'GET'
      });


      if (!response.ok) {
        let message = 'Gagal mengunduh file Excel.';

        try {
          const result = await response.json();
          message = result.message || message;
        } catch {
          // Respons bukan JSON
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      const fileUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = 'Rekap_Survei_UPA_Bahasa.xlsx';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(fileUrl);

      setSuccessMessage('Rekap survei berhasil diunduh.');

      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

    } catch (err) {
      console.error('Error ekspor survei:', err);
      setError(err.message || 'Gagal mengunduh rekap survei.');
    } finally {
      setExporting(false);
    }
  };

  // ======================================
  // KOMPONEN KARTU RINGKASAN
  // ======================================
  const summaryCards = [
    {
      title: 'Total Responden',
      value: summary.totalResponses || 0,
      description: 'Jumlah survei yang masuk',
      icon: Users,
      iconBg: 'bg-green-50',
      iconColor: 'text-[#10C35D]'
    },
    {
      title: 'Rata-rata Kepuasan',
      value: Number(summary.overallAverage || 0).toFixed(2),
      description: getAverageLabel(summary.overallAverage),
      icon: Star,
      iconBg: 'bg-yellow-50',
      iconColor: 'text-yellow-500'
    },
    {
      title: 'Aspek Penilaian',
      value: aspects.length,
      description: 'Indikator kualitas layanan',
      icon: BarChart3,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500'
    }
  ];

  // ======================================
  // TAMPILAN LOADING
  // ======================================
  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <Loader2
            size={38}
            className="animate-spin text-[#10C35D] mb-4"
          />
          <p className="text-sm text-gray-500">
            Memuat data survei...
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 pb-8">

        {/* HEADER HALAMAN */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[#10C35D] mb-2">
              <ClipboardList size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Manajemen Layanan Pengguna
              </span>
            </div>

            <h1 className="text-2xl font-bold text-[#0a3d2e]">
              Manajemen Survei
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Pantau hasil penilaian dan kepuasan mahasiswa terhadap layanan UPA Bahasa.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fetchSurveyData(true)}
              disabled={refreshing || deleting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60 transition"
            >
              <RefreshCw
                size={16}
                className={refreshing ? 'animate-spin' : ''}
              />
              Muat Ulang
            </button>

            <button
              type="button"
              onClick={handleExportExcel}
              disabled={exporting || surveyData.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#10C35D] text-white text-sm font-semibold hover:bg-[#0DAA50] disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              {exporting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Download size={17} />
              )}
              {exporting ? 'Mengunduh...' : 'Ekspor Excel'}
            </button>
          </div>
        </div>

        {/* NAVIGASI TAB */}
        <SurveiTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* NOTIFIKASI */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
            <AlertCircle
              size={19}
              className="text-red-500 shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-red-700">
                Terjadi Kesalahan
              </p>
              <p className="text-sm text-red-600 mt-1">
                {error}
              </p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
            <FileSpreadsheet size={18} />
            {successMessage}
          </div>
        )}

        {/* =====================================
            TAB DASHBOARD
        ====================================== */}
        {activeTab === 'dashboard' && (
          <>
            {/* RINGKASAN SURVEI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {summaryCards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <div
                    key={index}
                    className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500 font-medium">
                          {card.title}
                        </p>

                        <h2 className="text-3xl font-bold text-[#0a3d2e] mt-2">
                          {card.value}
                        </h2>
                      </div>

                      <div
                        className={`w-12 h-12 rounded-xl ${card.iconBg} ${card.iconColor} flex items-center justify-center`}
                      >
                        <Icon size={23} />
                      </div>
                    </div>

                    <p className="text-xs text-gray-400">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* RATA-RATA SETIAP ASPEK */}
            <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp size={19} className="text-[#10C35D]" />

                <div>
                  <h2 className="font-bold text-[#0a3d2e]">
                    Rata-rata Penilaian Layanan
                  </h2>

                  <p className="text-xs text-gray-400 mt-1">
                    Skala penilaian 1 sampai 4
                  </p>
                </div>
              </div>

              {summary.totalResponses > 0 ? (
                <div className="space-y-5">
                  {aspects.map((aspect) => {
                    const average = Number(
                      summary.averages?.[aspect.aspectKey] || 0
                    );

                    const percentage = (average / 4) * 100;

                    return (
                      <div key={aspect.id}>
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {aspect.label}
                          </span>

                          <div className="text-right">
                            <span className="text-sm font-bold text-[#0a3d2e]">
                              {average.toFixed(2)}
                            </span>

                            <span className="text-xs text-gray-400 ml-1">
                              / 4
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#10C35D] rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>

                        <p className="text-xs text-gray-400 mt-1.5">
                          {getAverageLabel(average)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <BarChart3
                    size={35}
                    className="mx-auto text-gray-300 mb-3"
                  />

                  <p className="text-sm text-gray-500">
                    Belum ada data penilaian.
                  </p>
                </div>
              )}
            </section>

            {/* DISTRIBUSI PENILAIAN */}
            <section className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <BarChart3 size={19} className="text-[#10C35D]" />

                <div>
                  <h2 className="font-bold text-[#0a3d2e]">
                    Distribusi Penilaian
                  </h2>

                  <p className="text-xs text-gray-400 mt-1">
                    Jumlah jawaban berdasarkan kategori penilaian
                  </p>
                </div>
              </div>

              {summary.totalResponses > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {aspects.map((aspect) => {
                    const aspectDistribution =
                      distribution[aspect.aspectKey] || {};

                    return (
                      <div
                        key={aspect.id}
                        className="border border-gray-100 rounded-xl p-4"
                      >
                        <h3 className="text-sm font-bold text-[#0a3d2e] mb-4">
                          {aspect.label}
                        </h3>

                        <div className="space-y-3">
                          {Object.entries(ratingColors).map(([rating, color]) => {
                            const count = Number(
                              aspectDistribution[rating] || 0
                            );

                            const percentage = summary.totalResponses
                              ? (count / summary.totalResponses) * 100
                              : 0;

                            return (
                              <div key={rating}>
                                <div className="flex items-center justify-between text-xs mb-1.5 gap-2">
                                  <span className="text-gray-600">
                                    {rating}
                                  </span>

                                  <span className="font-semibold text-gray-700">
                                    {count} responden
                                  </span>
                                </div>

                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{
                                      width: `${percentage}%`,
                                      backgroundColor: color
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <ClipboardList
                    size={35}
                    className="mx-auto text-gray-300 mb-3"
                  />

                  <p className="text-sm text-gray-500">
                    Distribusi penilaian belum tersedia.
                  </p>
                </div>
              )}
            </section>

            {/* TABEL HASIL SURVEI */}
            <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">

              {/* HEADER TABEL */}
              <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MessageSquare size={19} className="text-[#10C35D]" />

                  <div>
                    <h2 className="font-bold text-[#0a3d2e]">
                      Data Hasil Survei
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                      Seluruh tanggapan yang telah dikirimkan mahasiswa
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSurveys(selectedIds)}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs font-semibold hover:bg-red-100 disabled:opacity-50 transition"
                    >
                      {deleting ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      {deleting
                        ? 'Menghapus...'
                        : `Hapus ${selectedIds.length} Data`}
                    </button>
                  )}

                  <span className="text-xs font-semibold text-[#0a3d2e] bg-green-50 px-3 py-2 rounded-lg">
                    {surveyData.length} Respons
                  </span>
                </div>
              </div>

              {surveyData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1150px] text-left">

                    {/* HEADER KOLOM */}
                    <thead className="bg-gray-50">
                      <tr className="text-xs text-gray-500">
                        <th className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleSelectAll}
                            disabled={deleting}
                            className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                            title="Pilih semua tanggapan"
                          />
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          No.
                        </th>

                        <th className="px-5 py-4 font-semibold">
                          Tanggal
                        </th>

                        {aspects.map((aspect) => (
                          <th
                            key={aspect.id}
                            className="px-5 py-4 font-semibold"
                          >
                            {aspect.label}
                          </th>
                        ))}

                        <th className="px-5 py-4 font-semibold">
                          Komentar / Saran
                        </th>

                        <th className="px-5 py-4 font-semibold text-center">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    {/* ISI TABEL */}
                    <tbody className="divide-y divide-gray-100">
                      {surveyData.map((item, index) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            selectedIds.includes(item.id)
                              ? 'bg-green-50/50'
                              : 'hover:bg-gray-50/70'
                          }`}
                        >
                          {/* CHECKBOX */}
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(item.id)}
                              onChange={() => handleSelectSurvey(item.id)}
                              disabled={deleting}
                              className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                              aria-label={`Pilih tanggapan nomor ${index + 1}`}
                            />
                          </td>

                          {/* NOMOR */}
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {index + 1}
                          </td>

                          {/* TANGGAL */}
                          <td className="px-5 py-4 text-xs text-gray-600 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <CalendarDays
                                size={14}
                                className="text-gray-400"
                              />

                              {formatDate(item.created_at)}
                            </div>
                          </td>

                          {/* NILAI ASPEK DINAMIS */}
                          {aspects.map((aspect) => (
                            <td
                              key={aspect.id}
                              className="px-5 py-4"
                            >
                              <span className="text-xs font-medium text-gray-600">
                                {getRatingLabel(
                                  getSurveyRating(item, aspect.aspectKey)
                                )}
                              </span>
                            </td>
                          ))}

                          {/* KOMENTAR */}
                          <td className="px-5 py-4 text-xs text-gray-600 max-w-[240px]">
                            {item.comment?.trim() ? (
                              <p
                                className="line-clamp-2 break-words leading-relaxed"
                                title={item.comment}
                              >
                                {item.comment}
                              </p>
                            ) : (
                              <span className="text-gray-400 italic">
                                Tidak ada komentar
                              </span>
                            )}
                          </td>

                          {/* AKSI */}
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedSurvey(item)}
                                title="Lihat detail tanggapan"
                                aria-label="Lihat detail tanggapan"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#10C35D] hover:bg-green-50 hover:text-[#0DAA50] transition"
                              >
                                <Eye size={16} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteSurveys([item.id])}
                                disabled={deleting}
                                title="Hapus tanggapan"
                                aria-label="Hapus tanggapan"
                                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition"
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
              ) : (
                <div className="py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <ClipboardList
                      size={27}
                      className="text-gray-300"
                    />
                  </div>

                  <h3 className="text-sm font-bold text-gray-700">
                    Belum Ada Respons Survei
                  </h3>

                  <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto">
                    Data survei yang dikirimkan mahasiswa akan muncul di halaman ini.
                  </p>
                </div>
              )}
            </section>

            {/* KETERANGAN */}
            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
              <Smile
                size={19}
                className="text-[#10C35D] shrink-0 mt-0.5"
              />

              <p className="text-xs text-green-800 leading-relaxed">
                Survei bersifat anonim. Data yang ditampilkan merupakan hasil
                penilaian dan komentar mahasiswa tanpa menampilkan identitas
                pribadi responden.
              </p>
            </div>
          </>
        )}

        {/* =====================================
            TAB KELOLA ASPEK
        ====================================== */}
        {activeTab === 'aspek' && (
          <KelolaAspek
            onDataChanged={() => fetchSurveyData(true)}
          />
        )}

        {/* =====================================
            MODAL DETAIL TANGGAPAN SURVEI
        ====================================== */}
        {selectedSurvey && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedSurvey(null)}
          >
            <div
              className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >

              {/* HEADER MODAL */}
              <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                    <MessageSquare
                      size={20}
                      className="text-[#10C35D]"
                    />
                  </div>

                  <div>
                    <h2 className="font-bold text-[#0a3d2e]">
                      Detail Tanggapan Survei
                    </h2>

                    <p className="text-xs text-gray-400 mt-1">
                      Informasi tanggapan anonim mahasiswa
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSurvey(null)}
                  className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                  aria-label="Tutup detail"
                >
                  <X size={20} />
                </button>
              </div>

              {/* ISI MODAL */}
              <div className="p-5 space-y-5 overflow-y-auto">

                {/* INFORMASI WAKTU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CalendarDays size={16} />

                      <span className="text-xs font-medium">
                        Tanggal Pengisian
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#0a3d2e]">
                      {formatDate(selectedSurvey.created_at)}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <CalendarDays size={16} />

                      <span className="text-xs font-medium">
                        Waktu Pengisian
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#0a3d2e]">
                      {formatTime(selectedSurvey.created_at)}
                    </p>
                  </div>
                </div>

                {/* PENILAIAN DINAMIS */}
                <div>
                  <h3 className="text-sm font-bold text-[#0a3d2e] mb-3">
                    Hasil Penilaian
                  </h3>

                  <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
                    {(selectedSurvey.aspects || []).map((aspect) => (
                      <div
                        key={aspect.aspectId || aspect.aspectKey}
                        className="flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <span className="text-sm text-gray-600">
                          {aspect.aspectLabel}
                        </span>

                        <span className="text-xs font-semibold text-[#0a3d2e] bg-green-50 px-3 py-1.5 rounded-lg">
                          {getRatingLabel(aspect.rating)}
                        </span>
                      </div>
                    ))}

                    {(!selectedSurvey.aspects ||
                      selectedSurvey.aspects.length === 0) && (
                      <p className="px-4 py-5 text-sm text-gray-400 text-center">
                        Data penilaian tidak tersedia.
                      </p>
                    )}
                  </div>
                </div>

                {/* KOMENTAR DAN SARAN */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageSquare
                      size={17}
                      className="text-[#10C35D]"
                    />

                    <h3 className="text-sm font-bold text-[#0a3d2e]">
                      Saran dan Komentar
                    </h3>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 min-h-[100px] max-h-64 overflow-y-auto">
                    {selectedSurvey.comment?.trim() ? (
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
                        {selectedSurvey.comment}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400 italic">
                        Responden tidak memberikan saran atau komentar.
                      </p>
                    )}
                  </div>
                </div>

                {/* KETERANGAN ANONIM */}
                <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                  <Smile
                    size={17}
                    className="text-[#10C35D] shrink-0 mt-0.5"
                  />

                  <p className="text-xs text-green-800 leading-relaxed">
                    Tanggapan ini bersifat anonim. Identitas pribadi responden
                    tidak ditampilkan.
                  </p>
                </div>
              </div>

              {/* FOOTER MODAL */}
              <div className="p-4 border-t border-gray-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedSurvey(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#10C35D] text-white text-sm font-semibold hover:bg-[#0DAA50] transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
