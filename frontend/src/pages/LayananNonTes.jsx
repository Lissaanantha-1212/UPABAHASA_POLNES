
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import heroImage from '../assets/news-1.jpg';
import {
  ArrowRight,
  GraduationCap,
  Info,
  CalendarDays,
  Clock3,
  FileText,
  Globe,
  BookOpen,
  Briefcase,
} from 'lucide-react';
import ProgramInfo from './layanan-non-tes/components/ProgramInfo';
import ProgramSchedule from './layanan-non-tes/components/ProgramSchedule';
import RegistrationFlow from './layanan-non-tes/components/RegistrationFlow';
import RegistrationForm from './layanan-non-tes/components/RegistrationForm';
import StatusBadge from './layanan-non-tes/components/StatusBadge';


// ==========================================
// FORMULIR PENDAFTARAN
// ==========================================

const initialForm = {
  nama: '',
  nim: '',
  kelas: '',
  prodi: '',
  semester: '',
  noWa: '',
};

const API_PROGRAM_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/non-test-programs';
const API_REGISTRATION_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/registrations';
const API_PUBLIC_SCHEDULE_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/schedules';

// Identitas visual program tetap mengikuti desain frontend.
const PROGRAM_METADATA = {
  inggris: {
    slug: 'kursus-inggris',
    name: 'Kursus Bahasa Inggris',
    shortName: 'Bahasa Inggris',
    icon: Globe,
    schedule: [],
  },
  mandarin: {
    slug: 'kursus-mandarin',
    name: 'Kursus Bahasa Mandarin',
    shortName: 'Bahasa Mandarin',
    icon: BookOpen,
    schedule: [],
  },
  jsst: {
    slug: 'jsst',
    name: 'Job Seeking Skills Training (JSST)',
    shortName: 'JSST',
    icon: Briefcase,
    schedule: [],
  },
};

