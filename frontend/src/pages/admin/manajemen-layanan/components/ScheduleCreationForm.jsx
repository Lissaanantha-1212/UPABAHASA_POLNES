
import {
  Plus,
  Trash2,
  LoaderCircle,
  Save,
} from 'lucide-react';

export default function ScheduleCreationForm(props) {
  const {
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
  } = props;

  return (
    <form
      onSubmit={handleCreateSchedule}
      className="border border-gray-200 rounded-xl p-4 sm:p-5 space-y-5"
    >
      <div>
        <h3 className="text-lg font-bold text-[#0a3d2e]">
          Buat Jadwal Pelaksanaan
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Atur pelaksanaan program dan peserta yang akan mengikuti jadwal.
        </p>
      </div>

      <div>
        <label className={labelClass}>Metode Penjadwalan</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleScheduleMethodChange('tanpa_sesi')}
            className={`rounded-lg border p-4 text-left transition ${
              scheduleMethod === 'tanpa_sesi'
                ? 'border-[#10C35D] bg-green-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="font-semibold text-gray-700">Tanpa Sesi</p>
            <p className="text-xs text-gray-500 mt-1">
              Semua peserta mengikuti satu jadwal yang sama.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleScheduleMethodChange('dengan_sesi')}
            className={`rounded-lg border p-4 text-left transition ${
              scheduleMethod === 'dengan_sesi'
                ? 'border-[#10C35D] bg-green-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            <p className="font-semibold text-gray-700">Dengan Sesi</p>
            <p className="text-xs text-gray-500 mt-1">
              Peserta dibagi ke beberapa sesi dengan waktu fleksibel.
            </p>
          </button>
        </div>
      </div>

      {scheduleMethod === 'tanpa_sesi' ? (
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Tanggal Pelaksanaan</label>
            <input
              type="date"
              min={getTodayWITA()}
              value={scheduleForm.date}
              onChange={(e) =>
                handleScheduleFieldChange('date', e.target.value)
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
                value={scheduleForm.start_time}
                onChange={(e) =>
                  handleScheduleFieldChange('start_time', e.target.value)
                }
              className={inputClass}
                required
            />
            </div>

            <div>
              <label className={labelClass}>Jam Selesai</label>
              <input
                type="time"
                value={scheduleForm.end_time}
                onChange={(e) =>
                  handleScheduleFieldChange('end_time', e.target.value)
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
              value={scheduleForm.location}
              onChange={(e) =>
                handleScheduleFieldChange('location', e.target.value)
              }
              placeholder="Contoh: Ruang Laboratorium Bahasa"
              className={inputClass}
            />
          </div>

          {/* Pengaturan visibilitas peserta Tanpa Sesi */}
          <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(scheduleForm.show_participants)}
              onChange={(e) =>
                handleScheduleFieldChange(
                  'show_participants',
                  e.target.checked
                )
              }
              className="mt-1 w-4 h-4 accent-[#10C35D]"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-700">
                Tampilkan Peserta
              </span>
              <span className="block text-xs text-gray-500 mt-1">
                Jika diaktifkan, nama, kelas, dan program studi peserta dapat dilihat dan diunduh secara publik.
              </span>
            </span>
          </label>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Peserta yang akan dimasukkan ke jadwal:
              <strong className="ml-1 text-[#0DAA50]">
                {availableSelectedIdsCount()} mahasiswa
              </strong>
            </p>

            {availableRegistrations.filter((student) =>
              selectedRegistrationIds.includes(Number(student.id))
            ).length > 0 ? (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                {availableRegistrations
                  .filter((student) =>
                    selectedRegistrationIds.includes(Number(student.id))
                  )
                  .map((student, index) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {index + 1}. {student.name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {student.nim} · {student.class || '-'}
                        </p>
                      </div>
                      <span className="text-xs text-green-700 font-medium">
                        Dipilih
                      </span>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="border border-dashed border-gray-200 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">
                  Belum ada mahasiswa yang dipilih.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-700">Daftar Sesi</p>
              <p className="text-xs text-gray-500 mt-1">
                Setiap sesi dapat memiliki tanggal dan waktu berbeda.
              </p>
            </div>

            <button
              type="button"
              onClick={addSessionRow}
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#0DAA50] hover:text-[#0a3d2e]"
            >
              <Plus size={16} />
              Tambah Sesi
            </button>
          </div>

          {sessionRows.map((session, index) => {
            const assignedToOtherSessions = new Set(
              sessionRows
                .filter((item) => item.id !== session.id)
                .flatMap((item) => item.registration_ids.map(Number))
            );

            return (
              <div
                key={session.id}
                className="border border-gray-200 rounded-lg p-4 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <h4 className="font-bold text-[#0a3d2e]">
                    Sesi {index + 1}
                  </h4>

                  {sessionRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSessionRow(session.id)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={15} />
                      Hapus Sesi
                    </button>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Nama Sesi</label>
                  <input
                    type="text"
                    value={session.session_name}
                    onChange={(e) =>
                      handleSessionFieldChange(
                        session.id,
                        'session_name',
                        e.target.value
                      )
                    }
                    placeholder={`Sesi ${index + 1}`}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label className={labelClass}>Tanggal Pelaksanaan</label>
                  <input
                    type="date"
                    min={getTodayWITA()}
                    value={session.date}
                    onChange={(e) =>
                      handleSessionFieldChange(
                        session.id,
                        'date',
                        e.target.value
                      )
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
                      value={session.start_time}
                      onChange={(e) =>
                        handleSessionFieldChange(
                          session.id,
                          'start_time',
                          e.target.value
                        )
                      }
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Jam Selesai</label>
                    <input
                      type="time"
                      value={session.end_time}
                      onChange={(e) =>
                        handleSessionFieldChange(
                          session.id,
                          'end_time',
                          e.target.value
                        )
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
                    value={session.location}
                    onChange={(e) =>
                      handleSessionFieldChange(
                        session.id,
                        'location',
                        e.target.value
                      )
                    }
                    placeholder="Contoh: Ruang Laboratorium Bahasa"
                    className={inputClass}
                  />
                </div>

                {/* Pengaturan visibilitas peserta per sesi */}
                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(session.show_participants)}
                    onChange={(e) =>
                      handleSessionFieldChange(
                        session.id,
                        'show_participants',
                        e.target.checked
                      )
                    }
                    className="mt-1 w-4 h-4 accent-[#10C35D]"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-gray-700">
                      Tampilkan Peserta
                    </span>
                    <span className="block text-xs text-gray-500 mt-1">
                      Jika diaktifkan, identitas peserta sesi dapat dilihat dan diunduh secara publik.
                    </span>
                  </span>
                </label>

                <div>
                  <label className={labelClass}>
                    Peserta Sesi ({session.registration_ids.length})
                  </label>

                  {availableRegistrations.filter((student) =>
                    selectedRegistrationIds.includes(Number(student.id))
                  ).length === 0 ? (
                    <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg p-3">
                      Pilih mahasiswa terlebih dahulu pada tabel pendaftar.
                    </p>
                  ) : (
                    <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                      {availableRegistrations
                        .filter((student) =>
                          selectedRegistrationIds.includes(Number(student.id))
                        )
                        .map((student) => {
                          const assignedElsewhere =
                            assignedToOtherSessions.has(Number(student.id));

                          return (
                            <label
                              key={student.id}
                              className={`flex items-center gap-3 p-3 text-sm ${
                                assignedElsewhere
                                  ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                  : 'hover:bg-green-50 cursor-pointer'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={session.registration_ids.includes(
                                  Number(student.id)
                                )}
                                disabled={assignedElsewhere}
                                onChange={(e) =>
                                  handleSessionParticipant(
                                    session.id,
                                    student.id,
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 accent-[#10C35D]"
                              />
                              <span>
                                <span className="block font-semibold">
                                  {student.name}
                                </span>
                                <span className="block text-xs">
                                  {student.nim} · {student.class || '-'}
                                </span>
                              </span>
                              {assignedElsewhere && (
                                <span className="ml-auto text-xs">
                                  Sudah masuk sesi lain
                                </span>
                              )}
                            </label>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {scheduleFormError && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">
          {scheduleFormError}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={creatingSchedule}
          className="inline-flex items-center justify-center gap-2 bg-[#10C35D] hover:bg-[#0DAA50] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg text-sm transition"
        >
          {creatingSchedule ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {creatingSchedule ? 'Menyimpan...' : 'Buat Jadwal Draft'}
        </button>
      </div>
    </form>
  );
}
