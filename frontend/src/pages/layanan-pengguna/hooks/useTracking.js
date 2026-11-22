import { useState } from 'react';
import { parseComplaintDescription } from '../utils/complaintHelpers';

export default function useTracking(setToast) {
  // STATE TRACKING
  const [trackInput, setTrackInput] = useState('');
  const [accessInput, setAccessInput] = useState('');
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  const [additionalInfo, setAdditionalInfo] = useState('');
  const [additionalFile, setAdditionalFile] = useState(null);
  const [additionalFileError, setAdditionalFileError] = useState('');
  const [isSubmittingAdditional, setIsSubmittingAdditional] = useState(false);

  // Mencari status pengaduan.
  const handleTrackSubmit = async (e) => {
    e.preventDefault();

    setIsTracking(true);
    setTrackingError('');
    setTrackingResult(null);
    setToast(null);
    setAdditionalInfo('');
    setAdditionalFile(null);
    setAdditionalFileError('');

    try {
      const response = await fetch(
        'http://upabahasa-polnes-4p4a.vercel.app/api/complaints/track',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ticket_number: trackInput.trim(),
            access_code: accessInput.trim(),
          }),
        }
      );

      const contentType = response.headers.get('content-type');

      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(
          'Server tidak merespon dengan format JSON. Pastikan backend sudah dijalankan!'
        );
      }

      const data = await response.json();

      if (response.ok && data.data) {
        const c = data.data;

        const createdAt = c.created_at
          ? new Date(c.created_at)
          : new Date();

        const parsedDescription = parseComplaintDescription(c.description);

        const historiesArray = Array.isArray(c.histories)
          ? c.histories
          : [];

        setTrackingResult({
          ticket: c.ticket_number || 'Tidak diketahui',
          status: c.current_status || c.status || 'menunggu',

          tanggalPengajuan: createdAt.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),

          waktuPengajuan: createdAt.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
          }),

          nama: c.name || '-',
          prodi: c.program_studi || '-',
          layanan: c.layanan || '-',
          kategori: c.category || '-',

          detail: parsedDescription.description,
          additionalDetails: parsedDescription.additionalDetails,

          lampiranAwal: c.attachment || null,
          lampiranTambahan: c.additional_attachment || null,

          catatanAdmin: c.admin_note || null,
          hasilPenyelesaian: c.resolution_note || null,

          history: historiesArray.map((h) => ({
            done: true,

            label: h.sender === 'mahasiswa'
              ? 'Informasi Tambahan Dikirim Mahasiswa'
              : h.status === 'menunggu'
                ? 'Pengaduan Diterima'
                : h.status === 'perlu_dilengkapi'
                  ? 'Admin Meminta Informasi Tambahan'
                  : h.status === 'selesai'
                    ? 'Pengaduan Selesai'
                    : 'Pengaduan Sedang Diproses',

            date: h.date
              ? new Date(h.date).toLocaleString('id-ID')
              : '-',

            description: h.note || '',
          })),

          additionalMessages: [],
        });
      } else {
        setTrackingError(
          data.message ||
          'Gagal melacak pengaduan atau data tidak ditemukan.'
        );
      }
    } catch (error) {
      console.error('Error Tracking:', error);

      setTrackingError(
        error.message ||
        'Terjadi kesalahan koneksi ke server.'
      );
    } finally {
      setIsTracking(false);
    }
  };

  // Memilih dan memvalidasi lampiran informasi tambahan.
  const handleAdditionalFileChange = (e) => {
    const file = e.target.files?.[0];

    setAdditionalFileError('');

    if (!file) {
      setAdditionalFile(null);
      return;
    }

    const validTypes = [
      'image/jpeg',
      'image/png',
      'application/pdf',
    ];

    if (!validTypes.includes(file.type)) {
      setAdditionalFileError(
        'Format file tidak valid. Gunakan JPG, PNG, atau PDF.'
      );
      setAdditionalFile(null);
      e.target.value = '';
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setAdditionalFileError(
        'Ukuran file terlalu besar. Maksimal 2 MB.'
      );
      setAdditionalFile(null);
      e.target.value = '';
      return;
    }

    setAdditionalFile(file);
  };

  // Menghapus lampiran informasi tambahan.
  const handleRemoveAdditionalFile = () => {
    setAdditionalFile(null);
    setAdditionalFileError('');

    const fileInput = document.getElementById('additionalFileInput');

    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Mengirim informasi tambahan beserta lampiran opsional.
  const handleAdditionalSubmit = async (e) => {
    e.preventDefault();

    if (!additionalInfo.trim()) {
      setToast({
        type: 'error',
        title: 'Informasi Belum Diisi',
        message: 'Silakan isi informasi tambahan terlebih dahulu.',
      });
      return;
    }

    if (additionalFileError) {
      setToast({
        type: 'error',
        title: 'Lampiran Tidak Valid',
        message: 'Periksa kembali file lampiran yang dipilih.',
      });
      return;
    }

    setIsSubmittingAdditional(true);

    try {
      const formData = new FormData();

      formData.append('ticket_number', trackingResult.ticket);
      formData.append('access_code', accessInput.trim());
      formData.append('student_note', additionalInfo.trim());

      if (additionalFile) {
        formData.append('attachment', additionalFile);
      }

      const response = await fetch(
        'http://upabahasa-polnes-4p4a.vercel.app/api/complaints/additional-info',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setToast({
          type: 'error',
          title: 'Gagal Mengirim Informasi',
          message:
            data.message ||
            'Informasi tambahan gagal dikirim. Silakan coba kembali.',
        });
        return;
      }

      // Kosongkan formulir setelah berhasil.
      setAdditionalInfo('');
      setAdditionalFile(null);
      setAdditionalFileError('');

      const fileInput = document.getElementById('additionalFileInput');

      if (fileInput) {
        fileInput.value = '';
      }

      // Notifikasi keberhasilan.
      setToast({
        type: 'success',
        title: 'Informasi Berhasil Dikirim',
        message:
          'Informasi tambahan dan lampiran Anda berhasil dikirim. Pengaduan akan kembali ditinjau dan diproses oleh Admin.',
      });

      // Ambil ulang data tracking.
      // Kegagalan refresh tidak membatalkan pengiriman.
      try {
        const trackResponse = await fetch(
          'http://upabahasa-polnes-4p4a.vercel.app/api/complaints/track',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticket_number: trackingResult.ticket,
              access_code: accessInput.trim(),
            }),
          }
        );

        const trackData = await trackResponse.json();

        if (trackResponse.ok && trackData.data) {
          const c = trackData.data;

          const historiesArray = Array.isArray(c.histories)
            ? c.histories
            : [];

          setTrackingResult((prev) => ({
            ...prev,

            status: c.current_status || c.status || prev.status,

            lampiranAwal: c.attachment || null,
            lampiranTambahan: c.additional_attachment || null,

            catatanAdmin: c.admin_note || null,
            hasilPenyelesaian: c.resolution_note || null,

            history: historiesArray.map((h) => ({
              done: true,

              label: h.sender === 'mahasiswa'
                ? 'Informasi Tambahan Dikirim Mahasiswa'
                : h.status === 'menunggu'
                  ? 'Pengaduan Diterima'
                  : h.status === 'perlu_dilengkapi'
                    ? 'Admin Meminta Informasi Tambahan'
                    : h.status === 'selesai'
                      ? 'Pengaduan Selesai'
                      : 'Pengaduan Sedang Diproses',

              date: h.date
                ? new Date(h.date).toLocaleString('id-ID')
                : '-',

              description: h.note || '',
            })),
          }));
        }
      } catch (refreshError) {
        console.error(
          'Gagal memperbarui data tracking:',
          refreshError
        );
      }
    } catch (error) {
      console.error('Additional Info Error:', error);

      setToast({
        type: 'error',
        title: 'Terjadi Kesalahan',
        message:
          'Informasi tambahan belum berhasil dikirim. Periksa koneksi dan coba kembali.',
      });
    } finally {
      setIsSubmittingAdditional(false);
    }
  };

  return {
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
  };
}