// Format tanggal mengikuti kalender lokal Indonesia.
function formatProgramDate(value) {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Makassar',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatScheduleDate(value) {
  if (!value) return '';

  const dateValue = /^\d{4}-\d{2}-\d{2}$/.test(String(value))
    ? `${value}T00:00:00+08:00`
    : value;

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Makassar',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Mengubah data API agar sesuai dengan struktur komponen lama.
function mapProgramFromApi(item) {
  const entry = Object.entries(PROGRAM_METADATA).find(
    ([, metadata]) => metadata.slug === item.slug
  );

  if (!entry) return null;

  const [programId, metadata] = entry;

  const startDate = formatProgramDate(item.reg_start);
  const endDate = formatProgramDate(item.reg_end);

  return {
    id: programId,
    databaseId: Number(item.id),
    name: metadata.name,
    shortName: metadata.shortName,
    icon: metadata.icon,

    description: item.description?.trim() || '',

    benefits: Array.isArray(item.benefits)
      ? item.benefits
      : [],

    requirements: Array.isArray(item.requirements)
      ? item.requirements
      : [],

    registrationFlow: Array.isArray(item.registration_flow)
      ? item.registration_flow
      : [],

    registrationPeriod: startDate || 'Belum ditentukan',
    deadline: endDate || 'Belum ditentukan',

    status: item.status || 'upcoming',

    schedule: metadata.schedule,
  };
}

// ==========================================
// HELPER
// ==========================================

function getProgramFromPath(pathname) {
  if (pathname.includes('mandarin')) return 'mandarin';
  if (pathname.includes('jsst')) return 'jsst';

  return 'inggris';
}

// ==========================================
// HALAMAN LAYANAN NON-TES
// ==========================================

export default function LayananNonTes() {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState(() =>
    getProgramFromPath(location.pathname)
  );

  const [formData, setFormData] = useState(initialForm);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [majorsList, setMajorsList] = useState([]);

  const [programsData, setProgramsData] = useState({});
  const [programsLoading, setProgramsLoading] = useState(true);
  const [programsError, setProgramsError] = useState('');
  const [publicSchedules, setPublicSchedules] = useState([]);
  const [downloadingScheduleId, setDownloadingScheduleId] = useState(null);

  // ======================================
  // ======================================
  // MENGAMBIL DATA PROGRAM STUDI
  // ======================================

  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const response = await fetch(
          'http://upabahasa-polnes-4p4a.vercel.app/api/majors'
        );

        const data = await response.json();

        if (response.ok && Array.isArray(data.data)) {
          setMajorsList(data.data);
        }
      } catch (error) {
        console.error(
          'Gagal mengambil data program studi:',
          error
        );
      }
    };

    fetchMajors();
  }, []);
  // ======================================
  // MENGAMBIL DATA PROGRAM DARI DATABASE
  // ======================================

  useEffect(() => {
    let activeProgramController = null;
    let activeScheduleController = null;

    let programRequestId = 0;
    let scheduleRequestId = 0;

    let midnightTimeoutId;
    let lastRefreshAt = 0;

    const fetchPrograms = async (isInitial = false) => {
      if (activeProgramController) {
        activeProgramController.abort();
      }

      const controller = new AbortController();
      activeProgramController = controller;

      const requestId = ++programRequestId;

      try {
        if (isInitial) {
          setProgramsLoading(true);
          setProgramsError('');
        }

        const response = await fetch(API_PROGRAM_URL, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (requestId !== programRequestId) return;

        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(
            result.message || 'Gagal mengambil informasi program.'
          );
        }

        const mappedPrograms = {};

        result.data.forEach((item) => {
          const program = mapProgramFromApi(item);

          if (program) {
            mappedPrograms[program.id] = program;
          }
        });

        if (Object.keys(mappedPrograms).length !== 3) {
          throw new Error('Data program belum lengkap.');
        }

        if (requestId !== programRequestId) return;

        setProgramsData(mappedPrograms);
        setProgramsError('');

      } catch (error) {
        if (
          error.name !== 'AbortError' &&
          requestId === programRequestId
        ) {
          console.error('Gagal mengambil data program:', error);

          if (isInitial) {
            setProgramsError(error.message);
          }
        }
      } finally {
        if (requestId === programRequestId) {
          setProgramsLoading(false);
          activeProgramController = null;
        }
      }
    };

    const fetchPublicSchedules = async () => {
      if (activeScheduleController) {
        activeScheduleController.abort();
      }

      const controller = new AbortController();
      activeScheduleController = controller;

      const requestId = ++scheduleRequestId;

      try {
        const response = await fetch(API_PUBLIC_SCHEDULE_URL, {
          signal: controller.signal,
        });

        const result = await response.json();

        if (requestId !== scheduleRequestId) return;

        if (
          !response.ok ||
          !result.success ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            result.message || 'Gagal mengambil jadwal pelaksanaan.'
          );
        }

        setPublicSchedules(result.data);

      } catch (error) {
        if (
          error.name !== 'AbortError' &&
          requestId === scheduleRequestId
        ) {
          console.error('Gagal mengambil jadwal publik:', error);
        }
      } finally {
        if (requestId === scheduleRequestId) {
          activeScheduleController = null;
        }
      }
    };

    const refreshAllData = () => {
      fetchPrograms(false);
      fetchPublicSchedules();
    };

    // Ambil data program dan jadwal ketika halaman pertama dibuka.
    lastRefreshAt = Date.now();
    fetchPrograms(true);
    fetchPublicSchedules();

    // Perbarui status pendaftaran ketika memasuki tanggal baru WITA.
    const scheduleNextMidnight = () => {
      const now = new Date();

      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Makassar',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(now);

      const year = Number(parts.find((part) => part.type === 'year').value);
      const month = Number(parts.find((part) => part.type === 'month').value);
      const day = Number(parts.find((part) => part.type === 'day').value);

      const nextMidnight = Date.UTC(
        year,
        month - 1,
        day + 1,
        -8,
        0,
        0
      );

      const delay = Math.max(1000, nextMidnight - Date.now() + 250);

      midnightTimeoutId = window.setTimeout(() => {
        lastRefreshAt = Date.now();
        refreshAllData();
        scheduleNextMidnight();
      }, delay);
    };

    scheduleNextMidnight();

    // Perbarui data saat pengguna kembali ke halaman.
    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (Date.now() - lastRefreshAt < 1500) return;

      lastRefreshAt = Date.now();
      refreshAllData();
    };

    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      programRequestId++;
      scheduleRequestId++;

      if (activeProgramController) {
        activeProgramController.abort();
      }

      if (activeScheduleController) {
        activeScheduleController.abort();
      }

      window.clearTimeout(midnightTimeoutId);

      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  // UPDATE PROGRAM KETIKA URL BERUBAH
  // ======================================

  useEffect(() => {
    setActiveTab(getProgramFromPath(location.pathname));
    setSubmissionStatus('');
    setSubmissionMessage('');
    setFormData(initialForm);

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [location.pathname]);

  // ======================================
  // HILANGKAN NOTIFIKASI PENDAFTARAN
  // ======================================

  useEffect(() => {
    if (
      submissionStatus !== 'success' &&
      submissionStatus !== 'duplicate'
    ) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSubmissionStatus('');
      setSubmissionMessage('');
    }, 6000);

    return () => window.clearTimeout(timeoutId);
  }, [submissionStatus]);

  // ======================================
  // DATA PROGRAM AKTIF
  // ======================================

  const selectedProgram =
    programsData[activeTab] || programsData.inggris;

  const currentProgram = selectedProgram
    ? {
        ...selectedProgram,
        schedule: publicSchedules
          .filter(
            (item) =>
              Number(item.program_id) === Number(selectedProgram.databaseId)
          )
          .map((item) => ({
            id: item.id,
            session: item.session_name || '',
            date: formatScheduleDate(item.date) || 'Belum ditentukan',
            time: item.start_time && item.end_time
              ? `${String(item.start_time).slice(0, 5)} - ${String(item.end_time).slice(0, 5)}`
              : 'Belum ditentukan',
            location: item.location || 'Belum ditentukan',
            participantCount: item.participant_count,
            participants: Array.isArray(item.participants)
              ? item.participants
              : [],
          })),
      }
    : null;

  // TAMPILAN SAAT DATA SEDANG DIMUAT
  if (programsLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#F7FAF8]">
        <p className="text-sm font-medium text-[#0a3d2e]">
          Memuat informasi program UPA Bahasa...
        </p>
      </main>
    );
  }

  // TAMPILAN JIKA API GAGAL
  if (programsError || !currentProgram) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#F7FAF8] px-5 text-center">
        <p className="font-bold text-[#0a3d2e]">
          Informasi program belum dapat ditampilkan.
        </p>

        <p className="text-sm text-gray-500">
          {programsError || 'Data program tidak ditemukan.'}
        </p>

        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-xl bg-[#10C35D] px-5 py-2.5 text-sm font-bold text-white"
        >
          Coba Lagi
        </button>
      </main>
    );
  }

  const ProgramIcon = currentProgram.icon;


  // ======================================
  // INPUT FORM
  // ======================================

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ======================================
  // PINDAH PROGRAM
  // ======================================

  const handleTabChange = (programId) => {
    setActiveTab(programId);
    setSubmissionStatus('');
    setSubmissionMessage('');
    setFormData(initialForm);
  };

  // ======================================
  // SUBMIT FORM KE BACKEND
  // ======================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!formData.prodi) {
      setSubmissionStatus('error');
      setSubmissionMessage(
        'Silakan pilih Program Studi dari daftar yang tersedia.'
      );
      return;
    }

    if (!currentProgram.databaseId) {
      setSubmissionStatus('error');
      setSubmissionMessage(
        'ID program tidak ditemukan. Silakan muat ulang halaman.'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmissionStatus('');
    setSubmissionMessage('');

    try {
      const payload = {
        program_id: Number(currentProgram.databaseId),
        major_id: Number(formData.prodi),
        name: formData.nama.trim(),
        nim: formData.nim.trim(),
        class: formData.kelas.trim(),
        semester: Number(formData.semester),
        phone: formData.noWa.trim(),
      };

      const response = await fetch(API_REGISTRATION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Pendaftaran gagal dikirim.'
        );
      }

      setSubmissionStatus(
        result.data?.possible_duplicate ? 'duplicate' : 'success'
      );

      setSubmissionMessage(
        result.message || 'Pendaftaran berhasil dikirim.'
      );

      setFormData(initialForm);

    } catch (error) {
      console.error('Gagal mengirim pendaftaran:', error);

      setSubmissionStatus('error');
      setSubmissionMessage(
        error.message ||
        'Tidak dapat menghubungi server. Silakan coba kembali.'
      );

    } finally {
      setIsSubmitting(false);
    }
  };

  // ======================================
  // UNDUH JADWAL EXCEL
  // ======================================

  const handleDownloadSchedule = async (scheduleId) => {
    if (!scheduleId || downloadingScheduleId !== null) return;

    setDownloadingScheduleId(scheduleId);

    try {
      const response = await fetch(
        `${API_PUBLIC_SCHEDULE_URL}/download/${scheduleId}?format=xlsx`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.message || 'File jadwal gagal diunduh.'
        );
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const contentDisposition = response.headers.get('content-disposition');
      const filenameMatch = contentDisposition?.match(/filename="?([^"]+)"?/i);

      const filename = filenameMatch?.[1]
        || `jadwal-${scheduleId}.xlsx`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error('Gagal mengunduh jadwal:', error);
      window.alert(error.message || 'Terjadi kesalahan saat mengunduh jadwal.');

    } finally {
      setDownloadingScheduleId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#F7FAF8] pb-16">

      {/* ======================================
          1. HERO
      ====================================== */}

      <section className="relative isolate overflow-hidden bg-[#0a3d2e] text-white">

        {/* FOTO BACKGROUND */}

        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="UPA Bahasa POLNES"
            className="w-full h-full object-cover object-center"
          />

          <div className="absolute inset-0 bg-[#0A3D2E]/60" />

          <div className="absolute inset-0 bg-gradient-to-r from-[#073d2c]/10 via-[#0a5938]/80 to-[#0a5938]/40" />
        </div>

        {/* ORNAMEN */}

        <div className="pointer-events-none absolute -right-20 -top-36 h-96 w-96 rounded-full bg-[#10C35D]/15 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-[-5rem] h-80 w-80 rounded-full bg-[#10C35D]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 pb-20 pt-14 md:px-8 md:pb-24 md:pt-16">

          <div className="mx-auto max-w-3xl text-center">

            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[11px] font-semibold tracking-wide text-green-100 backdrop-blur-sm">
              <GraduationCap size={14} />
              PENGEMBANGAN KOMPETENSI
            </span>

            <h1 className="mt-5 text-3xl font-bold tracking-tight md:text-4xl lg:text-[2.7rem]">
              Layanan Non-Tes
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-green-50/90 md:text-base">
              Program pembelajaran dan pelatihan untuk mengembangkan
              kompetensi bahasa, keterampilan komunikasi, serta kesiapan
              mahasiswa menghadapi dunia profesional.
            </p>

            <a
              href="#pilih-program"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0a3d2e] transition hover:bg-green-50"
            >
              Jelajahi Program
              <ArrowRight size={16} />
            </a>

          </div>
        </div>

        <div className="absolute bottom-0 left-0 h-10 w-full rounded-t-[2rem] bg-[#F7FAF8]" />

      </section>

      {/* ======================================
          2. KONTEN UTAMA
      ====================================== */}

      <div className="relative z-10 mx-auto -mt-8 max-w-7xl px-5 md:px-8">

        {/* ======================================
            3. PILIH PROGRAM
        ====================================== */}

        <section
          id="pilih-program"
          aria-label="Pilih program"
          className="mb-7 scroll-mt-24 rounded-2xl border border-gray-100 bg-white p-2.5 shadow-[0_12px_35px_rgba(10,61,46,0.08)]"
        >

          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">

            {Object.values(programsData).map((program) => {
              const Icon = program.icon;
              const isActive = activeTab === program.id;

              return (
                <button
                  key={program.id}
                  type="button"
                  onClick={() => handleTabChange(program.id)}
                  aria-pressed={isActive}
                  className={`group flex min-h-[68px] items-center gap-3 rounded-xl px-4 py-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/20 ${
                    isActive
                      ? 'bg-[#10C35D] text-white shadow-md shadow-green-700/15'
                      : 'bg-white text-gray-600 hover:bg-[#f2faf5] hover:text-[#0a3d2e]'
                  }`}
                >

                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                      isActive
                        ? 'bg-white/15 text-white'
                        : 'bg-[#10C35D]/10 text-[#10C35D] group-hover:bg-[#10C35D]/15'
                    }`}
                  >
                    <Icon size={19} />
                  </span>

                  <span className="min-w-0 flex-1">

                    <span className="block text-sm font-bold">
                      {program.shortName}
                    </span>

                    <span
                      className={`mt-0.5 block text-[11px] ${
                        isActive
                          ? 'text-white/80'
                          : 'text-gray-400'
                      }`}
                    >
                      {program.status === 'open'
                        ? 'Pendaftaran tersedia'
                        : program.status === 'upcoming'
                          ? 'Informasi program'
                          : 'Lihat informasi program'}
                    </span>

                  </span>

                  <ArrowRight
                    size={16}
                    className={`shrink-0 transition-transform ${
                      isActive
                        ? 'translate-x-0 text-white'
                        : '-translate-x-1 text-gray-300 group-hover:translate-x-0 group-hover:text-[#10C35D]'
                    }`}
                  />

                </button>
              );
            })}

          </div>
        </section>

        {/* ======================================
            5. INFORMASI PROGRAM
        ====================================== */}

        <div className="mt-6 space-y-6">

          <ProgramInfo program={currentProgram} />

          {/* ======================================
              6. ALUR PENDAFTARAN
          ====================================== */}

          <RegistrationFlow
            steps={currentProgram.registrationFlow}
          />

          {/* ======================================
              7. INFORMASI PENDAFTARAN
          ====================================== */}

          <section className="overflow-hidden rounded-3xl border border-[#e4f1e8] bg-white shadow-[0_8px_30px_rgba(10,61,46,0.05)]">
  {/* Accent Line */}
  <div className="h-1.5 w-full bg-gradient-to-r from-[#0A3D2E] via-[#10C35D] to-[#9BE7B8]" />

  <div className="space-y-6 p-5 sm:p-7 lg:p-8">
    {/* Heading */}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#dcefe2] bg-gradient-to-br from-[#edf9f1] to-[#e3f6e9] text-[#10C35D]">
          <CalendarDays size={20} />
        </div>

        <div className="min-w-0 pt-0.5">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#10C35D]">
            Informasi Pendaftaran
          </p>

          <h2 className="text-lg font-bold leading-snug tracking-tight text-[#0a3d2e] sm:text-xl">
            Periode Pendaftaran Program
          </h2>

          <p className="mt-1.5 text-sm leading-6 text-gray-500">
            Periksa status dan tanggal pendaftaran sebelum mengisi formulir.
          </p>
        </div>
      </div>

      <div className="sm:shrink-0">
        <StatusBadge status={currentProgram.status} />
      </div>
    </div>

    {/* Periode Pendaftaran */}
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-[#dcefe2] bg-[#f5fbf7] p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <CalendarDays size={16} className="text-[#10A45A]" />
          Periode Pendaftaran
        </div>

        <p className="mt-3 text-base font-bold text-[#0a3d2e]">
          {currentProgram.registrationPeriod}
        </p>
      </div>

      <div className="rounded-2xl border border-[#e7ece9] bg-[#fafcfb] p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
          <Clock3 size={16} className="text-[#527966]" />
          Batas Akhir Pendaftaran
        </div>

        <p className="mt-3 text-base font-bold text-[#0a3d2e]">
          {currentProgram.deadline}
        </p>
      </div>
    </div>

    {/* Status dan Aksi Pendaftaran */}
    <div
      className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${
        currentProgram.status === 'open'
          ? 'border-[#ccebd7] bg-[#f2faf5]'
          : currentProgram.status === 'closed'
            ? 'border-red-100 bg-red-50/60'
            : 'border-amber-100 bg-amber-50/60'
      }`}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-bold ${
            currentProgram.status === 'open'
              ? 'text-[#087b40]'
              : currentProgram.status === 'closed'
                ? 'text-red-700'
                : 'text-amber-800'
          }`}
        >
          {currentProgram.status === 'open'
            ? 'Pendaftaran sedang dibuka'
            : currentProgram.status === 'closed'
              ? 'Pendaftaran telah ditutup'
              : 'Pendaftaran belum dibuka'}
        </p>

        <p className="mt-1 text-xs leading-5 text-gray-500">
          {currentProgram.status === 'open'
            ? 'Silakan isi formulir pendaftaran jika ingin mengikuti program ini.'
            : 'Pantau informasi resmi UPA Bahasa untuk mengetahui perkembangan pendaftaran.'}
        </p>
      </div>

      {currentProgram.status === 'open' ? (
        <button
          type="button"
          onClick={() => setShowRegistrationModal(true)}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#10C35D] px-5 py-3 text-sm font-bold text-white shadow-md shadow-green-700/15 transition hover:-translate-y-0.5 hover:bg-[#0DAA50] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/25 sm:w-auto"
        >
          <FileText size={16} />
          Daftar Sekarang
        </button>
      ) : (
        <span className="inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-3 text-xs font-semibold text-gray-400 sm:w-auto">
          Pendaftaran Tidak Tersedia
        </span>
      )}
    </div>
  </div>
</section>

          {/* ======================================
              8. JADWAL PELAKSANAAN
          ====================================== */}

          <ProgramSchedule
            program={currentProgram}
            downloadingScheduleId={downloadingScheduleId}
            onDownloadExcel={handleDownloadSchedule}
          />

        </div>
{/* ======================================
            6. CATATAN INFORMASI
        ====================================== */}

        <div className="mt-7 flex items-start gap-2 rounded-xl border border-green-100 bg-white/70 px-4 py-3 text-xs leading-5 text-gray-500">

          <Info
            size={15}
            className="mt-0.5 shrink-0 text-[#10C35D]"
          />

          <p>
            Informasi program, periode pendaftaran, status,
            manfaat, dan persyaratan ditampilkan berdasarkan
            data yang dikelola Admin UPA Bahasa. Jadwal
            pelaksanaan ditampilkan setelah diterbitkan oleh Admin.
          </p>

        </div>

      </div>

            {showRegistrationModal && currentProgram.status === 'open' && (
        <RegistrationForm
          currentProgram={currentProgram}
          formData={formData}
          submissionStatus={submissionStatus}
          submissionMessage={submissionMessage}
          isSubmitting={isSubmitting}
          majorsList={majorsList}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          onClose={() => setShowRegistrationModal(false)}
        />
      )}
{/* ======================================
          STYLE KHUSUS CETAK JADWAL
      ====================================== */}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }

          #jadwal-program,
          #jadwal-program * {
            visibility: visible;
          }

          #jadwal-program {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            border: none;
            box-shadow: none;
          }

          #jadwal-program button {
            display: none !important;
          }

          #jadwal-program .overflow-x-auto {
            overflow: visible !important;
          }

          #jadwal-program table {
            width: 100%;
          }

          @page {
            size: A4;
            margin: 15mm;
          }
        }
      `}</style>

    </main>
  );
}














