import React, { useEffect, useState } from 'react';
import { X, Plus, Trash2, Save, FileQuestion } from 'lucide-react';

const EMPTY_FORM = {
  subtopic: '',
  question_text: '',
  options: [
    { label: 'A', text: '' },
    { label: 'B', text: '' },
    { label: 'C', text: '' },
  ],
  correct_answer: 'A',
  explanation: '',
  recommendation_material: '',
};

export default function SoalMandiriModal({
  initialData,
  category,
  categoryLabel,
  saving,
  onClose,
  onSave,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [audioFile, setAudioFile] = useState(null);

  useEffect(() => {
    setAudioFile(null);
    setFormError('');

    if (!initialData) {
      setForm(EMPTY_FORM);
      return;
    }

    const sourceOptions = Array.isArray(initialData.options)
      ? initialData.options
      : [];

    const normalizedOptions = ['A', 'B', 'C', 'D']
      .filter((label) =>
        sourceOptions.some((option) => option.label === label)
      )
      .map((label) => {
        const option = sourceOptions.find((item) => item.label === label);
        return { label, text: option?.text || '' };
      });

    const correctAnswer = Array.isArray(initialData.correct_answer)
      ? initialData.correct_answer[0]
      : initialData.correct_answer;

    setForm({
      subtopic: initialData.subtopic || '',
      question_text: initialData.question_text || '',
      options: normalizedOptions.length >= 3
        ? normalizedOptions
        : EMPTY_FORM.options,
      correct_answer: correctAnswer || 'A',
      explanation: initialData.explanation || '',
      recommendation_material: initialData.recommendation_material || '',
    });
  }, [initialData]);

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateOption = (label, value) => {
    setForm((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.label === label
          ? { ...option, text: value }
          : option
      ),
    }));
  };

  const addOption = () => {
    if (form.options.length >= 4) return;

    const nextLabel = ['A', 'B', 'C', 'D'][form.options.length];

    setForm((current) => ({
      ...current,
      options: [
        ...current.options,
        { label: nextLabel, text: '' },
      ],
    }));
  };

  const removeOption = () => {
    if (form.options.length <= 3) return;

    const removedLabel = form.options[form.options.length - 1].label;

    setForm((current) => ({
      ...current,
      options: current.options.slice(0, -1),
      correct_answer:
        current.correct_answer === removedLabel
          ? 'A'
          : current.correct_answer,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');

    if (!form.subtopic.trim()) {
      setFormError('Subtopik wajib diisi.');
      return;
    }

    if (!form.question_text.trim()) {
      setFormError('Pertanyaan wajib diisi.');
      return;
    }

    if (form.options.some((option) => !option.text.trim())) {
      setFormError('Semua pilihan jawaban yang ditampilkan wajib diisi.');
      return;
    }

    if (!form.options.some((option) => option.label === form.correct_answer)) {
      setFormError('Pilih satu jawaban yang benar.');
      return;
    }

    if (!form.explanation.trim()) {
      setFormError('Pembahasan wajib diisi.');
      return;
    }

    if (!form.recommendation_material.trim()) {
      setFormError('Rekomendasi materi wajib diisi.');
      return;
    }

    if (
      category === 'listening' &&
      !audioFile &&
      !initialData?.audio_url
    ) {
      setFormError('Unggah file audio Listening terlebih dahulu.');
      return;
    }

    onSave({
      audioFile: category === 'listening' ? audioFile : null,
      subtopic: form.subtopic.trim(),
      question_text: form.question_text.trim(),
      options: form.options.map((option) => ({
        label: option.label,
        text: option.text.trim(),
      })),
      correct_answer: [form.correct_answer],
      explanation: form.explanation.trim(),
      recommendation_material: form.recommendation_material.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#10C35D]">
              <FileQuestion size={20} />
            </div>
            <div>
              <h3 className="font-bold text-[#0a3d2e]">
                {initialData ? 'Edit Soal Mandiri' : 'Tambah Soal Mandiri'}
              </h3>
              <p className="text-xs text-gray-500">
                Kategori {categoryLabel}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          {formError && (
            <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Subtopik
            </label>
            <input
              type="text"
              value={form.subtopic}
              onChange={(event) => updateField('subtopic', event.target.value)}
              placeholder="Contoh: Vocabulary"
              className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            />
          </div>

          {category === 'listening' && (
            <div className="rounded-xl border border-green-100 bg-green-50/50 p-4">
              <label className="mb-2 block text-sm font-semibold text-[#0a3d2e]">
                Audio Listening <span className="text-red-500">*</span>
              </label>

              {initialData?.audio_url && !audioFile && (
                <p className="mb-2 text-xs text-green-700">
                  <span className="font-semibold">Audio tersimpan.</span>
                  {' '}Audio lama akan tetap digunakan jika tidak diganti.
                </p>
              )}

              {audioFile && (
                <p className="mb-2 break-all text-xs text-green-700">
                  File baru: {audioFile.name}
                </p>
              )}

              <input
                type="file"
                accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;

                  if (!file) {
                    setAudioFile(null);
                    return;
                  }

                  if (!/\.(mp3|wav|m4a)$/i.test(file.name)) {
                    setFormError('Format audio harus MP3, WAV, atau M4A.');
                    event.target.value = '';
                    setAudioFile(null);
                    return;
                  }

                  if (file.size > 25 * 1024 * 1024) {
                    setFormError('Ukuran audio maksimal 25 MB.');
                    event.target.value = '';
                    setAudioFile(null);
                    return;
                  }

                  setFormError('');
                  setAudioFile(file);
                }}
                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#10C35D] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-green-600"
              />

              <p className="mt-2 text-xs text-gray-500">
                Format MP3, WAV, atau M4A. Maksimal 25 MB.
              </p>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Pertanyaan
            </label>
            <textarea
              rows={3}
              value={form.question_text}
              onChange={(event) => updateField('question_text', event.target.value)}
              placeholder="Tuliskan pertanyaan..."
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Pilihan Jawaban
              </label>
              <span className="text-xs text-gray-400">
                Minimal 3, maksimal 4 pilihan
              </span>
            </div>

            <div className="space-y-3">
              {form.options.map((option) => (
                <div key={option.label} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-sm font-bold text-gray-600">
                    {option.label}
                  </span>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(event) =>
                      updateOption(option.label, event.target.value)
                    }
                    placeholder={`Pilihan ${option.label}`}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-gray-600">
                    <input
                      type="radio"
                      name="correct_answer"
                      value={option.label}
                      checked={form.correct_answer === option.label}
                      onChange={() => updateField('correct_answer', option.label)}
                      className="accent-[#10C35D]"
                    />
                    Benar
                  </label>
                </div>
              ))}
            </div>

            <div className="mt-3 flex gap-2">
              {form.options.length < 4 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 px-3 py-2 text-xs font-semibold text-[#0a3d2e] hover:bg-green-50"
                >
                  <Plus size={14} />
                  Tambah pilihan D
                </button>
              )}

              {form.options.length > 3 && (
                <button
                  type="button"
                  onClick={removeOption}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  Hapus pilihan D
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Pembahasan
            </label>
            <textarea
              rows={3}
              value={form.explanation}
              onChange={(event) => updateField('explanation', event.target.value)}
              placeholder="Jelaskan alasan jawaban yang benar..."
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Rekomendasi Materi
            </label>
            <textarea
              rows={2}
              value={form.recommendation_material}
              onChange={(event) =>
                updateField('recommendation_material', event.target.value)
              }
              placeholder="Materi yang disarankan untuk dipelajari..."
              className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? 'Menyimpan...' : 'Simpan Soal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
