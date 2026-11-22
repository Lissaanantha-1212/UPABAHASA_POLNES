
import React from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  BookOpen,
} from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  // ==========================================
  // DATA NAVIGASI
  // ==========================================

  const quickLinks = [
    { label: 'Beranda', link: '/' },
    { label: 'Tentang UPA Bahasa', link: '/tentang' },

    // Menunggu URL layanan tes dari EPD2
    { label: 'Layanan Tes', disabled: true },

    { label: 'Kursus Bahasa', link: '/layanan/kursus-inggris' },
    { label: 'E-Book', link: '/pembelajaran/e-book' },
    { label: 'Berita & Pengumuman', link: '/informasi/berita' },
  ];

  const userLinks = [
    { label: 'Kuis Bahasa', link: '/pembelajaran/kuis' },
    { label: 'Pengaduan', link: '/layanan-pengguna/pengaduan' },
    { label: 'Survei Kepuasan', link: '/layanan-pengguna/survei' },
  ];

  // ==========================================
  // GOOGLE MAPS
  // ==========================================

  const mapQuery = encodeURIComponent(
    'UPA Bahasa Politeknik Negeri Samarinda, Jl. Cipto Mangunkusumo, Samarinda Seberang, Kalimantan Timur'
  );

  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;

  const mapDirectionUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  // ==========================================
  // KOMPONEN ITEM NAVIGASI
  // ==========================================

  const renderNavigationItem = (item) => {
    const itemClass =
      'group inline-flex items-center gap-2 text-sm text-gray-300 transition-colors';

    if (item.disabled || !item.link) {
      return (
        <span
          className={`${itemClass} text-gray-500 cursor-not-allowed`}
        >
          <span className="w-1 h-1 rounded-full bg-[#10C35D] opacity-0" />
          {item.label}
        </span>
      );
    }

    return (
      <Link
        to={item.link}
        className={`${itemClass} hover:text-[#10C35D]`}
      >
        <span className="w-1 h-1 rounded-full bg-[#10C35D] opacity-0 group-hover:opacity-100 transition-opacity" />
        {item.label}
      </Link>
    );
  };

  // ==========================================
  // FOOTER
  // ==========================================

  return (
    <footer className="relative bg-[#0A3D2E] text-white overflow-hidden">

      {/* AKSEN GARIS HIJAU BAGIAN ATAS */}

      <div className="h-1.5 w-full bg-gradient-to-r from-[#10C35D] via-[#62D995] to-[#10C35D]" />

      {/* DEKORASI BACKGROUND */}

      <div className="absolute -top-32 -right-20 w-96 h-96 rounded-full border-[45px] border-white/[0.03] pointer-events-none" />

      <div className="absolute -bottom-40 -left-20 w-80 h-80 rounded-full bg-[#10C35D]/[0.05] blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-5 md:px-8 pt-14 pb-7">

        {/* ======================================
            BAGIAN UTAMA FOOTER
        ====================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8 mb-12">

          {/* KOLOM 1: IDENTITAS UPA BAHASA */}

          <div className="lg:col-span-4">

            <div className="flex items-center gap-3 mb-5">

              <div className="w-12 h-12 rounded-xl bg-[#10C35D]/15 border border-[#10C35D]/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-[#10C35D]" />
              </div>

              <div>
                <h3 className="text-lg font-bold tracking-wide text-white">
                  UPA BAHASA
                </h3>

                <p className="text-xs text-green-200 tracking-wider">
                  POLITEKNIK NEGERI SAMARINDA
                </p>
              </div>

            </div>

            <p className="text-gray-300 text-sm leading-relaxed max-w-sm">
              Pusat layanan dan pengembangan bahasa di Politeknik Negeri
              Samarinda yang mendukung peningkatan kemampuan bahasa
              mahasiswa dan sivitas akademika.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.06] border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#10C35D]" />

              <span className="text-xs text-green-100">
                Layanan Pengembangan Bahasa
              </span>
            </div>

          </div>

          {/* KOLOM 2: NAVIGASI */}

          <div className="lg:col-span-2">

            <h4 className="text-sm font-bold text-white mb-5">
              Navigasi
            </h4>

            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  {renderNavigationItem(item)}
                </li>
              ))}
            </ul>

          </div>

          {/* KOLOM 3: LAYANAN PENGGUNA */}

          <div className="lg:col-span-2">

            <h4 className="text-sm font-bold text-white mb-5">
              Layanan Pengguna
            </h4>

            <ul className="space-y-3">
              {userLinks.map((item) => (
                <li key={item.label}>
                  {renderNavigationItem(item)}
                </li>
              ))}
            </ul>

          </div>

          {/* KOLOM 4: KONTAK */}

          <div className="lg:col-span-4">

            <h4 className="text-sm font-bold text-white mb-5">
              Hubungi Kami
            </h4>

            <div className="space-y-4">

              {/* ALAMAT */}

              <div className="flex items-start gap-3">

                <div className="w-9 h-9 rounded-lg bg-[#10C35D]/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-[#10C35D]" />
                </div>

                <div>
                  <p className="text-xs text-green-200 mb-1">
                    Alamat
                  </p>

                  <p className="text-sm text-gray-300 leading-relaxed">
                    Jl. Cipto Mangunkusumo, Samarinda Seberang,
                    Kalimantan Timur.
                  </p>
                </div>

              </div>

              {/* EMAIL */}

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-[#10C35D]/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-[#10C35D]" />
                </div>

                <div>
                  <p className="text-xs text-green-200 mb-1">
                    Email
                  </p>

                  <a
                    href="mailto:upabahasa@polnes.ac.id"
                    className="text-sm text-gray-300 hover:text-[#10C35D] transition-colors"
                  >
                    upabahasa@polnes.ac.id
                  </a>
                </div>

              </div>

              {/* TELEPON */}

              <div className="flex items-center gap-3">

                <div className="w-9 h-9 rounded-lg bg-[#10C35D]/15 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4 text-[#10C35D]" />
                </div>

                <div>
                  <p className="text-xs text-green-200 mb-1">
                    Telepon
                  </p>

                  <a
                    href="tel:0541743584"
                    className="text-sm text-gray-300 hover:text-[#10C35D] transition-colors"
                  >
                    (0541) 743584
                  </a>
                </div>

              </div>

            </div>

          </div>

        </div>

        {/* ======================================
            GOOGLE MAPS
        ====================================== */}

        <div className="border-t border-white/10 pt-9 mb-9">

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-5">

            <div>
              <p className="text-[#10C35D] text-xs font-bold uppercase tracking-[0.15em] mb-2">
                Lokasi Kami
              </p>

              <h4 className="text-lg md:text-xl font-bold text-white">
                Temukan UPA Bahasa POLNES
              </h4>

              <p className="text-gray-400 text-sm mt-1">
                Kunjungi lokasi kami melalui Google Maps.
              </p>
            </div>

            <a
              href={mapDirectionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-[#10C35D] hover:bg-[#0DAA50] text-white text-sm font-semibold px-5 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5"
            >
              Petunjuk Arah
              <ExternalLink className="w-4 h-4" />
            </a>

          </div>

          {/* MAP CONTAINER */}

          <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-black/10">

            <iframe
              title="Lokasi UPA Bahasa POLNES"
              src={mapEmbedUrl}
              width="100%"
              height="260"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />

          </div>

        </div>

        {/* ======================================
            COPYRIGHT
        ====================================== */}

        <div className="border-t border-white/10 pt-6">

          <div className="flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left">

            <p className="text-xs text-gray-400 leading-relaxed">
              © {currentYear} UPA Bahasa Politeknik Negeri Samarinda.
              All rights reserved.
            </p>

            <p className="text-xs text-gray-400">
              Dikembangkan untuk Proyek Capstone
            </p>

          </div>

        </div>

      </div>
    </footer>
  );
}

export default Footer;
