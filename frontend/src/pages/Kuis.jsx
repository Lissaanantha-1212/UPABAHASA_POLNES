import React, { useEffect, useRef, useState } from "react";

import CategorySection from "./kuis/sections/CategorySection";
import PreviewSection from "./kuis/sections/PreviewSection";
import QuizSection from "./kuis/sections/QuizSection";
import ResultSection from "./kuis/sections/ResultSection";

const API_URL = "http://upabahasa-polnes-4p4a.vercel.app/api/quizzes";

const getApiData = (payload) => {
  return payload?.data?.data ?? payload?.data ?? payload;
};

const getApiError = (payload, fallback) => {
  return (
    payload?.message ||
    payload?.error ||
    payload?.data?.message ||
    fallback
  );
};

const mapCategory = (category) => {
  const value = String(category || "").toLowerCase();

  if (value === "reading") return "reading";
  if (value === "grammar" || value === "structure") return "structure";

  return value;
};

const mapLevel = (level) => String(level || "").toLowerCase();

const normalizeQuestion = (question, group) => {
  const options = Array.isArray(question.options)
    ? question.options
    : [];

  const choices = Object.fromEntries(
    options.map((option) => [
      String(option.label || "").toUpperCase(),
      option.text || "",
    ])
  );

  return {
    id: question.id,
    question: question.question_text || "",
    choices,
    subtopic: question.subtopic || "",
    explanation: question.explanation || "",
    recommendation: question.recommendation_material || "",
    group,
  };
};

const normalizeQuizItems = (items, category) => {
  const questions = [];

  (Array.isArray(items) ? items : []).forEach((item) => {
    const packageQuestions = Array.isArray(item.questions)
      ? item.questions
      : [];

    const isReadingPackage =
      category === "reading" && item.type === "package";

    const group = isReadingPackage
      ? {
          id: item.id,
          title: "Teks Bacaan",
          passage: item.reading_text || "",
          readingInstruction:
            item.reading_instruction ||
            "Bacalah teks berikut dengan saksama.",
          startQuestionNumber: questions.length + 1,
          endQuestionNumber: questions.length + packageQuestions.length,
        }
      : null;

    packageQuestions.forEach((question) => {
      questions.push(normalizeQuestion(question, group));
    });
  });

  // Perbarui rentang nomor bacaan berdasarkan posisi soal sebenarnya.
  let questionNumber = 0;

  questions.forEach((question) => {
    questionNumber += 1;

    if (question.group) {
      const groupQuestions = questions.filter(
        (item) => item.group?.id === question.group.id
      );

      question.group.startQuestionNumber = questions.findIndex(
        (item) => item.group?.id === question.group.id
      ) + 1;

      question.group.endQuestionNumber =
        question.group.startQuestionNumber + groupQuestions.length - 1;
    }
  });

  return questions;
};

