import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  AlertCircle,
  X,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  LoaderCircle,
  FileText,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  ClipboardList,
  BookOpen,
  Languages,
  Pencil,
  Lock,
  Unlock,
} from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import ScheduleCreationForm from './components/ScheduleCreationForm';
import ScheduleManagement from './components/ScheduleManagement';
import InformationManagement from './components/InformationManagement';
import ProgramNavigation from './components/ProgramNavigation';
import ArchivedScheduleManagement from './components/ArchivedScheduleManagement';
import ScheduleHistory from './components/ScheduleHistory';
import { adminFetch } from '../../../adminSession';
import useScheduleLifecycle from '../../../hooks/useScheduleLifecycle';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/non-test-programs';
const REGISTRATION_API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/registrations/admin';
const SCHEDULE_API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/schedules/admin';

const PROGRAMS = [
  { slug: 'kursus-inggris', label: 'Kursus Bahasa Inggris', icon: BookOpen },
  { slug: 'kursus-mandarin', label: 'Kursus Bahasa Mandarin', icon: Languages },
  { slug: 'jsst', label: 'JSST', icon: FileText },
];

const EMPTY_FORM = {
  description: '',
  benefits: [],
  requirements: [],
  registration_flow: [],
  reg_start: '',
  reg_end: '',
};

const getTodayWITA = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
};

const formatDateForInput = (value) => {
  if (!value) return '';

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type) => parts.find((part) => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
};

const toFormData = (program) => ({
  description: program.description || '',
  benefits: Array.isArray(program.benefits) ? program.benefits : [],
  requirements: Array.isArray(program.requirements)
    ? program.requirements
    : [],
  registration_flow: Array.isArray(program.registration_flow)
    ? program.registration_flow
    : [],
  reg_start: formatDateForInput(program.reg_start),
  reg_end: formatDateForInput(program.reg_end),
});

const formatRegistrationDate = (value) => {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  });
};

