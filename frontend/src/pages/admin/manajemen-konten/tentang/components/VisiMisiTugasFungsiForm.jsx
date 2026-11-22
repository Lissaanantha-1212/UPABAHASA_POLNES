
import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';

const sections = [
  {
    type: 'visi',
    title: 'Visi',
    description: 'Arah dan cita-cita UPA Bahasa.',
  },
  {
    type: 'misi',
    title: 'Misi',
    description: 'Tujuan dan langkah strategis UPA Bahasa.',
  },
  {
    type: 'tugas',
    title: 'Tugas',
    description: 'Tanggung jawab UPA Bahasa.',
  },
  {
    type: 'fungsi',
    title: 'Fungsi',
    description: 'Peran dan fungsi UPA Bahasa.',
  },
];

function prepareItems(data = []) {
  return sections.reduce((result, section) => {
    const records = data
      .filter((item) => item.section_type === section.type)
      .sort(
        (a, b) =>
          Number(a.sort_order) - Number(b.sort_order) ||
          Number(a.id) - Number(b.id)
      );

    const contents = records
      .map((item) => (item.content || '').trim())
      .filter(Boolean);

    result[section.type] = {
      id: records[0]?.id ?? null,
      legacyIds: records.slice(1).map((item) => item.id),
      content: contents.join('\n'),
      section_type: section.type,
    };

    return result;
  }, {});
}

export default function VisiMisiTugasFungsiForm({
  data,
  onSave,
  saving,
}) {
  const [items, setItems] = useState(() => prepareItems(data));

  useEffect(() => {
    setItems(prepareItems(data));
  }, [data]);

  const updateContent = (sectionType, content) => {
    setItems((previous) => ({
      ...previous,
      [sectionType]: {
        ...previous[sectionType],
        content,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = sections.map((section, index) => ({
      ...items[section.type],
      section_type: section.type,
      content: items[section.type].content.trim(),
      sort_order: index,
      is_active: true,
    }));

    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-lg font-bold text-[#0a3d2e]">
          Pengelolaan Visi, Misi, Tugas & Fungsi
        </h3>
        <p className="mt-1 text-sm leading-6 text-gray-500">
          Kelola informasi landasan dan pelaksanaan UPA Bahasa.
          Seluruh perubahan akan dipublikasikan setelah disimpan.
        </p>
      </div>

      {sections.map((section) => (
        <section
          key={section.type}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <div className="mb-4">
            <h4 className="font-bold text-[#0a3d2e]">
              {section.title}
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              {section.description}
            </p>
          </div>

          <textarea
            rows={6}
            value={items[section.type]?.content || ''}
            onChange={(event) =>
              updateContent(section.type, event.target.value)
            }
            placeholder={`Masukkan isi ${section.title.toLowerCase()}...`}
            className="w-full rounded-lg border border-gray-300 px-3 py-3 text-sm leading-7 outline-none transition focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/10"
          />
          <p className="mt-2 text-xs text-gray-400">
            Satu kolom untuk seluruh isi {section.title.toLowerCase()}.
            Gunakan baris baru untuk memisahkan poin jika diperlukan.
          </p>
        </section>
      ))}

      <div className="flex justify-end rounded-xl border border-gray-200 bg-white p-5">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0eaa50] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </div>
    </form>
  );
}
