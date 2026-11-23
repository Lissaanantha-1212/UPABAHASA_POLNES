
import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  FileText,
  MessageCircle,
  Newspaper,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Languages,
  UsersRound,
  Building2
} from 'lucide-react';
import NewsModal from './informasi-pages/components/NewsModal';
import {
  normalizeCmsPost,
  isNewContent,
} from './informasi-pages/utils/informasiUtils';

// ==========================================
// IMPORT ASSETS
// ==========================================

const CMS_API = 'https://upabahasa-polnes-4p4a.vercel.app/api/cms';
const HOME_CACHE_KEY = 'upa_cms_home_cache';

function readHomeCache() {
  try {
    const cached = localStorage.getItem(HOME_CACHE_KEY);
    if (!cached) return null;

    const data = JSON.parse(cached);

    if (
      !data ||
      !Array.isArray(data.settings) ||
      !Array.isArray(data.posts) ||
      !Array.isArray(data.galleries)
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

function getCmsImage(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `https://upabahasa-polnes-4p4a.vercel.app${path}`;
}

function formatCmsDate(value) {
  if (!value) return '-';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  });
}

// ==========================================
// REUSABLE BUTTON STYLES
// ==========================================

const primaryButton =
  "group inline-flex items-center justify-center gap-2 min-h-[46px] flex-1 sm:flex-none px-4 sm:px-7 py-3 rounded-xl bg-gradient-to-r from-[#0A8F4D] to-[#10C35D] text-white text-xs sm:text-sm font-semibold tracking-wide shadow-[0_6px_18px_rgba(10,143,77,0.20)] hover:shadow-[0_10px_25px_rgba(10,143,77,0.28)] hover:-translate-y-1 hover:from-[#087A41] hover:to-[#0DAA50] active:translate-y-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/20 whitespace-nowrap";

const secondaryButton =
  "group inline-flex items-center justify-center gap-2 min-h-[46px] flex-1 sm:flex-none px-4 sm:px-7 py-3 rounded-xl bg-white/90 backdrop-blur-sm border border-[#0A3D2E]/15 text-[#0A3D2E] text-xs sm:text-sm font-semibold tracking-wide shadow-sm hover:bg-[#EAF8EF] hover:border-[#10C35D]/50 hover:text-[#087A41] hover:-translate-y-1 hover:shadow-md active:translate-y-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/20 whitespace-nowrap";

const outlineButton =
  "group inline-flex items-center justify-center gap-3 min-h-[46px] px-6 py-3 rounded-xl border border-[#0A8F4D]/30 bg-white text-[#0A8F4D] text-sm font-semibold tracking-wide hover:bg-[#0A8F4D] hover:border-[#0A8F4D] hover:text-white hover:-translate-y-0.5 hover:shadow-[0_7px_18px_rgba(10,143,77,0.16)] active:translate-y-0 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/20";

// ==========================================
// HOME COMPONENT
// ==========================================

function Home() {
  // Mengambil fungsi pembuka dropdown dari MainLayout
  const { openLayananDropdown } = useOutletContext();

  const [homeData, setHomeData] = useState(() =>
    readHomeCache() || {
      hero: null,
      settings: [],
      posts: [],
      galleries: [],
    }
  );

  const [hasHomeCache, setHasHomeCache] = useState(() =>
    Boolean(readHomeCache())
  );

  const [homeLoading, setHomeLoading] = useState(() =>
    !readHomeCache()
  );

  const [homeError, setHomeError] = useState('');
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [selectedNews, setSelectedNews] = useState(null);
  const [loadingNewsDetail, setLoadingNewsDetail] = useState(false);
  const [newsDetailError, setNewsDetailError] = useState('');

  const openNewsDetail = async (item) => {
    setSelectedNews(item);
    setLoadingNewsDetail(true);
    setNewsDetailError('');

    try {
      const response = await fetch(
        `${CMS_API}/posts/${encodeURIComponent(item.slug || '')}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil detail informasi.'
        );
      }

      setSelectedNews(normalizeCmsPost(result.data));
    } catch (error) {
      console.error('Gagal mengambil detail berita:', error);
      setNewsDetailError(
        error.message || 'Gagal mengambil detail informasi.'
      );
    } finally {
      setLoadingNewsDetail(false);
    }
  };

  const closeNewsDetail = () => {
    setSelectedNews(null);
    setNewsDetailError('');
    setLoadingNewsDetail(false);
  };

  const touchStartX = useRef(null);

  const changeNews = (direction) => {
    if (news.length <= 1) return;

    setActiveNewsIndex((current) =>
      (current + direction + news.length) % news.length
    );
  };

  const handleNewsTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleNewsTouchEnd = (event) => {
    if (touchStartX.current === null) return;

    const difference =
      touchStartX.current - event.changedTouches[0].clientX;

    if (Math.abs(difference) > 45) {
      changeNews(difference > 0 ? 1 : -1);
    }

    touchStartX.current = null;
  };

  useEffect(() => {
    let active = true;

    fetch(`${CMS_API}/home`)
      .then(async (response) => {
        const result = await response.json();

        if (!response.ok || result.success === false) {
          throw new Error(result.message || 'Gagal mengambil konten Beranda.');
        }

        return result;
      })
      .then((result) => {
        if (active) {
          const nextHomeData = {
            hero: result.data?.hero || null,
            settings: result.data?.settings || [],
            posts: result.data?.posts || [],
            galleries: result.data?.galleries || [],
          };

          setHomeData(nextHomeData);
          setHasHomeCache(true);

          try {
            localStorage.setItem(
              HOME_CACHE_KEY,
              JSON.stringify(nextHomeData)
            );
          } catch (cacheError) {
            console.warn('Cache Beranda tidak dapat disimpan:', cacheError);
          }
        }
      })
      .catch((error) => {
        console.error('Gagal memuat konten Beranda:', error);
        if (active && !hasHomeCache) {
          setHomeError(error.message || 'Konten Beranda gagal dimuat.');
        }
      })
      .finally(() => {
        if (active) setHomeLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const settingsMap = Object.fromEntries(
    homeData.settings.map((item) => [
      item.setting_key,
      item.setting_value || '',
    ])
  );

  const heroTitle = settingsMap.beranda_hero_title || '';
  const heroDescription = settingsMap.beranda_hero_description || '';
  const profileTitle = settingsMap.beranda_profil_title || '';
  const profileDescription = settingsMap.beranda_profil_description || '';
  const heroImage = getCmsImage(homeData.hero?.image_path);
  const profileImage = getCmsImage(settingsMap.beranda_profil_image);

  const news = homeData.posts.map((item) => {
    const category = String(item.category || 'Berita');
    const isAnnouncement = category.toLowerCase().includes('pengumuman');

    return {
      id: item.id,
      image: getCmsImage(item.image),
      date: formatCmsDate(item.published_at || item.created_at),
      publishedAt: item.published_at || item.created_at,
      title: item.title,
      summary: item.summary || '',
      category,
      link: isAnnouncement
        ? `/informasi/pengumuman`
        : `/informasi/berita`,
      slug: item.slug,
    };
  });

  const visibleNews = (() => {
    if (news.length === 0) return [];

    if (news.length >= 5) {
      return [-2, -1, 0, 1, 2].map((offset) => ({
        item: news[(activeNewsIndex + offset + news.length) % news.length],
        offset,
      }));
    }

    return news
      .map((item, index) => {
        let offset = index - activeNewsIndex;

        if (offset > news.length / 2) {
          offset -= news.length;
        }

        if (offset < -news.length / 2) {
          offset += news.length;
        }

        return { item, offset };
      })
      .sort((a, b) => a.offset - b.offset);
  })();

  const gallery = homeData.galleries.map((item) => ({
    id: item.id,
    image: getCmsImage(item.image),
    alt: item.title || 'Dokumentasi kegiatan UPA Bahasa',
    title: item.title,
    description: item.description || '',
    date: formatCmsDate(item.event_date),
  }));

  // ==========================================
  // QUICK ACCESS - PERMANEN
  // ==========================================

  const quickServices = [
    {
      id: 'layanan-tes',
      icon: BookOpen,
      title: 'Layanan Tes',
      description: 'TOEFL, TOEIC, SSPECT',
      link: '/layanan/kursus-inggris',
    },
    {
      id: 'kursus-bahasa',
      icon: GraduationCap,
      title: 'Layanan Non-Tes',
      description: 'Inggris, Mandarin, JSST',
      link: '/layanan/kursus-inggris',
    },
    {
      id: 'ebook',
      icon: FileText,
      title: 'E-Book',
      description: 'Bahan Pembelajaran',
      link: '/pembelajaran/e-book',
    },
    {
      id: 'pengaduan',
      icon: MessageCircle,
      title: 'Pengaduan',
      description: 'Saran dan Keluhan',
      link: '/layanan-pengguna/pengaduan',
    },
    {
      id: 'informasi',
      icon: Newspaper,
      title: 'Informasi',
      description: 'Berita dan Pengumuman',
      link: '/informasi/berita',
    },
  ];

  // ==========================================
  // ABOUT FEATURES
  // ==========================================

  const aboutFeatures = [
    {
      icon: Languages,
      title: 'Program Bahasa',
      description: 'Beragam program pembelajaran'
    },
    {
      icon: UsersRound,
      title: 'Pengembangan',
      description: 'Peningkatan kompetensi bahasa'
    },
    {
      icon: Building2,
      title: 'Layanan Terpadu',
      description: 'Layanan untuk sivitas akademika'
    }
  ];

  return (
    <main className="w-full overflow-hidden bg-white">

      {/* ==========================================
          1. HERO SECTION
      ========================================== */}

      <section className="relative min-h-[430px] sm:min-h-[400px] md:min-h-[440px] lg:min-h-[470px] flex items-center bg-white overflow-hidden">

        <div className="absolute inset-0">

          {heroImage && (
            <img
              src={heroImage}
              alt="Gedung Politeknik Negeri Samarinda"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
              className="absolute top-0 bottom-0 left-0 sm:left-[3%] w-full sm:w-[110%] h-full max-w-none object-cover object-[62%_center] sm:object-center"
            />
          )}

          <div className="absolute inset-0 bg-[#092F27]/25 sm:bg-[#092F27]/40" />

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.99) 27%, rgba(255,255,255,0.93) 39%, rgba(255,255,255,0.76) 51%, rgba(255,255,255,0.32) 68%, rgba(255,255,255,0.04) 88%, transparent 100%)'
            }}
          />

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(0deg, rgba(255,255,255,0.12) 0%, transparent 25%, transparent 80%, rgba(255,255,255,0.08) 100%)'
            }}
          />

        </div>

        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-5 md:px-8 py-8 sm:py-12 md:py-14 lg:py-16">

          <div className="max-w-[540px] sm:max-w-[540px]">

            {homeLoading ? (
              <p className="py-8 text-sm text-gray-500">
                Memuat konten Beranda...
              </p>
            ) : homeError ? (
              <p role="alert" className="py-8 text-sm text-red-700">
                Konten Beranda gagal dimuat. Silakan coba beberapa saat lagi.
              </p>
            ) : (
              <>
                {heroTitle && (
                  <h1 className="font-extrabold text-[27px] leading-[1.12] sm:text-4xl md:text-[44px] lg:text-[40px] tracking-tight text-[#0A3D2E] mb-3 sm:mb-4">
                    {heroTitle}
                  </h1>
                )}

                {heroDescription && (
                  <p className="text-gray-600 text-[13px] sm:text-sm md:text-base leading-[1.65] sm:leading-[1.8] max-w-[460px] mb-5 sm:mb-6">
                    {heroDescription}
                  </p>
                )}
              </>
            )}

            <div className="flex w-full max-w-[440px] items-center gap-2 sm:gap-4">

              {/* TOMBOL MEMBUKA DROPDOWN LAYANAN */}

              <button
                type="button"
                onClick={openLayananDropdown}
                className={primaryButton}
              >
                <span>Jelajahi Layanan</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
              </button>

              <a
                href="/tentang"
                className={secondaryButton}
              >
                <span>Tentang Kami</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
              </a>

            </div>

          </div>

        </div>

      </section>

      {/* ==========================================
          2. QUICK ACCESS - WHITE
      ========================================== */}

      <section className="relative z-20 px-4 sm:px-5 md:px-8 -mt-5 sm:-mt-7 md:-mt-8 pb-4 bg-white">

        <div className="max-w-7xl mx-auto">

          <div className="bg-white rounded-2xl border border-[#E7EFE9] shadow-[0_12px_35px_rgba(10,61,46,0.09)] p-2 sm:px-3 sm:py-2 md:px-4 md:py-3">

            {quickServices.length > 0 ? (
              <div
                className="grid grid-cols-5 gap-1 sm:gap-2"
              >
                {quickServices.map((service, index) => {
                  const Icon = service.icon;

                  return (
                    <a
                      key={service.id || `${service.title}-${index}`}
                      href={service.link}
                      className={`
                        group relative flex flex-col items-center text-center gap-1 sm:flex-row sm:text-left sm:gap-2 md:gap-3
                        px-1 py-2 sm:px-2 sm:py-3 md:px-3 md:py-4
                        rounded-xl hover:bg-[#F3F8F4] min-w-0
                        transition-all duration-300
                        ${index !== 0 ? 'xl:border-l xl:border-[#E9EFEB]' : ''}
                      `}
                    >
                      <div className="w-7 h-7 sm:w-9 sm:h-9 md:w-11 md:h-11 shrink-0 flex items-center justify-center rounded-lg sm:rounded-xl bg-[#EAF8EF] text-[#0A8F4D] group-hover:bg-[#0A8F4D] group-hover:text-white group-hover:scale-105 transition-all duration-300">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 md:w-[22px] md:h-[22px]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[9px] leading-tight sm:text-xs md:text-[13px] font-bold text-[#183D2E] sm:mb-1 group-hover:text-[#0A8F4D] transition-colors duration-300 line-clamp-2">
                          {service.title}
                        </h3>
                        <p className="hidden md:block text-[9px] sm:text-[10px] md:text-[11px] text-gray-500 leading-relaxed">
                          {service.description}
                        </p>
                      </div>

                      <ArrowUpRight className="hidden xl:block w-4 h-4 shrink-0 text-[#0A8F4D] opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" />
                    </a>
                  );
                })}
              </div>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                Belum ada layanan unggulan yang ditampilkan.
              </p>
            )}

          </div>

        </div>

      </section>

      {/* ==========================================
          3. NEWS & ANNOUNCEMENTS
      ========================================== */}

      <section className="relative py-14 md:py-16 bg-white overflow-hidden">

        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#10C35D]/[0.06] rounded-full blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-5 md:px-8">

          <div className="text-center max-w-2xl mx-auto mb-9">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#10C35D] mb-3">
              Berita & Pengumuman Terbaru
            </h2>

            <p className="text-gray-600 text-sm md:text-base font-bold leading-[1.8]">
              Temukan informasi terbaru mengenai kegiatan, layanan,
              dan pengumuman dari UPA Bahasa POLNES.
            </p>
          </div>

          {homeLoading ? (
            <p className="py-10 text-center text-sm text-gray-500">
              Memuat berita dan pengumuman...
            </p>
          ) : homeError ? (
            <p role="alert" className="py-10 text-center text-sm text-red-700">
              Berita dan pengumuman gagal dimuat.
            </p>
          ) : news.length > 0 ? (
            <>
              <div
                className="relative max-w-6xl mx-auto"
                style={{
                  perspective: '1200px',
                  transformStyle: 'preserve-3d',
                }}
                onTouchStart={handleNewsTouchStart}
                onTouchEnd={handleNewsTouchEnd}
              >

                <div className="relative min-h-[475px] md:min-h-[500px] overflow-hidden">

                  {visibleNews.map(({ item, offset }) => {
                    const distance = Math.abs(offset);
                    const scale =
                      distance === 0 ? 1 :
                      distance === 1 ? 0.88 : 0.76;

                    const rotation =
                      offset === 0 ? 0 :
                      offset < 0 ? 13 : -13;

                    const depth =
                      distance === 0 ? 60 :
                      distance === 1 ? 0 : -60;

                    const opacity =
                      distance === 0 ? 1 :
                      distance === 1 ? 0.88 : 0.62;

                    return (
                      <article
                        key={item.id}
                        className="
                          absolute top-0
                          w-[min(320px,74vw)]
                          flex flex-col
                          bg-white rounded-2xl overflow-hidden
                          border border-[#E4EDE6]
                          shadow-[0_12px_35px_rgba(10,61,46,0.16)]
                          transition-all duration-700
                          ease-[cubic-bezier(0.22,1,0.36,1)]
                          will-change-transform
                        "
                        style={{
                          left: `calc(50% + ${offset * 19}%)`,
                          transform: `translateX(-50%) scale(${scale}) rotateY(${rotation}deg) translateZ(${depth}px)`,
                          transformOrigin: 'center center',
                          zIndex: 10 - distance,
                          opacity,
                          pointerEvents: 'auto',
                          backfaceVisibility: 'hidden',
                        }}
                      >

                        <button
                          type="button"
                          onClick={() => openNewsDetail(item)}
                          className="relative block w-full h-[210px] overflow-hidden text-left"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              onError={(event) => {
                                event.currentTarget.style.display = 'none';
                              }}
                              className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#EAF5EE]" aria-label="Gambar berita tidak tersedia" />
                          )}

                          <span className="absolute bottom-4 left-4 bg-white text-[#0A8F4D] text-[10px] font-bold tracking-wide px-3 py-2 rounded-md shadow-sm">
                            {item.category.toUpperCase()}
                          </span>

                          {isNewContent({ publishedAt: item.publishedAt }) && (
                            <span className="absolute top-4 right-4 bg-[#10C35D] text-white text-[10px] font-extrabold tracking-wider px-3 py-1.5 rounded-full shadow-md">
                              BARU
                            </span>
                          )}
                        </button>

                        <div className="flex flex-col flex-1 p-5">

                          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
                            <CalendarDays className="w-4 h-4" />
                            <span>{item.date}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => openNewsDetail(item)}
                            className="text-left"
                          >
                            <h3 className="font-bold text-[#0A3D2E] leading-snug mb-3 line-clamp-2 min-h-[48px] hover:text-[#10A653] transition-colors text-base">
                              {item.title}
                            </h3>
                          </button>

                          <p className="text-gray-500 text-sm leading-[1.8] line-clamp-2 mb-5">
                            {item.summary}
                          </p>

                          <div className="mt-auto pt-4 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => openNewsDetail(item)}
                              className="inline-flex items-center gap-2 text-[#0A8F4D] font-bold text-xs hover:text-[#10C35D] transition-colors"
                            >
                              Baca Selengkapnya
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      </article>
                    );
                  })}

                </div>

                <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-10 md:w-24 bg-gradient-to-r from-white via-white/80 to-transparent" />

                <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 md:w-24 bg-gradient-to-l from-white via-white/80 to-transparent" />

              </div>

              {/* NEWS PAGINATION */}

              {news.length > 1 && (
                <div className="mt-6 flex items-center justify-center gap-4 sm:gap-5">

                  <button
                    type="button"
                    onClick={() => changeNews(-1)}
                    aria-label="Berita sebelumnya"
                    className="!w-11 !h-11 !min-w-11 !min-h-11 !p-0 shrink-0 rounded-full flex items-center justify-center bg-white border border-[#D7E9DD] text-[#0A8F4D] shadow-[0_3px_12px_rgba(10,61,46,0.05)] hover:bg-[#0A8F4D] hover:border-[#0A8F4D] hover:text-white hover:shadow-[0_5px_15px_rgba(10,143,77,0.20)] hover:-translate-x-0.5 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/20"
                  >
                    <ArrowLeft className="w-[18px] h-[18px]" />
                  </button>

                  <div
                    className="flex items-center justify-center gap-1.5 min-w-[52px]"
                    aria-live="polite"
                    aria-label={`Halaman ${activeNewsIndex + 1} dari ${news.length}`}
                  >
                    <span className="text-sm font-extrabold text-[#0A8F4D] tabular-nums">
                      {String(activeNewsIndex + 1).padStart(2, '0')}
                    </span>

                    <span className="text-xs text-gray-300 font-medium">/</span>

                    <span className="text-sm font-semibold text-gray-400 tabular-nums">
                      {String(news.length).padStart(2, '0')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => changeNews(1)}
                    aria-label="Berita berikutnya"
                    className="!w-11 !h-11 !min-w-11 !min-h-11 !p-0 shrink-0 rounded-full flex items-center justify-center bg-white border border-[#D7E9DD] text-[#0A8F4D] shadow-[0_3px_12px_rgba(10,61,46,0.05)] hover:bg-[#0A8F4D] hover:border-[#0A8F4D] hover:text-white hover:shadow-[0_5px_15px_rgba(10,143,77,0.20)] hover:translate-x-0.5 active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#10C35D]/20"
                  >
                    <ArrowRight className="w-[18px] h-[18px]" />
                  </button>

                </div>
              )}

            </>
          ) : (
            <p className="py-10 text-center text-sm text-gray-500">
              Belum ada berita atau pengumuman yang diterbitkan.
            </p>
          )}

          <div className="flex justify-center mt-9">
            <a href="/informasi/berita" className={outlineButton}>
              <span>Lihat Semua Berita</span>
              <span className="w-7 h-7 rounded-full bg-[#EAF8EF] flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
              </span>
            </a>
          </div>

        </div>
      </section>

      {/* ==========================================
          4. ABOUT UPA BAHASA
      ========================================== */}

      <section className="relative py-14 md:py-20 bg-[#EAF5EE] overflow-hidden">

        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-[#10C35D]/[0.10] blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-[#A4E878]/[0.12] blur-[110px]" />

        <div className="relative max-w-6xl mx-auto px-5 md:px-8">

          {/* PERUBAHAN: sm:grid-cols-2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 rounded-3xl overflow-hidden shadow-[0_18px_45px_rgba(10,61,46,0.13)]">

            <div className="relative min-h-[300px] md:min-h-[420px]">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Kegiatan dan lingkungan UPA Bahasa POLNES"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-[#DDEBE1]" aria-label="Gambar profil belum tersedia" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A3D2E]/30 to-transparent" />
            </div>

            <div className="relative bg-[#063D30] text-white px-6 py-9 sm:px-9 md:px-11 md:py-12 overflow-hidden">

              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#10C35D]/20 blur-[80px]" />

              <div className="relative">

                <p className="text-[#7DE6A5] font-bold text-xs md:text-sm uppercase tracking-[0.16em] mb-4">
                  Tentang UPA Bahasa
                </p>

                {homeLoading ? (
                  <p className="text-white/70 text-sm">Memuat profil UPA Bahasa...</p>
                ) : homeError ? (
                  <p role="alert" className="text-white/80 text-sm">Konten profil belum dapat dimuat.</p>
                ) : (
                  <>
                    {profileTitle && (
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-5">
                        {profileTitle}
                      </h2>
                    )}
                    {profileDescription && (
                      <p className="text-white/75 text-sm md:text-[15px] leading-[1.9] mb-8">
                        {profileDescription}
                      </p>
                    )}
                  </>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-9">
                  {aboutFeatures.map((feature, index) => {
                    const Icon = feature.icon;

                    return (
                      <div key={index} className="flex flex-col gap-3">
                        <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-[#7DE6A5]">
                          <Icon className="w-5 h-5" />
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-white mb-1">
                            {feature.title}
                          </h3>
                          <p className="text-xs text-white/60 leading-relaxed">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <a
                  href="/tentang"
                  className="group inline-flex items-center justify-center gap-3 min-h-[46px] px-6 py-3 rounded-xl bg-white text-[#0A3D2E] text-sm font-bold hover:bg-[#DDF7E5] hover:-translate-y-0.5 transition-all duration-300"
                >
                  <span>Selengkapnya Tentang Kami</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform duration-300" />
                </a>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          5. GALLERY
      ========================================== */}

      <section className="relative py-14 md:py-16 bg-white overflow-hidden">

        <div className="absolute -top-32 -right-20 w-96 h-96 rounded-full bg-[#10C35D]/[0.07] blur-[110px]" />

        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[#A4E878]/[0.10] blur-[100px]" />

        <div className="relative max-w-7xl mx-auto px-5 md:px-8">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-9">

            <div>

              <p className="text-[#0A8F4D] font-bold text-xs md:text-sm uppercase tracking-[0.15em] mb-3">
                Dokumentasi
              </p>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0A3D2E]">
                Galeri Kegiatan UPA Bahasa
              </h2>

              <p className="text-gray-500 text-sm mt-2 leading-relaxed">
                Dokumentasi kegiatan dan aktivitas UPA Bahasa POLNES.
              </p>

            </div>

            <a
              href="/galeri"
              className="group inline-flex items-center justify-center gap-3 min-h-[46px] px-6 py-3 rounded-xl border border-[#0A8F4D]/20 bg-white text-[#0A3D2E] text-sm font-semibold shadow-[0_4px_15px_rgba(10,61,46,0.05)] hover:bg-[#0A8F4D] hover:text-white hover:-translate-y-0.5 transition-all duration-300"
            >
              <span>Lihat Semua Galeri</span>

              <span className="w-7 h-7 rounded-full bg-[#EAF8EF] flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300">
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform duration-300" />
              </span>
            </a>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-[1fr_1.08fr_1fr] items-center gap-5 lg:gap-4 max-w-6xl mx-auto">

            {homeLoading ? (
              <p className="col-span-full py-10 text-center text-sm text-gray-500">
                Memuat galeri...
              </p>
            ) : homeError ? (
              <p role="alert" className="col-span-full py-10 text-center text-sm text-red-700">
                Galeri gagal dimuat.
              </p>
            ) : gallery.length > 0 ? (
              gallery.slice(0, 3).map((item, index) => {

                const isCenter = index === 1;

                return (
                  <a
                    key={index}
                    href="/galeri"
                    className={`group relative block bg-white rounded-2xl overflow-hidden border border-[#E8EFEA] transition-all duration-500 ${
                      isCenter
                        ? "shadow-[0_12px_35px_rgba(10,61,46,0.13)] z-10"
                        : "shadow-[0_5px_20px_rgba(10,61,46,0.07)] hover:shadow-[0_12px_28px_rgba(10,61,46,0.13)] hover:-translate-y-1"
                    }`}
                  >

                    <div
                      className={`relative overflow-hidden ${
                        isCenter
                          ? "h-[250px] md:h-[280px]"
                          : "h-[225px] md:h-[250px]"
                      }`}
                    >

                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.alt}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#EAF5EE]" aria-label="Gambar galeri tidak tersedia" />
                      )}

                      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/70 to-transparent" />

                      <div className="absolute top-4 left-4">
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-white/80 text-[#0A3D2E] text-[9px] md:text-[10px] font-bold tracking-wider uppercase shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10C35D]" />
                          Dokumentasi UPA
                        </span>
                      </div>

                    </div>

                    <div
                      className={`relative bg-white ${
                        isCenter
                          ? "px-5 pt-1 pb-6 md:px-6"
                          : "px-4 pt-1 pb-5 md:px-5"
                      }`}
                    >

                      <h3
                        className={`font-bold text-[#0A3D2E] leading-snug mb-3 line-clamp-2 group-hover:text-[#0A8F4D] transition-colors duration-300 ${
                          isCenter
                            ? "text-base md:text-lg"
                            : "text-sm md:text-base"
                        }`}
                      >
                        {item.title}
                      </h3>

                      <p className="text-gray-500 text-xs md:text-sm leading-relaxed line-clamp-2">
                        {item.description || "Dokumentasi kegiatan dan aktivitas UPA Bahasa POLNES."}
                      </p>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#0A3D2E]/10">

                        <div className="flex items-center gap-2 text-gray-400 text-xs">
                          <CalendarDays className="w-4 h-4" />
                          <span>{item.date}</span>
                        </div>

                        <span className="w-8 h-8 rounded-full bg-[#EAF8EF] flex items-center justify-center text-[#0A8F4D] group-hover:bg-[#0A8F4D] group-hover:text-white group-hover:translate-x-1 transition-all duration-300">
                          <ArrowUpRight className="w-4 h-4" />
                        </span>

                      </div>

                    </div>

                  </a>
                );
              })
            ) : (
              <p className="col-span-full py-10 text-center text-sm text-gray-500">
                Belum ada dokumentasi galeri.
              </p>
            )}

          </div>

        </div>

      </section>

      {selectedNews && (
        <NewsModal
          item={selectedNews}
          isNew={isNewContent(selectedNews)}
          onClose={closeNewsDetail}
          loadingDetail={loadingNewsDetail}
          detailError={newsDetailError}
        />
      )}

    </main>
  );
}

export default Home;
