import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { adminFetch } from '../../../../../adminSession';
import {
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  Users,
  ImagePlus,
  X,
  RefreshCw,
} from 'lucide-react';

const API_URL = 'http://localhost:5000/api/cms/admin';
const API_BASE_URL = 'http://localhost:5000';

const emptyMember = {
  section_name: '',
  name: '',
  description: '',
  sort_order: 0,
};

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-[#10C35D] focus:ring-2 focus:ring-green-100';

const labelClass =
  'mb-1.5 block text-sm font-semibold text-gray-700';

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Permintaan ke server gagal.');
  }

  return result;
}

function getImageUrl(path) {
  if (!path) return '';

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

function StatusBadge({ isActive }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
        isActive
          ? 'bg-green-50 text-green-700'
          : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isActive ? 'published' : 'draft'}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-12 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-[#0a3d2e]">
        <Users size={23} />
      </div>
      <p className="font-semibold text-gray-700">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </div>
  );
}

export default function StrukturOrganisasiSection() {
  const [members, setMembers] = useState([]);
  const [memberForm, setMemberForm] = useState(emptyMember);

  const [editingMember, setEditingMember] = useState(null);
  const [showMemberForm, setShowMemberForm] = useState(false);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


  const loadData = useCallback(
    async (showLoading = true) => {
      if (showLoading) setLoading(true);
      setError('');

      try {
        const response = await adminFetch(
          `${API_URL}/organization-members`
        );

        const result = await readResponse(response);

        setMembers(
          Array.isArray(result.data) ? result.data : []
        );
      } catch (err) {
        setError(err.message || 'Gagal memuat data personel.');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchData = useCallback(() => {
    return loadData();
  }, [loadData]);

  useEffect(() => {
    loadData().catch(() => {});
  }, [loadData]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview('');
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  const resetMemberForm = () => {
    setMemberForm(emptyMember);
    setEditingMember(null);
    setPhotoFile(null);
    setPhotoPreview('');
    setShowMemberForm(false);
  };

  const openAddMember = () => {
    setError('');
    setMemberForm(emptyMember);
    setEditingMember(null);
    setPhotoFile(null);
    setShowMemberForm(true);
  };

  const updateMemberField = (field, value) => {
    setMemberForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const saveMember = async (event) => {
    event.preventDefault();

    if (!memberForm.section_name.trim()) {
      setError('Nama bagian wajib diisi.');
      return;
    }

    if (!memberForm.name.trim()) {
      setError('Nama personel wajib diisi.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const isUpdate = Boolean(editingMember);
      const body = new FormData();

      body.append('section_name', memberForm.section_name.trim());
      body.append('name', memberForm.name.trim());
      body.append('description', memberForm.description.trim());
      body.append(
        'sort_order',
        String(Number(memberForm.sort_order) || 0)
      );
      body.append('is_active', 'false');

      if (photoFile) {
        body.append('photo', photoFile);
      }

      const response = await adminFetch(
        isUpdate
          ? `${API_URL}/organization-members/${editingMember.id}`
          : `${API_URL}/organization-members`,
        {
          method: isUpdate ? 'PUT' : 'POST',
          body,
        }
      );

      await readResponse(response);
      await loadData(false);

      resetMemberForm();

      setMessage(
        isUpdate
          ? 'Personel berhasil diperbarui dan tetap berstatus Draft.'
          : 'Personel berhasil ditambahkan sebagai Draft.'
      );
    } catch (err) {
      setError(err.message || 'Gagal menyimpan personel.');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (member) => {
    const nextAction = member.is_active ? 'unpublish' : 'publish';

    const confirmation = member.is_active
      ? `Unpublish personel "${member.name}"? Personel tidak lagi ditampilkan di halaman publik.`
      : `Publish personel "${member.name}"? Personel akan ditampilkan di halaman publik.`;

    if (!window.confirm(confirmation)) return;

    try {
      setUpdatingStatus(String(member.id));
      setError('');
      setMessage('');

      const response = await adminFetch(
        `${API_URL}/organization-members/${member.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: nextAction }),
        }
      );

      await readResponse(response);
      await loadData(false);

      setMessage(
        nextAction === 'publish'
          ? 'Personel berhasil dipublikasikan.'
          : 'Personel berhasil di-unpublish.'
      );
    } catch (err) {
      setError(err.message || 'Gagal memperbarui status publikasi.');
    } finally {
      setUpdatingStatus('');
    }
  };

  const startEditMember = (member) => {
    if (member.is_active) return;

    setMemberForm({
      section_name: member.section_name || '',
      name: member.name || '',
      description: member.description || '',
      sort_order: member.sort_order ?? 0,
    });

    setEditingMember(member);
    setPhotoFile(null);
    setShowMemberForm(true);
    setError('');
  };

  const deleteMember = async (member) => {
    if (member.is_active) {
      setError('Unpublish personel terlebih dahulu sebelum menghapus.');
      return;
    }

    if (!window.confirm(`Hapus personel "${member.name}"?`)) return;

    try {
      setError('');
      setMessage('');

      const response = await adminFetch(
        `${API_URL}/organization-members/${member.id}`,
        {
          method: 'DELETE',
        }
      );

      await readResponse(response);
      await loadData(false);

      setMessage('Personel berhasil dihapus.');
    } catch (err) {
      setError(err.message || 'Gagal menghapus personel.');
    }
  };


  const groupedMembers = useMemo(() => {
    const groups = new Map();

    const sortedMembers = [...members].sort((a, b) => {
      const orderDifference =
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);

      return orderDifference || Number(a.id) - Number(b.id);
    });

    sortedMembers.forEach((member) => {
      const sectionName = String(member.section_name || '').trim();

      if (!sectionName) return;

      if (!groups.has(sectionName)) {
        groups.set(sectionName, []);
      }

      groups.get(sectionName).push(member);
    });

    return Array.from(groups.entries()).map(([name, people]) => ({
      name,
      members: people,
    }));
  }, [members]);


  if (loading && members.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Memuat struktur organisasi...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label="Tutup pesan error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-[100] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 text-sm font-medium text-green-700 shadow-lg"
        >
          <CheckCircle2 size={21} />
          <span>{message}</span>
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h3 className="text-lg font-bold text-[#0a3d2e]">
            Struktur Organisasi
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Kelola personel dan bagian organisasi dalam satu tempat.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Muat Ulang
          </button>

          <button
            type="button"
            onClick={openAddMember}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0eaa50]"
          >
            <Plus size={17} />
            Tambah Personel
          </button>
        </div>
      </div>


      {showMemberForm && (
        <form
          onSubmit={saveMember}
          className="rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div>
              <h3 className="font-bold text-[#0a3d2e]">
                {editingMember ? 'Edit Personel' : 'Tambah Personel'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Lengkapi identitas, bagian organisasi, dan foto personel.
              </p>
            </div>

            <button
              type="button"
              onClick={resetMemberForm}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Tutup form personel"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Nama Personel</label>
                <input
                  value={memberForm.name}
                  onChange={(event) =>
                    updateMemberField('name', event.target.value)
                  }
                  required
                  maxLength={255}
                  className={inputClass}
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className={labelClass}>Bagian</label>
                <input
                  value={memberForm.section_name}
                  onChange={(event) =>
                    updateMemberField('section_name', event.target.value)
                  }
                  required
                  maxLength={255}
                  className={inputClass}
                  placeholder="Contoh: Divisi Administrasi"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Ketik nama bagian. Personel dengan nama bagian yang sama akan dikelompokkan bersama.
                </p>
              </div>

              <div>
                <label className={labelClass}>Urutan Tampilan</label>
                <input
                  type="number"
                  min="0"
                  value={memberForm.sort_order}
                  onChange={(event) =>
                    updateMemberField('sort_order', event.target.value)
                  }
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Rincian Tugas</label>
              <textarea
                rows={4}
                value={memberForm.description}
                onChange={(event) =>
                  updateMemberField('description', event.target.value)
                }
                className={inputClass}
                placeholder="Jelaskan tugas atau tanggung jawab personel."
              />
            </div>

            <div>
              <label className={labelClass}>Foto Personel (Opsional)</label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-5 text-sm font-medium text-gray-600 transition hover:border-[#10C35D] hover:bg-green-50">
                <ImagePlus size={19} className="text-[#10C35D]" />
                {photoFile ? photoFile.name : 'Pilih foto JPG, PNG, atau WebP'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                      setError('Format foto harus JPG, PNG, atau WebP.');
                      event.target.value = '';
                      return;
                    }

                    setError('');
                    setPhotoFile(file);
                  }}
                  className="hidden"
                />
              </label>

              <p className="mt-1.5 text-xs text-gray-500">
                Jika tidak memilih foto baru saat mengedit, foto sebelumnya tetap digunakan.
              </p>

              {(photoPreview || editingMember?.photo) && (
                <div className="mt-3">
                  <img
                    src={photoPreview || getImageUrl(editingMember.photo)}
                    alt="Preview foto personel"
                    className="h-32 w-32 rounded-xl border border-gray-200 object-cover"
                  />
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <StatusBadge isActive={false} />
                <span className="text-xs text-gray-500">
                  Data disimpan sebagai Draft. Publikasikan melalui daftar personel.
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-4">
            <button
              type="button"
              onClick={resetMemberForm}
              disabled={saving}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                saving ||
                !memberForm.name.trim() ||
                !memberForm.section_name.trim()
              }
              className="inline-flex items-center gap-2 rounded-lg bg-[#10C35D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0eaa50] disabled:opacity-50"
            >
              <CheckCircle2 size={17} />
              {saving
                ? 'Menyimpan...'
                : editingMember
                  ? 'Simpan Perubahan'
                  : 'Simpan sebagai Draft'}
            </button>
          </div>
        </form>
      )}


      {groupedMembers.length === 0 ? (
        <EmptyState
          title='Belum ada personel'
          description='Tambahkan personel pertama untuk memulai struktur organisasi.'
        />
      ) : (
        <div className="space-y-5">
          {groupedMembers.map((group) => (
            <section
              key={group.name}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white"
            >
              <div className="flex flex-col justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-[#0a3d2e]">
                      {group.name}
                    </h4>
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                      {group.members.length} personel
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="hidden items-center gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-gray-500 lg:grid lg:grid-cols-[minmax(0,1fr)_120px_230px]">
                    <span>Personel</span>
                    <span>Status</span>
                    <span className="text-right">Aksi</span>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {group.members.map((member) => {
                      const isUpdating =
                        updatingStatus === String(member.id);

                      return (
                        <div
                          key={member.id}
                          className="flex flex-col gap-4 px-4 py-4 transition hover:bg-gray-50/70 sm:flex-row sm:items-center"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-4">
                            {member.photo ? (
                              <img
                                src={getImageUrl(member.photo)}
                                alt={member.name}
                                className="h-16 w-16 shrink-0 rounded-full border border-gray-200 object-cover"
                              />
                            ) : (
                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-green-50 text-[#0a3d2e]">
                                <Users size={25} />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-gray-800">
                                {member.name}
                              </p>

                              {member.description && (
                                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                                  {member.description}
                                </p>
                              )}

                              <p className="mt-1 text-xs text-gray-400">
                                Urutan: {member.sort_order ?? 0}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:w-[120px] sm:shrink-0 lg:justify-start">
                            <span className="text-xs font-medium text-gray-500 lg:hidden">
                              Status
                            </span>
                            <StatusBadge isActive={member.is_active} />
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 sm:w-[230px] sm:shrink-0">
                            <button
                              type="button"
                              onClick={() => toggleStatus(member)}
                              disabled={isUpdating}
                              className={`rounded-lg border px-3 py-2 text-xs font-semibold disabled:opacity-50 ${
                                member.is_active
                                  ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                                  : 'border-green-200 text-green-700 hover:bg-green-50'
                              }`}
                            >
                              {isUpdating
                                ? 'Memproses...'
                                : member.is_active
                                  ? 'Unpublish'
                                  : 'Publish'}
                            </button>

                            <button
                              type="button"
                              onClick={() => startEditMember(member)}
                              disabled={member.is_active || isUpdating}
                              className="rounded-lg border border-blue-200 p-2 text-blue-600 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title={
                                member.is_active
                                  ? 'Unpublish terlebih dahulu untuk mengedit'
                                  : 'Edit personel'
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteMember(member)}
                              disabled={member.is_active || isUpdating}
                              className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                              title={
                                member.is_active
                                  ? 'Unpublish terlebih dahulu untuk menghapus'
                                  : 'Hapus personel'
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
