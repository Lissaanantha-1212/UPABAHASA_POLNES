import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Newspaper,
  CalendarDays,
  ArrowRight,
  MessageSquare,
  BookOpen,
  GraduationCap,
  RefreshCw,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import { adminFetch } from '../../adminSession';

const API_BASE = 'http://upabahasa-polnes-4p4a.vercel.app';

const ENDPOINTS = {
  complaints: `${API_BASE}/api/complaints/admin`,
  schedules: `${API_BASE}/api/schedules/admin`,
  posts: `${API_BASE}/api/cms/admin/posts`,
  ebooks: `${API_BASE}/api/ebooks`,
  quizzes: `${API_BASE}/api/quizzes/bank/items`,
};

const INITIAL_DATA = {
  complaints: [],
  schedules: [],
  posts: [],
  ebooks: [],
  quizzes: [],
};

const STATUS_CONFIG = [
  {
    key: 'menunggu',
    title: 'Menunggu Diproses',
    icon: Clock,
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    valueColor: 'text-amber-600',
  },
  {
    key: 'diproses',
    title: 'Sedang Diproses',
    icon: Loader,
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-600',
  },
  {
    key: 'perlu_dilengkapi',
    title: 'Perlu Dilengkapi',
    icon: AlertCircle,
    iconBg: 'bg-red-50',
    iconColor: 'text-red-500',
    valueColor: 'text-red-600',
  },
  {
    key: 'selesai',
    title: 'Selesai',
    icon: CheckCircle,
    iconBg: 'bg-green-50',
    iconColor: 'text-[#10C35D]',
    valueColor: 'text-[#0a8f48]',
  },
];

const cardStyle =
  'bg-white rounded-xl border border-gray-100 shadow-[0_2px_8px_rgba(15,23,42,0.04)] hover:shadow-[0_5px_16px_rgba(15,23,42,0.07)] transition-all duration-200';

const getStatusLabel = (status) => {
  const labels = {
    menunggu: 'Menunggu',
    diproses: 'Sedang Diproses',
    perlu_dilengkapi: 'Perlu Dilengkapi',
    selesai: 'Selesai',
  };

  return labels[status] || status || 'Tidak diketahui';
};

const getStatusStyle = (status) => {
  switch (status) {
    case 'menunggu':
      return 'bg-amber-50 text-amber-700';
    case 'diproses':
      return 'bg-blue-50 text-blue-700';
    case 'perlu_dilengkapi':
      return 'bg-red-50 text-red-700';
    case 'selesai':
      return 'bg-green-50 text-green-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const formatDate = (value) => {
  if (!value) return 'Tanggal tidak tersedia';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Tanggal tidak tersedia';
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  }).format(date);
};

