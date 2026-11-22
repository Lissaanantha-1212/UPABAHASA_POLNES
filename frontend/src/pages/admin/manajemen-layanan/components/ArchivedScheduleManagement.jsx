import {
  RefreshCw,
  LoaderCircle,
  Archive,
  CalendarDays,
  Clock3,
  MapPin,
  Users,
  RotateCcw,
  Trash2,
} from 'lucide-react';

export default function ArchivedScheduleManagement(props) {
  const {
    selectedProgram,
    archivedSchedules,
    loadingArchivedSchedules,
    archivedScheduleError,
    fetchArchivedSchedules,
    lifecycleActionLoadingId,
    handleScheduleLifecycleAction,
  } = props;

  const filteredSchedules = archivedSchedules.filter(
    (item) =>
      Number(item.program_id) === Number(selectedProgram?.id)
  );

  return (
    <section className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0a3d2e]">
            Arsip Jadwal
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Jadwal yang telah diarsipkan untuk {selectedProgram?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchArchivedSchedules}
          disabled={loadingArchivedSchedules}
          className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loadingArchivedSchedules ? 'animate-spin' : ''}
          />
          Muat Ulang Arsip
        </button>
      </div>

      {archivedScheduleError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
          {archivedScheduleError}
        </div>
      )}

      {loadingArchivedSchedules ? (
        <div className="py-8 flex flex-col items-center text-gray-500">
          <LoaderCircle size={26} className="animate-spin text-[#10C35D] mb-3" />
          <p className="text-sm">Memuat arsip jadwal...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
          <Archive size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-semibold text-gray-600">
            Belum ada jadwal yang diarsipkan.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Jadwal yang diarsipkan akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="border border-gray-200 rounded-xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-[#0a3d2e]">
                    {schedule.program_name || selectedProgram?.name || 'Program Layanan'}
                  </h3>

                  {schedule.session_name && (
                    <p className="text-sm text-gray-500 mt-1">
                      {schedule.session_name}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600 mt-3">
                    <span className="inline-flex items-center gap-2">
                      <CalendarDays size={16} />
                      {schedule.date
                        ? new Date(`${String(schedule.date).slice(0, 10)}T00:00:00`).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Clock3 size={16} />
                      {String(schedule.start_time || '').slice(0, 5)}
                      {' - '}
                      {String(schedule.end_time || '').slice(0, 5)}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <MapPin size={16} />
                      {schedule.location || 'Lokasi belum ditentukan'}
                    </span>

                    <span className="inline-flex items-center gap-2">
                      <Users size={16} />
                      {schedule.participant_count ?? 0} Peserta
                    </span>
                  </div>
                </div>

                <span className="inline-flex w-fit px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                  Diarsipkan
                </span>
              </div>

              <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={lifecycleActionLoadingId === Number(schedule.id)}
                  onClick={() => handleScheduleLifecycleAction(schedule, 'restore')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 text-sm font-semibold disabled:opacity-50"
                >
                  {lifecycleActionLoadingId === Number(schedule.id) ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  Pulihkan
                </button>

                <button
                  type="button"
                  disabled={lifecycleActionLoadingId === Number(schedule.id)}
                  onClick={() => handleScheduleLifecycleAction(schedule, 'deleteArchived')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Hapus Permanen
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

