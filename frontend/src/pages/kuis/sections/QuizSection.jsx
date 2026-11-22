import React from "react";
import {
  Headphones,
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Volume2,
} from "lucide-react";
import ReadingQuiz from "../components/ReadingQuiz";

export default function QuizSection({
  selectedCategory,
  selectedLevel,
  currentIndex,
  quizQuestions,
  currentQuestion,
  currentGroup,
  answers,
  audioPlayCount,
  isAudioPlaying,
  audioRef,
  handleAudioEnded,
  handlePlayAudio,
  handleAnswer,
  handlePrevious,
  handleNext,
  onFinish,
  onSelectQuestion,
  isSubmitting = false,
}) {
  const isLastQuestion = currentIndex === quizQuestions.length - 1;
  const isAnswered = Boolean(answers[currentQuestion.id]);

  const progress =
    ((currentIndex + 1) / quizQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-[#f7faf8]">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-xs font-medium text-gray-500">
              {selectedCategory === "Grammar"
                ? "Structure / Grammar"
                : selectedCategory}
              {" • "}
              {selectedLevel}
            </p>

            <h1 className="mt-1 text-base font-bold text-[#173d2d]">
              Latihan Bahasa Inggris
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-8">
        <div className="mb-7">
          <div className="mb-2 flex items-center justify-between text-xs font-medium text-gray-500">
            <span>
              Soal {currentIndex + 1} dari {quizQuestions.length}
            </span>
            <span>{Math.round(progress)}% selesai</span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#10C35D] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
          <div className="min-w-0">
            {/* AUDIO LISTENING */}
            {selectedCategory === "Listening" && currentGroup && (
              <div className="mb-5 rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf8ef] text-[#0b9d4a]">
                    <Headphones size={22} />
                  </div>

                  <div>
                    <h2 className="font-bold text-[#173d2d]">
                      {currentGroup.title}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Dengarkan audio sebelum menjawab soal.
                    </p>
                  </div>
                </div>

                {currentGroup.audioUrl ? (
                  <>
                    <audio
                      ref={audioRef}
                      src={currentGroup.audioUrl}
                      onEnded={handleAudioEnded}
                      preload="metadata"
                    />

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f5faf6] p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Volume2 size={18} />
                        <span>
                          Audio dapat diputar berulang kali.
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handlePlayAudio}
                        disabled={isAudioPlaying}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0da950] disabled:cursor-not-allowed disabled:bg-gray-300"
                      >
                        <Play size={16} fill="currentColor" />
                        {isAudioPlaying
                          ? "Audio sedang diputar"
                          : audioPlayCount === 0
                            ? "Putar Audio"
                            : "Putar Ulang"}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                    Audio contoh belum diunggah. Tambahkan alamat audio pada
                    data soal agar pemutar audio dapat digunakan.
                  </div>
                )}
              </div>
            )}

            {/* READING PASSAGE */}
            {selectedCategory === "Reading" && currentGroup && (
              <ReadingQuiz currentGroup={currentGroup} />
            )}

            {/* QUESTION */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="mb-5 flex items-center justify-between">
                <span className="rounded-full bg-[#eaf8ef] px-3 py-1.5 text-xs font-semibold text-[#0b9d4a]">
                  Pertanyaan {currentIndex + 1}
                </span>

                {isAnswered && (
                  <span className="flex items-center gap-1.5 text-xs font-medium text-[#0b9d4a]">
                    <CheckCircle2 size={15} />
                    Sudah dijawab
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold leading-8 text-[#173d2d]">
                {currentQuestion.question}
              </h2>

              <div className="mt-6 space-y-3">
                {Object.entries(currentQuestion.choices).map(
                  ([key, value]) => {
                    const isSelected =
                      answers[currentQuestion.id] === key;

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() =>
                          handleAnswer(currentQuestion.id, key)
                        }
                        disabled={isSubmitting}
                        className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isSelected
                            ? "border-[#10C35D] bg-[#f0fbf4] ring-1 ring-[#10C35D]"
                            : "border-gray-200 hover:border-[#10C35D]/60 hover:bg-[#f9fcfa]"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                            isSelected
                              ? "bg-[#10C35D] text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {key}
                        </span>

                        <span className="pt-1 text-sm leading-6 text-gray-700">
                          {value}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0 || isSubmitting}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={17} />
                  Sebelumnya
                </button>

                {!isLastQuestion ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0da950] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Selanjutnya
                    <ChevronRight size={17} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onFinish()}
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0da950] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? "Mengirim Jawaban..." : "Kirim Jawaban"}
                    <CheckCircle2 size={17} />
                  </button>
                )}
              </div>
            </section>
          </div>

          {/* NOMOR SOAL */}
          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="font-bold text-[#173d2d]">Navigasi Soal</h3>
            <p className="mt-1 text-xs leading-5 text-gray-500">
              Pilih nomor soal untuk berpindah pertanyaan.
            </p>

            <div className="mt-5 grid grid-cols-5 gap-2">
              {quizQuestions.map((question, index) => {
                const isCurrent = currentIndex === index;
                const isDone = Boolean(answers[question.id]);

                return (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => onSelectQuestion(index)}
                    disabled={isSubmitting}
                    className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                      isCurrent
                        ? "bg-[#10C35D] text-white"
                        : isDone
                          ? "bg-[#eaf8ef] text-[#0b9d4a]"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-2 border-t border-gray-100 pt-4">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-3 w-3 rounded-sm bg-[#10C35D]" />
                Soal aktif
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-3 w-3 rounded-sm bg-[#eaf8ef]" />
                Sudah dijawab
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="h-3 w-3 rounded-sm bg-gray-100" />
                Belum dijawab
              </div>
            </div>

            <div className="mt-5 rounded-xl bg-[#f5faf6] p-3">
              <p className="text-xs text-gray-500">Jawaban terisi</p>
              <p className="mt-1 text-lg font-bold text-[#173d2d]">
                {Object.keys(answers).length} / {quizQuestions.length}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onFinish()}
              disabled={isSubmitting}
              className="mt-5 w-full rounded-lg border border-[#10C35D] px-4 py-2.5 text-sm font-semibold text-[#0b9d4a] transition hover:bg-[#f0fbf4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Mengirim Jawaban..." : "Selesaikan Latihan"}
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}
