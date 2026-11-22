
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Smile,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';

import SurveiSection from './layanan-pengguna/sections/SurveiSection';
import PengaduanSection from './layanan-pengguna/sections/PengaduanSection';
import TrackingSection from './layanan-pengguna/sections/TrackingSection';
import usePengaduan from './layanan-pengguna/hooks/usePengaduan';
import useTracking from './layanan-pengguna/hooks/useTracking';
import useSurvei from './layanan-pengguna/hooks/useSurvei';

import { serviceOptions } from './layanan-pengguna/utils/complaintConstants';


// ==========================================
// HALAMAN LAYANAN PENGGUNA
// ==========================================

export default function LayananPengguna() {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState('pengaduan');

  // ==========================================
  // STATE NOTIFIKASI TOAST
  // ==========================================

  const [toast, setToast] = useState(null);

  // LOGIKA PENGADUAN
  const pengaduan = usePengaduan();

  // ==========================================
  // STATE PENGADUAN
  // ==========================================

  const {
    aduForm,
    setAduForm,
    majorsList,
    selectedFile,
    fileError,
    ticketSuccess,
    setTicketSuccess,
    createdTicket,
    isSubmitting,
    currentCategories,
    isToeflScore,
    handleAduSubmit,
    handleServiceChange,
    handleCategoryChange,
    handleFileChange,
    handleRemoveFile,
  } = pengaduan;
  // LOGIKA TRACKING
  const tracking = useTracking(setToast);

  // STATE TRACKING
  const {
    trackInput,
    setTrackInput,
    accessInput,
    setAccessInput,
    trackingResult,
    setTrackingResult,
    trackingError,
    isTracking,
    additionalInfo,
    setAdditionalInfo,
    additionalFile,
    setAdditionalFile,
    additionalFileError,
    setAdditionalFileError,
    isSubmittingAdditional,
    handleTrackSubmit,
    handleAdditionalFileChange,
    handleRemoveAdditionalFile,
    handleAdditionalSubmit,
  } = tracking;
  // LOGIKA SURVEI
  const survei = useSurvei();

  // STATE SURVEI
  const {
    surveyAspects,
    surveyForm,
    setSurveyForm,
    surveySubmitted,
    setSurveySubmitted,
    isLoadingAspects,
    aspectsError,
    isSubmittingSurvey,
    surveyError,
    setSurveyError,
    handleSurveySubmit,
  } = survei;
  // ==========================================
  // EFFECT - TOAST OTOMATIS
  // ==========================================

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);

    return () => clearTimeout(timer);
  }, [toast]);

  // ==========================================
  // EFFECTS
  // ==========================================

  // Menyesuaikan tab berdasarkan URL.
  useEffect(() => {
    const path = location.pathname;

    if (path.includes('tracking')) {
      setActiveTab('tracking');
    } else if (path.includes('survei')) {
      setActiveTab('survei');
    } else {
      setActiveTab('pengaduan');
    }

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [location.pathname]);

  // ==========================================


  // ==========================================
  // RENDER
  // ==========================================

  return (
    <main className="bg-[#F7FAF8] min-h-screen pb-16">

      {/* NOTIFIKASI TOAST */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-[100] w-[calc(100%-2.5rem)] max-w-md animate-fadeIn"
        >
          <div
            className={`flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-xl ${
              toast.type === 'success'
                ? 'border-green-200'
                : 'border-red-200'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                toast.type === 'success'
                  ? 'bg-green-100 text-[#10C35D]'
                  : 'bg-red-100 text-red-500'
              }`}
            >
              {toast.type === 'success'
                ? <CheckCircle size={21} />
                : <AlertCircle size={21} />
              }
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p
                className={`text-sm font-bold ${
                  toast.type === 'success'
                    ? 'text-[#0a3d2e]'
                    : 'text-red-700'
                }`}
              >
                {toast.title}
              </p>

              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* HERO SECTION */}
<section className="relative isolate overflow-hidden bg-gradient-to-br from-[#0A3D2E] via-[#105B40] to-[#0A3D2E] text-white">
  <div className="pointer-events-none absolute -right-24 -top-36 h-96 w-96 rounded-full bg-[#10C35D]/15 blur-3xl" />
  <div className="pointer-events-none absolute -bottom-40 -left-20 h-80 w-80 rounded-full bg-[#10C35D]/10 blur-3xl" />

  <div className="relative mx-auto max-w-7xl px-5 py-16 text-center md:px-8 md:py-20">
    <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.14em] text-white/90">
      <MessageSquare size={14} />
      LAYANAN PENGGUNA
    </span>

    <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
      Layanan Pengguna
    </h1>

    <p className="mt-1 text-2xl font-extrabold text-[#10C35D] md:text-3xl">
      UPA Bahasa POLNES
    </p>

    <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/90 md:text-base">
      Sampaikan pengaduan, lacak status, atau berikan penilaian untuk membantu
      kami meningkatkan kualitas layanan UPA Bahasa.
    </p>
  </div>
</section>

      <div className="max-w-4xl mx-auto px-5 md:px-8 -mt-8 relative z-10">

        {/* TABS NAVIGASI */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 mb-8 flex gap-2">
          {[
            {
              id: 'pengaduan',
              label: 'Buat Pengaduan',
              icon: MessageSquare,
            },
            {
              id: 'tracking',
              label: 'Cek Status',
              icon: Search,
            },
            {
              id: 'survei',
              label: 'Survei Kepuasan',
              icon: Smile,
            },
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setTrackingResult(null);
                  setTicketSuccess(false);
                  setSurveySubmitted(false);
                  setAdditionalInfo('');
                  setAdditionalFile(null);
                  setAdditionalFileError('');
                  setToast(null);
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-[#10C35D] text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <TabIcon size={18} />
                <span className="hidden sm:inline">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PENGADUAN */}
        {activeTab === 'pengaduan' && (
          <PengaduanSection
            aduForm={aduForm}
            setAduForm={setAduForm}
            majorsList={majorsList}
            selectedFile={selectedFile}
            fileError={fileError}
            ticketSuccess={ticketSuccess}
            createdTicket={createdTicket}
            isSubmitting={isSubmitting}
            currentCategories={currentCategories}
            isToeflScore={isToeflScore}
            serviceOptions={serviceOptions}
            handleAduSubmit={handleAduSubmit}
            handleServiceChange={handleServiceChange}
            handleCategoryChange={handleCategoryChange}
            handleFileChange={handleFileChange}
            handleRemoveFile={handleRemoveFile}
            setActiveTab={setActiveTab}
            setTrackInput={setTrackInput}
            setAccessInput={setAccessInput}
          />
        )}

        {/* TAB 2: TRACKING */}
        {activeTab === 'tracking' && (
          <TrackingSection
            trackInput={trackInput}
            setTrackInput={setTrackInput}
            accessInput={accessInput}
            setAccessInput={setAccessInput}
            handleTrackSubmit={handleTrackSubmit}
            isTracking={isTracking}
            trackingError={trackingError}
            trackingResult={trackingResult}
            additionalInfo={additionalInfo}
            setAdditionalInfo={setAdditionalInfo}
            additionalFile={additionalFile}
            additionalFileError={additionalFileError}
            isSubmittingAdditional={isSubmittingAdditional}
            handleAdditionalSubmit={handleAdditionalSubmit}
            handleAdditionalFileChange={handleAdditionalFileChange}
            handleRemoveAdditionalFile={handleRemoveAdditionalFile}
          />
        )}

        {/* TAB 3: SURVEI */}
        {activeTab === 'survei' && (
          <SurveiSection
            surveyAspects={surveyAspects}
            isLoadingAspects={isLoadingAspects}
            aspectsError={aspectsError}
            surveyForm={surveyForm}
            setSurveyForm={setSurveyForm}
            surveySubmitted={surveySubmitted}
            setSurveySubmitted={setSurveySubmitted}
            isSubmittingSurvey={isSubmittingSurvey}
            surveyError={surveyError}
            setSurveyError={setSurveyError}
            handleSurveySubmit={handleSurveySubmit}
          />
        )}

      </div>
    </main>
  );
}













