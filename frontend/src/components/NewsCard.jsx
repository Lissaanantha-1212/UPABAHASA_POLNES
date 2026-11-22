import {
  Calendar,
  BookOpen,
  Award,
  Handshake,
  Info,
  ArrowUpRight,
  ChevronRight,
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

export default function NewsCard({
  item,
  isNew,
  onOpen,
  showCategory = true,
}) {
  const CategoryIcon = getCategoryIcon(item.category);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#10C35D]/30 hover:shadow-[0_16px_35px_rgba(10,61,46,0.10)]">
      <button
        type="button"
        onClick={onOpen}
        className="relative block h-52 w-full overflow-hidden bg-[#EAF5EE] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#10C35D]"
        aria-label={`Baca ${item.title}`}
      >
        {item.image && (
          <img
            src={item.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-[#0a3d2e]/45 via-transparent to-transparent opacity-70" />

        {showCategory && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0a3d2e] shadow-sm backdrop-blur">
            <CategoryIcon size={13} /> {item.category}
          </span>
        )}

        {isNew && (
          <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-[#10C35D] px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-white shadow-md">
            BARU
          </span>
        )}

        <span className="absolute bottom-4 right-4 flex h-9 w-9 translate-x-2 items-center justify-center rounded-full bg-white text-[#10C35D] opacity-0 shadow-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
          <ArrowUpRight size={18} />
        </span>
      </button>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
          <Calendar size={14} className="text-[#10C35D]" />
          <time>{item.date}</time>
          <span className="h-1 w-1 rounded-full bg-gray-300" />
          <span>{item.type}</span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="mb-3 text-left text-lg font-bold leading-snug text-[#0a3d2e] transition-colors hover:text-[#10C35D] focus:outline-none focus-visible:underline"
        >
          {item.title}
        </button>

        <p className="mb-5 line-clamp-3 flex-1 text-sm leading-6 text-gray-500">
          {item.summary}
        </p>

        <button
          type="button"
          onClick={onOpen}
          className="mt-auto inline-flex w-fit items-center gap-2 border-b border-transparent pb-1 text-sm font-bold text-[#10C35D] transition-all hover:gap-3 hover:border-[#10C35D] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10C35D]"
        >
          Baca selengkapnya <ChevronRight size={16} />
        </button>
      </div>
    </article>
  );
}
