import React from 'react';
import { Routes, Route } from 'react-router-dom';

// ==========================================
// IMPORT LAYOUTS
// ==========================================
import MainLayout from './layouts/MainLayout';
import ProtectedAdminRoute from './ProtectedAdminRoute';

// ==========================================
// IMPORT HALAMAN PUBLIK
// ==========================================
import Home from './pages/Home';
import Galeri from './pages/Galeri';
import Tentang from './pages/Tentang';
import LayananNonTes from './pages/LayananNonTes';
import Informasi from './pages/Informasi';
import Ebook from './pages/Ebook';
import Kuis from './pages/Kuis';
import Publikasi from './pages/Publikasi';
import LayananPengguna from './pages/LayananPengguna';

// ==========================================
// IMPORT HALAMAN ADMIN
// ==========================================
import LoginAdmin from './pages/admin/LoginAdmin';
import RegisterAdmin from './pages/admin/RegisterAdmin';
import LupaPassword from './pages/admin/LupaPassword';
import ResetPassword from './pages/admin/ResetPassword';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import AdminManajemenKonten from './pages/admin/manajemen-konten/AdminManajemenKonten';
import AdminPengaduan from './pages/admin/pengaduan/AdminPengaduan';
import AdminSurvei from './pages/admin/survei/AdminSurvei';
import ManajemenPembelajaran from './pages/admin/manajemen-pembelajaran/ManajemenPembelajaran';
import AdminManajemenLayanan from './pages/admin/manajemen-layanan/AdminManajemenLayanan';

function App() {
  return (
    <Routes>

      {/* ==========================================
          1. ROUTE PUBLIK
          Ada Navbar dan Footer dari MainLayout
      ========================================== */}
      <Route element={<MainLayout />}>

        <Route path="/" element={<Home />} />
        <Route path="/tentang" element={<Tentang />} />
        <Route path="/galeri" element={<Galeri />} />

        {/* Layanan Non-Tes */}
        <Route path="/layanan/kursus-inggris" element={<LayananNonTes />} />
        <Route path="/layanan/kursus-mandarin" element={<LayananNonTes />} />
        <Route path="/layanan/jsst" element={<LayananNonTes />} />

        {/* Informasi */}
        <Route path="/informasi/berita" element={<Informasi />} />
        <Route path="/informasi/pengumuman" element={<Informasi />} />
        <Route path="/informasi/faq" element={<Informasi />} />

        {/* Pembelajaran */}
        <Route path="/pembelajaran/e-book" element={<Ebook />} />
        <Route path="/pembelajaran/kuis" element={<Kuis />} />
        <Route path="/pembelajaran/publikasi" element={<Publikasi />} />

        {/* Layanan Pengguna */}
        <Route path="/layanan-pengguna/pengaduan" element={<LayananPengguna />} />
        <Route path="/layanan-pengguna/tracking" element={<LayananPengguna />} />
        <Route path="/layanan-pengguna/survei" element={<LayananPengguna />} />

      </Route>

      {/* ==========================================
          2. LOGIN ADMIN
          Tetap bisa diakses tanpa login
      ========================================== */}
      <Route
        path="/admin/login"
        element={<LoginAdmin />}
      />
      <Route path="/admin/register" element={<RegisterAdmin />} />

      <Route
        path="/lupa-password"
        element={<LupaPassword />}
      />

      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />

      {/* ==========================================
          3. ROUTE ADMIN TERLINDUNGI
          Semua halaman di bawah wajib memiliki sesi valid
      ========================================== */}
      <Route element={<ProtectedAdminRoute />}>

        <Route
          path="/admin/dashboard"
          element={<DashboardAdmin />}
        />

        <Route
          path="/admin/konten"
          element={<AdminManajemenKonten />}
        />

        <Route
          path="/admin/layanan"
          element={<AdminManajemenLayanan />}
        />

        <Route
          path="/admin/pembelajaran"
          element={<ManajemenPembelajaran />}
        />

        <Route
          path="/admin/pengaduan"
          element={<AdminPengaduan />}
        />

        <Route
          path="/admin/survei"
          element={<AdminSurvei />}
        />

      </Route>

    </Routes>
  );
}

export default App;
