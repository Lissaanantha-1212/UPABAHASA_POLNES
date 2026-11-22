
import {
  RefreshCw,
  LoaderCircle,
  CalendarDays,
  Clock3,
  Users,
  MapPin,
  Pencil,
  Lock,
  Unlock,
  Trash2,
  Save,
  Archive,
  Undo2,
  Send,
  X,
} from 'lucide-react';

export default function ScheduleManagement(props) {
  const {
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
  } = props;
  const showScheduleWarning = (message) => {
    setToast({ type: 'warning', message });
  };

  const handleScheduleAction = (schedule, action) => {
    const id = Number(schedule.id);

    if (
      scheduleActionLoadingId === id ||
      lifecycleActionLoadingId === id
    ) {
      showScheduleWarning('Tindakan jadwal sedang diproses. Tunggu hingga selesai.');
      return;
    }

    const status = schedule.status;

    if (action === 'edit') {
      if (status === 'published') {
        showScheduleWarning('Jadwal harus di-Unpublish terlebih dahulu sebelum diedit.');
        return;
      }
      if (status !== 'draft') {
        showScheduleWarning('Jadwal yang dibatalkan tidak dapat diedit.');
        return;
      }
      if (schedule.is_locked) {
        showScheduleWarning('Buka kunci jadwal terlebih dahulu sebelum mengedit.');
        return;
      }
      setScheduleFormError('');
      handleStartEditSchedule(schedule);
      return;
    }

    if (action === 'lock') {
      if (status !== 'draft') {
        showScheduleWarning(
          status === 'published'
            ? 'Jadwal harus di-Unpublish terlebih dahulu sebelum mengubah kunci.'
            : 'Jadwal yang dibatalkan tidak dapat diubah status kuncinya.'
        );
        return;
      }
      handleScheduleLock(schedule, !schedule.is_locked);
      return;
    }

    if (action === 'publish') {
      if (status !== 'draft') {
        showScheduleWarning(
          status === 'published'
            ? 'Jadwal sudah dipublikasikan.'
            : 'Jadwal yang dibatalkan tidak dapat dipublikasikan.'
        );
        return;
      }
      if (!schedule.is_locked) {
        showScheduleWarning('Kunci jadwal terlebih dahulu sebelum dipublikasikan.');
        return;
      }
      handleScheduleLifecycleAction(schedule, 'publish');
      return;
    }

    if (action === 'deleteDraft' || action === 'archive') {
      if (status === 'published') {
        showScheduleWarning('Jadwal harus di-Unpublish terlebih dahulu.');
        return;
      }
      if (status !== 'draft') {
        showScheduleWarning(
          action === 'archive'
            ? 'Jadwal yang dibatalkan tidak dapat diarsipkan.'
            : 'Jadwal yang dibatalkan tidak dapat dihapus.'
        );
        return;
      }
      if (schedule.is_locked) {
        showScheduleWarning(
          action === 'archive'
            ? 'Buka kunci jadwal terlebih dahulu sebelum mengarsipkan.'
            : 'Buka kunci jadwal terlebih dahulu sebelum menghapus.'
        );
        return;
      }
      handleScheduleLifecycleAction(schedule, action);
      return;
    }

    if (action === 'unpublish') {
      if (status !== 'published') {
        showScheduleWarning(
          status === 'cancelled'
            ? 'Jadwal yang dibatalkan tidak dapat di-Unpublish.'
            : 'Jadwal ini belum dipublikasikan.'
        );
        return;
      }
      handleScheduleLifecycleAction(schedule, 'unpublish');
    }
  };

  const programSchedules = schedules
    .filter(
      (item) =>
        Number(item.program_id) === Number(selectedProgram?.id)
    )
    .sort((a, b) => {
      const dateA = `${a.date} ${a.start_time}`;
      const dateB = `${b.date} ${b.start_time}`;
      return dateA.localeCompare(dateB);
    });

  const editingSchedule = programSchedules.find(
    (item) => Number(item.id) === Number(editingScheduleId)
  );
  const eligibleEditRegistrations = editingSchedule
    ? selectedRegistrations.filter((student) => {
        const id = Number(student.id);

        const belongsToCurrentSchedule =
          editingSchedule.participants?.some(
            (participant) => Number(participant.registration_id) === id
          );

        const belongsToAnotherSchedule = schedules.some(
          (item) =>
            Number(item.id) !== Number(editingSchedule.id) &&
            item.status !== 'cancelled' &&
            item.participants?.some(
              (participant) => Number(participant.registration_id) === id
            )
        );

        return (
          !belongsToAnotherSchedule &&
          (!scheduledRegistrationIds.has(id) || belongsToCurrentSchedule)
        );
      })
    : [];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-5">
      {/* DAFTAR PENDAFTAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[#0a3d2e]">
            Daftar Pendaftar
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Data mahasiswa yang mendaftar pada program {selectedProgram?.name}.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRegistrations}
          disabled={loadingRegistrations}
          className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loadingRegistrations ? 'animate-spin' : ''}
          />
          Muat Ulang
        </button>
      </div>

      {registrationError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
          {registrationError}
        </div>
      )}

      {loadingRegistrations ? (
        <div className="py-10 flex flex-col items-center text-gray-500">
          <LoaderCircle
            size={28}
            className="animate-spin text-[#10C35D] mb-3"
          />
          <p className="text-sm">Memuat data pendaftar...</p>
        </div>
      ) : selectedRegistrations.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-gray-200 rounded-lg">
          <p className="text-sm font-semibold text-gray-600">
            Belum ada pendaftar.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Data pendaftar program ini akan muncul di sini.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-500">
                Total pendaftar:
                <strong className="ml-1 text-gray-700">
                  {selectedRegistrations.length} mahasiswa
                </strong>
              </span>

              <span className="bg-green-50 text-[#0DAA50] px-3 py-1 rounded-full text-sm font-bold">
                {selectedRegistrationIds.length} dipilih
              </span>
            </div>

            <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={
                  availableRegistrations.length > 0 &&
                  availableRegistrations.every((student) =>
                    selectedRegistrationIds.includes(Number(student.id))
                  )
                }
                onChange={(e) =>
                  handleToggleAllRegistrations(e.target.checked)
                }
                className="w-4 h-4 accent-[#10C35D]"
              />
              Pilih Semua
            </label>
          </div>

          <div className="overflow-x-auto border border-gray-100 rounded-lg">
            <table className="w-full min-w-[1000px] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-center font-semibold">Pilih</th>
                  <th className="px-4 py-3 text-left font-semibold">No.</th>
                  <th className="px-4 py-3 text-left font-semibold">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold">NIM</th>
                  <th className="px-4 py-3 text-left font-semibold">Kelas</th>
                  <th className="px-4 py-3 text-left font-semibold">Jurusan / Prodi</th>
                  <th className="px-4 py-3 text-left font-semibold">Semester</th>
                  <th className="px-4 py-3 text-left font-semibold">WhatsApp / HP</th>
                  <th className="px-4 py-3 text-left font-semibold">Status Jadwal</th>
                  <th className="px-4 py-3 text-left font-semibold">Tanggal Daftar</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {selectedRegistrations.map((student, index) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRegistrationIds.includes(Number(student.id))}
                        disabled={scheduledRegistrationIds.has(Number(student.id))}
                        onChange={(e) =>
                          handleToggleRegistration(student.id, e.target.checked)
                        }
                        aria-label={`Pilih ${student.name}`}
                        className="w-4 h-4 accent-[#10C35D] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                      />
                    </td>

                    <td className="px-4 py-3 text-gray-500">{index + 1}</td>

                    <td className="px-4 py-3 font-semibold text-gray-700">
                      {student.name}
                    </td>

                    <td className="px-4 py-3 text-gray-600">{student.nim}</td>

                    <td className="px-4 py-3 text-gray-600">
                      {student.class || '-'}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      <div>{student.jurusan || '-'}</div>
                      <div className="text-xs text-gray-400">
                        {student.jenjang || ''} {student.prodi || ''}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {student.semester || '-'}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {student.phone || '-'}
                    </td>

                    <td className="px-4 py-3">
                      {scheduledRegistrationIds.has(Number(student.id)) ? (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                          Sudah dijadwalkan
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                          Belum dijadwalkan
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatRegistrationDate(student.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* FORM PEMBUATAN JADWAL */}
      {renderScheduleForm()}

      {/* DAFTAR JADWAL PELAKSANAAN */}
      <div className="border-t border-gray-100 pt-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#0a3d2e]">
              Daftar Jadwal Pelaksanaan
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Jadwal yang telah dibuat untuk {selectedProgram?.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSchedules}
            disabled={loadingSchedules}
            className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loadingSchedules ? 'animate-spin' : ''}
            />
            Muat Ulang Jadwal
          </button>
        </div>

        {scheduleError && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
            {scheduleError}
          </div>
        )}

        {loadingSchedules ? (
          <div className="py-8 flex flex-col items-center text-gray-500">
            <LoaderCircle
              size={26}
              className="animate-spin text-[#10C35D] mb-3"
            />
            <p className="text-sm">Memuat daftar jadwal...</p>
          </div>
        ) : programSchedules.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-gray-200 rounded-lg">
            <CalendarDays size={28} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">
              Belum ada jadwal untuk program ini.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Jadwal yang dibuat Admin akan ditampilkan di sini.
            </p>
          </div>
        ) : (
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-center font-semibold">No.</th>
                    <th className="px-4 py-3 text-left font-semibold">Tanggal</th>
                    <th className="px-4 py-3 text-left font-semibold">Waktu</th>
                    <th className="px-4 py-3 text-left font-semibold">Metode / Sesi</th>
                    <th className="px-4 py-3 text-left font-semibold">Lokasi</th>
                    <th className="px-4 py-3 text-center font-semibold">Peserta</th>
                    <th className="px-4 py-3 text-left font-semibold">Status</th>
                    <th className="px-4 py-3 text-left font-semibold">Kunci</th>
                    <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {programSchedules.map((schedule, index) => (
                    <tr
                      key={schedule.id}
                      className="hover:bg-gray-50 transition"
                    >
                      <td className="px-4 py-3 text-center text-gray-500">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                        {schedule.date
                          ? new Date(
                              `${String(schedule.date).slice(0, 10)}T00:00:00`
                            ).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </td>

                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={15} className="text-gray-400" />
                          {String(schedule.start_time || '').slice(0, 5)}
                          {' – '}
                          {String(schedule.end_time || '').slice(0, 5)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-700">
                        <div className="font-medium">
                          {schedule.method === 'dengan_sesi'
                            ? 'Dengan Sesi'
                            : 'Tanpa Sesi'}
                        </div>
                        {schedule.method === 'dengan_sesi' && (
                          <div className="text-xs text-gray-400 mt-1">
                            {schedule.session_name || '-'}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-600">
                        {schedule.location || '-'}
                      </td>

                      <td className="px-4 py-3 text-center text-gray-700 font-semibold">
                        {schedule.participant_count ??
                          schedule.participants?.length ??
                          0}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            schedule.status === 'published'
                              ? 'bg-green-50 text-green-700'
                              : schedule.status === 'cancelled'
                                ? 'bg-red-50 text-red-600'
                                : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {schedule.status === 'published'
                            ? 'Dipublikasikan'
                            : schedule.status === 'cancelled'
                              ? 'Dibatalkan'
                              : 'Draft'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            schedule.is_locked
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {schedule.is_locked ? (
                            <Lock size={12} />
                          ) : (
                            <Unlock size={12} />
                          )}
                          {schedule.is_locked ? 'Terkunci' : 'Terbuka'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            title="Edit jadwal"
                            onClick={() => handleScheduleAction(schedule, 'edit')}
                            className="p-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            title={schedule.is_locked ? 'Buka kunci' : 'Kunci jadwal'}
                            onClick={() => handleScheduleAction(schedule, 'lock')}
                            className={`p-2 rounded-lg border transition ${
                              schedule.is_locked
                                ? 'border-blue-200 text-blue-700 hover:bg-blue-50'
                                : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                            }`}
                          >
                            {scheduleActionLoadingId === Number(schedule.id) ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : schedule.is_locked ? (
                              <Unlock size={16} />
                            ) : (
                              <Lock size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Publikasikan jadwal"
                            onClick={() => handleScheduleAction(schedule, 'publish')}
                            className="p-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50 transition"
                          >
                            {lifecycleActionLoadingId === Number(schedule.id) ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Send size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Hapus Draft"
                            onClick={() => handleScheduleAction(schedule, 'deleteDraft')}
                            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 size={16} />
                          </button>

                          <button
                            type="button"
                            title="Arsipkan jadwal"
                            onClick={() => handleScheduleAction(schedule, 'archive')}
                            className="p-2 rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition"
                          >
                            {lifecycleActionLoadingId === Number(schedule.id) ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Archive size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            title="Kembalikan ke Draft"
                            onClick={() => handleScheduleAction(schedule, 'unpublish')}
                            className="p-2 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition"
                          >
                            {lifecycleActionLoadingId === Number(schedule.id) ? (
                              <LoaderCircle size={16} className="animate-spin" />
                            ) : (
                              <Undo2 size={16} />
                            )}
                          </button>
</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Total: {programSchedules.length} jadwal pelaksanaan
              </p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL EDIT JADWAL */}
      {editingSchedule && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !savingSchedule
            ) {
              handleCancelEditSchedule();
            }
          }}
        >
          <div
            className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-schedule-title"
          >
            {/* HEADER MODAL */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 sm:px-6 py-4 flex items-center justify-between">
              <div>
                <h4
                  id="edit-schedule-title"
                  className="font-bold text-lg text-[#0a3d2e]"
                >
                  Edit Jadwal Pelaksanaan
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedProgram?.name}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCancelEditSchedule}
                disabled={savingSchedule}
                aria-label="Tutup form edit"
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM EDIT */}
            <form
              onSubmit={(event) =>
                handleUpdateSchedule(event, editingSchedule)
              }
              className="p-5 sm:p-6 space-y-5"
            >
              {editingSchedule.method === 'dengan_sesi' && (
                <div>
                  <label className={labelClass}>Nama Sesi</label>
                  <input
                    type="text"
                    maxLength={50}
                    value={editScheduleForm.session_name}
                    onChange={(e) =>
                      handleEditScheduleField('session_name', e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>
              )}

              <div>
                <label className={labelClass}>Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  min={getTodayWITA()}
                  value={editScheduleForm.date}
                  onChange={(e) =>
                    handleEditScheduleField('date', e.target.value)
                  }
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Jam Mulai</label>
                  <input
                    type="time"
                    value={editScheduleForm.start_time}
                    onChange={(e) =>
                      handleEditScheduleField('start_time', e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Jam Selesai</label>
                  <input
                    type="time"
                    value={editScheduleForm.end_time}
                    onChange={(e) =>
                      handleEditScheduleField('end_time', e.target.value)
                    }
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Lokasi (Opsional)</label>
                <input
                  type="text"
                  maxLength={100}
                  value={editScheduleForm.location}
                  onChange={(e) =>
                    handleEditScheduleField('location', e.target.value)
                  }
                  className={inputClass}
                  placeholder="Contoh: Ruang Laboratorium Bahasa"
                />
              </div>

              {/* PENGATURAN TAMPILAN PESERTA */}
              <div className="rounded-lg border border-gray-200 p-4 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editScheduleForm.show_participants)}
                    onChange={(e) =>
                      handleEditScheduleField('show_participants', e.target.checked)
                    }
                    className="w-4 h-4 mt-0.5 accent-[#10C35D]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-700">
                      Tampilkan Peserta
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      Jika diaktifkan, nama, kelas, dan program studi peserta
                      akan ditampilkan pada jadwal publik dan dapat diunduh.
                      Jika dinonaktifkan, identitas peserta disembunyikan.
                    </span>
                  </span>
                </label>
              </div>

              <div>
                <label className={labelClass}>
                  Peserta ({editScheduleForm.registration_ids.length} mahasiswa)
                </label>

                <label className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      eligibleEditRegistrations.length > 0 &&
                      eligibleEditRegistrations.every((student) =>
                        editScheduleForm.registration_ids.includes(Number(student.id))
                      )
                    }
                    disabled={eligibleEditRegistrations.length === 0 || savingSchedule}
                    onChange={(e) => {
                      eligibleEditRegistrations.forEach((student) =>
                        handleEditScheduleParticipant(student.id, e.target.checked)
                      );
                    }}
                    className="w-4 h-4 accent-[#10C35D]"
                  />
                  Pilih Semua Peserta yang Tersedia
                </label>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                  {selectedRegistrations
                    .filter((student) => {
                      const id = Number(student.id);

                      const belongsToCurrentSchedule =
                        editingSchedule.participants?.some(
                          (participant) =>
                            Number(participant.registration_id) === id
                        );

                      const belongsToAnotherSchedule = schedules.some(
                        (item) =>
                          Number(item.id) !== Number(editingSchedule.id) &&
                          item.status !== 'cancelled' &&
                          item.participants?.some(
                            (participant) =>
                              Number(participant.registration_id) === id
                          )
                      );

                      return (
                        !belongsToAnotherSchedule &&
                        (
                          !scheduledRegistrationIds.has(id) ||
                          belongsToCurrentSchedule
                        )
                      );
                    })
                    .map((student) => (
                      <label
                        key={student.id}
                        className="flex items-center gap-3 p-3 text-sm hover:bg-green-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={editScheduleForm.registration_ids.includes(
                            Number(student.id)
                          )}
                          onChange={(e) =>
                            handleEditScheduleParticipant(
                              student.id,
                              e.target.checked
                            )
                          }
                          className="w-4 h-4 accent-[#10C35D]"
                        />

                        <span>
                          <span className="block font-semibold text-gray-700">
                            {student.name}
                          </span>
                          <span className="block text-xs text-gray-500">
                            {student.nim} · {student.class || '-'}
                          </span>
                        </span>
                      </label>
                    ))}

                  {selectedRegistrations.filter((student) => {
                    const id = Number(student.id);

                    const belongsToCurrentSchedule =
                      editingSchedule.participants?.some(
                        (participant) =>
                          Number(participant.registration_id) === id
                      );

                    const belongsToAnotherSchedule = schedules.some(
                      (item) =>
                        Number(item.id) !== Number(editingSchedule.id) &&
                        item.status !== 'cancelled' &&
                        item.participants?.some(
                          (participant) =>
                            Number(participant.registration_id) === id
                        )
                    );

                    return (
                      !belongsToAnotherSchedule &&
                      (
                        !scheduledRegistrationIds.has(id) ||
                        belongsToCurrentSchedule
                      )
                    );
                  }).length === 0 && (
                    <p className="p-4 text-sm text-gray-500 text-center">
                      Tidak ada mahasiswa yang tersedia untuk dipilih.
                    </p>
                  )}
                </div>
              </div>

              {scheduleFormError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
                  {scheduleFormError}
                </div>
              )}

              {/* FOOTER MODAL */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancelEditSchedule}
                  disabled={savingSchedule}
                  className="px-5 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-semibold disabled:opacity-50"
                >
                  {savingSchedule ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  {savingSchedule ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}