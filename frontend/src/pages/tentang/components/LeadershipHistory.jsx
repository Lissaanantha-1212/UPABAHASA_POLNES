import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, UserRound } from "lucide-react";
import SectionHeading from "./SectionHeading";

const API_URL = "https://upabahasa-polnes-4p4a.vercel.app/api/cms/about";
const API_ORIGIN = "https://upabahasa-polnes-4p4a.vercel.app";

function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function formatPeriod(person) {
  const start = person.start_period?.trim();
  const end = person.end_period?.trim();

  if (start && end) return `${start} – ${end}`;
  if (start) return `Sejak ${start}`;
  if (end) return `Sampai ${end}`;
  return "Periode jabatan belum dilengkapi";
}

export default function LeadershipHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL);
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
          throw new Error(
            result.message || "Gagal memuat riwayat kepemimpinan."
          );
        }

        const records = Array.isArray(result.data?.history)
          ? result.data.history
          : [];

        if (!cancelled) {
          setHistory(records);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Tidak dapat terhubung ke server.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  return (
    <section
      id="riwayat-kepemimpinan"
      className="scroll-mt-16 overflow-hidden bg-white py-11 md:py-14 lg:py-16"
    >
      <div className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <SectionHeading
          eyebrow="Riwayat Kepemimpinan"
          title="Kepala UPA dari Masa ke Masa"
          description="Mengenal para pemimpin yang telah berkontribusi dalam perjalanan dan perkembangan UPA Bahasa POLNES."
          centered
        />

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Memuat riwayat kepemimpinan...
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-100 bg-red-50 px-5 py-8 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={() => setRetry((value) => value + 1)}
              className="mt-3 rounded-lg bg-[#0a3d2e] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#10533e]"
            >
              Coba Lagi
            </button>
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-5 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#0a3d2e]">
              <UserRound size={23} />
            </div>
            <p className="font-semibold text-gray-700">
              Riwayat kepemimpinan belum tersedia
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Informasi Kepala UPA Bahasa akan ditampilkan di bagian ini.
            </p>
          </div>
        ) : (
          <>
            <div
              className="flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden pb-4"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "#86d6a5 #f0faf4",
              }}
            >
              {history.map((person, index) => (
                <article
                  key={person.id}
                  className="group w-[220px] shrink-0 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_5px_18px_rgba(10,61,46,0.05)] transition duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-[0_12px_28px_rgba(10,61,46,0.10)] sm:w-[245px]"
                >
                  <div className="relative h-[245px] overflow-hidden bg-[#edf5ef] sm:h-[265px]">
                    {person.photo ? (
                      <img
                        src={getImageUrl(person.photo)}
                        alt={`Foto ${person.name}`}
                        loading="lazy"
                        className="h-full w-full object-cover object-top grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[#0a3d2e]/30">
                        <UserRound size={76} strokeWidth={1} />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#062f23]/80 via-transparent to-transparent opacity-75 transition group-hover:opacity-95" />

                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-[#0a3d2e]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-green-200">
                        Kepala UPA Bahasa
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-white">
                        {person.name}
                      </h3>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <CalendarDays
                        size={14}
                        className="shrink-0 text-[#10C35D]"
                      />
                      <span>{formatPeriod(person)}</span>
                    </div>
                    <div className="mt-3 h-1 w-0 rounded-full bg-[#10C35D] transition-all duration-500 group-hover:w-full" />
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-1 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ArrowRight size={14} />
              Geser untuk melihat riwayat kepemimpinan lainnya
            </div>
          </>
        )}
      </div>
    </section>
  );
}
