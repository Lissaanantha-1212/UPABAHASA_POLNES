import { ChevronDown } from 'lucide-react';

export default function FaqItem({ item, index, isOpen, onToggle }) {
  const answerId = `faq-answer-${item.id}`;

  return (
    <article
      className={`overflow-hidden rounded-2xl border bg-white transition-all duration-300 ${
        isOpen
          ? 'border-[#10C35D]/50 shadow-[0_10px_25px_rgba(10,61,46,0.07)]'
          : 'border-gray-100 shadow-sm hover:border-[#10C35D]/30'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={answerId}
        className="flex w-full items-center gap-4 p-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#10C35D] md:p-5"
      >
        <span
          className={`hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold sm:flex ${
            isOpen
              ? 'bg-[#10C35D] text-white'
              : 'bg-[#EAF7EF] text-[#10C35D]'
          }`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>

        <span className="min-w-0 flex-1">
          <span className="mb-1.5 block">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                isOpen
                  ? 'bg-[#E8F8EE] text-[#0a3d2e]'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {item.topic}
            </span>
          </span>

          <span
            className={`block text-sm font-bold leading-6 md:text-base ${
              isOpen ? 'text-[#10C35D]' : 'text-[#0a3d2e]'
            }`}
          >
            {item.question}
          </span>
        </span>

        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${
            isOpen
              ? 'rotate-180 bg-[#E8F8EE] text-[#10C35D]'
              : 'bg-gray-50 text-gray-400'
          }`}
        >
          <ChevronDown size={18} />
        </span>
      </button>

      <div
        id={answerId}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="overflow-hidden">
          <div className="ml-4 border-l-2 border-[#10C35D]/30 pb-5 pl-4 pr-5 text-sm leading-7 text-gray-600 sm:ml-[4.25rem] sm:pl-5 md:pr-8">
            {item.answer}
          </div>
        </div>
      </div>
    </article>
  );
}
