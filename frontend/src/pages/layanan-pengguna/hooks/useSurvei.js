import { useState, useEffect } from 'react';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/surveys';

export default function useSurvei() {
  const [surveyAspects, setSurveyAspects] = useState([]);
  const [surveyForm, setSurveyForm] = useState({
    saran: '',
  });

  const [isLoadingAspects, setIsLoadingAspects] = useState(true);
  const [aspectsError, setAspectsError] = useState('');

  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [isSubmittingSurvey, setIsSubmittingSurvey] = useState(false);
  const [surveyError, setSurveyError] = useState('');

  // Mengambil aspek survei aktif dari backend
  useEffect(() => {
    let isMounted = true;

    const fetchSurveyAspects = async () => {
      try {
        setIsLoadingAspects(true);
        setAspectsError('');

        const response = await fetch(`${API_URL}/aspects`);
        const result = await response.json();

        if (!response.ok || !result.success || !Array.isArray(result.data)) {
          throw new Error(
            result.message || 'Gagal mengambil daftar aspek survei.'
          );
        }

        if (isMounted) {
          setSurveyAspects(result.data);

          const initialRatings = Object.fromEntries(
            result.data.map((aspect) => [String(aspect.id), ''])
          );

          setSurveyForm((prev) => ({
            ...initialRatings,
            saran: prev.saran || '',
          }));
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error mengambil aspek survei:', error);
          setAspectsError(
            error.message || 'Tidak dapat memuat aspek survei.'
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingAspects(false);
        }
      }
    };

    fetchSurveyAspects();

    return () => {
      isMounted = false;
    };
  }, []);

  // Mengirim penilaian survei
  const handleSurveySubmit = async (e) => {
    e.preventDefault();

    if (isSubmittingSurvey) return;

    setSurveyError('');

    if (isLoadingAspects) {
      setSurveyError('Mohon tunggu, aspek survei sedang dimuat.');
      return;
    }

    if (surveyAspects.length === 0) {
      setSurveyError(
        'Aspek survei belum tersedia. Silakan muat ulang halaman.'
      );
      return;
    }

    const ratingValues = {
      'Sangat Baik': 4,
      Baik: 3,
      'Kurang Baik': 2,
      'Tidak Baik': 1,
    };

    const ratings = surveyAspects.map((aspect) => ({
      aspectId: Number(aspect.id),
      rating: ratingValues[surveyForm[String(aspect.id)]],
    }));

    const isIncomplete = ratings.some(
      (item) =>
        !Number.isInteger(item.aspectId) ||
        item.aspectId <= 0 ||
        !Number.isInteger(item.rating)
    );

    if (isIncomplete) {
      setSurveyError(
        'Silakan isi seluruh aspek penilaian terlebih dahulu.'
      );
      return;
    }

    const surveyData = {
      ratings,
      comment: (surveyForm.saran || '').trim(),
    };

    try {
      setIsSubmittingSurvey(true);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(surveyData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal mengirim penilaian survei.'
        );
      }

      setSurveySubmitted(true);

      const emptyRatings = Object.fromEntries(
        surveyAspects.map((aspect) => [String(aspect.id), ''])
      );

      setSurveyForm({
        ...emptyRatings,
        saran: '',
      });
    } catch (error) {
      console.error('Error mengirim survei:', error);
      setSurveyError(
        error.message ||
        'Terjadi kesalahan saat mengirim survei. Silakan coba kembali.'
      );
    } finally {
      setIsSubmittingSurvey(false);
    }
  };

  return {
    surveyAspects,
    surveyForm,
    setSurveyForm,
    surveySubmitted,
    setSurveySubmitted,
    isLoadingAspects,
    aspectsError,
    isSubmittingSurvey,
    surveyError,
    setSurveyError,
    handleSurveySubmit,
  };
}
