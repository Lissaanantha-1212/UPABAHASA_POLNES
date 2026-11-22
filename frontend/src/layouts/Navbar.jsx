
import React, { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import logoPolnes from '../assets/logo-polnes.png';

const EPD2_URLS = {
  toefl: null,
  sspect: null,
  toeic: null,
};

const menus = [
  {
    name: 'Layanan',
    label: 'Layanan',
    basePath: '/layanan',
    position: 'left-0',
    width: 'w-64',
    sections: [
      {
        title: 'Layanan Tes',
        items: [
          { label: 'TOEFL Prediction', href: EPD2_URLS.toefl || '#', external: true },
          { label: 'SSPECT', href: EPD2_URLS.sspect || '#', external: true },
          { label: 'TOEIC', href: EPD2_URLS.toeic || '#', external: true },
        ],
      },
      {
        title: 'Layanan Non-Tes',
        items: [
          { label: 'Kursus Bahasa Inggris', href: '/layanan/kursus-inggris' },
          { label: 'Kursus Bahasa Mandarin', href: '/layanan/kursus-mandarin' },
          { label: 'Job Seeking Skills Training', href: '/layanan/jsst' },
        ],
      },
    ],
  },
  {
    name: 'Informasi',
    label: 'Informasi',
    basePath: '/informasi',
    position: 'left-0',
    width: 'w-56',
    items: [
      { label: 'Berita', href: '/informasi/berita' },
      { label: 'Pengumuman', href: '/informasi/pengumuman' },
      { label: 'FAQ', href: '/informasi/faq' },
    ],
  },
  {
    name: 'Pembelajaran',
    label: 'Pembelajaran',
    basePath: '/pembelajaran',
    position: 'right-0',
    width: 'w-56',
    items: [
      { label: 'E-Book', href: '/pembelajaran/e-book' },
      { label: 'Kuis / Latihan Soal', href: '/pembelajaran/kuis' },
      { label: 'Publikasi', href: '/pembelajaran/publikasi' },
    ],
  },
  {
    name: 'LayananPengguna',
    label: 'Layanan Pengguna',
    basePath: '/layanan-pengguna',
    position: 'right-0',
    width: 'w-56',
    items: [
      { label: 'Pengaduan', href: '/layanan-pengguna/pengaduan' },
      { label: 'Tracking Pengaduan', href: '/layanan-pengguna/tracking' },
      { label: 'Survei Kepuasan', href: '/layanan-pengguna/survei' },
    ],
  },
];

// ==========================================
// DROPDOWN DESKTOP
// ==========================================

function DropdownMenu({
  menu,
  currentPath,
  activeDropdown,
  setActiveDropdown,
}) {
  const isActive =
    currentPath === menu.basePath ||
    currentPath.startsWith(menu.basePath + '/');

  const isOpen = activeDropdown === menu.name;

  return (
    <div
      className="relative"
      onMouseEnter={() => setActiveDropdown(menu.name)}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() =>
          setActiveDropdown(isOpen ? null : menu.name)
        }
        className={`relative flex items-center gap-1 font-medium text-sm transition-colors whitespace-nowrap ${
          isActive || isOpen
            ? 'text-[#10C35D]'
            : 'text-gray-700 hover:text-[#10C35D]'
        }`}
      >
        {menu.label}

        <svg
          className={`w-3 h-3 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>

        <span
          className={`absolute -bottom-1.5 left-0 w-full h-0.5 bg-[#10C35D] transition-opacity ${
            isActive || isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full ${menu.position} ${menu.width} pt-2 z-[60]`}
        >
          <div className="bg-white shadow-lg rounded-md border border-gray-100 py-2 overflow-hidden">
            {menu.sections ? (
              menu.sections.map((section, index) => (
                <div key={section.title}>
                  {index > 0 && (
                    <div className="my-2 border-t border-gray-100" />
                  )}

                  <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {section.title}
                  </div>

                  {section.items.map((item) => (
                    <DropdownItem
                      key={item.label}
                      item={item}
                      onClose={() => setActiveDropdown(null)}
                    />
                  ))}
                </div>
              ))
            ) : (
              menu.items.map((item) => (
                <DropdownItem
                  key={item.label}
                  item={item}
                  onClose={() => setActiveDropdown(null)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ITEM DROPDOWN DESKTOP
// ==========================================

function DropdownItem({ item, onClose }) {
  const baseClass = 'block px-4 py-2 text-sm transition-colors';

  if (item.disabled || !item.href || item.href === '#') {
    return (
      <span className={`${baseClass} text-gray-400 cursor-not-allowed`}>
        {item.label}
      </span>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className={`${baseClass} text-gray-700 hover:bg-gray-50 hover:text-[#10C35D]`}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      to={item.href}
      onClick={onClose}
      className={`${baseClass} text-gray-700 hover:bg-gray-50 hover:text-[#10C35D]`}
    >
      {item.label}
    </Link>
  );
}

// ==========================================
// ITEM DROPDOWN MOBILE
// ==========================================

function MobileDropdownItem({ item, onClose }) {
  const baseClass =
    'block w-full px-5 py-3 text-sm transition-colors';

  if (item.disabled || !item.href || item.href === '#') {
    return (
      <span className={`${baseClass} text-gray-400 cursor-not-allowed`}>
        {item.label}
      </span>
    );
  }

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className={`${baseClass} text-gray-600 hover:bg-gray-50 hover:text-[#10C35D]`}
      >
        {item.label}
      </a>
    );
  }

  return (
    <Link
      to={item.href}
      onClick={onClose}
      className={`${baseClass} text-gray-600 hover:bg-gray-50 hover:text-[#10C35D]`}
    >
      {item.label}
    </Link>
  );
}

// ==========================================
// NAVBAR UTAMA
// ==========================================

function Navbar({
  activeDropdown,
  setActiveDropdown,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  activeMobileDropdown,
  setActiveMobileDropdown,
}) {
  const location = useLocation();

  // Tutup menu ketika halaman berubah
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setActiveMobileDropdown(null);
    setActiveDropdown(null);
  }, [
    location.pathname,
    setIsMobileMenuOpen,
    setActiveMobileDropdown,
    setActiveDropdown,
  ]);

  // Tutup seluruh menu mobile
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setActiveMobileDropdown(null);
  };

  // Cek halaman aktif
  const isActivePath = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="w-full relative z-50">

      {/* ======================================
          TOP BAR
      ====================================== */}

      <div className="bg-[#10C35D] text-white py-2.5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-2">
          <div className="flex flex-col md:flex-row gap-3 md:gap-8 text-xs md:text-sm text-white/90">
            <span className="flex items-center gap-2">
              Jl. Cipto Mangunkusumo, Samarinda Seberang
            </span>

            <span className="flex items-center gap-2">
              upabahasa@polnes.ac.id
            </span>

            <span className="flex items-center gap-2">
              (0541) 743584
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-white">ID</span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300 hover:text-white cursor-pointer transition-colors">
              EN
            </span>
          </div>
        </div>
      </div>

      {/* ======================================
          NAVBAR UTAMA
      ====================================== */}

      <div
        id="main-navbar"
        className="bg-white shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex justify-between items-center gap-5">

          {/* LOGO */}

          <Link
            to="/"
            onClick={() => {
              setActiveDropdown(null);
              closeMobileMenu();
            }}
            className="flex items-center gap-3 flex-shrink-0"
          >
            <img
              src={logoPolnes}
              alt="Logo POLNES"
              className="w-12 h-12 object-contain"
            />

            <div className="flex flex-col">
              <span className="text-[#0a3d2e] font-bold text-xl leading-tight tracking-tight">
                UPA BAHASA
              </span>

              <span className="text-[#10c35d] text-[10px] leading-tight tracking-wider font-medium">
                POLITEKNIK NEGERI SAMARINDA
              </span>
            </div>
          </Link>

          {/* ======================================
              NAVIGASI DESKTOP
          ====================================== */}

          <nav className="hidden md:flex gap-5 lg:gap-6 items-center">

            {/* BERANDA */}

            <div className="relative">
              <Link
                to="/"
                onClick={() => setActiveDropdown(null)}
                className={`relative font-medium text-sm transition-colors whitespace-nowrap uppercase tracking-wide ${
                  isActivePath('/')
                    ? 'text-[#10C35D]'
                    : 'text-gray-700 hover:text-[#10C35D]'
                }`}
              >
                Beranda

                <span
                  className={`absolute -bottom-1.5 left-0 w-full h-0.5 bg-[#10C35D] transition-opacity ${
                    isActivePath('/') ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </Link>
            </div>

            {/* TENTANG */}

            <div className="relative">
              <Link
                to="/tentang"
                onClick={() => setActiveDropdown(null)}
                className={`relative font-medium text-sm transition-colors whitespace-nowrap uppercase tracking-wide ${
                  isActivePath('/tentang')
                    ? 'text-[#10C35D]'
                    : 'text-gray-700 hover:text-[#10C35D]'
                }`}
              >
                Tentang

                <span
                  className={`absolute -bottom-1.5 left-0 w-full h-0.5 bg-[#10C35D] transition-opacity ${
                    isActivePath('/tentang') ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </Link>
            </div>

            {/* GALERI */}

            <div className="relative">
              <Link
                to="/galeri"
                onClick={() => setActiveDropdown(null)}
                className={`relative font-medium text-sm transition-colors whitespace-nowrap uppercase tracking-wide ${
                  isActivePath('/galeri')
                    ? 'text-[#10C35D]'
                    : 'text-gray-700 hover:text-[#10C35D]'
                }`}
              >
                Galeri
                <span
                  className={`absolute -bottom-1.5 left-0 w-full h-0.5 bg-[#10C35D] transition-opacity ${
                    isActivePath('/galeri') ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </Link>
            </div>

            {/* DROPDOWN DESKTOP */}

            {menus.map((menu) => (
              <DropdownMenu
                key={menu.name}
                menu={menu}
                currentPath={location.pathname}
                activeDropdown={activeDropdown}
                setActiveDropdown={setActiveDropdown}
              />
            ))}
          </nav>

          {/* ======================================
              TOMBOL HAMBURGER MOBILE
          ====================================== */}

          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen((prev) => !prev);
              setActiveMobileDropdown(null);
            }}
            aria-label={
              isMobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'
            }
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-md text-gray-700 hover:bg-gray-100 hover:text-[#10C35D] transition-colors"
          >
            {isMobileMenuOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* ======================================
            MENU MOBILE
        ====================================== */}

        {isMobileMenuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Navigasi mobile"
            className="md:hidden bg-white border-t border-gray-100 shadow-lg"
          >
            <div className="max-w-7xl mx-auto px-4 py-3">

              {/* BERANDA MOBILE */}

              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`block px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActivePath('/')
                    ? 'text-[#10C35D] bg-green-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Beranda
              </Link>

              {/* TENTANG MOBILE */}

              <Link
                to="/tentang"
                onClick={closeMobileMenu}
                className={`block px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActivePath('/tentang')
                    ? 'text-[#10C35D] bg-green-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tentang UPA Bahasa
              </Link>

              {/* GALERI MOBILE */}

              <Link
                to="/galeri"
                onClick={closeMobileMenu}
                className={`block px-3 py-3 text-sm font-medium rounded-md transition-colors ${
                  isActivePath('/galeri')
                    ? 'text-[#10C35D] bg-green-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Galeri
              </Link>

              {/* DROPDOWN MOBILE */}

              {menus.map((menu) => {
                const isOpen = activeMobileDropdown === menu.name;

                const isActive =
                  location.pathname === menu.basePath ||
                  location.pathname.startsWith(menu.basePath + '/');

                const menuItems = menu.sections
                  ? menu.sections.flatMap((section) => section.items)
                  : menu.items;

                return (
                  <div
                    key={menu.name}
                    className="border-t border-gray-100"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setActiveMobileDropdown(
                          isOpen ? null : menu.name
                        )
                      }
                      aria-expanded={isOpen}
                      className={`w-full flex items-center justify-between px-3 py-3 text-sm font-medium transition-colors ${
                        isActive || isOpen
                          ? 'text-[#10C35D]'
                          : 'text-gray-700 hover:text-[#10C35D]'
                      }`}
                    >
                      {menu.label}

                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {isOpen && (
                      <div className="pb-2">

                        {menu.sections ? (
                          menu.sections.map((section) => (
                            <div key={section.title}>
                              <div className="px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                                {section.title}
                              </div>

                              {section.items.map((item) => (
                                <MobileDropdownItem
                                  key={item.label}
                                  item={item}
                                  onClose={closeMobileMenu}
                                />
                              ))}
                            </div>
                          ))
                        ) : (
                          menuItems.map((item) => (
                            <MobileDropdownItem
                              key={item.label}
                              item={item}
                              onClose={closeMobileMenu}
                            />
                          ))
                        )}

                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          </nav>
        )}
      </div>
    </header>
  );
}

export default Navbar;
