
import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  Download,
  PlusCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { adminFetch } from '../../../../../adminSession';

const API_URL = 'http://upabahasa-polnes-4p4a.vercel.app/api/quizzes';

const EMPTY_QUESTION = {
  question_text: '',
  subtopic_id: '',
  new_subtopic_name: '',
  new_subtopic_description: '',
  options: { A: '', B: '', C: '', D: '' },
  correct_answer: 'A',
  explanation: '',
};

// ======================================
// HELPER EXCEL
// ======================================

const normalizeHeader = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, '')
    .replace(/[^\w]/g, '');

const normalizeName = (value) =>
  String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const getCell = (row, aliases) => {
  const normalizedRow = {};

  Object.entries(row).forEach(([key, value]) => {
    normalizedRow[normalizeHeader(key)] = value;
  });

  for (const alias of aliases) {
    const key = normalizeHeader(alias);

    if (
      normalizedRow[key] !== undefined &&
      normalizedRow[key] !== null
    ) {
      return String(normalizedRow[key]).trim();
    }
  }

  return '';
};

const normalizeCorrectAnswer = (value) => {
  const answer = String(value || '').trim().toUpperCase();

  const match = answer.match(
    /(?:^|[\s:([{])([A-D])(?:$|[\s.)\]}])/i
  );

  if (match) return match[1].toUpperCase();

  return /^[A-D]$/.test(answer) ? answer : answer;
};

const createExcelQuestion = (row, subtopics) => {
  const questionText = getCell(row, [
    'Pertanyaan',
    'Soal',
    'Question',
    'Question Text',
  ]);

  const options = {
    A: getCell(row, ['A', 'Pilihan A', 'Option A']),
    B: getCell(row, ['B', 'Pilihan B', 'Option B']),
    C: getCell(row, ['C', 'Pilihan C', 'Option C']),
    D: getCell(row, ['D', 'Pilihan D', 'Option D']),
  };

  const correctAnswer = normalizeCorrectAnswer(
    getCell(row, [
      'Kunci',
      'Kunci Jawaban',
      'Jawaban Benar',
      'Correct Answer',
      'Answer',
    ])
  );

  const subtopicName = getCell(row, [
    'Subtopik',
    'Subtopic',
  ]);

  const subtopicDescription = getCell(row, [
    'Deskripsi Subtopik',
    'Deskripsi Subtopic',
    'Subtopic Description',
    'Description',
  ]);

  const explanation = getCell(row, [
    'Pembahasan',
    'Penjelasan',
    'Explanation',
  ]);

  const matchedSubtopic = subtopics.find(
    (item) =>
      normalizeName(item.name) === normalizeName(subtopicName)
  );

  return {
    question_text: questionText,
    subtopic_id: matchedSubtopic
      ? String(matchedSubtopic.id)
      : '',
    new_subtopic_name: subtopicName,
    new_subtopic_description: subtopicDescription,
    options,
    correct_answer: correctAnswer,
    explanation,
  };
};

// ======================================
// KOMPONEN
// ======================================