export default function DashboardAdmin() {
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(INITIAL_DATA);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});

  // Mengambil data setiap modul secara terpisah.
  // Kegagalan satu endpoint tidak menghentikan endpoint lainnya.
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setErrors({});

    const resources = Object.entries(ENDPOINTS);

    const results = await Promise.all(
      resources.map(async ([key, url]) => {
        try {
          const response = await adminFetch(url, {
            method: 'GET',
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(
              result.message || `Gagal mengambil data ${key}.`
            );
          }

          if (!Array.isArray(result.data)) {
            throw new Error(`Format data ${key} tidak sesuai.`);
          }

          return {
            key,
            data: result.data,
            error: null,
          };
        } catch (error) {
          console.error(`Dashboard ${key} Error:`, error);

          return {
            key,
            data: null,
            error: error.message || `Gagal mengambil data ${key}.`,
          };
        }
      })
    );

    const nextData = { ...INITIAL_DATA };
    const nextErrors = {};

    results.forEach(({ key, data, error }) => {
      if (error) {
        nextErrors[key] = error;
      } else {
        nextData[key] = data;
      }
    });

    setDashboardData(nextData);
    setErrors(nextErrors);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // RINGKASAN PENGADUAN
  const complaintStats = STATUS_CONFIG.map((status) => ({
    ...status,
    value: dashboardData.complaints.filter(
      (complaint) => complaint.status === status.key
    ).length,
  }));

  // RINGKASAN JADWAL
  const draftSchedules = dashboardData.schedules.filter(
    (schedule) => schedule.status === 'draft'
  ).length;

  const publishedSchedules = dashboardData.schedules.filter(
    (schedule) => schedule.status === 'published'
  ).length;

  // RINGKASAN KONTEN
  const publishedPosts = dashboardData.posts.filter(
    (post) => post.status === 'published'
  ).length;

  // RINGKASAN PEMBELAJARAN
  const activeEbooks = dashboardData.ebooks.length;
  const totalQuizItems = dashboardData.quizzes.length;

  const quizPackages = dashboardData.quizzes.filter(
    (item) => item.type === 'package'
  ).length;

  const standaloneQuestions = dashboardData.quizzes.filter(
    (item) => item.type === 'standalone'
  ).length;

  // PENGADUAN TERBARU
  const recentComplaints = [...dashboardData.complaints]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() -
        new Date(a.created_at).getTime()
    )
    .slice(0, 3);

  // AKTIVITAS UPA BAHASA
  const activityStats = [
    {
      key: 'schedules',
      title: 'Jadwal Layanan',
      value: dashboardData.schedules.length,
      description: `${draftSchedules} draft · ${publishedSchedules} dipublikasikan`,
      icon: CalendarDays,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
    },
    {
      key: 'posts',
      title: 'Konten Terpublikasi',
      value: publishedPosts,
      description: 'Berita dan pengumuman',
      icon: Newspaper,
      iconBg: 'bg-green-50',
      iconColor: 'text-[#10C35D]',
    },
    {
      key: 'ebooks',
      title: 'E-Book',
      value: activeEbooks,
      description: 'Koleksi bahan bacaan',
      icon: BookOpen,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      key: 'quizzes',
      title: 'Bank Kuis',
      value: totalQuizItems,
      description: `${quizPackages} paket · ${standaloneQuestions} soal mandiri`,
      icon: GraduationCap,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
  ];

  const quickActions = [
    {
      title: 'Kelola Konten',
      description: 'Tambah dan perbarui berita, pengumuman, serta informasi website.',
      icon: Newspaper,
      iconBg: 'bg-green-50',
      iconColor: 'text-[#10C35D]',
      path: '/admin/konten',
    },
    {
      title: 'Atur Jadwal Layanan',
      description: 'Kelola informasi program dan jadwal pelaksanaan layanan.',
      icon: CalendarDays,
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-500',
      path: '/admin/layanan',
    },
    {
      title: 'Kelola Pembelajaran',
      description: 'Atur koleksi E-Book dan materi bank kuis.',
      icon: BookOpen,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      path: '/admin/pembelajaran',
    },
    {
      title: 'Kelola Pengaduan',
      description: 'Periksa dan tindak lanjuti pengaduan mahasiswa.',
      icon: MessageSquare,
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      path: '/admin/pengaduan',
    },
  ];

  const renderError = (key) => {
    if (!errors[key]) return null;

    return (
      <p className="text-xs text-red-500 mt-2 leading-relaxed">
        Data gagal dimuat: {errors[key]}
      </p>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0a3d2e]">
              Dashboard Admin
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Ringkasan aktivitas pengelolaan layanan dan informasi UPA Bahasa POLNES.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchDashboardData}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Perbarui Data
          </button>
        </div>

        {/* RINGKASAN PENGADUAN */}
        <section className={`${cardStyle} p-5 md:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-[#0a3d2e]">
                Ringkasan Pengaduan
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Status pengaduan yang masuk dari mahasiswa.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/admin/pengaduan')}
              className="text-sm font-semibold text-[#10C35D] hover:text-[#0a3d2e] flex items-center gap-1 transition-colors"
            >
              Lihat Pengaduan
              <ArrowRight size={15} />
            </button>
          </div>

          {errors.complaints ? (
            <div className="rounded-lg bg-red-50 border border-red-100 p-4">
              <p className="text-sm font-medium text-red-600">
                Ringkasan pengaduan tidak dapat dimuat.
              </p>
              {renderError('complaints')}
              <button
                type="button"
                onClick={fetchDashboardData}
                className="text-xs font-semibold text-red-600 underline mt-2"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {complaintStats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.key}
                    className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-3 shadow-[0_2px_6px_rgba(15,23,42,0.035)] hover:shadow-sm transition-shadow"
                  >
                    <div
                      className={`w-11 h-11 rounded-xl ${stat.iconBg} ${stat.iconColor} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">
                        {stat.title}
                      </p>
                      <h3 className={`text-2xl font-bold mt-0.5 ${stat.valueColor}`}>
                        {loading ? '—' : stat.value}
                      </h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* AKTIVITAS UPA BAHASA */}
        <section>
          <div className="mb-4">
            <h2 className="text-base font-bold text-[#0a3d2e]">
              Aktivitas UPA Bahasa
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Ringkasan jadwal, konten, dan pengelolaan pembelajaran.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {activityStats.map((item) => {
              const Icon = item.icon;
              const hasError = Boolean(errors[item.key]);

              return (
                <div
                  key={item.key}
                  className={`${cardStyle} p-5 flex items-center gap-4`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={22} />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm text-gray-500">
                      {item.title}
                    </p>
                    <h3 className="text-2xl font-bold text-[#0a3d2e] mt-0.5">
                      {loading || hasError ? '—' : item.value}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {loading ? 'Memuat data...' : hasError ? 'Data tidak tersedia' : item.description}
                    </p>
                    {renderError(item.key)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* PENGADUAN TERBARU DAN AKSES CEPAT */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* PENGADUAN TERBARU */}
          <section className={`${cardStyle} xl:col-span-2 p-5 md:p-6`}>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-bold text-[#0a3d2e]">
                  Pengaduan Terbaru
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Pengaduan yang baru disampaikan mahasiswa.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/admin/pengaduan')}
                className="text-sm font-semibold text-[#10C35D] hover:underline whitespace-nowrap"
              >
                Lihat Semua
              </button>
            </div>

            {errors.complaints ? (
              <div className="text-center py-10">
                <AlertCircle size={30} className="mx-auto text-red-300 mb-2" />
                <p className="text-sm text-red-500">
                  Data pengaduan terbaru gagal dimuat.
                </p>
              </div>
            ) : loading ? (
              <div className="text-center py-10">
                <Loader size={25} className="mx-auto text-[#10C35D] animate-spin mb-2" />
                <p className="text-sm text-gray-500">
                  Memuat pengaduan...
                </p>
              </div>
            ) : recentComplaints.length > 0 ? (
              <div className="space-y-3">
                {recentComplaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="p-4 rounded-lg border border-gray-100 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#10C35D] mb-1">
                          {complaint.ticket_number || 'Nomor tiket tidak tersedia'}
                        </p>

                        <h3 className="text-sm font-semibold text-gray-800">
                          {complaint.description || 'Tidak ada deskripsi pengaduan.'}
                        </h3>

                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(complaint.created_at)}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap self-start sm:self-center ${getStatusStyle(complaint.status)}`}
                      >
                        {getStatusLabel(complaint.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <MessageSquare
                  size={32}
                  className="mx-auto text-gray-300 mb-2"
                />
                <p className="text-sm text-gray-500">
                  Belum ada pengaduan masuk.
                </p>
              </div>
            )}
          </section>

          {/* AKSES CEPAT */}
          <section className={`${cardStyle} p-5 md:p-6`}>
            <div className="mb-5">
              <h2 className="text-base font-bold text-[#0a3d2e]">
                Akses Cepat
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Pintasan untuk mengelola website dan layanan.
              </p>
            </div>

            <div className="space-y-3">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <button
                    type="button"
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-green-200 hover:bg-[#F8FCF9] transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg ${action.iconBg} ${action.iconColor} flex items-center justify-center shrink-0`}
                      >
                        <Icon size={19} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-[#0a3d2e]">
                          {action.title}
                        </p>

                        <p className="text-xs text-gray-500 leading-relaxed mt-1">
                          {action.description}
                        </p>
                      </div>

                      <ArrowRight
                        size={15}
                        className="text-gray-400 group-hover:text-[#10C35D] mt-1 shrink-0"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {/* INFORMASI PENGELOLAAN */}
        <div className={`${cardStyle} p-4 flex items-start gap-3`}>
          <div className="w-10 h-10 rounded-lg bg-green-50 text-[#10C35D] flex items-center justify-center shrink-0">
            <BookOpen size={19} />
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[#0a3d2e]">
              Informasi Pengelolaan
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">
              Pastikan informasi website selalu diperbarui dan setiap
              pengaduan mahasiswa ditindaklanjuti sesuai statusnya.
              Periksa juga kelengkapan koleksi pembelajaran secara berkala.
            </p>
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
