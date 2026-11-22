import React from "react";
import {
  CheckCircle2,
  XCircle,
  Lightbulb,
  Home,
  RotateCcw,
} from "lucide-react";

export default function ResultSection({ result, answers, onBack, onRetry }) {
  const incorrectAnswers = Array.isArray(result?.incorrectAnswers)
    ? result.incorrectAnswers
    : [];

  const recommendations = Array.isArray(result?.recommendations)
    ? result.recommendations
    : [];

  const scorePercentage =
    result?.total > 0
      ? Math.round((result.correct / result.total) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-[#f7faf8] px-5 py-12">
      <main className="mx-auto max-w-4xl">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm md:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf8ef] text-[#0b9d4a]">
            <CheckCircle2 size={34} />
          </div>

          <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-[#10a653]">
            Latihan Selesai
          </p>

          <h1 className="mt-2 text-2xl font-bold text-[#173d2d]">
            Hasil Latihanmu
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Jawaban berhasil dikirim dan telah diperiksa oleh sistem.
          </p>

          <div className="mx-auto mt-8 flex h-36 w-36 flex-col items-center justify-center rounded-full border-8 border-[#d9f4e2] bg-[#f5faf6]">
            <span className="text-4xl font-bold text-[#0b9d4a]">
              {scorePercentage}%
            </span>
            <span className="mt-1 text-xs font-medium text-gray-500">
              Hasil latihan
            </span>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">Jumlah Soal</p>
              <p className="mt-2 text-2xl font-bold text-[#173d2d]">
                {result.total}
              </p>
            </div>

            <div className="rounded-xl bg-[#f0fbf4] p-4">
              <p className="text-xs text-gray-500">Jawaban Benar</p>
              <p className="mt-2 text-2xl font-bold text-[#0b9d4a]">
                {result.correct}
              </p>
            </div>

            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-xs text-gray-500">Jawaban Salah</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {result.incorrect}
              </p>
            </div>
          </div>
        </section>

        {/* PEMBAHASAN JAWABAN SALAH */}
        <section className="mt-7">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-wider text-[#10a653]">
              Evaluasi Jawaban
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#173d2d]">
              Pembahasan Soal
            </h2>
          </div>

          {incorrectAnswers.length > 0 ? (
            <div className="space-y-4">
              {incorrectAnswers.map((question, index) => {
                const correctLabels = String(question.answer || "")
                  .split(",")
                  .map((label) => label.trim().toUpperCase())
                  .filter(Boolean);

                const selectedAnswer = answers?.[question.id] || "";

                const correctAnswerText = correctLabels
                  .map((label) => {
                    const choiceText = question.choices?.[label];
                    return choiceText
                      ? `${label}. ${choiceText}`
                      : label;
                  })
                  .join(" / ");

                const selectedAnswerText = selectedAnswer
                  ? question.choices?.[selectedAnswer]
                    ? `${selectedAnswer}. ${question.choices[selectedAnswer]}`
                    : selectedAnswer
                  : "Tidak dijawab";

                return (
                  <article
                    key={question.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <XCircle size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-red-600">
                          Jawaban Salah • Soal {index + 1}
                        </p>

                        <h3 className="mt-2 font-semibold leading-7 text-[#173d2d]">
                          {question.question}
                        </h3>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-lg bg-red-50 p-3">
                            <p className="text-xs text-red-600">
                              Jawaban kamu
                            </p>
                            <p className="mt-1 text-sm font-semibold text-red-700">
                              {selectedAnswerText}
                            </p>
                          </div>

                          <div className="rounded-lg bg-[#f0fbf4] p-3">
                            <p className="text-xs text-[#0b9d4a]">
                              Jawaban yang benar
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#087d3a]">
                              {correctAnswerText || "Belum tersedia"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Pembahasan
                          </p>
                          <p className="mt-2 text-sm leading-7 text-gray-600">
                            {question.explanation || "Belum ada pembahasan untuk soal ini."}
                          </p>
                        </div>

                        {question.subtopic && (
                          <div className="mt-3 inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
                            Subtopik: {question.subtopic}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#d8eee0] bg-white p-7 text-center">
              <CheckCircle2
                size={36}
                className="mx-auto text-[#10C35D]"
              />
              <h3 className="mt-3 font-bold text-[#173d2d]">
                Semua Jawaban Benar!
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Tidak terdapat subtopik tertentu yang perlu direkomendasikan
                berdasarkan hasil latihan ini. Pertahankan hasil belajarmu!
              </p>
            </div>
          )}
        </section>

        {/* REKOMENDASI MATERI */}
        {recommendations.length > 0 && (
          <section className="mt-8">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#10a653]">
                Pengembangan Kemampuan
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#173d2d]">
                Rekomendasi Materi
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                Materi berikut dapat dipelajari kembali berdasarkan
                subtopik dari soal yang belum dijawab dengan benar.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {recommendations.map((item, index) => (
                <article
                  key={item.subtopic || index}
                  className="rounded-2xl border border-[#d8eee0] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf8ef] text-[#0b9d4a]">
                      <Lightbulb size={20} />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Materi {index + 1}
                      </p>
                      <h3 className="font-bold text-[#173d2d]">
                        {item.subtopic}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-600">
                    {item.recommendation}
                  </p>
                </article>
              ))}
            </div>
          </section>
        )}

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <Home size={17} />
            Kembali ke Kuis
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#10C35D] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0da950]"
          >
            <RotateCcw size={17} />
            Ulangi Latihan
          </button>
        </div>
      </main>
    </div>
  );
}
