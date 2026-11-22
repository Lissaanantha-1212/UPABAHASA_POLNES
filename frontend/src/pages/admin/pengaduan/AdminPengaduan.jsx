
import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import AdminLayout from '../../../layouts/AdminLayout';
import { adminFetch } from '../../../adminSession';

import ComplaintTable from './ComplaintTable';
import ComplaintDetail from './ComplaintDetail';

const API_URL = 'http://localhost:5000/api/complaints';

export default function AdminPengaduan() {
  const [complaints, setComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return;

    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // AMBIL SEMUA PENGADUAN
  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await adminFetch(`${API_URL}/admin`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data pengaduan.');
      }

      setComplaints(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error('Fetch Complaints Error:', err);
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, []);

  // AMBIL DETAIL PENGADUAN
  const fetchComplaintDetail = async (id) => {
    try {
      setDetailLoading(true);
      setSelectedComplaint(null);

      const response = await adminFetch(`${API_URL}/admin/${id}`, {
        method: 'GET',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil detail pengaduan.');
      }

      setSelectedComplaint(result.data);
    } catch (err) {
      console.error('Fetch Complaint Detail Error:', err);
      alert(err.message || 'Gagal mengambil detail pengaduan.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDetail = (id) => {
    setSelectedId(id);
    fetchComplaintDetail(id);
  };

  const handleBack = () => {
    setSelectedId(null);
    setSelectedComplaint(null);
  };

  // UPDATE STATUS
  const handleUpdateStatus = async (formData) => {
    if (!selectedId) return;

    try {
      setSaving(true);

      const response = await adminFetch(
        `${API_URL}/admin/${selectedId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: formData.status,
            admin_note: formData.admin_note || '',
            resolution_note: formData.resolution_note || '',
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal memperbarui status pengaduan.'
        );
      }

      await fetchComplaints();
      await fetchComplaintDetail(selectedId);

      setToast({
        message: result.message || 'Perubahan pengaduan berhasil disimpan.',
      });
    } catch (err) {
      console.error('Update Complaint Error:', err);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  // HAPUS PENGADUAN BERDASARKAN ID
  const handleDeleteComplaint = async (id, ticketNumber = '') => {
    if (!id) return;

    const complaint = complaints.find(
      (item) => Number(item.id) === Number(id)
    );

    if (complaint && complaint.status !== 'selesai') {
      setToast({
        message: 'Pengaduan hanya dapat dihapus jika statusnya Selesai.',
      });
      return;
    }

    const confirmed = window.confirm(
      `Apakah kamu yakin ingin menghapus pengaduan ${
        ticketNumber || complaint?.ticket_number || ''
      }?\n\nData pengaduan dan riwayatnya akan dihapus permanen.`
    );

    if (!confirmed) return;

    try {
      setSaving(true);

      const response = await adminFetch(`${API_URL}/admin/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal menghapus pengaduan.'
        );
      }

      setComplaints((previous) =>
        previous.filter((item) => Number(item.id) !== Number(id))
      );

      if (Number(selectedId) === Number(id)) {
        setSelectedId(null);
        setSelectedComplaint(null);
      }

      await fetchComplaints();

      setToast({
        message: result.message || 'Pengaduan berhasil dihapus.',
      });
    } catch (err) {
      console.error('Delete Complaint Error:', err);

      setToast({
        message: err.message || 'Terjadi kesalahan saat menghapus pengaduan.',
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <AdminLayout>
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-[100] w-[calc(100%-2rem)] sm:w-[380px] animate-fadeIn"
        >
          <div className="flex items-start gap-3 bg-white border border-green-100 rounded-xl shadow-xl p-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle size={22} className="text-[#10C35D]" />
            </div>

            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-sm font-bold text-[#0a3d2e]">
                Berhasil!
              </p>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Tutup notifikasi"
              className="text-gray-400 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0a3d2e]">
            Manajemen Pengaduan
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola pengaduan dan tindak lanjut layanan UPA Bahasa POLNES.
          </p>
        </div>

        {error && !selectedId && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={fetchComplaints}
              className="font-semibold underline"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {selectedId ? (
          <ComplaintDetail
            complaint={selectedComplaint}
            loading={detailLoading}
            saving={saving}
            onBack={handleBack}
            onUpdateStatus={handleUpdateStatus}
            onDelete={() =>
              handleDeleteComplaint(
                selectedId,
                selectedComplaint?.ticket_number
              )
            }
          />
        ) : (
          <ComplaintTable
            complaints={complaints}
            loading={loading}
            saving={saving}
            onView={handleViewDetail}
            onDelete={handleDeleteComplaint}
            onRefresh={fetchComplaints}
          />
        )}
      </div>
    </AdminLayout>
  );
}
