
import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Download,
  Eye,
  Search,
  X,
  UserRound,
  FileText,
  ArrowUpRight,
  SlidersHorizontal,
  ChevronDown,
  BookCopy,
  Library,
  Sparkles,
} from 'lucide-react';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/ebooks';

const categories = [
  'Semua Kategori',
  'Bahasa Inggris',
  'Bahasa Mandarin',
  'Bahasa Indonesia',
  'Umum',
];

export default function Ebook() {
  const [ebooks, setEbooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] =
    useState('Semua Kategori');
  const [selectedBook, setSelectedBook] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ==========================================
  // AMBIL DATA E-BOOK DARI BACKEND
  // ==========================================

  const fetchEbooks = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(API_URL);
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil data E-Book.'
        );
      }

      setEbooks(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Gagal mengambil E-Book:', err);
      setError(
        'Data E-Book belum dapat dimuat. Silakan coba beberapa saat lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEbooks();
  }, []);

  // ==========================================
  // PENCARIAN DAN FILTER
  // ==========================================

  const filteredBooks = useMemo(() => {
    return ebooks.filter((book) => {
      const title = (book.title || '').toLowerCase();
      const keyword = searchTerm.toLowerCase().trim();

      const matchesSearch = title.includes(keyword);

      const matchesCategory =
        selectedCategory === 'Semua Kategori' ||
        book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [ebooks, searchTerm, selectedCategory]);

  // ==========================================
  // BUKA MATERI
  // ==========================================

  const handleReadBook = (book) => {
    if (!book.fileUrl) return;

    window.open(
      book.fileUrl,
      '_blank',
      'noopener,noreferrer'
    );
  };

  // ==========================================
  // UNDUH PDF
  // ==========================================

  const handleDownloadBook = async (book) => {
    if (!book.fileUrl || book.accessType !== 'file') return;

    try {
      const response = await fetch(book.fileUrl);

      if (!response.ok) {
        throw new Error('File PDF tidak dapat diunduh.');
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${book.title || 'ebook'}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Gagal mengunduh PDF:', err);

      // Alternatif jika unduhan langsung gagal
      window.open(
        book.fileUrl,
        '_blank',
        'noopener,noreferrer'
      );
    }
  };

  // ==========================================
  // RESET FILTER
  // ==========================================

  const resetFilter = () => {
    setSearchTerm('');
    setSelectedCategory('Semua Kategori');
  };

  // ==========================================
  // TUTUP MODAL
  // ==========================================

  const closeModal = () => {
    setSelectedBook(null);
  };

  return (
    <main className="min-h-screen bg-[#F7FAF8] pb-20">

      {/* =====================================
          HERO SECTION
      ====================================== */}

      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0A3D2E] via-[#105B40] to-[#0A3D2E] text-white">
  <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[#10C35D]/15 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#10C35D]/10 blur-3xl" />

  <div className="relative mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-20">
    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white/90">
      <BookOpen size={14} />
      PEMBELAJARAN DAN PUBLIKASI
    </span>

    <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
      Katalog E-Book
    </h1>

    <p className="mt-1 text-2xl font-extrabold text-[#10C35D] md:text-3xl">
      UPA Bahasa POLNES
    </p>

    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/90 md:text-base">
      Temukan berbagai bahan bacaan digital untuk mendukung
      pembelajaran dan meningkatkan kemampuan berbahasa.
    </p>
  </div>
</section>

      {/* =====================================
          KATALOG E-BOOK
      ====================================== */}

      <section
        id="katalog-ebook"
        className="max-w-7xl mx-auto px-5 md:px-8 pt-14 md:pt-16 relative"
      >

        {/* SECTION HEADING */}

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">

          <div>
            <div className="flex items-center gap-2 text-[#10C35D] text-xs font-bold uppercase tracking-[0.15em] mb-3">
              <span className="w-7 h-[2px] bg-[#10C35D]" />
              Perpustakaan Digital
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d2e] mb-2">
              Jelajahi Koleksi E-Book
            </h2>

            <p className="text-sm text-gray-500 max-w-xl leading-relaxed">
              Temukan bahan bacaan sesuai kebutuhan dan bidang
              pembelajaran yang ingin kamu pelajari.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 self-start md:self-auto px-4 py-2.5 rounded-xl bg-[#EAF7EE] text-[#0a3d2e] text-xs font-semibold">
            <Library size={16} className="text-[#10C35D]" />
            {ebooks.length} Koleksi Tersedia
          </div>

        </div>

        {/* SEARCH AND FILTER */}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-5 mb-8">

          <div className="flex flex-col md:flex-row gap-3">

            {/* SEARCH */}

            <div className="relative flex-1">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari judul E-Book..."
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-[#F7FAF8] border border-gray-200 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition-all focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/10"
              />
            </div>

            {/* CATEGORY FILTER */}

            <div className="relative md:w-64">
              <SlidersHorizontal
                size={17}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-[#10C35D] pointer-events-none"
              />

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-12 pl-11 pr-10 rounded-xl bg-[#F7FAF8] border border-gray-200 text-sm text-gray-700 outline-none appearance-none cursor-pointer focus:border-[#10C35D] focus:ring-2 focus:ring-[#10C35D]/10"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={16}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>

          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">

            <p className="text-xs text-gray-500">
              Menampilkan{' '}
              <span className="font-bold text-[#0a3d2e]">
                {filteredBooks.length}
              </span>{' '}
              dari {ebooks.length} E-Book
            </p>

            {(searchTerm ||
              selectedCategory !== 'Semua Kategori') && (
              <button
                onClick={resetFilter}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#10C35D] hover:text-[#0a3d2e] transition-colors"
              >
                <X size={14} />
                Reset Filter
              </button>
            )}

          </div>
        </div>

        {/* =====================================
            DAFTAR E-BOOK
        ====================================== */}

        {loading ? (

          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <div className="w-10 h-10 mx-auto border-4 border-[#EAF7EE] border-t-[#10C35D] rounded-full animate-spin mb-4" />

            <p className="text-sm text-gray-500">
              Memuat koleksi E-Book...
            </p>
          </div>

        ) : error ? (

          <div className="bg-white rounded-2xl border border-red-100 py-16 px-5 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <BookCopy size={29} />
            </div>

            <h3 className="text-lg font-bold text-[#0a3d2e] mb-2">
              Gagal Memuat E-Book
            </h3>

            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              {error}
            </p>

            <button
              onClick={fetchEbooks}
              className="px-5 py-2.5 rounded-xl bg-[#10C35D] text-white text-sm font-semibold hover:bg-[#0DAA50] transition-colors"
            >
              Coba Lagi
            </button>

          </div>

        ) : filteredBooks.length > 0 ? (

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">

            {filteredBooks.map((book) => (

              <article
                key={book.id}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-green-900/10 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >

                {/* COVER */}

                <div
                  className="relative h-64 overflow-hidden bg-[#EAF4ED] cursor-pointer"
                  onClick={() => setSelectedBook(book)}
                >

                  <img
                    src={book.cover || 'https://placehold.co/700x900/EAF4ED/0a3d2e?text=E-Book'}
                    alt={`Sampul ${book.title}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://placehold.co/700x900/EAF4ED/0a3d2e?text=E-Book';
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#06291f]/50 via-transparent to-transparent" />

                  <span className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm text-[#0a3d2e] text-[10px] font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {book.category || 'Umum'}
                  </span>

                  <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/90 text-[#10C35D] flex items-center justify-center shadow-sm">
                    <BookOpen size={17} />
                  </div>

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                    <span className="text-white text-xs font-medium drop-shadow">
                      Koleksi UPA Bahasa
                    </span>

                    <div className="w-9 h-9 rounded-full bg-white text-[#10C35D] flex items-center justify-center shadow-md opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <ArrowUpRight size={18} />
                    </div>
                  </div>

                </div>

                {/* CONTENT */}

                <div className="p-5 md:p-6 flex flex-col flex-grow">

                  <h3 className="font-bold text-[#0a3d2e] text-lg leading-snug mb-3 line-clamp-2 group-hover:text-[#10C35D] transition-colors">
                    {book.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">

                    <div className="w-8 h-8 rounded-full bg-[#EAF7EE] flex items-center justify-center text-[#10C35D]">
                      <UserRound size={15} />
                    </div>

                    <div>
                      <p className="text-[10px] text-gray-400">
                        Penulis
                      </p>

                      <span className="font-medium text-gray-600">
                        {book.author}
                      </span>
                    </div>

                  </div>

                  <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 flex-grow mb-5">
                    {book.description}
                  </p>

                  <div className="pt-4 border-t border-gray-100">

                    <button
                      onClick={() => setSelectedBook(book)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border border-[#DCEFE2] bg-[#EAF7EE] text-[#0a3d2e] font-semibold text-sm hover:bg-[#10C35D] hover:text-white hover:border-[#10C35D] transition-all duration-300 group/detail"
                    >
                      <Eye size={16} />
                      Lihat Detail
                      <ArrowUpRight size={15} className="ml-auto" />
                    </button>

                  </div>

                </div>
              </article>

            ))}

          </div>

        ) : (

          /* EMPTY STATE */

          <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 px-5 text-center">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#EAF7EE] text-[#10C35D] flex items-center justify-center mb-4">
              <BookCopy size={29} />
            </div>

            <h3 className="text-lg font-bold text-[#0a3d2e] mb-2">
              {ebooks.length === 0
                ? 'Belum Ada E-Book'
                : 'E-Book Tidak Ditemukan'}
            </h3>

            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-5">
              {ebooks.length === 0
                ? 'Koleksi E-Book belum tersedia. Silakan kunjungi kembali halaman ini nanti.'
                : 'Belum ada E-Book yang sesuai dengan pencarian atau kategori yang kamu pilih.'}
            </p>

            {(searchTerm ||
              selectedCategory !== 'Semua Kategori') && (
              <button
                onClick={resetFilter}
                className="px-5 py-2.5 rounded-xl bg-[#10C35D] text-white text-sm font-semibold hover:bg-[#0DAA50] transition-colors"
              >
                Tampilkan Semua E-Book
              </button>
            )}

          </div>

        )}

        {/* INFORMATION NOTE */}

        <div className="mt-12 rounded-2xl border border-[#DCEFE2] bg-[#EFF8F1] p-5 md:p-6 flex flex-col sm:flex-row items-start gap-4">

          <div className="w-11 h-11 shrink-0 rounded-xl bg-white flex items-center justify-center text-[#10C35D] shadow-sm">
            <Sparkles size={21} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#0a3d2e] mb-1">
              Sumber Belajar Digital
            </h3>

            <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
              Koleksi E-Book ini disediakan sebagai bahan pendukung
              pembelajaran bahasa. Ketersediaan materi dan file
              dapat diperbarui oleh Admin UPA Bahasa.
            </p>
          </div>

        </div>

      </section>

      {/* =====================================
          MODAL DETAIL E-BOOK
      ====================================== */}

      {selectedBook && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#061F17]/75 backdrop-blur-sm"
          onClick={closeModal}
        >

          <div
            className="relative bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >

            {/* CLOSE BUTTON */}

            <button
              onClick={closeModal}
              aria-label="Tutup detail E-Book"
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/95 shadow-md flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-500 transition-colors"
            >
              <X size={19} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-5">

              {/* BOOK COVER */}

              <div className="md:col-span-2 bg-[#EAF4ED] min-h-[260px] md:min-h-[430px] relative">

                <img
                  src={selectedBook.cover || 'https://placehold.co/700x900/EAF4ED/0a3d2e?text=E-Book'}
                  alt={`Sampul ${selectedBook.title}`}
                  className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://placehold.co/700x900/EAF4ED/0a3d2e?text=E-Book';
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#06291f]/40 via-transparent to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 text-white">
                  <span className="text-xs font-medium drop-shadow">
                    Koleksi E-Book
                  </span>
                </div>

              </div>

              {/* BOOK INFORMATION */}

              <div className="md:col-span-3 p-6 md:p-8 flex flex-col">

                <div className="mb-6">

                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#10C35D] bg-[#EAF7EE] px-3 py-1.5 rounded-full mb-4">
                    <BookOpen size={13} />
                    {selectedBook.category || 'Umum'}
                  </span>

                  <h2 className="text-2xl md:text-3xl font-bold text-[#0a3d2e] leading-tight mb-4">
                    {selectedBook.title}
                  </h2>

                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <UserRound size={16} className="text-[#10C35D]" />
                    <span>{selectedBook.author}</span>
                  </div>

                </div>

                <div className="border-t border-gray-100 pt-5 mb-6">

                  <h3 className="text-sm font-bold text-[#0a3d2e] mb-3 flex items-center gap-2">
                    <FileText size={17} className="text-[#10C35D]" />
                    Deskripsi E-Book
                  </h3>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {selectedBook.description || 'Tidak ada deskripsi.'}
                  </p>

                </div>

                {/* ACTION BUTTONS */}

                <div className="mt-auto space-y-3">

                  {selectedBook.accessType === 'link' ? (

                    <button
                      onClick={() => handleReadBook(selectedBook)}
                      disabled={!selectedBook.fileUrl}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#10C35D] text-white text-sm font-bold hover:bg-[#0DAA50] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      <ArrowUpRight size={17} />
                      Buka Materi
                    </button>

                  ) : (

                    <>
                      <button
                        onClick={() => handleReadBook(selectedBook)}
                        disabled={!selectedBook.fileUrl}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#10C35D] text-white text-sm font-bold hover:bg-[#0DAA50] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                      >
                        <Eye size={17} />
                        Baca Online
                      </button>

                      <button
                        onClick={() => handleDownloadBook(selectedBook)}
                        disabled={!selectedBook.fileUrl}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[#F1F5F2] text-[#0a3d2e] text-sm font-bold hover:bg-[#E5EFE8] transition-all disabled:text-gray-400 disabled:cursor-not-allowed"
                      >
                        <Download size={17} />
                        Unduh PDF
                      </button>
                    </>
                  )}

                  {!selectedBook.fileUrl && (
                    <p className="text-[11px] text-center text-gray-400">
                      Materi belum tersedia.
                    </p>
                  )}

                </div>

              </div>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
