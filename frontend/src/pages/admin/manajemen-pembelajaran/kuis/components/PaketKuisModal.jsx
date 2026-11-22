
import React, { useEffect, useState } from 'react';
import {
  X, Plus, Trash2, Save, RefreshCw, AlertCircle,
  Headphones, Upload, BookOpen, FileText, CheckCircle,
  FileSpreadsheet, Download
} from 'lucide-react';
import { adminFetch } from '../../../../../adminSession';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:5000/api/quizzes';
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

const createEmptyQuestion = () => ({
  question_text: '',
  subtopic: '',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
  ],
  correct_answer: ['A'],
  explanation: '',
  recommendation_material: '',
});

const normalizeOptions = (options) => {
  if (Array.isArray(options)) {
    return OPTION_LABELS
      .map((label) => {
        const found = options.find((item) => item?.label === label);
        return found ? { label, text: String(found.text ?? '') } : null;
      })
      .filter(Boolean);
  }

  if (options && typeof options === 'object') {
    return OPTION_LABELS
      .filter((label) => String(options[label] ?? '').trim())
      .map((label) => ({ label, text: String(options[label]).trim() }));
  }

  return createEmptyQuestion().options;
};

const normalizeQuestion = (question = {}) => {
  const options = normalizeOptions(question.options);
  const correct = Array.isArray(question.correct_answer)
    ? question.correct_answer
    : [question.correct_answer || 'A'];

  return {
    question_text: question.question_text || '',
    subtopic: question.subtopic || question.subtopic_name || '',
    options: options.length ? options : createEmptyQuestion().options,
    correct_answer: correct.filter((label) => OPTION_LABELS.includes(label)).slice(0, 1),
    explanation: question.explanation || '',
    recommendation_material: question.recommendation_material || '',
  };
};

const categoryLabel = {
  listening: 'Listening',
  reading: 'Reading',
  structure: 'Grammar',
};

const normalizeExcelHeader = (value) =>
  String(value || '').toLowerCase().trim().replace(/[\s_-]+/g, '').replace(/[^\w]/g, '');

const readExcelCell = (row, aliases) => {
  const normalized = {};
  Object.entries(row).forEach(([key, value]) => {
    normalized[normalizeExcelHeader(key)] = value;
  });

  for (const alias of aliases) {
    const key = normalizeExcelHeader(alias);
    if (normalized[key] !== undefined && normalized[key] !== null) {
      return String(normalized[key]).trim();
    }
  }

  return '';
};

const parsePackageExcelRow = (row) => {
  const options = OPTION_LABELS
    .map((label) => ({
      label,
      text: readExcelCell(row, [`Option ${label}`, `Pilihan ${label}`, label]),
    }))
    .filter((option) => option.text);

  const answerRaw = readExcelCell(
    row,
    ['Correct Answer', 'Kunci Jawaban', 'Kunci', 'Answer']
  ).toUpperCase();

  const answerMatch = answerRaw.match(/(?:^|[\s:([{])([A-D])(?:$|[\s.)\]}])/);
  const correct = answerMatch ? answerMatch[1] : answerRaw;

  return {
    question_text: readExcelCell(row, ['Question', 'Question Text', 'Pertanyaan', 'Soal']),
    subtopic: readExcelCell(row, ['Subtopic', 'Subtopik']),
    options,
    correct_answer: OPTION_LABELS.includes(correct) ? [correct] : [],
    explanation: readExcelCell(row, ['Explanation', 'Pembahasan', 'Penjelasan']),
    recommendation_material: readExcelCell(
      row,
      ['Recommendation Material', 'Rekomendasi Materi', 'Materi Rekomendasi']
    ),
  };
};

