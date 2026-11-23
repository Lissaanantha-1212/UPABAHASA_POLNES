
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

function MainLayout() {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMobileDropdown, setActiveMobileDropdown] = useState(null);

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
    <div className="min-h-screen bg-gray-50 flex flex-col overflow-x-hidden">
      <Navbar
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        activeMobileDropdown={activeMobileDropdown}
        setActiveMobileDropdown={setActiveMobileDropdown}
      />

      <main className="flex-grow">
        <Outlet context={{ openLayananDropdown }} />
      </main>

      <Footer />
    </div>
  );
}

export default MainLayout;
