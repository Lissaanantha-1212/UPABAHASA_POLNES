import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Smile,
  LogOut,
  Menu,
  X,
  UserRound,
  ChevronDown,
  Calendar,
  FileUp,
  FolderKanban
} from 'lucide-react';

import logoPolnes from '../assets/logo-polnes.png';
import { clearAdminSession } from '../adminSession';

const UPABAHASA_BASE_URL = 'https://upabahasa.vercel.app';

const operasionalMenuItems = [
  {
    name: 'Penjadwalan',
    icon: Calendar,
    children: [
      { name: 'Jadwal Test', href: `${UPABAHASA_BASE_URL}/jadwal-test.html` },
      { name: 'Jadwal Remedial', href: `${UPABAHASA_BASE_URL}/jadwal-remedial.html` },
    ],
  },
  {
    name: 'Hasil Test',
    icon: FileUp,
    children: [
      { name: 'TOEFL', href: `${UPABAHASA_BASE_URL}/toefl.html` },
      { name: 'SSPECT', href: `${UPABAHASA_BASE_URL}/sspect.html` },
    ],
  },
  {
    name: 'Rekapan',
    icon: FolderKanban,
    href: `${UPABAHASA_BASE_URL}/rekapan.html`,
  },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [openOperasionalMenus, setOpenOperasionalMenus] = useState({
    Penjadwalan: false,
    'Hasil Test': false,
  });

  let adminUser = {};

  try {
    adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}') || {};
  } catch (error) {
    console.error('Data profil admin tidak valid:', error);
  }

  const adminName = adminUser.fullName || 'Admin UPA';
  const adminEmail = adminUser.email || '-';
  const adminInitial = adminName.trim().charAt(0).toUpperCase() || 'A';
  const staffNumber = adminUser.staffNumber;
  const adminNumber =
    staffNumber !== null &&
    staffNumber !== undefined &&
    staffNumber !== ''
      ? `Admin ${staffNumber}`
      : 'Nomor admin belum tersedia';

  const roleLabel = adminUser.role
    ? adminUser.role.charAt(0).toUpperCase() + adminUser.role.slice(1)
    : 'Administrator';

  const menuItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Manajemen Konten', path: '/admin/konten', icon: FileText },
    { name: 'Manajemen Layanan', path: '/admin/layanan', icon: Briefcase },
    { name: 'Manajemen Pembelajaran', path: '/admin/pembelajaran', icon: GraduationCap },
    { name: 'Manajemen Pengaduan', path: '/admin/pengaduan', icon: MessageSquare },
    { name: 'Manajemen Survei', path: '/admin/survei', icon: Smile },
  ];

  const toggleOperasionalMenu = (menuName) => {
    setOpenOperasionalMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  const handleLogout = () => {
    setIsProfileOpen(false);
    clearAdminSession();
    alert('Anda berhasil Logout!');
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#F7FAF8] flex">

      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0a3d2e] text-white flex flex-col transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 bg-[#082d22] shrink-0">
          <div className="flex items-center gap-2">
            <img
              src={logoPolnes}
              alt="Logo POLNES"
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold text-lg tracking-wide">UPA ADMIN</span>
          </div>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
            aria-label="Tutup sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-[#10C35D] text-white shadow-md'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}

          {operasionalMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = Array.isArray(item.children) && item.children.length > 0;
            const isOpen = !!openOperasionalMenus[item.name];

            if (!hasChildren) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <Icon size={18} />
                  {item.name}
                </a>
              );
            }

            return (
              <div key={item.name} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleOperasionalMenu(item.name)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} />
                    {item.name}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="pl-11 pr-2 space-y-1">
                    {item.children.map((subItem) => (
                      <a
                        key={subItem.name}
                        href={subItem.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10C35D]" />
                        {subItem.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* TOP HEADER */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 z-40 relative">

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-[#10C35D]"
              aria-label="Buka sidebar"
            >
              <Menu size={24} />
            </button>

            <div>
              <h2 className="text-lg font-semibold text-[#0a3d2e]">
                Panel Administrasi
              </h2>
              <p className="text-xs text-gray-500 hidden sm:block">
                Selamat datang di Sistem Informasi UPA Bahasa
              </p>
            </div>
          </div>

          {/* PROFILE DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsProfileOpen((prev) => !prev)}
              aria-expanded={isProfileOpen}
              aria-haspopup="true"
              className="flex items-center gap-2 sm:gap-3 rounded-xl px-2 py-1.5 hover:bg-[#F0F8F3] transition-colors focus:outline-none focus:ring-2 focus:ring-[#10C35D]"
            >
              <div className="w-10 h-10 rounded-full bg-[#10C35D] text-white flex items-center justify-center font-bold shadow-sm">
                {adminInitial}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-[#0a3d2e]">
                  Profile
                </p>
                <p className="text-xs text-gray-500">
                  {adminName}
                </p>
              </div>

              <ChevronDown
                size={17}
                className={`text-gray-500 transition-transform ${
                  isProfileOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-3 w-72 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">

                <div className="px-5 py-4 bg-[#F0F8F3] border-b border-gray-100">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Akun Administrator
                  </p>

                  <div className="flex items-center gap-3 mt-3">
                    <div className="w-12 h-12 rounded-full bg-[#10C35D] text-white flex items-center justify-center text-lg font-bold shrink-0">
                      {adminInitial}
                    </div>

                    <div className="min-w-0">
                      <p className="font-semibold text-[#0a3d2e] truncate">
                        {adminName}
                      </p>
                      <p className="text-xs text-gray-500 break-all">
                        {adminEmail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">Role</span>
                    <span className="text-sm font-medium text-[#0a3d2e]">
                      {roleLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-gray-500">Nomor Admin</span>
                    <span className="text-sm font-semibold text-[#0a3d2e]">
                      {adminNumber}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-100 p-3">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}