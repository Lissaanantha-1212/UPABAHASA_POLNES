export default function EmptyState({
  icon: Icon,
  title,
  description,
  onReset,
  showReset,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-14 text-center">
      <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF7EF] text-[#10C35D]">
        <Icon size={25} />
      </span>

      <h3 className="text-lg font-bold text-[#0a3d2e]">{title}</h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {description}
      </p>

      {showReset && (
        <button
          type="button"
          onClick={onReset}
          className="mt-5 rounded-lg px-4 py-2 text-sm font-bold text-[#10C35D] transition hover:bg-[#EAF7EF]"
        >
          Tampilkan semua
        </button>
      )}
    </div>
  );
}
