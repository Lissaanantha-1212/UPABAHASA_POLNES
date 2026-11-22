import {
  Calendar,
  Tag,
  X,
  BookOpen,
  Award,
  Handshake,
  Info,
} from 'lucide-react';

function getCategoryIcon(category) {
  switch (category) {
    case 'Kegiatan':
      return BookOpen;
    case 'Prestasi':
      return Award;
    case 'Kerja Sama':
      return Handshake;
    default:
      return Info;
  }
}

export default function NewsModal({
  item,
  isNew,
  onClose,
  loadingDetail = false,
  detailError = '',
}) {
  const CategoryIcon = getCategoryIcon(item.category);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#061f18]/65 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-modal-title"
        className="relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
      >
        {/* GAMBAR UTAMA */}
        <div className="relative h-52 shrink-0 bg-[#EAF5EE] sm:h-60">
          {item.image && (
            <img
              src={item.image}
              alt=""
              className="h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#0a3d2e]/60 via-transparent to-black/10" />

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail informasi"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition hover:rotate-90 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10C35D]"
          >
            <X size={19} />
          </button>

          <div className="absolute bottom-4 left-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#10C35D] px-3.5 py-2 text-xs font-bold text-white shadow-sm">
              <CategoryIcon size={14} />
              {item.category}
            </span>

            {isNew && (
              <span className="rounded-full bg-white px-3.5 py-2 text-[10px] font-extrabold tracking-wider text-[#0a3d2e] shadow-sm">
                BARU
              </span>
            )}
          </div>
        </div>

        {/* ISI INFORMASI */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-7">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-gray-600">
              <Calendar size={15} className="text-[#10C35D]" />
              {item.date}
            </span>

            <span className="inline-flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              <Tag size={15} className="text-[#10C35D]" />
              {item.type}
            </span>
          </div>

          <h2
            id="news-modal-title"
            className="text-xl font-extrabold leading-snug tracking-tight text-[#0a3d2e] sm:text-2xl"
          >
            {item.title}
          </h2>

          <div className="my-5 h-px bg-gradient-to-r from-[#10C35D]/50 via-gray-200 to-transparent" />

          {loadingDetail ? (
            <p className="py-6 text-sm text-gray-500">
              Memuat detail informasi...
            </p>
          ) : detailError ? (
            <p className="whitespace-pre-line rounded-xl bg-red-50 p-4 text-sm leading-7 text-red-600">
              {detailError}
            </p>
          ) : (
            <div className="whitespace-pre-line break-words text-sm leading-8 text-gray-600 sm:text-[15px]">
              {item.content}
            </div>
          )}

          <div className="mt-8 flex justify-end border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#0a3d2e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#10553f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10C35D] focus-visible:ring-offset-2"
            >
              Tutup
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
