import React, { useEffect, useState } from 'react';
import { CalendarDays, Image as ImageIcon, X, ZoomIn, ArrowLeft, ArrowRight } from 'lucide-react';

const CMS_API = 'http://localhost:5000/api/cms';

function getCmsImage(path) {
  if (!path) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `http://localhost:5000${path}`;
}

function formatCmsDate(value) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Makassar',
  });
}

function Galeri() {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchGalleries() {
      try {
        const response = await fetch(`${CMS_API}/galleries`);
        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Gagal memuat galeri kegiatan.');
        }

        if (active) {
          setGalleries(Array.isArray(result.data) ? result.data : []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Terjadi kesalahan saat memuat galeri.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchGalleries();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedImage) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedImage(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedImage]);

  return (
    <main className="min-h-screen bg-white">
      {/* HEADER */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0A3D2E] via-[#105B40] to-[#0A3D2E] text-white">
        <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[#10C35D]/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#10C35D]/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-20">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white/90">
            <ImageIcon size={14} />
            DOKUMENTASI KEGIATAN
          </span>

          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Galeri Kegiatan
          </h1>

          <p className="mt-1 text-2xl font-extrabold text-[#10C35D] md:text-3xl">
            UPA Bahasa POLNES
          </p>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/90 md:text-base">
            Kumpulan dokumentasi kegiatan, program, dan berbagai aktivitas
            UPA Bahasa Politeknik Negeri Samarinda.
          </p>
        </div>
      </section>

      {/* GALERI */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-14 md:py-20">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-9">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#0A8F4D] mb-2">
              Arsip Dokumentasi
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#0A3D2E]">
              Momen dan Aktivitas
            </h2>
          </div>

          {!loading && !error && galleries.length > 0 && (
            <p className="text-sm text-gray-500">
              {galleries.length} dokumentasi kegiatan
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="aspect-[4/3] rounded-2xl bg-[#F1F5F2] animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="py-16 px-6 text-center rounded-2xl border border-red-100 bg-red-50">
            <p className="font-semibold text-red-700 mb-2">
              Galeri belum dapat dimuat
            </p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : galleries.length === 0 ? (
          <div className="py-20 px-6 text-center rounded-2xl border border-dashed border-[#CFE3D4] bg-[#F8FBF9]">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-[#EAF8EF] flex items-center justify-center text-[#0A8F4D]">
              <ImageIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-[#0A3D2E] mb-2">
              Belum Ada Dokumentasi
            </h3>
            <p className="max-w-md mx-auto text-sm text-gray-500 leading-relaxed">
              Dokumentasi kegiatan UPA Bahasa akan ditampilkan di halaman ini
              setelah ditambahkan melalui pengelolaan konten.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleries.map((item) => {
              const imageUrl = getCmsImage(item.image);

              return (
                <article
                  key={item.id}
                  className="group overflow-hidden rounded-2xl bg-white border border-[#E5EEE8] hover:border-[#B8DFC5] shadow-[0_5px_20px_rgba(10,61,46,0.04)] hover:shadow-[0_14px_32px_rgba(10,61,46,0.11)] transition-all duration-300"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedImage(item)}
                    className="relative block w-full aspect-[4/3] overflow-hidden bg-[#F1F5F2] text-left"
                    aria-label={`Lihat foto ${item.title || 'kegiatan UPA Bahasa'}`}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title || 'Dokumentasi kegiatan UPA Bahasa'}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#8BAA96]">
                        <ImageIcon className="w-10 h-10" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-[#062B20]/45 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <span className="absolute right-4 bottom-4 w-10 h-10 rounded-full bg-white/95 text-[#0A8F4D] flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <ZoomIn className="w-5 h-5" />
                    </span>
                  </button>

                  <div className="p-5">
                    {item.event_date && (
                      <div className="flex items-center gap-2 text-xs text-[#0A8F4D] font-medium mb-3">
                        <CalendarDays className="w-4 h-4" />
                        <span>{formatCmsDate(item.event_date)}</span>
                      </div>
                    )}

                    <h3 className="font-bold text-[#0A3D2E] text-base leading-snug mb-2">
                      {item.title || 'Dokumentasi Kegiatan'}
                    </h3>

                    {item.description && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                        {item.description}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* DETAIL FOTO */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-[#041B14]/90 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          onClick={() => setSelectedImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Detail foto galeri"
        >
          <button
            type="button"
            onClick={() => setSelectedImage(null)}
            className="absolute top-5 right-5 z-10 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            aria-label="Tutup detail foto"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="w-full max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={getCmsImage(selectedImage.image)}
              alt={selectedImage.title || 'Dokumentasi kegiatan UPA Bahasa'}
              className="max-w-full max-h-[68vh] object-contain rounded-xl shadow-2xl"
            />

            <div className="w-full max-w-3xl text-center mt-5">
              <h3 className="text-white text-lg md:text-xl font-bold mb-2">
                {selectedImage.title || 'Dokumentasi Kegiatan'}
              </h3>

              {selectedImage.event_date && (
                <p className="text-[#A9E9BF] text-xs mb-3">
                  {formatCmsDate(selectedImage.event_date)}
                </p>
              )}

              {selectedImage.description && (
                <p className="text-white/75 text-sm leading-relaxed">
                  {selectedImage.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Galeri;


