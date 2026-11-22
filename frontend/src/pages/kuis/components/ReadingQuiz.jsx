import React from "react";
import { BookOpen } from "lucide-react";

export default function ReadingQuiz({ currentGroup }) {
  if (!currentGroup) return null;

  const instruction = currentGroup.readingInstruction?.trim()
    ? currentGroup.readingInstruction
    : "Bacalah teks berikut dengan saksama.";

  return (
    <div className="mb-5 rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf8ef] text-[#0b9d4a]">
          <BookOpen size={22} />
        </div>

        <div>
          <h2 className="font-bold text-[#173d2d]">
            Teks Bacaan
          </h2>

          <p className="text-xs text-gray-500">
            {instruction}
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-[#f5faf6] p-5">
        <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
          {currentGroup.passage}
        </p>
      </div>
    </div>
  );
}
