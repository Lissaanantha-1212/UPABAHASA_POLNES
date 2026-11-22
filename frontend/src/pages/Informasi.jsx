
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Newspaper,
  Megaphone,
  HelpCircle,
  X,
  Search,
  Info,
  ArrowUpRight,
  FileText,
  SlidersHorizontal,
  MessageCircleQuestion,
} from 'lucide-react';

import useInformasiData from './informasi-pages/hooks/useInformasiData';
import { isNewContent } from './informasi-pages/utils/informasiUtils';

import EmptyState from './informasi-pages/components/EmptyState';
import FaqItem from './informasi-pages/components/FaqItem';
import NewsCard from './informasi-pages/components/NewsCard';
import NewsModal from './informasi-pages/components/NewsModal';

const tabs = [
  { id: 'berita', label: 'Berita', icon: Newspaper },
  { id: 'pengumuman', label: 'Pengumuman', icon: Megaphone },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
];

// Kategori FAQ yang selalu tersedia.
const defaultFaqTopics = [
  'Layanan Non-Tes',
  'Pendaftaran',
  'Jadwal',
  'Pengaduan',
  'Layanan Tes',
];

export default function Informasi() {
  const location = useLocation();

  const {
    news,
    announcements,
    faqs,
    loadingPosts,
    loadingFaqs,
    postsError,
    faqsError,
    fetchPostBySlug,
    loadingDetail,
    detailError,
    refreshPosts,
    refreshFaqs,
  } = useInformasiData();

  const detailRequestId = useRef(0);

  const [activeTab, setActiveTab] = useState('berita');
  const [selectedNews, setSelectedNews] = useState(null);

  // Pencarian setiap tab dipisahkan.
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [announcementSearchQuery, setAnnouncementSearchQuery] = useState('');
  const [faqSearchQuery, setFaqSearchQuery] = useState('');

  const [faqFilter, setFaqFilter] = useState('Semua');
  const [openFaqId, setOpenFaqId] = useState(null);

  const searchQuery =
    activeTab === 'berita'
      ? newsSearchQuery
      : activeTab === 'pengumuman'
        ? announcementSearchQuery
        : faqSearchQuery;

  const setActiveSearchQuery =
    activeTab === 'berita'
      ? setNewsSearchQuery
      : activeTab === 'pengumuman'
        ? setAnnouncementSearchQuery
        : setFaqSearchQuery;

  const handleOpenNews = async (item) => {
    const requestId = ++detailRequestId.current;
    setSelectedNews(item);

    if (!item.slug) return;

    try {
      const detail = await fetchPostBySlug(item.slug);

      if (detailRequestId.current === requestId) {
        setSelectedNews(detail);
      }
    } catch {
      // Pesan kesalahan ditampilkan melalui detailError dari hook.
    }
  };

  const handleCloseNews = () => {
    detailRequestId.current += 1;
    setSelectedNews(null);
  };

  // Menyesuaikan tab dengan alamat halaman.
  useEffect(() => {
    const path = location.pathname.toLowerCase();

    if (path.includes('pengumuman')) {
      setActiveTab('pengumuman');
    } else if (path.includes('faq')) {
      setActiveTab('faq');
    } else {
      setActiveTab('berita');
    }

    setNewsSearchQuery('');
    setAnnouncementSearchQuery('');
    setFaqSearchQuery('');
    setFaqFilter('Semua');
    setOpenFaqId(null);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Menutup modal dengan tombol Escape.
  useEffect(() => {
    if (!selectedNews) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleCloseNews();
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNews]);

  // Menggabungkan kategori dari database dengan kategori bawaan.
  const topics = useMemo(() => {
    const existingTopics = faqs
      .map((item) => item.topic)
      .filter(Boolean);

    return [
      'Semua',
      ...new Set([...defaultFaqTopics, ...existingTopics]),
    ];
  }, [faqs]);

  // Data berita dan pengumuman tetap dipisahkan.
  const currentPosts =
    activeTab === 'berita' ? news : announcements;

  // Pencarian khusus berita atau pengumuman.
  const filteredNews = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return currentPosts.filter((item) => {
      const searchableTitle = (item.title || '').toLowerCase();

      return !query || searchableTitle.includes(query);
    });
  }, [currentPosts, searchQuery]);

  // Pencarian FAQ berdasarkan pertanyaan, jawaban, dan topik.
  const filteredFaq = useMemo(() => {
    const query = faqSearchQuery.trim().toLowerCase();

    return faqs.filter((item) => {
      const matchesTopic =
        faqFilter === 'Semua' || item.topic === faqFilter;

      const searchableText = [
        item.question,
        item.answer,
        item.topic,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesTopic && matchesSearch;
    });
  }, [faqs, faqFilter, faqSearchQuery]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setOpenFaqId(null);
    setFaqFilter('Semua');
  };

  const handleClearSearch = () => {
    setActiveSearchQuery('');
  };

  return (
    <main className="min-h-screen bg-[#F7FAF8] pb-20">
      {/* HERO */}
<section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0A3D2E] via-[#105B40] to-[#0A3D2E] text-white">
  <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[#10C35D]/15 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#10C35D]/10 blur-3xl" />

  <div className="relative mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-20">
    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white/90">
      <Info size={14} />
      PUSAT INFORMASI
    </span>

    <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
      Informasi
    </h1>

    <p className="mt-1 text-2xl font-extrabold text-[#10C35D] md:text-3xl">
      UPA Bahasa POLNES
    </p>

    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/90 md:text-base">
      Temukan berita, pengumuman resmi, dan jawaban atas pertanyaan seputar
      layanan UPA Bahasa POLNES.
    </p>
  </div>
</section>

      <div className="relative z-10 mx-auto -mt-7 max-w-7xl px-5 md:px-8">
        {/* TAB NAVIGATION */}
        <div className="mb-8 rounded-2xl border border-gray-100 bg-white p-2 shadow-[0_12px_35px_rgba(10,61,46,0.08)]">
          <div className="grid grid-cols-3 gap-1.5">
            {tabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  aria-pressed={isActive}
                  className={`group flex min-h-12 items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10C35D] focus-visible:ring-offset-2 sm:text-sm ${
                    isActive
                      ? 'bg-[#10C35D] text-white shadow-md shadow-[#10C35D]/20'
                      : 'text-gray-600 hover:bg-[#F1F8F3] hover:text-[#0a3d2e]'
                  }`}
                >
                  <TabIcon size={17} className="shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION HEADING */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#10C35D]">
              {activeTab === 'faq'
                ? 'BANTUAN & PERTANYAAN'
                : 'PUSAT INFORMASI'}
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#0a3d2e] md:text-3xl">
              {activeTab === 'berita'
                ? 'Berita UPA Bahasa'
                : activeTab === 'pengumuman'
                  ? 'Pengumuman UPA Bahasa'
                  : 'Pertanyaan yang Sering Diajukan'}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              {activeTab === 'faq'
                ? 'Cari informasi dan jawaban mengenai layanan UPA Bahasa.'
                : 'Jelajahi informasi dan aktivitas UPA Bahasa POLNES.'}
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            {activeTab === 'faq' ? (
              <MessageCircleQuestion size={16} />
            ) : (
              <FileText size={16} />
            )}

            <span>
              {activeTab === 'faq'
                ? `${filteredFaq.length} pertanyaan ditemukan`
                : `${filteredNews.length} konten ditemukan`}
            </span>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setActiveSearchQuery(event.target.value)
              }
              placeholder={
                activeTab === 'faq'
                  ? 'Cari pertanyaan atau jawaban...'
                  : activeTab === 'berita'
                    ? 'Cari berita...'
                    : 'Cari pengumuman...'
              }
              aria-label={
                activeTab === 'faq'
                  ? 'Cari pertanyaan FAQ'
                  : activeTab === 'berita'
                    ? 'Cari berita'
                    : 'Cari pengumuman'
              }
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#10C35D] focus:ring-4 focus:ring-[#10C35D]/10"
            />
          </div>

          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-xs font-semibold text-[#0a3d2e] transition hover:bg-white sm:self-auto"
            >
              <X size={14} /> Hapus pencarian
            </button>
          )}
        </div>

        {/* NEWS & ANNOUNCEMENTS */}
        {(activeTab === 'berita' || activeTab === 'pengumuman') && (
          <section
            aria-label={
              activeTab === 'berita'
                ? 'Daftar berita'
                : 'Daftar pengumuman'
            }
          >
            {loadingPosts ? (
              <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center text-sm text-gray-500">
                Memuat {activeTab}...
              </div>
            ) : postsError ? (
              <div className="rounded-2xl border border-red-100 bg-white px-6 py-10 text-center">
                <p className="text-sm text-red-600">{postsError}</p>

                <button
                  type="button"
                  onClick={refreshPosts}
                  className="mt-4 rounded-lg bg-[#10C35D] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0eaa50]"
                >
                  Coba lagi
                </button>
              </div>
            ) : filteredNews.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredNews.map((item) => (
                  <NewsCard
                    key={item.id}
                    item={item}
                    isNew={isNewContent(item)}
                    onOpen={() => handleOpenNews(item)}
                    showCategory={activeTab === 'berita'}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Search}
                title={`Belum ada ${activeTab} yang sesuai`}
                description="Coba gunakan kata kunci lain atau hapus pencarian untuk melihat semua konten."
                onReset={handleClearSearch}
                showReset={Boolean(searchQuery)}
              />
            )}
          </section>
        )}

        {/* FAQ */}
        {activeTab === 'faq' && (
          <section aria-label="Daftar pertanyaan yang sering diajukan">
            <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <SlidersHorizontal size={15} />
              Filter berdasarkan topik
            </div>

            <div className="mb-6 flex flex-wrap gap-2">
              {topics.map((topic) => {
                const isActive = faqFilter === topic;

                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => {
                      setFaqFilter(topic);
                      setOpenFaqId(null);
                    }}
                    aria-pressed={isActive}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10C35D] focus-visible:ring-offset-2 sm:text-sm ${
                      isActive
                        ? 'border-[#10C35D] bg-[#10C35D] text-white shadow-sm'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-[#10C35D]/50 hover:bg-[#F1F8F3] hover:text-[#0a3d2e]'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>

            {loadingFaqs ? (
              <div className="rounded-2xl border border-gray-100 bg-white px-6 py-14 text-center text-sm text-gray-500">
                Memuat daftar pertanyaan...
              </div>
            ) : faqsError ? (
              <div className="rounded-2xl border border-red-100 bg-white px-6 py-10 text-center">
                <p className="text-sm text-red-600">{faqsError}</p>

                <button
                  type="button"
                  onClick={refreshFaqs}
                  className="mt-4 rounded-lg bg-[#10C35D] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0eaa50]"
                >
                  Coba lagi
                </button>
              </div>
            ) : filteredFaq.length > 0 ? (
              <div className="mx-auto max-w-4xl space-y-3">
                {filteredFaq.map((item, index) => (
                  <FaqItem
                    key={item.id}
                    item={item}
                    index={index}
                    isOpen={openFaqId === item.id}
                    onToggle={() =>
                      setOpenFaqId((current) =>
                        current === item.id ? null : item.id
                      )
                    }
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={HelpCircle}
                title="Pertanyaan tidak ditemukan"
                description="Coba kata kunci atau topik lain untuk menemukan jawaban yang dicari."
                onReset={() => {
                  setFaqSearchQuery('');
                  setFaqFilter('Semua');
                }}
                showReset={
                  Boolean(faqSearchQuery) || faqFilter !== 'Semua'
                }
              />
            )}

            <div className="mx-auto mt-8 flex max-w-4xl flex-col items-start justify-between gap-3 rounded-2xl border border-[#10C35D]/15 bg-white p-5 sm:flex-row sm:items-center md:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F8EE] text-[#10C35D]">
                  <MessageCircleQuestion size={20} />
                </span>

                <div>
                  <h3 className="font-bold text-[#0a3d2e]">
                    Belum menemukan jawaban?
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Sampaikan pertanyaan atau kendala melalui halaman Layanan Pengguna.
                  </p>
                </div>
              </div>

              <a
                href="/layanan-pengguna/pengaduan"
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#10C35D] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0eaa50] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#10C35D] focus-visible:ring-offset-2"
              >
                Hubungi Kami <ArrowUpRight size={16} />
              </a>
            </div>
          </section>
        )}
      </div>

      {/* MODAL DETAIL BERITA */}
      {selectedNews && (
        <NewsModal
          item={selectedNews}
          isNew={isNewContent(selectedNews)}
          onClose={handleCloseNews}
          loadingDetail={loadingDetail}
          detailError={detailError}
        />
      )}
    </main>
  );
}


