import React, { useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  Trash2,
  Filter,
  CalendarDays,
  Inbox,
  Edit,
} from 'lucide-react';

// ==========================================
// STATUS
// ==========================================

const statusLabels = {
  menunggu: 'Menunggu',
  diproses: 'Sedang Diproses',
  perlu_dilengkapi: 'Perlu Dilengkapi',
  selesai: 'Selesai',
};

const statusStyles = {
  menunggu: 'bg-amber-50 text-amber-700 border-amber-200',
  diproses: 'bg-blue-50 text-blue-700 border-blue-200',
  perlu_dilengkapi: 'bg-orange-50 text-orange-700 border-orange-200',
  selesai: 'bg-green-50 text-green-700 border-green-200',
};

// ==========================================
// FORMAT DATE
// ==========================================

const formatDate = (date) => {
  if (!date) return '-';

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return '-';

  return parsedDate.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==========================================
// FORMAT WHATSAPP
// ==========================================

const formatWhatsApp = (number) => {
  if (!number) return '';

  let cleaned = String(number).replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = `62${cleaned.slice(1)}`;
  } else if (cleaned.startsWith('8')) {
    cleaned = `62${cleaned}`;
  }

  return cleaned;
};

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function ComplaintTable({
  complaints = [],
  loading,
  saving,
  onView,
  onDelete,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('semua');

  // ==========================================
  // FILTER DATA
  // ==========================================

  const filteredComplaints = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return complaints.filter((item) => {
      const whatsapp =
        item.whatsapp ||
        item.phone ||
        item.no_whatsapp ||
        '';

      const matchesSearch =
        String(item.ticket_number || '').toLowerCase().includes(keyword) ||
        String(item.name || '').toLowerCase().includes(keyword) ||
        String(item.nim || '').toLowerCase().includes(keyword) ||
        String(item.program_studi || '').toLowerCase().includes(keyword) ||
        String(whatsapp).toLowerCase().includes(keyword) ||
        String(item.category || '').toLowerCase().includes(keyword) ||
        String(item.layanan || '').toLowerCase().includes(keyword);

      const matchesStatus =
        filterStatus === 'semua' ||
        item.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [complaints, search, filterStatus]);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="space-y-5">

      {/* HEADER */}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw
            size={16}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh Data
        </button>
      </div>

      {/* SEARCH DAN FILTER */}

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">

        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-[#10C35D]" />

          <h3 className="text-sm font-semibold text-gray-700">
            Pencarian dan Filter
          </h3>
        </div>

        <div className="flex flex-col lg:flex-row gap-3">

          {/* SEARCH */}

          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tiket, nama, NIM, WhatsApp, atau program studi..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#10C35D] focus:ring-2 focus:ring-green-50 transition"
            />
          </div>

          {/* FILTER STATUS */}

          <div className="w-full lg:w-56">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 outline-none focus:border-[#10C35D] bg-white cursor-pointer"
            >
              <option value="semua">Semua Status</option>
              <option value="menunggu">Menunggu</option>
              <option value="diproses">Sedang Diproses</option>
              <option value="perlu_dilengkapi">Perlu Dilengkapi</option>
              <option value="selesai">Selesai</option>
            </select>
          </div>
        </div>

        {(search || filterStatus !== 'semua') && (
          <div className="flex items-center justify-between gap-3 mt-3">
            <p className="text-xs text-gray-500">
              Menampilkan hasil sesuai pencarian dan filter.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFilterStatus('semua');
              }}
              className="text-xs font-semibold text-[#0a3d2e] hover:text-[#10C35D]"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">

        {/* TABLE HEADER */}

        <div className="px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="font-bold text-[#0a3d2e]">
              Data Pengaduan Mahasiswa
            </h3>

            <p className="text-xs text-gray-500 mt-1">
              Daftar pengaduan yang masuk ke UPA Bahasa.
            </p>
          </div>

          <span className="text-xs font-semibold text-[#0a3d2e] bg-green-50 border border-green-100 rounded-lg px-3 py-2 w-fit">
            {filteredComplaints.length} Data
          </span>
        </div>

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1200px] table-fixed text-sm text-left">

            <colgroup>
              <col style={{ width: '55px' }} />
              <col style={{ width: '145px' }} />
              <col style={{ width: '175px' }} />
              <col style={{ width: '125px' }} />
              <col style={{ width: '145px' }} />
              <col style={{ width: '165px' }} />
              <col style={{ width: '155px' }} />
              <col style={{ width: '150px' }} />
            </colgroup>

            <thead className="bg-[#F7FAF8] text-gray-600 border-b border-gray-100">
              <tr>
                <th className="px-3 py-4 font-semibold">
                  No.
                </th>

                <th className="px-3 py-4 font-semibold">
                  Nomor Tiket
                </th>

                <th className="px-3 py-4 font-semibold">
                  Mahasiswa
                </th>

                <th className="px-3 py-4 font-semibold">
                  WhatsApp
                </th>

                <th className="px-3 py-4 font-semibold">
                  Kategori
                </th>

                <th className="px-3 py-4 font-semibold">
                  Tanggal
                </th>

                <th className="pl-2 pr-1 py-4 font-semibold">
                  Status
                </th>

                <th className="px-3 py-4 font-semibold text-center">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">

              {/* LOADING */}

              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-14">
                    <div className="w-8 h-8 rounded-full border-4 border-green-100 border-t-[#10C35D] animate-spin mx-auto mb-3" />

                    <p className="text-sm text-gray-500">
                      Memuat data pengaduan...
                    </p>
                  </td>
                </tr>

              ) : filteredComplaints.length === 0 ? (

                /* EMPTY STATE */

                <tr>
                  <td colSpan={8} className="py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                      <Inbox
                        size={26}
                        className="text-gray-300"
                      />
                    </div>

                    <p className="text-sm font-semibold text-gray-600">
                      Data pengaduan tidak ditemukan.
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Coba gunakan kata kunci atau filter yang berbeda.
                    </p>
                  </td>
                </tr>

              ) : (

                /* DATA ROWS */

                filteredComplaints.map((item, index) => {
                  const rawWhatsApp =
                    item.whatsapp ||
                    item.phone ||
                    item.no_whatsapp ||
                    '';

                  const whatsappNumber = formatWhatsApp(rawWhatsApp);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#F8FCF9] transition-colors"
                    >

                      {/* NOMOR */}

                      <td className="px-3 py-4 text-gray-400">
                        {index + 1}
                      </td>

                      {/* NOMOR TIKET */}

                      <td className="px-3 py-4">
                        <span className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-green-50 text-[#0a3d2e] text-xs font-bold whitespace-nowrap">
                          {item.ticket_number || '-'}
                        </span>
                      </td>

                      {/* MAHASISWA */}

                      <td className="px-3 py-4">
                        <p className="font-semibold text-gray-800 whitespace-nowrap">
                          {item.name || '-'}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          NIM: {item.nim || '-'}
                        </p>

                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.program_studi || '-'}
                        </p>
                      </td>

                      {/* WHATSAPP */}

                      <td className="px-3 py-4 whitespace-nowrap">
                        {rawWhatsApp ? (
                          <a
                            href={`https://wa.me/${whatsappNumber}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-700 hover:text-green-900 font-medium transition"
                            title="Hubungi melalui WhatsApp"
                          >
                            {rawWhatsApp}
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">
                            Belum tersedia
                          </span>
                        )}
                      </td>

                      {/* KATEGORI */}

                      <td className="px-3 py-4">
                        <p className="text-gray-700 font-medium">
                          {item.category || '-'}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          {item.layanan || '-'}
                        </p>
                      </td>

                      {/* TANGGAL */}

                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-gray-500">
                          <CalendarDays
                            size={14}
                            className="text-gray-400"
                          />

                          <span className="text-xs">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                      </td>

                      {/* STATUS */}

                      <td className="pl-2 pr-1 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-full border text-xs font-semibold whitespace-nowrap ${
                            statusStyles[item.status] ||
                            'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current" />

                          {statusLabels[item.status] || item.status || '-'}
                        </span>
                      </td>

                      {/* AKSI */}

                      <td className="px-3 py-4">
                        <div className="flex items-center justify-center gap-2 whitespace-nowrap">

                          {/* EDIT / LIHAT DETAIL */}
                          <button
                            type="button"
                            onClick={() => onView(item.id)}
                            disabled={saving}
                            title="Lihat Detail / Edit"
                            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition disabled:opacity-50"
                          >
                            <Edit size={16} />
                          </button>

                          {/* HAPUS */}
                          <button
                            type="button"
                            onClick={() =>
                              onDelete?.(
                                item.id,
                                item.ticket_number
                              )
                            }
                            disabled={saving}
                            title="Hapus Pengaduan"
                            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })
              )}

            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}

        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-xs text-gray-500">
            Menampilkan{' '}
            <span className="font-semibold text-gray-700">
              {filteredComplaints.length}
            </span>{' '}
            dari{' '}
            <span className="font-semibold text-gray-700">
              {complaints.length}
            </span>{' '}
            pengaduan.
          </p>

          <p className="text-xs text-gray-400">
            Data pengaduan UPA Bahasa POLNES
          </p>
        </div>

      </div>
    </div>
  );
}