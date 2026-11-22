import { adminFetch } from '../adminSession';
import { useCallback, useState } from 'react';

const API_BASE_URL = 'http://localhost:5000/api/schedules';

export default function useScheduleLifecycle({
  handleUnauthorized,
  setToast,
  fetchSchedules,
}) {
  const [archivedSchedules, setArchivedSchedules] = useState([]);
  const [loadingArchivedSchedules, setLoadingArchivedSchedules] = useState(false);
  const [archivedScheduleError, setArchivedScheduleError] = useState('');

  const [scheduleHistories, setScheduleHistories] = useState([]);
  const [loadingScheduleHistories, setLoadingScheduleHistories] = useState(false);
  const [scheduleHistoryError, setScheduleHistoryError] = useState('');

  const [lifecycleActionLoadingId, setScheduleActionLoadingId] = useState(null);

  const fetchArchivedSchedules = useCallback(async () => {
    try {
      setLoadingArchivedSchedules(true);
      setArchivedScheduleError('');

      const response = await adminFetch(`${API_BASE_URL}/archived/admin`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) return;
        throw new Error(result.message || 'Gagal mengambil jadwal arsip.');
      }

      setArchivedSchedules(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Fetch Archived Schedules Error:', error);
      setArchivedScheduleError(error.message || 'Gagal mengambil jadwal arsip.');
    } finally {
      setLoadingArchivedSchedules(false);
    }
  }, [handleUnauthorized]);

  const fetchScheduleHistories = useCallback(async (programId = null) => {
    try {
      setLoadingScheduleHistories(true);
      setScheduleHistoryError('');

      const query = programId
        ? `?program_id=${encodeURIComponent(programId)}`
        : '';

      const response = await adminFetch(`${API_BASE_URL}/history/admin${query}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) return;
        throw new Error(result.message || 'Gagal mengambil riwayat jadwal.');
      }

      setScheduleHistories(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      console.error('Fetch Schedule Histories Error:', error);
      setScheduleHistoryError(error.message || 'Gagal mengambil riwayat jadwal.');
    } finally {
      setLoadingScheduleHistories(false);
    }
  }, [handleUnauthorized]);

  const handleScheduleLifecycleAction = useCallback(async (schedule, action) => {
    const actions = {
      publish: {
        endpoint: 'publish',
        method: 'POST',
        confirm: 'Publikasikan jadwal ini?',
      },
      unpublish: {
        endpoint: 'unpublish',
        method: 'POST',
        confirm: 'Kembalikan jadwal Published ini ke Draft? Jadwal tidak akan tampil ke publik dan data peserta serta riwayat aktivitas tetap disimpan.',
      },      archive: {
        endpoint: 'archive',
        method: 'POST',
        confirm: 'Arsipkan jadwal ini?',
      },
      restore: {
        endpoint: 'restore',
        method: 'POST',
        confirm: 'Pulihkan jadwal ini dari arsip?',
      },
      deleteDraft: {
        endpoint: 'draft',
        method: 'DELETE',
        confirm: 'Hapus jadwal Draft ini? Peserta akan kembali ke Daftar Pendaftar dan riwayat aktivitas tetap disimpan.',
      },
      deleteArchived: {
        endpoint: 'archived',
        method: 'DELETE',
        confirm: 'Hapus permanen jadwal arsip ini? Riwayat aktivitasnya tetap disimpan.',
      },
    };

    const config = actions[action];

    if (!config || !schedule?.id) return;

    if (!window.confirm(config.confirm)) return;

    try {
      setScheduleActionLoadingId(Number(schedule.id));

      const response = await adminFetch(
        `${API_BASE_URL}/${schedule.id}/${config.endpoint}`,
        {
          method: config.method,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) return;
        throw new Error(result.message || 'Aksi jadwal gagal dilakukan.');
      }

      setToast({
        message: result.message || 'Jadwal berhasil diperbarui.',
      });

      await Promise.all([
        fetchSchedules(),
        fetchArchivedSchedules(),
        fetchScheduleHistories(),
      ]);
    } catch (error) {
      console.error('Schedule Lifecycle Action Error:', error);
      setToast({
        message: error.message || 'Terjadi kesalahan saat memproses jadwal.',
        type: 'error',
      });
    } finally {
      setScheduleActionLoadingId(null);
    }
  }, [
    handleUnauthorized,
    setToast,
    fetchSchedules,
    fetchArchivedSchedules,
    fetchScheduleHistories,
  ]);

  // Menghapus riwayat jadwal yang dipilih dalam satu program.
  const deleteSelectedScheduleHistories = useCallback(async (programId, ids) => {
    const normalizedIds = [...new Set(
      (Array.isArray(ids) ? ids : []).map(Number)
    )];

    if (!Number.isInteger(Number(programId)) || Number(programId) <= 0) {
      setToast({
        message: 'Program tidak valid.',
        type: 'error',
      });
      return false;
    }

    if (
      normalizedIds.length === 0 ||
      normalizedIds.some((id) => !Number.isInteger(id) || id <= 0)
    ) {
      setToast({
        message: 'Pilih riwayat yang ingin dihapus terlebih dahulu.',
        type: 'error',
      });
      return false;
    }

    try {
      const response = await adminFetch(`${API_BASE_URL}/history/admin`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          program_id: Number(programId),
          ids: normalizedIds,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (handleUnauthorized(response.status)) return false;
        throw new Error(result.message || 'Gagal menghapus riwayat jadwal.');
      }

      await fetchScheduleHistories(Number(programId));

      setToast({
        message: result.message || 'Riwayat jadwal terpilih berhasil dihapus.',
      });

      return true;
    } catch (error) {
      console.error('Delete Selected Schedule Histories Error:', error);

      setToast({
        message: error.message || 'Terjadi kesalahan saat menghapus riwayat.',
        type: 'error',
      });

      return false;
    }
  }, [
    handleUnauthorized,
    setToast,
    fetchScheduleHistories,
  ]);
  return {
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
  };
}




