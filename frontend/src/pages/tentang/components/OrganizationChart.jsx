
import { useEffect, useMemo, useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = "https://upabahasa-polnes-4p4a.vercel.app/api/cms/about";
const API_ORIGIN = "https://upabahasa-polnes-4p4a.vercel.app";

function getImageUrl(path) {
  if (!path) return "";

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function MemberCard({ person }) {
  const [showDetail, setShowDetail] = useState(false);
  const photo = getImageUrl(person.photo);

  return (
    <>
      <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-[64px] border border-gray-100 bg-white shadow-[0_8px_25px_rgba(10,61,46,0.09)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(10,61,46,0.15)]">
        <div className="relative aspect-[4/4.3] w-full shrink-0 overflow-hidden rounded-tl-xl rounded-tr-xl rounded-bl-none rounded-br-[68px] bg-[#e8f8ee]">
          {photo ? (
            <img
              src={photo}
              alt={`Foto ${person.name}`}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8f8ee] to-[#c8eed6]">
              <span className="text-6xl font-bold text-[#0a3d2e]">
                {person.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-4 pb-6 pt-4 md:px-5 md:pb-7">
          <h4 className="line-clamp-2 break-words text-base font-bold leading-snug text-gray-800 md:text-lg">
            {person.name}
          </h4>

          <p className="mt-1 line-clamp-2 break-words text-sm text-gray-500">
            {person.section_name}
          </p>

          <div className="mt-auto pt-3">
            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#10C35D] transition-colors hover:text-[#0a3d2e]"
            >
              Klik Detail
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </article>

      {showDetail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowDetail(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`member-title-${person.id}`}
            className="relative max-h-[85vh] w-full max-w-lg min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-green-100 bg-white p-6 shadow-2xl md:p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowDetail(false)}
              aria-label="Tutup rincian tugas"
              className="absolute right-4 top-4 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              <X size={20} />
            </button>

            <div className="mb-5 pr-8">
              <p className="text-xs font-bold uppercase tracking-wider text-[#10C35D]">
                Detail Personel
              </p>

              <h3
                id={`member-title-${person.id}`}
                className="mt-2 break-words text-xl font-bold text-[#0a3d2e]"
              >
                {person.name}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {person.section_name}
              </p>
            </div>

            <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-green-100 bg-[#f5fbf7] p-5">
              <h4 className="mb-3 border-l-4 border-[#10C35D] pl-3 text-sm font-bold text-[#0a3d2e]">
                Rincian Tugas
              </h4>

              <p className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-7 text-gray-600">
                {person.description?.trim() ||
                  "Rincian tugas belum tersedia."}
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetail(false)}
                className="rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MemberCarousel({ members }) {
  const [startIndex, setStartIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);

  const hasCarousel = members.length > 4;

  const visibleMembers = hasCarousel
    ? members.slice(startIndex, startIndex + 4)
    : members;

  const maxStart = Math.max(0, members.length - 4);

  useEffect(() => {
    if (!hasCarousel || paused) return undefined;

    const interval = setInterval(() => {
      setStartIndex((current) =>
        current >= maxStart ? 0 : current + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [hasCarousel, paused, maxStart]);

  const moveCarousel = (direction) => {
    setStartIndex((current) => {
      if (direction === "next") {
        return current >= maxStart ? 0 : current + 1;
      }

      return current <= 0 ? maxStart : current - 1;
    });
  };

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
    setPaused(true);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;

    const distance =
      event.changedTouches[0].clientX - touchStartX;

    if (distance < -45) moveCarousel("next");
    if (distance > 45) moveCarousel("previous");

    setTouchStartX(null);
    setPaused(false);
  };

  return (
    <div
      className="relative w-full min-w-0 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      onTouchStart={hasCarousel ? handleTouchStart : undefined}
      onTouchEnd={hasCarousel ? handleTouchEnd : undefined}
    >
      {hasCarousel && (
        <>
          <button
            type="button"
            aria-label="Geser personel ke kiri"
            onClick={() => moveCarousel("previous")}
            className="absolute left-1 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-green-100 bg-white/95 text-[#0a3d2e] shadow-lg transition hover:bg-[#0a3d2e] hover:text-white md:left-2"
          >
            <ChevronLeft size={21} />
          </button>

          <button
            type="button"
            aria-label="Geser personel ke kanan"
            onClick={() => moveCarousel("next")}
            className="absolute right-1 top-1/2 z-30 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-green-100 bg-white/95 text-[#0a3d2e] shadow-lg transition hover:bg-[#0a3d2e] hover:text-white md:right-2"
          >
            <ChevronRight size={21} />
          </button>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-12 bg-gradient-to-r from-white via-white/80 to-transparent backdrop-blur-[3px] md:w-16" />

          <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-12 bg-gradient-to-l from-white via-white/80 to-transparent backdrop-blur-[3px] md:w-16" />
        </>
      )}

      <div
        className={
          hasCarousel
            ? "flex w-full min-w-0 items-stretch justify-center gap-5"
            : "grid grid-cols-1 items-stretch justify-items-center gap-5 min-[480px]:grid-cols-2 min-[768px]:grid-cols-4"
        }
      >
        {visibleMembers.map((person) => (
          <div
            key={person.id}
            className={
              hasCarousel
                ? "flex max-w-[220px] min-w-0 shrink-0"
                : "flex w-full max-w-[220px] min-w-0"
            }
            style={
              hasCarousel
                ? { flexBasis: "calc((100% - 60px) / 4)" }
                : undefined
            }
          >
            <MemberCard person={person} />
          </div>
        ))}
      </div>

      {hasCarousel && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: maxStart + 1 }).map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Tampilkan posisi ${index + 1}`}
              onClick={() => setStartIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                startIndex === index
                  ? "w-7 bg-[#0a3d2e]"
                  : "w-2 bg-[#b9dfc7] hover:bg-[#10C35D]"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrganizationChart() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchOrganization = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (!response.ok || !result.success || !result.data) {
          throw new Error(
            result.message ||
              "Gagal mengambil data struktur organisasi."
          );
        }

        const memberData = Array.isArray(result.data.members)
          ? result.data.members
          : [];

        if (!cancelled) {
          setMembers(memberData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message ||
              "Terjadi kesalahan saat memuat struktur organisasi."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchOrganization();

    return () => {
      cancelled = true;
    };
  }, [retry]);

  const sortedMembers = useMemo(() => {
    return [...members]
      .filter((person) => String(person.section_name || "").trim())
      .sort((a, b) => {
        const orderDifference =
          Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);

        return orderDifference || Number(a.id) - Number(b.id);
      });
  }, [members]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Memuat struktur organisasi...
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 text-center">
        <p className="text-sm text-red-600">{error}</p>

        <button
          type="button"
          onClick={() => setRetry((value) => value + 1)}
          className="mt-4 rounded-lg bg-[#0a3d2e] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#10C35D]"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  if (sortedMembers.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-gray-500">
        Struktur organisasi belum tersedia.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-6xl overflow-hidden px-3 md:px-5">
      <MemberCarousel members={sortedMembers} />
    </div>
  );
}
