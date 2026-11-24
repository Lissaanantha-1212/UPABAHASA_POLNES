
import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

const API_URL =
  "https://upabahasa-polnes-4p4a.vercel.app/api/cms/about";

const API_ORIGIN =
  "https://upabahasa-polnes-4p4a.vercel.app";

function getImageUrl(path) {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://")
  ) {
    return path;
  }

  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
}

function MemberCard({ person }) {
  const [showDetail, setShowDetail] = useState(false);

  const photo = getImageUrl(person.photo);

  return (
    <>
      <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-tl-xl rounded-tr-xl rounded-bl-xl rounded-br-[28px] border border-gray-100 bg-white shadow-[0_8px_25px_rgba(10,61,46,0.09)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(10,61,46,0.15)] sm:rounded-tl-2xl sm:rounded-tr-2xl sm:rounded-bl-2xl sm:rounded-br-[48px] md:rounded-br-[64px]">

        {/* Foto Personel */}
        <div className="relative aspect-square w-full shrink-0 overflow-hidden rounded-tl-xl rounded-tr-xl rounded-bl-none rounded-br-[28px] bg-[#e8f8ee] sm:rounded-tl-2xl sm:rounded-tr-2xl sm:rounded-br-[48px] md:rounded-br-[68px]">

          {photo ? (
            <img
              src={photo}
              alt={`Foto ${person.name}`}
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8f8ee] to-[#c8eed6]">
              <span className="text-2xl font-bold text-[#0a3d2e] sm:text-5xl md:text-6xl">
                {person.name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          )}
        </div>

        {/* Informasi Personel */}
        <div className="flex min-h-0 flex-1 flex-col px-1.5 pb-2.5 pt-2 sm:px-3 sm:pb-4 sm:pt-3 md:px-5 md:pb-7 md:pt-4">

          <h4 className="line-clamp-3 break-words text-[8px] font-bold leading-snug text-gray-800 sm:line-clamp-2 sm:text-sm md:text-lg">
            {person.name}
          </h4>

          <p className="mt-1 line-clamp-3 break-words text-[7px] leading-relaxed text-gray-500 sm:line-clamp-2 sm:text-xs md:text-sm">
            {person.section_name}
          </p>

          {/* Tombol Detail */}
          <div className="mt-auto pt-2 sm:pt-3">

            <button
              type="button"
              onClick={() => setShowDetail(true)}
              className="inline-flex items-center gap-0.5 text-[7px] font-semibold text-[#10C35D] transition-colors hover:text-[#0a3d2e] sm:gap-1 sm:text-[10px] md:text-xs"
            >
              Klik Detail
              <span aria-hidden="true">→</span>
            </button>

          </div>
        </div>
      </article>

      {/* Modal Detail Personel */}
      {showDetail && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
          onClick={() => setShowDetail(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`member-title-${person.id}`}
            className="relative min-w-0 max-h-[85vh] w-full max-w-lg overflow-x-hidden overflow-y-auto rounded-2xl border border-green-100 bg-white p-5 shadow-2xl sm:p-6 md:p-8"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Tombol Tutup */}
            <button
              type="button"
              onClick={() => setShowDetail(false)}
              aria-label="Tutup rincian tugas"
              className="absolute right-3 top-3 rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 sm:right-4 sm:top-4"
            >
              <X size={20} />
            </button>

            {/* Header Modal */}
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

            {/* Rincian Tugas */}
            <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-green-100 bg-[#f5fbf7] p-4 sm:p-5">

              <h4 className="mb-3 border-l-4 border-[#10C35D] pl-3 text-sm font-bold text-[#0a3d2e]">
                Rincian Tugas
              </h4>

              <p className="min-w-0 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm leading-7 text-gray-600">
                {person.description?.trim() ||
                  "Rincian tugas belum tersedia."}
              </p>

            </div>

            {/* Footer Modal */}
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

export default function OrganizationChart() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  // Mengambil data organisasi dari CMS
  useEffect(() => {
    let cancelled = false;

    const fetchOrganization = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(API_URL);
        const result = await response.json();

        if (
          !response.ok ||
          !result.success ||
          !result.data
        ) {
          throw new Error(
            result.message ||
              "Gagal mengambil data struktur organisasi."
          );
        }

        const memberData = Array.isArray(
          result.data.members
        )
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

  // Mengurutkan data personel
  const sortedMembers = useMemo(() => {
    return [...members]
      .filter((person) =>
        String(person.section_name || "").trim()
      )
      .sort((a, b) => {
        const orderDifference =
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0);

        return (
          orderDifference ||
          Number(a.id) - Number(b.id)
        );
      });
  }, [members]);

  // Loading
  if (loading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 sm:py-16">
        Memuat struktur organisasi...
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-12 text-center">

        <p className="text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            setRetry((value) => value + 1)
          }
          className="mt-4 rounded-lg bg-[#0a3d2e] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#10C35D]"
        >
          Coba Lagi
        </button>

      </div>
    );
  }

  // Data kosong
  if (sortedMembers.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500 sm:py-16">
        Struktur organisasi belum tersedia.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-3 sm:px-5 md:px-8 lg:px-10">

      {/* Grid Organisasi - Selalu 4 Kolom */}
      <div className="grid grid-cols-4 items-stretch gap-1.5 sm:gap-3 md:gap-5">

        {sortedMembers.map((person) => (
          <div
            key={person.id}
            className="min-w-0"
          >
            <MemberCard person={person} />
          </div>
        ))}

      </div>
    </div>
  );
}
