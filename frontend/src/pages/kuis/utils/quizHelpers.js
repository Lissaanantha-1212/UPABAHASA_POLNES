import {
  listeningGroups,
  readingGroups,
  grammarQuestions,
  levelConfig,
} from "../data/quizData";
export const shuffleArray = (array) => {
  const result = [...array];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

export const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(
    remainingSeconds
  ).padStart(2, "0")}`;
};

export const prepareExercise = (category, level) => {
  const config = levelConfig[level][category];

  if (category === "Grammar") {
    return shuffleArray(grammarQuestions)
      .slice(0, config.questions)
      .map((question) => ({
        ...question,
        group: null,
      }));
  }

  const sourceGroups =
    category === "Listening" ? listeningGroups : readingGroups;

  // Acak urutan kelompok materi, bukan mengacak soal di dalamnya.
  const selectedGroups = shuffleArray(sourceGroups).slice(0, config.groups);

  // Pertanyaan dari satu audio/teks tetap berada dalam kelompok yang sama.
  return selectedGroups.flatMap((group) =>
    group.questions.map((question) => ({
      ...question,
      group,
    }))
  );
};
