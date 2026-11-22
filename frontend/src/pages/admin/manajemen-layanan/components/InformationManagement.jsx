import React from 'react';
import {
  Save,
  Plus,
  Trash2,
  LoaderCircle,
} from 'lucide-react';

const InformationManagement = ({
  form,
  selectedProgram,
  handleSave,
  saving,
  labelClass,
  handleFieldChange,
  addListItem,
  handleListChange,
  removeListItem,
  getTodayWITA,
  inputClass,
}) => (

    <form onSubmit={handleSave} className="space-y-5">
      <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#0a3d2e]">
            Informasi Program
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Informasi berikut akan ditampilkan pada halaman layanan publik.
          </p>
        </div>

        <div>
          <label className={labelClass}>Nama Program</label>
          <input
            type="text"
            value={selectedProgram?.name || ''}
            readOnly
            className={`${inputClass} bg-gray-50 text-gray-500`}
          />
          <p className="text-xs text-gray-400 mt-1">
            Nama program dikelola sebagai data tetap sistem.
          </p>
        </div>

        <div>
          <label className={labelClass}>Deskripsi Program</label>
          <textarea
            rows={4}
            required
            value={form.description}
            onChange={(e) =>
              handleFieldChange('description', e.target.value)
            }
            placeholder="Tuliskan penjelasan singkat mengenai program..."
            className={inputClass}
          />
        </div>

        {/* MANFAAT */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Manfaat Program
            </label>
            <button
              type="button"
              onClick={() => addListItem('benefits')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0DAA50] hover:text-[#0a3d2e]"
            >
              <Plus size={15} />
              Tambah Manfaat
            </button>
          </div>

          <div className="space-y-2">
            {form.benefits.map((item, index) => (
              <div key={`benefit-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    handleListChange('benefits', index, e.target.value)
                  }
                  placeholder={`Manfaat ${index + 1}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeListItem('benefits', index)}
                  aria-label="Hapus manfaat"
                  className="shrink-0 p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PERSYARATAN */}
        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Persyaratan Pendaftaran
            </label>
            <button
              type="button"
              onClick={() => addListItem('requirements')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0DAA50] hover:text-[#0a3d2e]"
            >
              <Plus size={15} />
              Tambah Persyaratan
            </button>
          </div>

          <div className="space-y-2">
            {form.requirements.map((item, index) => (
              <div key={`requirement-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    handleListChange('requirements', index, e.target.value)
                  }
                  placeholder={`Persyaratan ${index + 1}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeListItem('requirements', index)}
                  aria-label="Hapus persyaratan"
                  className="shrink-0 p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ALUR PENDAFTARAN */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#0a3d2e]">
            Alur Pendaftaran Program
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Atur tahapan yang perlu dilalui calon peserta sebelum dan selama mengikuti program.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3 mb-2">
            <label className="text-sm font-semibold text-gray-700">
              Tahapan Pendaftaran
            </label>
            <button
              type="button"
              onClick={() => addListItem('registration_flow')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0DAA50] hover:text-[#0a3d2e]"
            >
              <Plus size={15} />
              Tambah Tahapan
            </button>
          </div>

          <div className="space-y-2">
            {form.registration_flow.map((item, index) => (
              <div key={`registration-flow-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) =>
                    handleListChange('registration_flow', index, e.target.value)
                  }
                  placeholder={`Tahapan ${index + 1}`}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => removeListItem('registration_flow', index)}
                  aria-label="Hapus tahapan pendaftaran"
                  className="shrink-0 p-2.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PERIODE PENDAFTARAN */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 sm:p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#0a3d2e]">
            Periode dan Status Pendaftaran
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Atur periode pendaftaran yang ditampilkan kepada pengunjung.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Tanggal Mulai Pendaftaran</label>
            <input
              type="date"
              value={form.reg_start}
              min={getTodayWITA()}
              onChange={(e) =>
                handleFieldChange('reg_start', e.target.value)
              }
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tanggal Akhir Pendaftaran</label>
            <input
              type="date"
              value={form.reg_end}
              min={form.reg_start || undefined}
              onChange={(e) =>
                handleFieldChange('reg_end', e.target.value)
              }
              className={inputClass}
            />
          </div>
        </div>

        <p className="rounded-lg bg-green-50 px-4 py-3 text-sm leading-6 text-gray-600">
          Status pendaftaran ditentukan otomatis berdasarkan tanggal mulai
          dan tanggal akhir. Kosongkan kedua tanggal jika periode pendaftaran
          belum ditentukan.
        </p>
      </div>

      {/* SIMPAN */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 bg-[#10C35D] hover:bg-[#0DAA50] disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-lg text-sm transition"
        >
          {saving ? (
            <LoaderCircle size={17} className="animate-spin" />
          ) : (
            <Save size={17} />
          )}
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
);

export default InformationManagement;
