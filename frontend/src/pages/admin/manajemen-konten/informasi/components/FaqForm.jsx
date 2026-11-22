import React from 'react';
import { X, Save } from 'lucide-react';

export default function FaqForm({
  faqEditingId,
  closeFaqForm,
  faqSaving,
  handleFaqSubmit,
  faqForm,
  updateFaqField,
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-[#0a3d2e]">
            {faqEditingId ? 'Edit FAQ' : 'Tambah FAQ'}
          </h4>
          <p className="mt-1 text-xs text-gray-500">
            Lengkapi pertanyaan, jawaban, dan kategori FAQ.
          </p>
        </div>

        <button
          type="button"
          onClick={closeFaqForm}
          disabled={faqSaving}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Tutup formulir FAQ"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleFaqSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Kategori <span className="text-red-500">*</span>
          </label>
          <select
            value={faqForm.category}
            onChange={(event) => updateFaqField('category', event.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
          >
            <option value="Umum">Umum</option>
            <option value="Layanan Tes">Layanan Tes</option>
            <option value="Layanan Non-Tes">Layanan Non-Tes</option>
            <option value="Pengaduan">Pengaduan</option>
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Pertanyaan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={faqForm.question}
            onChange={(event) => updateFaqField('question', event.target.value)}
            required
            maxLength={500}
            placeholder="Masukkan pertanyaan"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Jawaban <span className="text-red-500">*</span>
          </label>
          <textarea
            value={faqForm.answer}
            onChange={(event) => updateFaqField('answer', event.target.value)}
            required
            rows={5}
            placeholder="Masukkan jawaban FAQ"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-gray-700">
              Urutan Tampil
            </label>
            <input
              type="number"
              min="1"
              value={faqForm.sort_order}
              onChange={(event) => updateFaqField('sort_order', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-[#10C35D]"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
          <button
            type="button"
            onClick={closeFaqForm}
            disabled={faqSaving}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={faqSaving}
            className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0eaa50] disabled:opacity-50"
          >
            <Save size={16} />
            {faqSaving ? 'Menyimpan...' : 'Simpan FAQ'}
          </button>
        </div>
      </form>
    </section>
  );
}