export default function AdminManajemenLayanan() {
  const navigate = useNavigate();

  const [programs, setPrograms] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('kursus-inggris');
  const [activeMenu, setActiveMenu] = useState('informasi');
  const [activeScheduleView, setActiveScheduleView] = useState('aktif');
  const [form, setForm] = useState(EMPTY_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  const [registrations, setRegistrations] = useState([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(true);
  const [registrationError, setRegistrationError] = useState('');

  const [schedules, setSchedules] = useState([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);
  const [scheduleError, setScheduleError] = useState('');
  const [selectedRegistrationIds, setSelectedRegistrationIds] = useState([]);

  const [scheduleMethod, setScheduleMethod] = useState('tanpa_sesi');
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    show_participants: false,
  });
  const [sessionRows, setSessionRows] = useState([
    {
      id: 1,
      session_name: 'Sesi 1',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      registration_ids: [],
      show_participants: false,
    },
  ]);
  const [creatingSchedule, setCreatingSchedule] = useState(false);
  const [scheduleFormError, setScheduleFormError] = useState('');

  const [editingScheduleId, setEditingScheduleId] = useState(null);
  const [editScheduleForm, setEditScheduleForm] = useState({
    session_name: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    registration_ids: [],
    show_participants: false,
  });
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleActionLoadingId, setScheduleActionLoadingId] = useState(null);

  const selectedProgram = programs.find(
    (item) => item.slug === selectedSlug
  );

  const selectedRegistrations = registrations.filter(
    (item) => Number(item.program_id) === Number(selectedProgram?.id)
  );

  const scheduledRegistrationIds = new Set(
    schedules
      .filter((schedule) => schedule.status !== 'cancelled')
      .flatMap((schedule) =>
        Array.isArray(schedule.participants)
          ? schedule.participants.map((participant) =>
              Number(participant.registration_id)
            )
          : []
      )
  );

  const availableRegistrations = selectedRegistrations.filter(
    (student) => !scheduledRegistrationIds.has(Number(student.id))
  );

  const handleToggleRegistration = (registrationId, checked) => {
    const id = Number(registrationId);

    if (checked && scheduledRegistrationIds.has(id)) return;

    setSelectedRegistrationIds((previous) => {
      if (checked) {
        return previous.includes(id) ? previous : [...previous, id];
      }

      return previous.filter((item) => item !== id);
    });
  };

  const handleToggleAllRegistrations = (checked) => {
    setSelectedRegistrationIds(
      checked
        ? availableRegistrations.map((student) => Number(student.id))
        : []
    );
  };

  const handleUnauthorized = useCallback((status) => {
    if (status === 401 || status === 403) {
      navigate('/admin/login');
      return true;
    }

    return false;
  }, [navigate]);
  // ==========================================
  // MENGAMBIL DATA PROGRAM
  // ==========================================

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminFetch(API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) return;

        throw new Error(
          result.message || 'Gagal mengambil data program.'
        );
      }

      const data = Array.isArray(result.data) ? result.data : [];

      setPrograms(data);

      const activeProgram =
        data.find((item) => item.slug === selectedSlug) || data[0];

      if (activeProgram) {
        setSelectedSlug(activeProgram.slug);
        setForm(toFormData(activeProgram));
      }
    } catch (err) {
      console.error('Fetch Non-Test Programs Error:', err);
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, [handleUnauthorized]);

  // ==========================================
  // MENGAMBIL DATA PENDAFTAR
  // ==========================================

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoadingRegistrations(true);
      setRegistrationError('');

      const response = await adminFetch(REGISTRATION_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) return;

        throw new Error(
          result.message || 'Gagal mengambil data pendaftar.'
        );
      }

      setRegistrations(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (err) {
      console.error('Fetch Registrations Error:', err);

      setRegistrationError(
        err.message || 'Terjadi kesalahan saat mengambil data pendaftar.'
      );
    } finally {
      setLoadingRegistrations(false);
    }
  }, [handleUnauthorized]);

  // ==========================================
  // MENGAMBIL DATA JADWAL ADMIN
  // ==========================================

  const fetchSchedules = useCallback(async () => {
    try {
      setLoadingSchedules(true);
      setScheduleError('');

      const response = await adminFetch(SCHEDULE_API_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) return;

        throw new Error(
          result.message || 'Gagal mengambil data jadwal.'
        );
      }

      setSchedules(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (err) {
      console.error('Fetch Schedules Error:', err);

      setScheduleError(
        err.message || 'Terjadi kesalahan saat mengambil data jadwal.'
      );
    } finally {
      setLoadingSchedules(false);
    }
  }, [handleUnauthorized]);
  // ==========================================
  // ==========================================
  // DATA ARSIP DAN RIWAYAT JADWAL
  // ==========================================

  const {
    archivedSchedules,
    loadingArchivedSchedules,
    archivedScheduleError,
    fetchArchivedSchedules,
    scheduleHistories,
    loadingScheduleHistories,
    scheduleHistoryError,
    fetchScheduleHistories,
    deleteSelectedScheduleHistories,
    lifecycleActionLoadingId,
    handleScheduleLifecycleAction,
  } = useScheduleLifecycle({
    handleUnauthorized,
    setToast,
    fetchSchedules,
  });
  // USE EFFECT
  // ==========================================

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    if (activeMenu !== 'jadwal' || !selectedProgram?.id) return;

    if (activeScheduleView === 'arsip') {
      fetchArchivedSchedules();
    }

    if (activeScheduleView === 'riwayat') {
      fetchScheduleHistories(selectedProgram.id);
    }
  }, [
    activeMenu,
    activeScheduleView,
    selectedProgram?.id,
    fetchArchivedSchedules,
    fetchScheduleHistories,
  ]);
  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);

    return () => clearTimeout(timer);
  }, [toast]);

  // ==========================================
  // MEMILIH PROGRAM
  // ==========================================

  const handleSelectProgram = (slug) => {
    const program = programs.find((item) => item.slug === slug);

    if (!program) return;

    setSelectedSlug(slug);
    setForm(toFormData(program));
    setSelectedRegistrationIds([]);
    setError('');
  };

  // ==========================================
  // MENGUBAH FORM
  // ==========================================

  const handleFieldChange = (field, value) => {
    setForm((previous) => {
      if (field === 'reg_start') {
        return {
          ...previous,
          reg_start: value,
          reg_end:
            !value || (previous.reg_end && previous.reg_end < value)
              ? ''
              : previous.reg_end,
        };
      }

      return {
        ...previous,
        [field]: value,
      };
    });
  };

  const handleListChange = (field, index, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: previous[field].map((item, itemIndex) =>
        itemIndex === index ? value : item
      ),
    }));
  };

  const addListItem = (field) => {
    setForm((previous) => ({
      ...previous,
      [field]: [...previous[field], ''],
    }));
  };

  const removeListItem = (field, index) => {
    setForm((previous) => ({
      ...previous,
      [field]: previous[field].filter(
        (_, itemIndex) => itemIndex !== index
      ),
    }));
  };

  // ==========================================
  // MENYIMPAN INFORMASI PROGRAM
  // ==========================================

  const handleSave = async (event) => {
    event.preventDefault();

    if (!selectedProgram) return;

    if (!form.description.trim()) {
      setError('Deskripsi Program wajib diisi.');
      return;
    }

    if (Boolean(form.reg_start) !== Boolean(form.reg_end)) {
      setError(
        'Tanggal mulai dan tanggal akhir harus diisi bersama, atau dikosongkan bersama.'
      );
      return;
    }

    if (
      form.reg_start &&
      form.reg_end &&
      form.reg_end < form.reg_start
    ) {
      setError('Tanggal akhir pendaftaran tidak boleh sebelum tanggal mulai.');
      return;
    }

    const payload = {
      description: form.description.trim(),
      benefits: form.benefits.map((item) => item.trim()).filter(Boolean),
      requirements: form.requirements
        .map((item) => item.trim())
        .filter(Boolean),
      registration_flow: form.registration_flow
        .map((item) => item.trim())
        .filter(Boolean),
      reg_start: form.reg_start || null,
      reg_end: form.reg_end || null,
    };

    try {
      setSaving(true);
      setError('');

      const response = await adminFetch(
        `${API_URL}/${selectedProgram.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) {
          throw new Error('Sesi Admin berakhir. Silakan login kembali.');
        }

        throw new Error(
          result.message || 'Gagal menyimpan informasi program.'
        );
      }

      if (result.data) {
        setPrograms((previous) =>
          previous.map((item) =>
            Number(item.id) === Number(result.data.id)
              ? result.data
              : item
          )
        );

        setForm(toFormData(result.data));
      }

      setToast({
        message: result.message || 'Informasi program berhasil disimpan.',
      });
    } catch (err) {
      console.error('Save Non-Test Program Error:', err);
      setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100 transition';

  const labelClass =
    'block text-sm font-semibold text-gray-700 mb-2';

  // ==========================================
  // FORM PEMBUATAN JADWAL
  // ==========================================

  const handleScheduleMethodChange = (method) => {
    setScheduleMethod(method);
    setScheduleFormError('');
  };

  const handleScheduleFieldChange = (field, value) => {
    setScheduleForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addSessionRow = () => {
    setSessionRows((previous) => [
      ...previous,
      {
        id: Date.now(),
        session_name: `Sesi ${previous.length + 1}`,
        date: '',
        start_time: '',
        end_time: '',
        location: '',
        registration_ids: [],
        show_participants: false,
      },
    ]);
  };

  const removeSessionRow = (sessionId) => {
    setSessionRows((previous) =>
      previous.filter((session) => session.id !== sessionId)
    );
  };

  const handleSessionFieldChange = (sessionId, field, value) => {
    setSessionRows((previous) =>
      previous.map((session) =>
        session.id === sessionId
          ? { ...session, [field]: value }
          : session
      )
    );
  };

  const handleSessionParticipant = (sessionId, registrationId, checked) => {
    const id = Number(registrationId);

    setSessionRows((previous) =>
      previous.map((session) => {
        if (session.id !== sessionId) {
          return {
            ...session,
            registration_ids: checked
              ? session.registration_ids.filter(
                  (item) => Number(item) !== id
                )
              : session.registration_ids,
          };
        }

        return {
          ...session,
          registration_ids: checked
            ? [...session.registration_ids, id]
            : session.registration_ids.filter(
                (item) => Number(item) !== id
              ),
        };
      })
    );
  };

  const handleCreateSchedule = async (event) => {
    event.preventDefault();

    if (!selectedProgram) return;

    const availableSelectedIds = selectedRegistrationIds
      .map(Number)
      .filter((id) =>
        availableRegistrations.some(
          (student) => Number(student.id) === id
        )
      );

    if (availableSelectedIds.length === 0) {
      setScheduleFormError(
        'Pilih minimal satu mahasiswa yang belum dijadwalkan.'
      );
      return;
    }

    let schedulesPayload = [];

    if (scheduleMethod === 'tanpa_sesi') {
      if (
        !scheduleForm.date ||
        !scheduleForm.start_time ||
        !scheduleForm.end_time
      ) {
        setScheduleFormError(
          'Tanggal, jam mulai, dan jam selesai wajib diisi.'
        );
        return;
      }

      if (scheduleForm.end_time <= scheduleForm.start_time) {
        setScheduleFormError(
          'Jam selesai harus lebih besar dari jam mulai.'
        );
        return;
      }

      schedulesPayload = [
        {
          date: scheduleForm.date,
          start_time: scheduleForm.start_time,
          end_time: scheduleForm.end_time,
          location: scheduleForm.location.trim() || null,
          registration_ids: availableSelectedIds,
          show_participants: Boolean(scheduleForm.show_participants),
        },
      ];
    } else {
      if (sessionRows.length === 0) {
        setScheduleFormError('Tambahkan minimal satu sesi.');
        return;
      }

      for (let index = 0; index < sessionRows.length; index += 1) {
        const session = sessionRows[index];

        if (
          !session.session_name.trim() ||
          !session.date ||
          !session.start_time ||
          !session.end_time
        ) {
          setScheduleFormError(
            `Lengkapi nama, tanggal, jam mulai, dan jam selesai pada sesi ${index + 1}.`
          );
          return;
        }

        if (session.end_time <= session.start_time) {
          setScheduleFormError(
            `Jam selesai sesi ${index + 1} harus lebih besar dari jam mulai.`
          );
          return;
        }

        if (session.registration_ids.length === 0) {
          setScheduleFormError(
            `Pilih minimal satu peserta untuk sesi ${index + 1}.`
          );
          return;
        }
      }

      const assignedIds = sessionRows.flatMap((session) =>
        session.registration_ids.map(Number)
      );

      const uniqueAssignedIds = new Set(assignedIds);

      if (uniqueAssignedIds.size !== assignedIds.length) {
        setScheduleFormError(
          'Seorang mahasiswa tidak boleh masuk ke lebih dari satu sesi.'
        );
        return;
      }

      const unassignedIds = availableSelectedIds.filter(
        (id) => !uniqueAssignedIds.has(id)
      );

      const invalidAssignedIds = assignedIds.filter(
        (id) => !availableSelectedIds.includes(id)
      );

      if (unassignedIds.length > 0 || invalidAssignedIds.length > 0) {
        setScheduleFormError(
          'Pastikan semua peserta terpilih sudah dibagikan ke sesi dan tidak ada peserta yang tidak tersedia.'
        );
        return;
      }

      schedulesPayload = sessionRows.map((session) => ({
        session_name: session.session_name.trim(),
        date: session.date,
        start_time: session.start_time,
        end_time: session.end_time,
        location: session.location.trim() || null,
        registration_ids: session.registration_ids.map(Number),
        show_participants: Boolean(session.show_participants),
      }));
    }

    try {
      setCreatingSchedule(true);
      setScheduleFormError('');

      const response = await adminFetch(
        'https://upabahasa-polnes-4p4a.vercel.app/api/schedules/batches',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            program_id: Number(selectedProgram.id),
            method: scheduleMethod,
            schedules: schedulesPayload,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) {
          throw new Error(
            'Sesi Admin berakhir. Silakan login kembali.'
          );
        }

        throw new Error(
          result.message || 'Gagal membuat jadwal.'
        );
      }

      setToast({
        message: result.message || 'Jadwal berhasil dibuat sebagai Draft.',
      });

      setSelectedRegistrationIds([]);
      setScheduleForm({
        date: '',
        start_time: '',
        end_time: '',
        location: '',
        show_participants: false,
      });
      setSessionRows([
        {
          id: Date.now(),
          session_name: 'Sesi 1',
          date: '',
          start_time: '',
          end_time: '',
          location: '',
          registration_ids: [],
          show_participants: false,
        },
      ]);

      await Promise.all([
        fetchSchedules(),
        fetchRegistrations(),
      ]);
    } catch (err) {
      console.error('Create Schedule Error:', err);
      setScheduleFormError(
        err.message || 'Terjadi kesalahan saat membuat jadwal.'
      );
    } finally {
      setCreatingSchedule(false);
    }
  };

  // ==========================================
  // FORM PEMBUATAN JADWAL
  // ==========================================

  // ==========================================
  // EDIT DAN KELOLA JADWAL
  // ==========================================

  const handleStartEditSchedule = (schedule) => {
    setEditingScheduleId(Number(schedule.id));

    setEditScheduleForm({
      session_name: schedule.session_name || '',
      date: formatDateForInput(schedule.date),
      start_time: String(schedule.start_time || '').slice(0, 5),
      end_time: String(schedule.end_time || '').slice(0, 5),
      location: schedule.location || '',
      show_participants: Boolean(schedule.show_participants),
      registration_ids: Array.isArray(schedule.participants)
        ? schedule.participants.map((item) => Number(item.registration_id))
        : [],
    });
  };

  const handleEditScheduleField = (field, value) => {
    setEditScheduleForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleEditScheduleParticipant = (registrationId, checked) => {
    const id = Number(registrationId);

    setEditScheduleForm((previous) => ({
      ...previous,
      registration_ids: checked
        ? previous.registration_ids.includes(id)
          ? previous.registration_ids
          : [...previous.registration_ids, id]
        : previous.registration_ids.filter((item) => item !== id),
    }));
  };

  const handleCancelEditSchedule = () => {
    setEditingScheduleId(null);
    setEditScheduleForm({
      session_name: '',
      date: '',
      start_time: '',
      end_time: '',
      location: '',
      registration_ids: [],
      show_participants: false,
    });
  };

  const handleUpdateSchedule = async (event, schedule) => {
    event.preventDefault();

    if (!editScheduleForm.date ||
        !editScheduleForm.start_time ||
        !editScheduleForm.end_time) {
      setScheduleFormError('Tanggal dan waktu jadwal wajib diisi.');
      return;
    }

    if (editScheduleForm.end_time <= editScheduleForm.start_time) {
      setScheduleFormError('Jam selesai harus lebih besar dari jam mulai.');
      return;
    }

    if (schedule.method === 'dengan_sesi' &&
        !editScheduleForm.session_name.trim()) {
      setScheduleFormError('Nama sesi wajib diisi.');
      return;
    }


    try {
      setSavingSchedule(true);
      setScheduleFormError('');

      const response = await adminFetch(
        `https://upabahasa-polnes-4p4a.vercel.app/api/schedules/${schedule.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_name: schedule.method === 'dengan_sesi'
              ? editScheduleForm.session_name.trim()
              : null,
            date: editScheduleForm.date,
            start_time: editScheduleForm.start_time,
            end_time: editScheduleForm.end_time,
            location: editScheduleForm.location.trim() || null,
            registration_ids: editScheduleForm.registration_ids,
            show_participants: Boolean(editScheduleForm.show_participants),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) {
          throw new Error('Sesi Admin berakhir. Silakan login kembali.');
        }

        throw new Error(result.message || 'Gagal memperbarui jadwal.');
      }

      setToast({
        message: result.message || 'Jadwal berhasil diperbarui.',
      });

      handleCancelEditSchedule();

      await Promise.all([
        fetchSchedules(),
        fetchRegistrations(),
      ]);
    } catch (err) {
      console.error('Update Schedule Error:', err);
      setScheduleFormError(
        err.message || 'Terjadi kesalahan saat memperbarui jadwal.'
      );
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleScheduleLock = async (schedule, shouldLock) => {
    try {
      setScheduleActionLoadingId(Number(schedule.id));

      const action = shouldLock ? 'lock' : 'unlock';

      const response = await adminFetch(
        `https://upabahasa-polnes-4p4a.vercel.app/api/schedules/${schedule.id}/${action}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) {
          throw new Error('Sesi Admin berakhir. Silakan login kembali.');
        }

        throw new Error(result.message || 'Gagal mengubah kunci jadwal.');
      }

      setToast({
        message: result.message || 'Status kunci jadwal berhasil diubah.',
      });

      await fetchSchedules();
    } catch (err) {
      console.error('Schedule Lock Error:', err);
      setScheduleError(
        err.message || 'Terjadi kesalahan saat mengubah kunci jadwal.'
      );
    } finally {
      setScheduleActionLoadingId(null);
    }
  };

  const availableSelectedIdsCount = () =>
    selectedRegistrationIds.filter((id) =>
      availableRegistrations.some(
        (student) => Number(student.id) === Number(id)
      )
    ).length;

  const renderScheduleForm = () => (
    <ScheduleCreationForm
      {...{
      handleCreateSchedule,
      labelClass,
      scheduleMethod,
      handleScheduleMethodChange,
      getTodayWITA,
      scheduleForm,
      handleScheduleFieldChange,
      availableSelectedIdsCount,
      availableRegistrations,
      selectedRegistrationIds,
      sessionRows,
      addSessionRow,
      removeSessionRow,
      handleSessionFieldChange,
      handleSessionParticipant,
      scheduleFormError,
      creatingSchedule,
      inputClass
      }}
    />
  );

  // ==========================================
  // KONTEN MANAJEMEN JADWAL
  // ==========================================

  const renderSchedule = () => (
    <ScheduleManagement
      {...{
        selectedProgram,
        fetchRegistrations,
        loadingRegistrations,
        registrationError,
        selectedRegistrations,
        selectedRegistrationIds,
        availableRegistrations,
        handleToggleAllRegistrations,
        scheduledRegistrationIds,
        handleToggleRegistration,
        formatRegistrationDate,
        renderScheduleForm,
        fetchSchedules,
        loadingSchedules,
        scheduleError,
        schedules,
        scheduleActionLoadingId,
        lifecycleActionLoadingId,
        handleScheduleLifecycleAction,
        setToast,
        setScheduleFormError,
        handleStartEditSchedule,
        handleScheduleLock,
        editingScheduleId,
        handleUpdateSchedule,
        labelClass,
        getTodayWITA,
        editScheduleForm,
        handleEditScheduleField,
        inputClass,
        handleEditScheduleParticipant,
        scheduleFormError,
        savingSchedule,
        handleCancelEditSchedule
      }}
    />
  );

  // ==========================================
  // ==========================================
  // KONTEN ARSIP DAN RIWAYAT JADWAL
  // ==========================================

  const renderArchivedSchedules = () => (
    <ArchivedScheduleManagement
      selectedProgram={selectedProgram}
      archivedSchedules={archivedSchedules}
      loadingArchivedSchedules={loadingArchivedSchedules}
      archivedScheduleError={archivedScheduleError}
      fetchArchivedSchedules={fetchArchivedSchedules}
      lifecycleActionLoadingId={lifecycleActionLoadingId}
      handleScheduleLifecycleAction={handleScheduleLifecycleAction}
    />
  );

  const renderScheduleHistory = () => (
    <ScheduleHistory
      selectedProgram={selectedProgram}
      scheduleHistories={scheduleHistories}
      loadingScheduleHistories={loadingScheduleHistories}
      scheduleHistoryError={scheduleHistoryError}
      fetchScheduleHistories={() => fetchScheduleHistories(selectedProgram?.id)}
      deleteSelectedScheduleHistories={deleteSelectedScheduleHistories}
    />
  );
  // RENDER UTAMA
  // ==========================================

  return (
    <AdminLayout>
      {/* NOTIFIKASI */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-[380px] animate-fadeIn"
        >
          <div className={`flex items-start gap-3 bg-white border rounded-xl shadow-xl p-4 ${toast.type === 'warning' ? 'border-amber-100' : 'border-green-100'}`}>
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center ${toast.type === 'warning' ? 'bg-amber-50' : 'bg-green-50'}`}>
              {toast.type === 'warning' ? <AlertCircle size={22} className="text-amber-600" /> : <CheckCircle size={22} className="text-[#10C35D]" />}
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className={`text-sm font-bold ${toast.type === 'warning' ? 'text-amber-800' : 'text-[#0a3d2e]'}`}>
                {toast.type === 'warning' ? 'Perlu perhatian' : 'Berhasil!'}
              </p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="text-gray-400 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0a3d2e]">
              Manajemen Layanan
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Kelola informasi program dan jadwal layanan non-tes UPA Bahasa POLNES.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchPrograms();
              fetchRegistrations();
              fetchSchedules();
            }}
            disabled={loading || saving || loadingRegistrations}
            className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading || loadingRegistrations ? 'animate-spin' : ''
              }
            />
            Muat Ulang
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError('')}
              className="font-semibold underline"
            >
              Tutup
            </button>
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-xl border border-gray-100 p-12 flex flex-col items-center justify-center text-gray-500">
            <LoaderCircle
              size={30}
              className="animate-spin text-[#10C35D] mb-3"
            />
            <p className="text-sm">Memuat data program...</p>
          </div>
        ) : programs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <p className="text-gray-600 text-sm">
              Data program belum tersedia di database.
            </p>
          </div>
        ) : (
          <>
            <ProgramNavigation
  {...{
    PROGRAMS,
    programs,
    selectedSlug,
    handleSelectProgram
  }}
/>{/* SUBMENU PENGELOLAAN */}
            {selectedProgram && (
              <>
                <div>
                  <h2 className="text-lg font-bold text-[#0a3d2e]">
                    {selectedProgram.name}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Pilih bagian pengelolaan yang ingin dibuka.
                  </p>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveMenu('informasi')}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition ${
                        activeMenu === 'informasi'
                          ? 'bg-[#10C35D] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
                      }`}
                    >
                      <FileText size={19} />
                      <span>Manajemen Informasi</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveMenu('jadwal')}
                      className={`flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-sm font-semibold transition ${
                        activeMenu === 'jadwal'
                          ? 'bg-[#10C35D] text-white shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
                      }`}
                    >
                      <CalendarDays size={19} />
                      <span>Manajemen Jadwal</span>
                    </button>
                  </div>
                </div>

                {activeMenu === 'jadwal' && (
                  <div className="bg-white border border-gray-200 rounded-xl p-2">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'aktif', label: 'Jadwal Aktif' },
                        { id: 'arsip', label: 'Arsip Jadwal' },
                        { id: 'riwayat', label: 'Riwayat Jadwal' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setActiveScheduleView(item.id)}
                          className={`px-3 py-3 rounded-lg text-sm font-semibold transition ${
                            activeScheduleView === item.id
                              ? 'bg-[#10C35D] text-white shadow-sm'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-[#0a3d2e]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* KONTEN MENU AKTIF */}
                <div className="space-y-5">
                  {/* HEADER KONTEN */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-[#10C35D]">
                      {activeMenu === 'informasi' ? (
                        <FileText size={20} />
                      ) : (
                        <CalendarDays size={20} />
                      )}
                    </div>

                    <div>
                      <h3 className="font-bold text-[#0a3d2e]">
                        {activeMenu === 'informasi'
                          ? 'Manajemen Informasi'
                          : 'Manajemen Jadwal'}
                      </h3>

                      <p className="text-xs text-gray-500 mt-0.5">
                        {activeMenu === 'informasi'
                          ? 'Kelola informasi dan periode pendaftaran program.'
                          : 'Kelola pendaftar dan jadwal pelaksanaan program.'}
                      </p>
                    </div>
                  </div>

                  {/* ISI KONTEN */}
                  {activeMenu === 'informasi' ? (
                    <InformationManagement
                      {...{
                        form,
                        selectedProgram,
                        handleSave,
                        saving,
                        labelClass,
                        handleFieldChange,
                        addListItem,
                        handleListChange,
                        removeListItem,
                        getTodayWITA,
                        inputClass
                      }}
                    />
                  ) : activeScheduleView === 'aktif' ? (
                    renderSchedule()
                  ) : activeScheduleView === 'arsip' ? (
                    renderArchivedSchedules()
                  ) : (
                    renderScheduleHistory()
                  )}
                </div>              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}






