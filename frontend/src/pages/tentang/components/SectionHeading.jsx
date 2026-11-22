export default function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}) {
  return (
    <div className={`mb-7 md:mb-9 ${centered ? "text-center" : ""}`}>
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#10a653] md:text-xs">
        {eyebrow}
      </p>

      <h2 className="text-2xl font-bold leading-tight tracking-tight text-[#0a3d2e] md:text-3xl">
        {title}
      </h2>

      {description && (
        <p
          className={`mt-3 max-w-2xl text-sm leading-7 text-gray-600 ${
            centered ? "mx-auto" : ""
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
