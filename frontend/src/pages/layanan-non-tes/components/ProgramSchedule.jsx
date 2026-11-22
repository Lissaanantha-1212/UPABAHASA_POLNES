import React from 'react';
import {
  CalendarDays,
  Clock3,
  Users,
  MapPin,
  Download,
} from 'lucide-react';

import SectionTitle from './SectionTitle';
import InformationItem from './InformationItem';

function ProgramSchedule({ program, downloadingScheduleId, onDownloadExcel }) {
  const schedules = Array.isArray(program?.schedule)
    ? program.schedule
    : [];

  const scheduleCount = schedules.length;

  return (
    <section
      id="jadwal-program"
      className="overflow-hidden rounded-3xl border border-[#e4f1e8] bg-white shadow-[0_8px_30px_rgba(10,61,46,0.05)]"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-[#0A3D2E] via-[#10C35D] to-[#9BE7B8]" />

      <div className="space-y-6 p-5 sm:p-7 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <SectionTitle
              icon={CalendarDays}
              eyebrow="Informasi kegiatan"
              title="Jadwal Pelaksanaan"
              description="Informasi jadwal yang telah disusun dan diterbitkan oleh Admin UPA Bahasa."
            />

            <div className="mt-3 flex items-start gap-2 rounded-xl border border-[#dcefe2] bg-[#f5fbf7] px-3.5 py-3 sm:max-w-[420px]">
              <Download
                size={16}
                className="mt-0.5 shrink-0 text-[#10A653]"
              />
              <p className="text-xs leading-5 text-[#527966]">
                Jadwal pelaksanaan akan ditampilkan setelah diterbitkan
                oleh Admin UPA Bahasa. Setelah tersedia, jadwal dapat
                dilihat dan diunduh dalam format Excel melalui halaman ini.
              </p>
            </div>
          </div>


        </div>

        {scheduleCount > 0 ? (
          <>
            <div className="flex items-center justify-between border-b border-[#e8f0eb] pb-4">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                <CalendarDays size={15} className="text-[#10C35D]" />
                Jadwal pelaksanaan
              </div>

              <span className="rounded-full bg-[#edf9f1] px-3 py-1.5 text-xs font-bold text-[#0A8F49]">
                {scheduleCount} Jadwal
              </span>
            </div>

            <div className="space-y-4">
              {schedules.map((jadwal, index) => {
                const rawParticipants = Array.isArray(jadwal?.participants)
                  ? jadwal.participants
                  : [];



                const participantCount =
                  jadwal?.participantCount !== null &&
                  jadwal?.participantCount !== undefined
                    ? `${jadwal.participantCount} peserta`
                    : 'Tidak ditampilkan';

                return (
                  <article
                    key={jadwal?.id || `${jadwal?.session || 'jadwal'}-${index}`}
                    className="overflow-hidden rounded-2xl border border-[#e2eee6] transition-colors duration-200 hover:border-[#c5e7d1]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e2eee6] bg-gradient-to-r from-[#f2faf5] to-[#fafdfb] px-4 py-4 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#10C35D] shadow-sm">
                          <CalendarDays size={17} />
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#10A653]">
                            Jadwal {index + 1}
                          </p>

                          <h3 className="mt-0.5 text-sm font-bold text-[#0a3d2e]">
                            {jadwal?.session || 'Tanpa Sesi'}
                          </h3>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#dcefe2] bg-white px-3 py-1.5 text-[10px] font-semibold text-[#0A8F49]">
                          {program?.shortName || 'Program UPA Bahasa'}
                        </span>

                        <button
                          type="button"
                          onClick={() => onDownloadExcel(jadwal.id)}
                          disabled={!jadwal?.id || downloadingScheduleId !== null}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ccebd7] bg-white px-3 py-2 text-xs font-bold text-[#0A8F49] transition hover:border-[#10C35D] hover:bg-[#edf9f1] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/15 disabled:cursor-wait disabled:opacity-60"
                        >
                          <Download size={14} />
                          {downloadingScheduleId === jadwal.id
                            ? 'Menyiapkan...'
                            : 'Unduh Excel'}
                        </button>
                      </div>
                    </div>

                    <div className="grid gap-4 p-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-5 sm:p-5">
                      <InformationItem
                        icon={CalendarDays}
                        label="Tanggal Pelaksanaan"
                        value={jadwal?.date || 'Belum ditentukan'}
                      />

                      <InformationItem
                        icon={Clock3}
                        label="Waktu"
                        value={jadwal?.time || 'Belum ditentukan'}
                      />

                      <InformationItem
                        icon={MapPin}
                        label="Lokasi"
                        value={jadwal?.location || 'Belum ditentukan'}
                      />

                      <InformationItem
                        icon={Users}
                        label="Jumlah Peserta"
                        value={participantCount}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#ccebd7] bg-[#f7fbf8] px-5 py-8 text-center sm:py-10">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dcefe2] bg-white text-[#10C35D] shadow-sm">
              <CalendarDays size={24} />
            </div>

            <p className="text-sm font-bold text-[#0a3d2e]">
              Jadwal Belum Tersedia
            </p>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-6 text-gray-500">
              Jadwal akan ditampilkan setelah Admin UPA Bahasa
              menyelesaikan pengaturan dan menerbitkan jadwal
              pelaksanaan program.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

export default ProgramSchedule;


