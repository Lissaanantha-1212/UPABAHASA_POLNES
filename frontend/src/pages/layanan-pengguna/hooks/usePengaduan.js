import { useState, useEffect } from 'react';
import { complaintCategories } from '../utils/complaintConstants';

export default function usePengaduan() {
  // STATE FORMULIR PENGADUAN
  const [aduForm, setAduForm] = useState({
    nama: '',
    nim: '',
    prodi: '',
    whatsapp: '',
    layanan: 'TOEFL Prediction',
    kategori: 'Hasil/Skor',
    tanggalTes: '',
    sesiTes: '',
    ruangan: '',
    nomorKomputer: '',
    tanggalKendala: '',
    detail: '',
  });

  const [majorsList, setMajorsList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // DATA TURUNAN
  const currentCategories =
    complaintCategories[aduForm.layanan] || [];

  const isToeflScore =
    aduForm.layanan === 'TOEFL Prediction' &&
    aduForm.kategori === 'Hasil/Skor';

  // MENGAMBIL DATA PROGRAM STUDI
  useEffect(() => {
    const fetchMajors = async () => {
      try {
        const response = await fetch(
          'https://upabahasa-polnes-4p4a.vercel.app/api/majors'
        );

        const data = await response.json();

        if (response.ok) {
          setMajorsList(data.data);
        }
      } catch (error) {
        console.error(
          'Gagal mengambil data program studi:',
          error
        );
      }
    };

    fetchMajors();
  }, []);

  // MENGUBAH LAYANAN
  const handleServiceChange = (value) => {
    const nextCategories = complaintCategories[value] || [];

    setAduForm((prev) => ({
      ...prev,
      layanan: value,
      kategori: nextCategories[0] || '',
      tanggalTes: '',
      sesiTes: '',
      ruangan: '',
      nomorKomputer: '',
      tanggalKendala: '',
    }));
  };

  // MENGUBAH KATEGORI
  const handleCategoryChange = (value) => {
    setAduForm((prev) => ({
      ...prev,
      kategori: value,
      tanggalTes: '',
      sesiTes: '',
      ruangan: '',
      nomorKomputer: '',
      tanggalKendala: '',
    }));
  };

  // MEMILIH DAN MEMVALIDASI FILE
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    setFileError('');

    if (!file) {
      setSelectedFile(null);
      return;
    }

    const validTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ];

    const maxSize = 2 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setFileError(
        'Format file tidak valid. Gunakan JPG, PNG, atau PDF.'
      );
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    if (file.size > maxSize) {
      setFileError(
        'Ukuran file terlalu besar. Maksimal 2 MB.'
      );
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  };

  // MENGHAPUS FILE
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileError('');

    const fileInput = document.getElementById('fileInput');

    if (fileInput) {
      fileInput.value = '';
    }
  };

  // MENGIRIM PENGADUAN
  const handleAduSubmit = async (e) => {
    e.preventDefault();

    if (!aduForm.prodi) {
      alert(
        'Silakan pilih Program Studi dari daftar yang tersedia.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const additionalDetails = [];

      if (isToeflScore) {
        additionalDetails.push(
          `Tanggal Pelaksanaan Tes: ${aduForm.tanggalTes}`,
          `Jam / Sesi Tes: ${aduForm.sesiTes}`,
          `Ruangan Laboratorium: ${aduForm.ruangan}`,
          `Nomor Komputer: ${aduForm.nomorKomputer}`
        );
      } else if (
        aduForm.kategori !== 'Lainnya' &&
        aduForm.tanggalKendala
      ) {
        additionalDetails.push(
          `${aduForm.kategori === 'Pendaftaran'
            ? 'Tanggal Pendaftaran'
            : aduForm.kategori === 'Jadwal'
              ? 'Tanggal Jadwal yang Mengalami Kendala'
              : aduForm.kategori === 'Sertifikat'
                ? 'Tanggal Pelaksanaan Tes / Kursus'
                : 'Tanggal Kejadian'}: ${aduForm.tanggalKendala}`
        );
      }

      const complaintDescription = additionalDetails.length
        ? `${aduForm.detail.trim()}\n\nInformasi Tambahan:\n${additionalDetails.join('\n')}`
        : aduForm.detail.trim();

      const formData = new FormData();

      formData.append('name', aduForm.nama);
      formData.append('nim', aduForm.nim);
      formData.append('program_studi', aduForm.prodi);
      formData.append('whatsapp', aduForm.whatsapp.trim());
      formData.append('category', aduForm.kategori);
      formData.append('layanan', aduForm.layanan);
      formData.append('description', complaintDescription);

      if (selectedFile) {
        formData.append('attachment', selectedFile);
      }

      const response = await fetch(
        'https://upabahasa-polnes-4p4a.vercel.app/api/complaints',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setCreatedTicket({
          ticket_number: data.data.ticket_number,
          access_code: data.data.access_code,
        });

        setTicketSuccess(true);

        localStorage.setItem(
          'lastComplaintData',
          JSON.stringify({
            ticket: data.data.ticket_number,
            accessCode: data.data.access_code,
          })
        );

        setAduForm({
          nama: '',
          nim: '',
          prodi: '',
          whatsapp: '',
          layanan: 'TOEFL Prediction',
          kategori: 'Hasil/Skor',
          tanggalTes: '',
          sesiTes: '',
          ruangan: '',
          nomorKomputer: '',
          tanggalKendala: '',
          detail: '',
        });

        setSelectedFile(null);
        setFileError('');

        const fileInput = document.getElementById('fileInput');

        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        alert(
          'Gagal mengirim pengaduan: ' + data.message
        );
      }
    } catch (error) {
      console.error('Error:', error);

      alert(
        'Terjadi kesalahan koneksi ke server. Pastikan backend sedang berjalan!'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
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
  };
}