const isValidImportedQuestion = (question) =>
  Boolean(
    question.question_text.trim() &&
    question.subtopic.trim() &&
    question.options.length >= 3 &&
    question.options.length <= 4 &&
    question.options.every(
      (option, index) =>
        option.label === OPTION_LABELS[index] && option.text.trim()
    ) &&
    question.correct_answer.length === 1 &&
    question.options.some(
      (option) => option.label === question.correct_answer[0]
    ) &&
    question.explanation.trim() &&
    question.recommendation_material.trim()
  );

export default function PaketKuisModal({
  category,
  initialData,
  saving = false,
  onClose,
  onSave,
}) {
  const isEditing = Boolean(initialData);
  const label = categoryLabel[category] || 'Kuis';

  const [name, setName] = useState('');
  const [stimulusNote, setStimulusNote] = useState('');
  const [readingText, setReadingText] = useState('');
  const [audioFile, setAudioFile] = useState(null);
  const [existingAudio, setExistingAudio] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');
  const [excelPreview, setExcelPreview] = useState([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelError, setExcelError] = useState('');

  useEffect(() => {
    if (!initialData) {
      setName('');
      setStimulusNote('');
      setReadingText('');
      setAudioFile(null);
      setExistingAudio('');
      setQuestions([]);
      setError('');
      setExcelPreview([]);
      setExcelFileName('');
      setExcelError('');
      return;
    }

    setName(initialData.name || '');
    setStimulusNote(initialData.stimulus_note || '');
    setReadingText(initialData.reading_text || '');
    setAudioFile(null);
    setExistingAudio(initialData.audio_file || '');
    setQuestions((initialData.questions || []).map(normalizeQuestion));
    setError('');
    setExcelPreview([]);
    setExcelFileName('');
    setExcelError('');
  }, [initialData]);

  const updateQuestion = (index, field, value) => {
    setQuestions((current) =>
      current.map((question, i) =>
        i === index ? { ...question, [field]: value } : question
      )
    );
  };

  const updateOption = (questionIndex, labelOption, value) => {
    setQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        const options = question.options.map((option) =>
          option.label === labelOption
            ? { ...option, text: value }
            : option
        );

        return { ...question, options };
      })
    );
  };

  const addOption = (questionIndex) => {
    setQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        const nextLabel = OPTION_LABELS[question.options.length];
        if (!nextLabel) return question;

        return {
          ...question,
          options: [
            ...question.options,
            { label: nextLabel, text: '' },
          ],
        };
      })
    );
  };

  const removeOption = (questionIndex, labelOption) => {
    setQuestions((current) =>
      current.map((question, i) => {
        if (i !== questionIndex) return question;

        const remaining = question.options.filter(
          (option) => option.label !== labelOption
        );

        const compacted = remaining.map((option, index) => ({
          ...option,
          label: OPTION_LABELS[index],
        }));

        const correct = question.correct_answer[0];
        const correctStillExists = compacted.some(
          (option) => option.label === correct
        );

        return {
          ...question,
          options: compacted,
          correct_answer: correctStillExists ? [correct] : ['A'],
        };
      })
    );
  };

  const addQuestion = () =>
    setQuestions((current) => [...current, createEmptyQuestion()]);

  const removeQuestion = (index) =>
    setQuestions((current) => current.filter((_, i) => i !== index));

  const handleExcelImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelError('');
    setExcelPreview([]);
    setExcelFileName('');

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setExcelError('File import paket harus berformat .xlsx.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setExcelError('Ukuran file Excel maksimal 5 MB.');
      event.target.value = '';
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      if (!sheet) {
        throw new Error('Sheet Excel tidak ditemukan.');
      }

      const rows = XLSX.utils.sheet_to_json(sheet, {
        defval: '',
        raw: false,
      });

      if (!rows.length) {
        throw new Error('File Excel belum memiliki data soal.');
      }

      const imported = rows
        .map(parsePackageExcelRow)
        .filter(
          (question) => question.question_text || question.options.length
        );

      if (!imported.length) {
        throw new Error('Tidak ditemukan soal pada file Excel.');
      }

      setExcelPreview(imported);
      setExcelFileName(file.name);
    } catch (err) {
      setExcelError(err.message || 'Gagal membaca file Excel.');
    } finally {
      event.target.value = '';
    }
  };

  const applyExcelQuestions = () => {
    if (!excelPreview.length) return;

    const invalidIndex = excelPreview.findIndex(
      (question) => !isValidImportedQuestion(question)
    );

    if (invalidIndex !== -1) {
      setExcelError(
        `Soal pada baris data ${invalidIndex + 1} belum valid. Periksa pertanyaan, subtopik, pilihan AÃ¢â‚¬â€œC, kunci, pembahasan, dan rekomendasi materi.`
      );
      return;
    }

    setQuestions((current) => [
      ...current,
      ...excelPreview.map((question) => ({
        ...question,
        options: question.options.map((option) => ({ ...option })),
        correct_answer: [...question.correct_answer],
      })),
    ]);

    setExcelPreview([]);
    setExcelFileName('');
    setExcelError('');
  };

  const downloadPackageTemplate = () => {
    const headers = [{
      Question: '',
      'Option A': '',
      'Option B': '',
      'Option C': '',
      'Option D': '',
      'Correct Answer': '',
      Explanation: '',
      Subtopic: '',
      'Recommendation Material': '',
    }];

    const worksheet = XLSX.utils.json_to_sheet(headers);

    worksheet['!cols'] = [
      { wch: 42 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 18 },
      { wch: 45 },
      { wch: 28 },
      { wch: 45 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Soal Paket');
    XLSX.writeFile(workbook, `Template_Soal_Paket_${label}.xlsx`);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!stimulusNote.trim()) {
      setError(
        (category === 'reading' ? 'Instruksi wajib diisi.' : 'Instruksi wajib diisi, termasuk rentang nomor soal yang menggunakan stimulus.')
      );
      return;
    }

    if (category === 'listening' && !audioFile && !existingAudio) {
      setError('Unggah file audio Listening terlebih dahulu.');
      return;
    }

    if (category === 'reading' && !readingText.trim()) {
      setError('Teks bacaan wajib diisi untuk paket Reading.');
      return;
    }

    if (questions.length === 0) {
      setError('Tambahkan minimal satu soal ke dalam paket.');
      return;
    }

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const number = index + 1;
      const options = question.options.filter(
        (option) => option.text.trim()
      );

      if (!question.question_text.trim()) {
        setError(`Pertanyaan nomor ${number} wajib diisi.`);
        return;
      }

      if (!question.subtopic.trim()) {
        setError(`Subtopik soal nomor ${number} wajib diisi.`);
        return;
      }

      if (options.length < 3 || options.length > 4) {
        setError(
          `Soal nomor ${number} wajib memiliki pilihan A, B, C dan D opsional.`
        );
        return;
      }

      if (
        options.some(
          (option, optionIndex) =>
            option.label !== OPTION_LABELS[optionIndex]
        )
      ) {
        setError(
          `Pilihan jawaban soal nomor ${number} harus berurutan mulai dari A.`
        );
        return;
      }

      if (
        question.correct_answer.length !== 1 ||
        !options.some(
          (option) => option.label === question.correct_answer[0]
        )
      ) {
        setError(
          `Pilih tepat satu kunci jawaban yang tersedia untuk soal nomor ${number}.`
        );
        return;
      }

      if (!question.explanation.trim()) {
        setError(`Pembahasan soal nomor ${number} wajib diisi.`);
        return;
      }

      if (!question.recommendation_material.trim()) {
        setError(
          `Rekomendasi materi soal nomor ${number} wajib diisi.`
        );
        return;
      }
    }

    onSave({
      name: name.trim(),
      stimulus_note: stimulusNote.trim(),
      reading_text: category === 'reading' ? readingText.trim() : '',
      reading_instruction: '',
      audioFile: category === 'listening' ? audioFile : null,
      questions: questions.map((question) => ({
        question_text: question.question_text.trim(),
        subtopic: question.subtopic.trim(),
        options: question.options
          .filter((option) => option.text.trim())
          .map((option) => ({
            label: option.label,
            text: option.text.trim(),
          })),
        correct_answer: question.correct_answer,
        explanation: question.explanation.trim(),
        recommendation_material:
          question.recommendation_material.trim(),
      })),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-[#0a3d2e]">
              {isEditing
                ? `Edit Paket ${label}`
                : `Tambah Paket ${label}`}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Kelola stimulus dan kumpulan soal dalam satu paket.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 space-y-6 overflow-y-auto p-6"
        >
          <section className="space-y-4">
            <h4 className="font-bold text-[#0a3d2e]">
              Informasi Paket
            </h4>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Nama Paket{' '}
                <span className="font-normal text-gray-400">
                  (Opsional)
                </span>
              </label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                disabled={saving}
                placeholder={`Contoh: Paket ${label} - Daily Practice`}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
              />

              <p className="mt-1 text-xs text-gray-400">
                Jika dikosongkan, sistem akan membuat nama paket secara otomatis.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                {category === 'reading' || category === 'listening' ? 'Instruksi' : 'Catatan Stimulus'} <span className="text-red-500">*</span>
              </label>

              <textarea
                rows={2}
                value={stimulusNote}
                onChange={(event) => setStimulusNote(event.target.value)}
                disabled={saving}
                placeholder={category === 'reading' ? "Contoh: Bacalah teks berikut dengan saksama, kemudian jawablah pertanyaan berdasarkan informasi dalam bacaan." : "Contoh: Audio digunakan untuk menjawab soal nomor 1â€“5."}
                className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
              />

              {category === 'reading' ? (
  <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">
    <p className="mb-1 font-semibold">Petunjuk untuk Admin</p>
    <p>
      Tuliskan petunjuk pengerjaan yang singkat dan jelas sesuai dengan teks bacaan.
      Jangan mencantumkan nomor atau rentang soal, jawaban, maupun informasi yang
      tidak berkaitan dengan bacaan. Nomor soal akan diurutkan otomatis oleh sistem.
    </p>
  </div>
) : (
  <p className="mt-1 text-xs text-gray-400">
    Jelaskan stimulus paket dan rentang nomor soal yang menggunakannya.
  </p>
)}
            </div>

            {category === 'listening' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    File Audio <span className="text-red-500">*</span>
                  </label>

                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 p-5 hover:border-[#10C35D]">
                    <Upload size={24} className="text-[#10C35D]" />

                    <span className="text-sm font-semibold text-gray-700">
                      {audioFile?.name ||
                        existingAudio.split('/').pop() ||
                        'Unggah audio Listening'}
                    </span>

                    <span className="text-xs text-gray-400">
                      MP3, WAV, atau M4A. Maksimal 25 MB.
                    </span>

                    <input
                      type="file"
                      accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
                      className="hidden"
                      disabled={saving}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;

                        const extension = file.name
                          .split('.')
                          .pop()
                          .toLowerCase();

                        if (!['mp3', 'wav', 'm4a'].includes(extension)) {
                          setError(
                            'Format audio harus MP3, WAV, atau M4A.'
                          );
                          event.target.value = '';
                          return;
                        }

                        if (file.size > 25 * 1024 * 1024) {
                          setError('Ukuran audio maksimal 25 MB.');
                          event.target.value = '';
                          return;
                        }

                        setError('');
                        setAudioFile(file);
                      }}
                    />
                  </label>

                  {isEditing && (
                    <p className="mt-2 text-xs text-gray-400">
                      Audio sebelumnya tetap digunakan jika tidak mengunggah file audio pengganti.
                    </p>
                  )}
                </div>
              </div>
            )}

            {category === 'reading' && (
              <div className="space-y-4">


                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Teks Bacaan <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    rows={8}
                    value={readingText}
                    onChange={(event) => setReadingText(event.target.value)}
                    disabled={saving}
                    placeholder="Masukkan teks bacaan yang menjadi stimulus paket..."
                    className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
                  />
                </div>
              </div>
            )}

            {category === 'structure' && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900">
                <div className="flex items-center gap-2 font-semibold">
                  <FileText size={17} /> Paket Grammar
                </div>

                <p className="mt-1 text-xs leading-relaxed">
                  Grammar tidak memerlukan audio atau teks bacaan. Catatan stimulus di atas tetap digunakan untuk menjelaskan cakupan soal dalam paket.
                </p>
              </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          <section className="space-y-3">
            <div>
              <h4 className="font-bold text-[#0a3d2e]">
                Import Soal Paket dari Excel
              </h4>

              <p className="mt-1 text-xs text-gray-500">
                Satu file Excel digunakan untuk menambahkan kumpulan soal ke paket {label} yang sedang dibuat atau diedit.
              </p>
            </div>

            <div className="space-y-3 rounded-xl border border-green-100 bg-green-50/50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                    <FileSpreadsheet size={21} className="text-[#0a3d2e]" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      File Excel untuk satu paket
                    </p>
                    <p className="text-xs text-gray-500">
                      Format .xlsx · Maksimal 5 MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadPackageTemplate}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#0a3d2e] hover:underline"
                >
                  <Download size={15} /> Download Template
                </button>
              </div>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-green-300 bg-white px-4 py-3 text-sm font-semibold text-[#0a3d2e] hover:bg-green-50">
                <Upload size={17} /> Pilih File Excel

                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  disabled={saving}
                  onChange={handleExcelImport}
                />
              </label>

              {excelFileName && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle size={15} className="text-green-600" />
                  {excelFileName}
                </div>
              )}

              {excelError && (
                <p className="text-xs text-red-600">{excelError}</p>
              )}

              <p className="text-xs leading-relaxed text-gray-500">
                Kolom: Question, Option A, Option B, Option C, Option D (opsional), Correct Answer, Explanation, Subtopic, Recommendation Material. Pilihan A, B, C, pembahasan, dan rekomendasi materi wajib diisi.
              </p>
            </div>

            {excelPreview.length > 0 && (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 bg-gray-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Preview Import Paket
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      {excelPreview.length} soal ditemukan
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setExcelPreview([]);
                      setExcelFileName('');
                      setExcelError('');
                    }}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200"
                    title="Batalkan import"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
                  {excelPreview.map((question, index) => {
                    const valid = isValidImportedQuestion(question);

                    return (
                      <div key={index} className="space-y-1.5 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-700">
                            {index + 1}. {question.question_text || '(Pertanyaan kosong)'}
                          </p>

                          {valid ? (
                            <CheckCircle size={16} className="shrink-0 text-green-600" />
                          ) : (
                            <AlertCircle size={16} className="shrink-0 text-orange-500" />
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          {question.options.length} pilihan · Kunci: {question.correct_answer[0] || '-'} · Subtopik: {question.subtopic || '-'}
                        </p>

                        {!valid && (
                          <p className="text-xs text-orange-600">
                            Data soal belum lengkap atau tidak valid.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-col-reverse justify-between gap-2 border-t border-gray-100 p-3 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setExcelPreview([]);
                      setExcelFileName('');
                      setExcelError('');
                    }}
                    className="text-sm text-gray-500 hover:text-red-500"
                  >
                    Batalkan Import
                  </button>

                  <button
                    type="button"
                    onClick={applyExcelQuestions}
                    disabled={
                      saving ||
                      !excelPreview.every(isValidImportedQuestion)
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50"
                  >
                    <Plus size={16} /> Masukkan {excelPreview.length} Soal ke Paket
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-[#0a3d2e]">
                  Daftar Soal {label}
                </h4>

                <p className="mt-1 text-xs text-gray-500">
                  Setiap soal wajib memiliki subtopik, tiga pilihan minimum, kunci, pembahasan, dan rekomendasi materi.
                </p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-semibold text-[#0a3d2e] hover:bg-green-100"
              >
                <Plus size={16} /> Tambah Soal
              </button>
            </div>

            {questions.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
                {category === 'listening' ? (
                  <Headphones size={28} className="mx-auto mb-2 text-gray-300" />
                ) : (
                  <BookOpen size={28} className="mx-auto mb-2 text-gray-300" />
                )}

                <p className="text-sm text-gray-500">
                  Belum ada soal dalam paket ini.
                </p>
              </div>
            )}

            {questions.map((question, index) => (
              <div
                key={index}
                className="space-y-4 rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-bold text-[#0a3d2e]">
                    Soal {index + 1}
                  </h5>

                  <button
                    type="button"
                    onClick={() => removeQuestion(index)}
                    disabled={saving}
                    title="Hapus soal"
                    className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Pertanyaan <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    rows={3}
                    value={question.question_text}
                    onChange={(event) =>
                      updateQuestion(index, 'question_text', event.target.value)
                    }
                    disabled={saving}
                    placeholder="Masukkan pertanyaan..."
                    className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Subtopik <span className="text-red-500">*</span>
                  </label>

                  <input
                    value={question.subtopic}
                    onChange={(event) =>
                      updateQuestion(index, 'subtopic', event.target.value)
                    }
                    disabled={saving}
                    maxLength={150}
                    placeholder="Contoh: Identifying Main Ideas"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
                  />
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Pilihan Jawaban <span className="text-red-500">*</span>
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Pilihan A, B, C wajib diisi. Pilihan D bersifat opsional.
                    </p>
                  </div>

                  {question.options.map((option) => (
                    <div key={option.label} className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
                        {option.label}
                      </span>

                      <input
                        value={option.text}
                        onChange={(event) =>
                          updateOption(index, option.label, event.target.value)
                        }
                        disabled={saving}
                        placeholder={`Pilihan ${option.label}`}
                        className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
                      />

                      {option.label === 'D' && (
                        <button
                          type="button"
                          onClick={() => removeOption(index, 'D')}
                          disabled={saving}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                          title="Hapus pilihan D"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}

                  {question.options.length < 4 && (
                    <button
                      type="button"
                      onClick={() => addOption(index)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a3d2e] hover:underline"
                    >
                      <Plus size={14} /> Tambah pilihan D
                    </button>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Kunci Jawaban <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={question.correct_answer[0] || 'A'}
                    onChange={(event) =>
                      updateQuestion(index, 'correct_answer', [event.target.value])
                    }
                    disabled={saving}
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
                  >
                    {question.options
                      .filter((option) => option.text.trim())
                      .map((option) => (
                        <option key={option.label} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Pembahasan <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    rows={2}
                    value={question.explanation}
                    onChange={(event) =>
                      updateQuestion(index, 'explanation', event.target.value)
                    }
                    disabled={saving}
                    placeholder="Jelaskan alasan jawaban yang benar..."
                    className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Rekomendasi Materi <span className="text-red-500">*</span>
                  </label>

                  <textarea
                    rows={2}
                    value={question.recommendation_material}
                    onChange={(event) =>
                      updateQuestion(
                        index,
                        'recommendation_material',
                        event.target.value
                      )
                    }
                    disabled={saving}
                    placeholder="Masukkan materi yang disarankan untuk dipelajari..."
                    className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#10C35D]"
                  />
                </div>
              </div>
            ))}
          </section>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-100 bg-red-50 p-3 text-red-600">
              <AlertCircle size={17} className="mt-0.5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col-reverse justify-end gap-2 border-t border-gray-100 pt-4 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing ? 'Simpan Perubahan' : 'Tambah Paket'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
