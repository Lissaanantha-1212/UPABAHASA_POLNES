import React from 'react';
import {
  X,
  Save,
  Tags,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

const SubtopicModal = ({
  show,
  editingSubtopic,
  formSubtopic,
  savingSubtopic,
  formError,
  onClose,
  onChange,
  onSave,
}) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <Tags size={20} className="text-[#10C35D]" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {editingSubtopic ? 'Edit Subtopik' : 'Tambah Subtopik'}
              </h3>

              <p className="text-xs text-gray-500 mt-0.5">
                Lengkapi informasi subtopik kuis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={savingSubtopic}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-5">
          {/* ERROR */}
          {formError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p className="text-sm">{formError}</p>
            </div>
          )}

          {/* KATEGORI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kategori <span className="text-red-500">*</span>
            </label>

            <select
              value={formSubtopic.category}
              onChange={(e) => onChange('category', e.target.value)}
              disabled={savingSubtopic}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D] disabled:bg-gray-50"
            >
              <option value="listening">Listening</option>
              <option value="reading">Reading</option>
              <option value="structure">Structure</option>
            </select>
          </div>

          {/* NAMA SUBTOPIK */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nama Subtopik <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={formSubtopic.name}
              onChange={(e) => onChange('name', e.target.value)}
              disabled={savingSubtopic}
              placeholder="Contoh: Daily Activities"
              maxLength={150}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D] disabled:bg-gray-50"
            />

            <p className="text-xs text-gray-400 mt-1">
              Masukkan nama subtopik yang mudah dipahami.
            </p>
          </div>

          {/* DESKRIPSI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Deskripsi Subtopik
            </label>

            <textarea
              value={formSubtopic.description}
              onChange={(e) => onChange('description', e.target.value)}
              disabled={savingSubtopic}
              rows={4}
              placeholder="Tuliskan penjelasan singkat mengenai subtopik..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#10C35D]/30 focus:border-[#10C35D] disabled:bg-gray-50"
            />

            <p className="text-xs text-gray-400 mt-1">
              Deskripsi bersifat opsional.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={savingSubtopic}
            className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-sm font-medium hover:bg-gray-100 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={savingSubtopic}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#10C35D] hover:bg-[#0eae53] text-white text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {savingSubtopic ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                {editingSubtopic ? 'Simpan Perubahan' : 'Simpan Subtopik'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubtopicModal;