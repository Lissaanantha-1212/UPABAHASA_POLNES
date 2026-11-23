
import React, { useState, useLayoutEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

function MainLayout() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState(null);

  // Mengatur viewport agar halaman publik menggunakan layout desktop
  useLayoutEffect(() => {
    const viewport = document.querySelector('meta[name="viewport"]');

    if (!viewport) return;

    // Simpan pengaturan viewport sebelumnya
    const originalViewport = viewport.getAttribute('content');

    const screenWidth = window.screen.width;
    const isMobile = screenWidth <= 767;

    if (isMobile) {
      const desktopWidth = 1440;

      // Skala dihitung berdasarkan lebar layar perangkat
      const scale = screenWidth / desktopWidth;

      viewport.setAttribute(
        'content',
        `width=${desktopWidth}, initial-scale=${scale}, minimum-scale=${scale}, viewport-fit=cover`
      );
    }

    // Kembalikan viewport ketika meninggalkan halaman publik
    return () => {
      if (originalViewport) {
        viewport.setAttribute('content', originalViewport);
      }
    };
  }, []);

  const openLayananDropdown = () => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    if (isMobile) {
      setIsMobileMenuOpen(true);
      setActiveMobileDropdown('Layanan');
      setActiveDropdown(null);
    } else {
      setActiveDropdown('Layanan');
      setIsMobileMenuOpen(false);
      setActiveMobileDropdown(null);
    }

    document.getElementById('main-navbar')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50 flex flex-col">
      <Navbar
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeMobileDropdown={activeMobileDropdown}
        setActiveMobileDropdown={setActiveMobileDropdown}
      />

      <main className="flex-grow w-full">
        <Outlet context={{ openLayananDropdown }} />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