export default function PaketReadingModal({
  initialData,
  subtopics,
  saving,
  onClose,
  onSave,
}) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState('');
  const [level, setLevel] = useState('singkat');
  const [readingInstruction, setReadingInstruction] = useState('');
  const [readingText, setReadingText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState('');

  const [localSubtopics, setLocalSubtopics] = useState(
    subtopics || []
  );

  const [addingSubtopic, setAddingSubtopic] = useState(null);
  const [subtopicInput, setSubtopicInput] = useState('');
  const [subtopicDescription, setSubtopicDescription] =
    useState('');
  const [savingSubtopic, setSavingSubtopic] = useState(false);

  // Excel
  const [excelPreview, setExcelPreview] = useState([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [excelError, setExcelError] = useState('');
  const [showExcelPreview, setShowExcelPreview] = useState(false);
  const [applyingExcel, setApplyingExcel] = useState(false);

  // ======================================
  // LOAD DATA SAAT EDIT
  // ======================================

  useEffect(() => {
    setLocalSubtopics(subtopics || []);
  }, [subtopics]);

  useEffect(() => {
    if (!initialData) {
      setName('');
      setLevel('singkat');
      setReadingInstruction('');
      setReadingText('');
      setQuestions([]);
      setError('');
      setAddingSubtopic(null);
      setSubtopicInput('');
      setSubtopicDescription('');
      setExcelPreview([]);
      setExcelFileName('');
      setExcelError('');
      setShowExcelPreview(false);
      return;
    }

    setName(initialData.name || '');
    setLevel(initialData.level || 'singkat');

    setReadingInstruction(
      initialData.reading_instruction ||
      initialData.readingInstruction ||
      ''
    );

    setReadingText(
      initialData.reading_text ||
      initialData.readingText ||
      ''
    );

    setError('');
    setAddingSubtopic(null);
    setSubtopicInput('');
    setSubtopicDescription('');

    setQuestions(
      (initialData.questions || []).map((question) => ({
        ...question,
        subtopic_id: question.subtopic_id
          ? String(question.subtopic_id)
          : '',
        new_subtopic_name: '',
        new_subtopic_description: '',
        options: {
          A: question.options?.A || '',
          B: question.options?.B || '',
          C: question.options?.C || '',
          D: question.options?.D || '',
        },
      }))
    );

    setExcelPreview([]);
    setExcelFileName('');
    setExcelError('');
    setShowExcelPreview(false);
  }, [initialData]);

  // ======================================
  // SUBTOPIK READING
  // ======================================

  const readingSubtopics = useMemo(
    () =>
      (localSubtopics || []).filter(
        (item) =>
          item.category === 'reading' &&
          Number(item.is_active) !== 0
      ),
    [localSubtopics]
  );

  // ======================================
  // TAMBAH SOAL
  // ======================================

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        ...EMPTY_QUESTION,
        options: { ...EMPTY_QUESTION.options },
      },
    ]);
  };

  // ======================================
  // HAPUS SOAL
  // ======================================

  const removeQuestion = (index) => {
    setQuestions((prev) =>
      prev.filter((_, i) => i !== index)
    );

    if (addingSubtopic === index) {
      setAddingSubtopic(null);
      setSubtopicInput('');
      setSubtopicDescription('');
    } else if (
      addingSubtopic !== null &&
      addingSubtopic > index
    ) {
      setAddingSubtopic((prev) => prev - 1);
    }
  };

  // ======================================
  // UPDATE SOAL
  // ======================================

  const updateQuestion = (index, field, value) => {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === index
          ? {
              ...question,
              [field]: value,
            }
          : question
      )
    );
  };

  // ======================================
  // UPDATE PILIHAN JAWABAN
  // ======================================

  const updateOption = (index, option, value) => {
    setQuestions((prev) =>
      prev.map((question, i) =>
        i === index
          ? {
              ...question,
              options: {
                ...question.options,
                [option]: value,
              },
            }
          : question
      )
    );
  };

  // ======================================
  // TAMBAH SUBTOPIK MANUAL
  // ======================================

  const handleAddSubtopic = async (questionIndex) => {
    const subtopicName = subtopicInput.trim();
    const description = subtopicDescription.trim();

    if (!subtopicName) {
      setError('Nama subtopik wajib diisi.');
      return;
    }

    if (!description) {
      setError('Deskripsi subtopik wajib diisi.');
      return;
    }

    const duplicate = readingSubtopics.find(
      (item) =>
        normalizeName(item.name) === normalizeName(subtopicName)
    );

    if (duplicate) {
      setQuestions((prev) =>
        prev.map((question, index) =>
          index === questionIndex
            ? {
                ...question,
                subtopic_id: String(duplicate.id),
                new_subtopic_name: '',
                new_subtopic_description: '',
              }
            : question
        )
      );

      setAddingSubtopic(null);
      setSubtopicInput('');
      setSubtopicDescription('');
      setError('');
      return;
    }

    setSavingSubtopic(true);
    setError('');

    try {
      const response = await adminFetch(`${API_URL}/subtopics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: 'reading',
          name: subtopicName,
          description,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal menambahkan subtopik.'
        );
      }

      const refreshResponse = await adminFetch(
        `${API_URL}/reading-subtopics`
      );

      const refreshResult = await refreshResponse.json();

      if (!refreshResponse.ok || !refreshResult.success) {
        throw new Error(
          'Subtopik berhasil dibuat, tetapi daftar subtopik gagal diperbarui. Silakan coba refresh.'
        );
      }

      const updatedSubtopics = Array.isArray(refreshResult.data)
        ? refreshResult.data
        : [];

      setLocalSubtopics(updatedSubtopics);

      const createdSubtopic = updatedSubtopics.find(
        (item) =>
          normalizeName(item.name) === normalizeName(subtopicName)
      );

      if (!createdSubtopic) {
        throw new Error(
          'Subtopik sudah dibuat, tetapi ID-nya belum ditemukan.'
        );
      }

      setQuestions((prev) =>
        prev.map((question, index) =>
          index === questionIndex
            ? {
                ...question,
                subtopic_id: String(createdSubtopic.id),
                new_subtopic_name: '',
                new_subtopic_description: '',
              }
            : question
        )
      );

      setAddingSubtopic(null);
      setSubtopicInput('');
      setSubtopicDescription('');
      setError('');
    } catch (err) {
      console.error('Add subtopic error:', err);
      setError(err.message);
    } finally {
      setSavingSubtopic(false);
    }
  };

  // ======================================
  // IMPORT EXCEL
  // ======================================

  const handleExcelImport = async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setExcelError('');
    setExcelPreview([]);
    setShowExcelPreview(false);

    const extension = file.name.split('.').pop().toLowerCase();

    if (!['xlsx', 'xls'].includes(extension)) {
      setExcelError('File harus berformat .xlsx atau .xls.');
      e.target.value = '';
      return;
    }

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: 'array',
      });

      const firstSheet =
        workbook.Sheets[workbook.SheetNames[0]];

      if (!firstSheet) {
        throw new Error('Sheet Excel tidak ditemukan.');
      }

      const rows = XLSX.utils.sheet_to_json(firstSheet, {
        defval: '',
        raw: false,
      });

      if (rows.length === 0) {
        throw new Error('File Excel belum memiliki data soal.');
      }

      const importedQuestions = rows
        .map((row) =>
          createExcelQuestion(row, readingSubtopics)
        )
        .filter(
          (question) =>
            question.question_text ||
            Object.values(question.options).some(
              (value) => value.trim()
            )
        );

      if (importedQuestions.length === 0) {
        throw new Error(
          'Tidak ditemukan pertanyaan pada file Excel.'
        );
      }

      setExcelPreview(importedQuestions);
      setExcelFileName(file.name);
      setShowExcelPreview(true);
    } catch (err) {
      console.error('Excel import error:', err);
      setExcelError(
        err.message || 'Gagal membaca file Excel.'
      );
    } finally {
      e.target.value = '';
    }
  };

  // ======================================
  // VALIDASI PREVIEW EXCEL
  // ======================================

  const isExcelQuestionValid = (question) => {
    const optionEntries = Object.entries(question.options)
      .filter(([, value]) => value.trim() !== '')
      .map(([key]) => key);

    const expectedOptions = ['A', 'B', 'C', 'D'].slice(
      0,
      optionEntries.length
    );

    const isSequential = optionEntries.every(
      (option, index) => option === expectedOptions[index]
    );

    const hasSubtopic =
      Boolean(question.subtopic_id) ||
      (
        Boolean(question.new_subtopic_name.trim()) &&
        Boolean(question.new_subtopic_description.trim())
      );

    return Boolean(
      question.question_text.trim() &&
      optionEntries.length >= 2 &&
      isSequential &&
      ['A', 'B', 'C', 'D'].includes(
        question.correct_answer
      ) &&
      question.options[question.correct_answer]?.trim() &&
      hasSubtopic
    );
  };

  // ======================================
  // MASUKKAN HASIL EXCEL KE FORM
  // SEKALIGUS BUAT SUBTOPIK BARU
  // ======================================

  const applyExcelQuestions = async () => {
    if (excelPreview.length === 0) return;

    const invalidIndex = excelPreview.findIndex(
      (question) => !isExcelQuestionValid(question)
    );

    if (invalidIndex !== -1) {
      setExcelError(
        `Periksa kembali soal nomor ${invalidIndex + 1}. Pastikan pertanyaan, pilihan jawaban, kunci, dan subtopik sudah benar.`
      );
      return;
    }

    setApplyingExcel(true);
    setExcelError('');

    try {
      const refreshResponse = await adminFetch(
        `${API_URL}/reading-subtopics`
      );

      const refreshResult = await refreshResponse.json();

      if (!refreshResponse.ok || !refreshResult.success) {
        throw new Error(
          'Gagal mengambil daftar subtopik terbaru.'
        );
      }

      let updatedSubtopics = Array.isArray(refreshResult.data)
        ? refreshResult.data
        : [];

      const newSubtopics = new Map();

      excelPreview.forEach((question) => {
        const subtopicName = question.new_subtopic_name.trim();

        if (!subtopicName) return;

        const existing = updatedSubtopics.find(
          (item) =>
            normalizeName(item.name) ===
            normalizeName(subtopicName)
        );

        if (existing) return;

        const key = normalizeName(subtopicName);
        const description =
          question.new_subtopic_description.trim();

        if (!newSubtopics.has(key)) {
          newSubtopics.set(key, {
            name: subtopicName,
            description,
          });
        } else {
          const previous = newSubtopics.get(key);

          if (
            previous.description &&
            description &&
            previous.description !== description
          ) {
            throw new Error(
              `Subtopik "${subtopicName}" memiliki deskripsi berbeda pada beberapa baris Excel. Samakan deskripsinya terlebih dahulu.`
            );
          }

          if (!previous.description && description) {
            previous.description = description;
          }
        }
      });

      for (const subtopic of newSubtopics.values()) {
        if (!subtopic.description) {
          throw new Error(
            `Deskripsi untuk subtopik "${subtopic.name}" wajib diisi.`
          );
        }

        const response = await adminFetch(`${API_URL}/subtopics`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            category: 'reading',
            name: subtopic.name,
            description: subtopic.description,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(
            result.message ||
              `Gagal membuat subtopik "${subtopic.name}".`
          );
        }
      }

      const finalResponse = await adminFetch(
        `${API_URL}/reading-subtopics`
      );

      const finalResult = await finalResponse.json();

      if (!finalResponse.ok || !finalResult.success) {
        throw new Error(
          'Subtopik sudah diproses, tetapi daftar terbaru gagal dimuat. Silakan refresh halaman.'
        );
      }

      updatedSubtopics = Array.isArray(finalResult.data)
        ? finalResult.data
        : [];

      setLocalSubtopics(updatedSubtopics);

      const mappedQuestions = excelPreview.map((question) => {
        const matchedSubtopic = updatedSubtopics.find(
          (item) =>
            normalizeName(item.name) ===
            normalizeName(question.new_subtopic_name)
        );

        if (!matchedSubtopic) {
          throw new Error(
            `Subtopik "${question.new_subtopic_name}" belum ditemukan.`
          );
        }

        return {
          ...question,
          subtopic_id: String(matchedSubtopic.id),
          new_subtopic_name: '',
          new_subtopic_description: '',
          options: { ...question.options },
        };
      });

      setQuestions((prev) => [
        ...prev,
        ...mappedQuestions,
      ]);

      setExcelPreview([]);
      setExcelFileName('');
      setShowExcelPreview(false);
      setExcelError('');
      setError('');
    } catch (err) {
      console.error('Apply Excel error:', err);
      setExcelError(err.message);
    } finally {
      setApplyingExcel(false);
    }
  };

  // ======================================
  // DOWNLOAD TEMPLATE EXCEL
  // ======================================

  const downloadTemplate = () => {
    const template = [
      {
        Pertanyaan: 'What is the main idea of the passage?',
        A: 'The importance of education',
        B: 'The history of transportation',
        C: '',
        D: '',
        Kunci: 'A',
        Subtopik: 'Identifying Main Ideas',
        'Deskripsi Subtopik':
          'Identifying the main idea or central point of a reading passage.',
        Pembahasan:
          'The main idea represents the central topic discussed throughout the passage.',
      },
      {
        Pertanyaan: 'According to the passage, why do people use technology?',
        A: 'To avoid communication',
        B: 'To make daily activities easier',
        C: 'To replace all human activities',
        D: '',
        Kunci: 'B',
        Subtopik: 'Identifying Specific Information',
        'Deskripsi Subtopik':
          'Finding specific details or information explicitly stated in a reading passage.',
        Pembahasan:
          'Look for the sentence that explains the benefits of technology.',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);

    worksheet['!cols'] = [
      { wch: 42 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 25 },
      { wch: 12 },
      { wch: 30 },
      { wch: 55 },
      { wch: 55 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Soal Reading'
    );

    XLSX.writeFile(
      workbook,
      'Template_Soal_Reading.xlsx'
    );
  };

  // ======================================
  // VALIDASI FORM
  // ======================================

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama paket wajib diisi.');
      return;
    }

    if (!readingText.trim()) {
      setError('Teks bacaan wajib diisi.');
      return;
    }

    if (questions.length === 0) {
      setError('Tambahkan minimal satu soal.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      if (!question.question_text.trim()) {
        setError(`Pertanyaan nomor ${i + 1} wajib diisi.`);
        return;
      }

      if (!question.subtopic_id) {
        setError(
          `Pilih atau tambahkan subtopik untuk soal nomor ${i + 1}.`
        );
        return;
      }

      const availableOptions = ['A', 'B', 'C', 'D'].filter(
        (key) =>
          typeof question.options[key] === 'string' &&
          question.options[key].trim() !== ''
      );

      if (availableOptions.length < 2) {
        setError(
          `Soal nomor ${i + 1} minimal harus memiliki 2 pilihan jawaban.`
        );
        return;
      }

      const expectedOptions = ['A', 'B', 'C', 'D'].slice(
        0,
        availableOptions.length
      );

      const isSequential = availableOptions.every(
        (option, index) =>
          option === expectedOptions[index]
      );

      if (!isSequential) {
        setError(
          `Pilihan jawaban soal nomor ${i + 1} harus berurutan mulai dari A.`
        );
        return;
      }

      if (!availableOptions.includes(question.correct_answer)) {
        setError(
          `Kunci jawaban soal nomor ${i + 1} tidak tersedia.`
        );
        return;
      }
    }

    onSave({
      name: name.trim(),
      level,
      readingInstruction: readingInstruction.trim(),
      readingText: readingText.trim(),
      questions: questions.map((question) => ({
        question_text: question.question_text.trim(),
        subtopic_id: Number(question.subtopic_id),
        options: Object.fromEntries(
          Object.entries(question.options).filter(
            ([, value]) =>
              typeof value === 'string' &&
              value.trim() !== ''
          )
        ),
        correct_answer: question.correct_answer,
        explanation: question.explanation?.trim() || '',
      })),
    });
  };

  // ======================================
  // RENDER
  // ======================================

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4"
      onClick={saving ? undefined : onClose}
    >
      <div
        className="bg-white w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-[#0a3d2e]">
              {isEditing
                ? 'Edit Paket Reading'
                : 'Tambah Paket Reading'}
            </h3>

            <p className="text-sm text-gray-500 mt-1">
              Lengkapi petunjuk, teks bacaan, dan soal dalam satu paket.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* INFORMASI PAKET */}

          <section className="space-y-4">
            <h4 className="font-bold text-[#0a3d2e]">
              Informasi Paket
            </h4>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nama Paket <span className="text-red-500">*</span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder="Contoh: Reading - Technology in Daily Life"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#10C35D]"
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Level <span className="text-red-500">*</span>
              </label>

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#10C35D]"
                disabled={saving}
              >
                <option value="singkat">Singkat</option>
                <option value="sedang">Sedang</option>
                <option value="panjang">Panjang</option>
              </select>
            </div>

            {/* PETUNJUK SOAL */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Petunjuk Soal
                <span className="text-gray-400 font-normal">
                  {' '}(Opsional)
                </span>
              </label>

              <textarea
                rows={3}
                value={readingInstruction}
                onChange={(e) =>
                  setReadingInstruction(e.target.value)
                }
                placeholder="Contoh: Read the following text carefully to answer questions {start}â€“{end}."
                disabled={saving}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none resize-y focus:border-[#10C35D]"
              />

              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                Petunjuk ditampilkan sebelum teks bacaan. Gunakan
                {' '}<span className="font-semibold">{'{start}'}</span>
                {' '}untuk nomor soal pertama dan
                {' '}<span className="font-semibold">{'{end}'}</span>
                {' '}untuk nomor soal terakhir. Nomor akan disesuaikan
                otomatis ketika paket ditampilkan pada halaman latihan.
              </p>
            </div>

            {/* TEKS BACAAN */}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Teks Bacaan <span className="text-red-500">*</span>
              </label>

              <textarea
                rows={10}
                value={readingText}
                onChange={(e) => setReadingText(e.target.value)}
                placeholder="Masukkan teks bacaan yang akan digunakan untuk menjawab soal-soal dalam paket ini..."
                disabled={saving}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none resize-y focus:border-[#10C35D]"
              />

              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-xs text-gray-400">
                  Satu teks bacaan digunakan bersama oleh seluruh soal dalam paket.
                </p>

                <span className="text-xs text-gray-400 shrink-0">
                  {readingText.trim()
                    ? readingText.trim().split(/\s+/).length
                    : 0}{' '}
                  kata
                </span>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100" />

          {/* IMPORT EXCEL */}

          <section className="space-y-3">
            <div>
              <h4 className="font-bold text-[#0a3d2e]">
                Import Soal dari Excel
              </h4>

              <p className="text-xs text-gray-500 mt-1">
                Masukkan banyak soal sekaligus menggunakan template Excel.
              </p>
            </div>

            <div className="border border-green-100 bg-green-50/50 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileSpreadsheet
                      size={21}
                      className="text-[#0a3d2e]"
                    />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      File Excel soal Reading
                    </p>

                    <p className="text-xs text-gray-500">
                      Format .xlsx atau .xls
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadTemplate}
                  disabled={saving || applyingExcel}
                  className="inline-flex items-center justify-center gap-2 text-xs font-semibold text-[#0a3d2e] hover:underline"
                >
                  <Download size={15} />
                  Download Template
                </button>
              </div>

              <label className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-dashed border-green-300 rounded-lg bg-white text-sm font-semibold text-[#0a3d2e] cursor-pointer hover:bg-green-50">
                <Upload size={17} />
                Pilih File Excel

                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  disabled={saving || applyingExcel}
                  onChange={handleExcelImport}
                />
              </label>

              {excelFileName && (
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <CheckCircle
                    size={15}
                    className="text-green-600"
                  />
                  {excelFileName}
                </div>
              )}

              {excelError && (
                <p className="text-xs text-red-600">
                  {excelError}
                </p>
              )}

              <p className="text-xs text-gray-500 leading-relaxed">
                Kolom Excel: Pertanyaan, A, B, C, D, Kunci,
                Subtopik, Deskripsi Subtopik, dan Pembahasan.
                Kolom C, D, dan Pembahasan boleh dikosongkan.
                Teks bacaan dan petunjuk soal diisi pada bagian Informasi Paket.
              </p>
            </div>

            {/* PREVIEW EXCEL */}

            {showExcelPreview && (
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between gap-3 p-4 bg-gray-50 border-b border-gray-200">
                  <div>
                    <p className="font-semibold text-sm text-gray-700">
                      Preview Hasil Import
                    </p>

                    <p className="text-xs text-gray-500 mt-1">
                      {excelPreview.length} soal ditemukan
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExcelPreview(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200"
                    title="Tutup preview"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                  {excelPreview.map((question, index) => {
                    const optionCount = Object.values(
                      question.options
                    ).filter((value) => value.trim()).length;

                    const valid = isExcelQuestionValid(question);

                    return (
                      <div
                        key={index}
                        className="p-3 space-y-1.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-700">
                            {index + 1}. {question.question_text || '(Pertanyaan kosong)'}
                          </p>

                          {valid ? (
                            <CheckCircle
                              size={16}
                              className="text-green-600 shrink-0"
                            />
                          ) : (
                            <AlertCircle
                              size={16}
                              className="text-orange-500 shrink-0"
                            />
                          )}
                        </div>

                        <p className="text-xs text-gray-500">
                          {optionCount} pilihan Â· Kunci: {question.correct_answer || '-'} Â· Subtopik: {question.new_subtopic_name || '-'}
                        </p>

                        {!question.subtopic_id &&
                          question.new_subtopic_name && (
                            <p className="text-xs text-gray-500">
                              Deskripsi: {question.new_subtopic_description || 'Belum diisi'}
                            </p>
                          )}

                        {!valid && (
                          <p className="text-xs text-orange-600">
                            Periksa pertanyaan, minimal dua pilihan
                            berurutan, kunci jawaban, dan deskripsi
                            subtopik baru.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExcelPreview([]);
                      setExcelFileName('');
                      setShowExcelPreview(false);
                      setExcelError('');
                    }}
                    disabled={applyingExcel}
                    className="text-sm text-gray-500 hover:text-red-500"
                  >
                    Batalkan Import
                  </button>

                  <button
                    type="button"
                    onClick={applyExcelQuestions}
                    disabled={
                      saving ||
                      applyingExcel ||
                      excelPreview.length === 0 ||
                      !excelPreview.every(isExcelQuestionValid)
                    }
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#10C35D] text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-50"
                  >
                    {applyingExcel ? (
                      <>
                        <RefreshCw
                          size={16}
                          className="animate-spin"
                        />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        Masukkan {excelPreview.length} Soal
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </section>

          <div className="border-t border-gray-100" />

          {/* DAFTAR SOAL */}

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-[#0a3d2e]">
                  Soal Reading
                </h4>

                <p className="text-xs text-gray-500 mt-1">
                  Seluruh soal dalam paket ini menggunakan teks bacaan yang sama.
                </p>
              </div>

              <button
                type="button"
                onClick={addQuestion}
                disabled={saving}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 text-[#0a3d2e] text-sm font-semibold hover:bg-green-100"
              >
                <Plus size={16} />
                Tambah Soal
              </button>
            </div>

            {questions.length > 0 && (
              <p className="text-xs text-gray-500">
                Total {questions.length} soal dalam paket ini.
              </p>
            )}

            {questions.length === 0 && (
              <div className="border border-dashed border-gray-300 rounded-xl p-7 text-center">
                <BookOpen
                  size={30}
                  className="mx-auto mb-2 text-gray-300"
                />

                <p className="text-sm text-gray-500">
                  Belum ada soal. Tambahkan secara manual atau import Excel.
                </p>
              </div>
            )}

            {questions.map((question, index) => {
              const availableOptions = ['A', 'B', 'C', 'D'].filter(
                (option) =>
                  question.options[option]?.trim()
              );

              return (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4 space-y-4"
                >
                  {/* JUDUL SOAL */}

                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold text-sm text-[#0a3d2e]">
                      Soal {index + 1}
                    </h5>

                    <button
                      type="button"
                      onClick={() => removeQuestion(index)}
                      disabled={saving}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                      title="Hapus soal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* PERTANYAAN */}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pertanyaan <span className="text-red-500">*</span>
                    </label>

                    <textarea
                      rows={3}
                      value={question.question_text}
                      onChange={(e) =>
                        updateQuestion(
                          index,
                          'question_text',
                          e.target.value
                        )
                      }
                      placeholder="Masukkan pertanyaan..."
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none resize-y focus:border-[#10C35D]"
                    />
                  </div>

                  {/* SUBTOPIK */}

                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        Subtopik <span className="text-red-500">*</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const isClosing = addingSubtopic === index;

                          setAddingSubtopic(
                            isClosing ? null : index
                          );

                          setSubtopicInput(
                            isClosing
                              ? ''
                              : question.new_subtopic_name || ''
                          );

                          setSubtopicDescription(
                            isClosing
                              ? ''
                              : question.new_subtopic_description || ''
                          );

                          setError('');
                        }}
                        disabled={saving}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#0a3d2e] hover:underline"
                      >
                        <PlusCircle size={15} />
                        Tambah Subtopik
                      </button>
                    </div>

                    <select
                      value={question.subtopic_id}
                      onChange={(e) => {
                        updateQuestion(
                          index,
                          'subtopic_id',
                          e.target.value
                        );

                        updateQuestion(
                          index,
                          'new_subtopic_name',
                          ''
                        );

                        updateQuestion(
                          index,
                          'new_subtopic_description',
                          ''
                        );
                      }}
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#10C35D]"
                    >
                      <option value="">Pilih subtopik</option>

                      {readingSubtopics.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    {question.new_subtopic_name &&
                      !question.subtopic_id && (
                        <p className="text-xs text-orange-600 mt-2">
                          Subtopik dari Excel: {question.new_subtopic_name}.
                          Tambahkan subtopik tersebut atau pilih yang tersedia.
                        </p>
                      )}

                    {addingSubtopic === index && (
                      <div className="mt-3 p-3 rounded-lg border border-green-100 bg-green-50/50 space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Nama Subtopik Baru
                          </label>

                          <input
                            type="text"
                            value={subtopicInput}
                            onChange={(e) =>
                              setSubtopicInput(e.target.value)
                            }
                            maxLength={100}
                            placeholder="Contoh: Identifying Main Ideas"
                            disabled={savingSubtopic}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#10C35D] bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-2">
                            Deskripsi Subtopik{' '}
                            <span className="text-red-500">*</span>
                          </label>

                          <textarea
                            rows={3}
                            value={subtopicDescription}
                            onChange={(e) =>
                              setSubtopicDescription(e.target.value)
                            }
                            placeholder="Jelaskan kemampuan reading yang diuji pada subtopik ini..."
                            disabled={savingSubtopic}
                            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none resize-y focus:border-[#10C35D] bg-white"
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setAddingSubtopic(null);
                              setSubtopicInput('');
                              setSubtopicDescription('');
                            }}
                            disabled={savingSubtopic}
                            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg"
                          >
                            Batal
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleAddSubtopic(index)
                            }
                            disabled={
                              savingSubtopic ||
                              !subtopicInput.trim() ||
                              !subtopicDescription.trim()
                            }
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#10C35D] text-white text-xs font-semibold hover:bg-green-600 disabled:opacity-50"
                          >
                            {savingSubtopic ? (
                              <RefreshCw
                                size={14}
                                className="animate-spin"
                              />
                            ) : (
                              <Plus size={14} />
                            )}
                            Simpan Subtopik
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* PILIHAN JAWABAN */}

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-gray-700">
                      Pilihan Jawaban
                      <span className="text-red-500"> *</span>
                    </p>

                    <p className="text-xs text-gray-400">
                      Isi minimal 2 pilihan. Pilihan C dan D tidak wajib.
                    </p>

                    {['A', 'B', 'C', 'D'].map((option) => (
                      <div
                        key={option}
                        className="flex items-center gap-3"
                      >
                        <span className="w-8 h-8 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                          {option}
                        </span>

                        <input
                          type="text"
                          value={question.options[option]}
                          onChange={(e) =>
                            updateOption(
                              index,
                              option,
                              e.target.value
                            )
                          }
                          placeholder={`Pilihan ${option}`}
                          disabled={saving}
                          className="flex-1 min-w-0 px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#10C35D]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* KUNCI JAWABAN */}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Kunci Jawaban{' '}
                      <span className="text-red-500">*</span>
                    </label>

                    <select
                      value={question.correct_answer}
                      onChange={(e) =>
                        updateQuestion(
                          index,
                          'correct_answer',
                          e.target.value
                        )
                      }
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#10C35D]"
                    >
                      {availableOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* PEMBAHASAN */}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Pembahasan{' '}
                      <span className="text-gray-400 font-normal">
                        (Opsional)
                      </span>
                    </label>

                    <textarea
                      rows={2}
                      value={question.explanation || ''}
                      onChange={(e) =>
                        updateQuestion(
                          index,
                          'explanation',
                          e.target.value
                        )
                      }
                      placeholder="Jelaskan alasan jawaban yang benar..."
                      disabled={saving}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm outline-none resize-y focus:border-[#10C35D]"
                    />
                  </div>
                </div>
              );
            })}
          </section>

          {/* PESAN ERROR */}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600">
              <AlertCircle size={17} className="shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* FOOTER */}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving || savingSubtopic || applyingExcel}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={saving || savingSubtopic || applyingExcel}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#10C35D] text-white text-sm font-semibold hover:bg-green-600 disabled:opacity-60"
            >
              {saving ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save size={16} />
                  {isEditing
                    ? 'Simpan Perubahan'
                    : 'Tambah Paket'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

