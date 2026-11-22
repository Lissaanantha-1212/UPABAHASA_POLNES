import { useEffect, useState } from 'react';
import {
  RefreshCw,
  LoaderCircle,
  History,
  CalendarDays,
  Clock3,
  Archive,
  Trash2,
} from 'lucide-react';

export default function ScheduleHistory(props) {
  const {
    selectedProgram,
    scheduleHistories,
    loadingScheduleHistories,
    scheduleHistoryError,
    fetchScheduleHistories,
    deleteSelectedScheduleHistories,
  } = props;

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    setSelectedIds([]);
  }, [selectedProgram?.id, scheduleHistories]);

  const filteredHistories = scheduleHistories.filter((item) => {
    const snapshot = item.schedule_snapshot || {};
    const programId = item.program_id ?? snapshot.program_id;

    return Number(programId) === Number(selectedProgram?.id);
  });

  const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return '-';

    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0a3d2e]">
            Riwayat Jadwal
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Catatan aktivitas jadwal {selectedProgram?.name}.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={async () => {
              if (selectedIds.length === 0) return;

              const confirmed = window.confirm(
                `Hapus ${selectedIds.length} riwayat jadwal yang dipilih? Tindakan ini tidak dapat dibatalkan.`
              );

              if (!confirmed) return;

              const success = await deleteSelectedScheduleHistories(
                selectedProgram?.id,
                selectedIds
              );

              if (success) {
                setSelectedIds([]);
              }
            }}
            disabled={loadingScheduleHistories || selectedIds.length === 0}
            className="inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={16} />
            Hapus Terpilih ({selectedIds.length})
          </button>

          <button
            type="button"
            onClick={fetchScheduleHistories}
            disabled={loadingScheduleHistories}
            className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingScheduleHistories ? 'animate-spin' : ''}
            />
            Muat Ulang Riwayat
          </button>
        </div>
      </div>

      {scheduleHistoryError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
          {scheduleHistoryError}
        </div>
      )}

      {loadingScheduleHistories ? (
        <div className="py-8 flex flex-col items-center text-gray-500">
          <LoaderCircle size={26} className="animate-spin text-[#10C35D] mb-3" />
          <p className="text-sm">Memuat riwayat jadwal...</p>
        </div>
      ) : filteredHistories.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
          <History size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-600">
            Belum ada riwayat jadwal.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Aktivitas jadwal akan tercatat di sini.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full min-w-[750px] text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-center font-semibold">
                  <input
                    type="checkbox"
                    aria-label="Pilih semua riwayat"
                    checked={
                      filteredHistories.length > 0 &&
                      filteredHistories.every((item) =>
                        selectedIds.includes(Number(item.id))
                      )
                    }
                    onChange={(e) => {
                      setSelectedIds(
                        e.target.checked
                          ? filteredHistories.map((item) => Number(item.id))
                          : []
                      );
                    }}
                    className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold">No.</th>
                <th className="px-4 py-3 text-left font-semibold">Program</th>
                <th className="px-4 py-3 text-left font-semibold">Tanggal Jadwal</th>
                <th className="px-4 py-3 text-left font-semibold">Waktu</th>
                <th className="px-4 py-3 text-left font-semibold">Status Riwayat</th>
                <th className="px-4 py-3 text-left font-semibold">Waktu Dicatat</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredHistories.map((item, index) => {
                const snapshot = item.schedule_snapshot || {};

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        aria-label={`Pilih riwayat nomor ${index + 1}`}
                        checked={selectedIds.includes(Number(item.id))}
                        onChange={(e) => {
                          const id = Number(item.id);

                          setSelectedIds((previous) =>
                            e.target.checked
                              ? [...previous, id]
                              : previous.filter((selectedId) => selectedId !== id)
                          );
                        }}
                        className="w-4 h-4 accent-[#10C35D] cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                    <td className="px-4 py-3 font-semibold text-gray-700">
                      {item.program_name || snapshot.program_name || selectedProgram?.name || '-'}
                      {snapshot.session_name && (
                        <span className="block text-xs font-normal text-gray-400 mt-1">
                          {snapshot.session_name}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays size={15} />
                        {(item.schedule_date || snapshot.date)
                          ? new Date(`${String((item.schedule_date || snapshot.date)).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        <Clock3 size={15} />
                        {String(snapshot.start_time || '').slice(0, 5)}
                        {' - '}
                        {String(snapshot.end_time || '').slice(0, 5)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {item.schedule_deleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                          <Archive size={13} />
                          Jadwal dihapus
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-semibold">
                          Tersimpan
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(item.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}