export default function Kuis() {
  const [screen, setScreen] = useState("category");

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const [result, setResult] = useState(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [showPreparingNotice, setShowPreparingNotice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const audioRef = useRef(null);
  const submittedRef = useRef(false);
  const preparingRef = useRef(false);

  const currentQuestion = quizQuestions[currentIndex];
  const currentGroup = currentQuestion?.group;

  // ===================================================
  // PERSIAPAN SOAL DARI BACKEND
  // ===================================================

  const handleStartQuiz = async () => {
    if (!selectedCategory || !selectedLevel || preparingRef.current) {
      return;
    }

    preparingRef.current = true;
    setIsPreparing(true);
    setShowPreparingNotice(false);

    let noticeTimer;

    try {
      noticeTimer = setTimeout(() => {
        setShowPreparingNotice(true);
      }, 5000);

      const response = await fetch(`${API_URL}/student/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: mapCategory(selectedCategory),
          level: mapLevel(selectedLevel),
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiError(payload, "Gagal mempersiapkan latihan.")
        );
      }

      const data = getApiData(payload);

      if (!data?.session_token || !Array.isArray(data.items)) {
        throw new Error("Respons persiapan soal dari server tidak sesuai.");
      }

      const questions = normalizeQuizItems(
        data.items,
        mapCategory(selectedCategory)
      );

      if (questions.length === 0) {
        throw new Error("Belum ada soal yang dapat ditampilkan.");
      }

      setQuizQuestions(questions);
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setSessionToken(data.session_token);
      submittedRef.current = false;
      setScreen("quiz");
    } catch (error) {
      console.error("Gagal memulai latihan:", error);
      window.alert(error.message || "Terjadi kesalahan saat memulai latihan.");
    } finally {
      if (noticeTimer) clearTimeout(noticeTimer);

      preparingRef.current = false;
      setIsPreparing(false);
      setShowPreparingNotice(false);
    }
  };

  const [sessionToken, setSessionToken] = useState(null);

  // ===================================================
  // AUDIO
  // ===================================================

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentGroup?.id]);

  const handlePlayAudio = async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
    } catch (error) {
      console.error("Audio tidak dapat diputar:", error);
      window.alert("Audio tidak dapat diputar. Periksa alamat audio.");
    }
  };

  const handleAudioEnded = () => {};

  // ===================================================
  // JAWAB SOAL
  // ===================================================

  const handleAnswer = (questionId, answer) => {
    setAnswers((previousAnswers) => ({
      ...previousAnswers,
      [questionId]: answer,
    }));
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((previousIndex) => previousIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((previousIndex) => previousIndex + 1);
    }
  };

  // ===================================================
  // KIRIM JAWABAN KE BACKEND
  // ===================================================

  const finishQuiz = async () => {
    if (submittedRef.current || isSubmitting || !sessionToken) return;

    submittedRef.current = true;
    setIsSubmitting(true);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const submittedAnswers = quizQuestions.map((question) => ({
      question_id: question.id,
      answers: answers[question.id] ? [answers[question.id]] : [],
    }));

    try {
      const response = await fetch(`${API_URL}/student/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          session_token: sessionToken,
          answers: submittedAnswers,
        }),
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          getApiError(payload, "Gagal mengirim jawaban latihan.")
        );
      }

      const data = getApiData(payload);
      const backendResults = Array.isArray(data.results)
        ? data.results
        : [];

      const questionMap = new Map(
        quizQuestions.map((question) => [
          String(question.id),
          question,
        ])
      );

      const incorrectAnswers = backendResults
        .filter((item) => !item.is_correct)
        .map((item) => {
          const question = questionMap.get(String(item.question_id));

          if (!question) return null;

          return {
            ...question,
            answer: Array.isArray(item.correct_answers)
              ? item.correct_answers.join(", ")
              : "",
            selectedAnswer: Array.isArray(item.selected_answers)
              ? item.selected_answers.join(", ")
              : "",
            explanation: item.explanation || "",
            recommendation: item.recommendation_material || "",
          };
        })
        .filter(Boolean);

      const recommendations = [
        ...new Map(
          incorrectAnswers
            .filter((item) => item.recommendation)
            .map((item) => [
              item.subtopic,
              {
                subtopic: item.subtopic,
                recommendation: item.recommendation,
              },
            ])
        ).values(),
      ];

      setResult({
        total: data.total_questions ?? quizQuestions.length,
        correct: data.correct_answers ?? 0,
        incorrect: data.incorrect_answers ?? incorrectAnswers.length,
        score: data.score ?? 0,
        incorrectAnswers,
        recommendations,
        isAutomatic: false,
      });

      setScreen("result");
    } catch (error) {
      console.error("Gagal mengirim jawaban:", error);
      submittedRef.current = false;
      window.alert(
        error.message ||
          "Jawaban belum berhasil dikirim. Silakan coba kembali."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===================================================
  // KEMBALI KE BERANDA KUIS
  // ===================================================

  const handleBackToCategory = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    setScreen("category");
    setSelectedCategory(null);
    setSelectedLevel(null);
    setQuizQuestions([]);
    setAnswers({});
    setResult(null);
    setSessionToken(null);
    setCurrentIndex(0);

    submittedRef.current = false;
    preparingRef.current = false;
  };

  // ===================================================
  // PILIH KATEGORI
  // ===================================================

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setSelectedLevel(null);
  };

  const handleStartPreparation = () => {
    if (!selectedCategory || !selectedLevel) return;
    setScreen("preview");
  };

  // ===================================================
  // TAMPILAN
  // ===================================================

  if (screen === "category") {
    return (
      <CategorySection
        selectedCategory={selectedCategory}
        selectedLevel={selectedLevel}
        onSelectCategory={handleSelectCategory}
        onSelectLevel={setSelectedLevel}
        onContinue={handleStartPreparation}
      />
    );
  }

  if (screen === "preview") {
    return (
      <PreviewSection
        selectedCategory={selectedCategory}
        selectedLevel={selectedLevel}
        onBack={() => setScreen("category")}
        onStart={handleStartQuiz}
        isPreparing={isPreparing}
        showPreparingNotice={showPreparingNotice}
      />
    );
  }

  if (screen === "quiz" && currentQuestion) {
    return (
      <QuizSection
        selectedCategory={selectedCategory}
        selectedLevel={selectedLevel}
        currentIndex={currentIndex}
        quizQuestions={quizQuestions}
        currentQuestion={currentQuestion}
        currentGroup={currentGroup}
        answers={answers}
        audioRef={audioRef}
        handleAudioEnded={handleAudioEnded}
        handlePlayAudio={handlePlayAudio}
        handleAnswer={handleAnswer}
        handlePrevious={handlePrevious}
        handleNext={handleNext}
        onFinish={finishQuiz}
        onSelectQuestion={setCurrentIndex}
        isSubmitting={isSubmitting}
      />
    );
  }

  if (screen === "result" && result) {
    return (
      <ResultSection
        result={result}
        answers={answers}
        onBack={handleBackToCategory}
        onRetry={() => {
          setResult(null);
          setQuizQuestions([]);
          setAnswers({});
          setSessionToken(null);
          submittedRef.current = false;
          setScreen("preview");
        }}
      />
    );
  }

  return null;
}
