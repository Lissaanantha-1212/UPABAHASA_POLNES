
import React, { useCallback, useEffect, useState } from 'react';
import {
  RefreshCw,
  Plus,
} from 'lucide-react';

import {
  formatDate,
  toDateTimeLocal,
  makeSlug,
} from './utils/informasiAdminUtils';
import InformasiTabs, { tabs } from './components/InformasiTabs';
import PostForm from './components/PostForm';
import FaqForm from './components/FaqForm';
import FaqTable from './components/FaqTable';
import PostTable from './components/PostTable';
import { adminFetch } from '../../../../adminSession';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/cms/admin';

const initialForm = {
  title: '',
  slug: '',
  category: 'berita',
  content_category: '',
  summary: '',
  content: '',
  status: 'draft',
  published_at: '',
  image: null,
};

const initialFaqForm = {
  category: 'Umum',
  question: '',
  answer: '',
  status: 'draft',
  sort_order: 1,
};

export default function InformasiSection() {
  const [activeTab, setActiveTab] = useState('berita');
  const [posts, setPosts] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);

  const [faqFormOpen, setFaqFormOpen] = useState(false);
  const [faqEditingId, setFaqEditingId] = useState(null);
  const [faqSaving, setFaqSaving] = useState(false);
  const [faqForm, setFaqForm] = useState(initialFaqForm);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);


  const fetchData = useCallback(async () => {

    setLoading(true);
    setError('');

    try {
      const endpoint = activeTab === 'faq' ? 'faqs' : 'posts';

      const response = await adminFetch(`${API_URL}/${endpoint}`);

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data informasi.');
      }

      const data = Array.isArray(result.data)
        ? result.data
        : result.data?.rows || [];

      if (activeTab === 'faq') {
        setFaqs(data);
      } else {
        setPosts(data);
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredPosts = posts.filter(
    (item) => item.category === activeTab
  );

  const currentTab = tabs.find((item) => item.id === activeTab);
  const CurrentIcon = currentTab.icon;

  const openCreateForm = () => {
    setEditingId(null);
    setForm({ ...initialForm, category: activeTab });
    setSlugManuallyEdited(false);
    setError('');
    setFormOpen(true);
  };

  const openEditForm = (item) => {
    if (item.status === 'published') {
      setError('Unpublish konten terlebih dahulu sebelum mengedit.');
      return;
    }

    setEditingId(item.id);
    setForm({
      title: item.title || '',
      slug: item.slug || '',
      category: item.category || activeTab,
      content_category: item.category === 'pengumuman' ? '' : (item.content_category || ''),
      summary: item.summary || '',
      content: item.content || '',
      status: item.status || 'draft',
      published_at: toDateTimeLocal(item.published_at),
      image: null,
    });
    setSlugManuallyEdited(true);
    setError('');
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditingId(null);
    setForm(initialForm);
  };

  const updateField = (field, value) => {
    setForm((previous) => {
      const next = { ...previous, [field]: value };

      if (field === 'title' && !slugManuallyEdited) {
        next.slug = makeSlug(value);
      }

      return next;
    });
  };

  const handleTitleChange = (value) => {
    setForm((previous) => ({
      ...previous,
      title: value,
      slug: slugManuallyEdited ? previous.slug : makeSlug(value),
    }));
  };

  const handleSlugChange = (value) => {
    setSlugManuallyEdited(true);
    updateField('slug', makeSlug(value));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();


    if (!form.title.trim() || !form.slug.trim()) {
      setError('Judul dan slug wajib diisi.');
      return;
    }

    if (!form.content.trim()) {
      setError('Isi konten wajib diisi.');
      return;
    }

    const payload = new FormData();

    payload.append('title', form.title.trim());
    payload.append('slug', form.slug.trim());
    payload.append('category', activeTab);
    payload.append(
      'content_category',
      activeTab === 'berita' ? form.content_category.trim() : ''
    );
    payload.append('summary', form.summary.trim());
    payload.append('content', form.content);
    payload.append('status', form.status);

    if (form.published_at) {
      payload.append(
        'published_at',
        new Date(form.published_at).toISOString()
      );
    }

    if (form.image) {
      payload.append('image', form.image);
    }

    setSaving(true);
    setError('');

    try {
      const url = editingId
        ? `${API_URL}/posts/${editingId}`
        : `${API_URL}/posts`;

      const response = await adminFetch(url, {
        method: editingId ? 'PUT' : 'POST',
        body: payload,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan konten.');
      }

      setFormOpen(false);
      setEditingId(null);
      setForm(initialForm);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan konten.');
    } finally {
      setSaving(false);
    }
  };

  const handlePostStatus = async (item) => {
    const action = item.status === 'published' ? 'unpublish' : 'publish';
    const actionLabel = action === 'publish'
      ? 'mempublikasikan'
      : 'membatalkan publikasi';

    const confirmed = window.confirm(
      `Yakin ingin ${actionLabel} konten "${item.title}"?`
    );

    if (!confirmed) return;


    setUpdatingStatusId(item.id);
    setError('');

    try {
      const response = await adminFetch(`${API_URL}/posts/${item.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengubah status publikasi.');
      }

      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengubah status publikasi.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (item) => {
    if (item.status === 'published') {
      setError('Unpublish konten terlebih dahulu sebelum menghapus.');
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus ${activeTab} "${item.title}"? Data yang dihapus tidak dapat dikembalikan.`
    );

    if (!confirmed) return;


    setError('');

    try {
      const response = await adminFetch(`${API_URL}/posts/${item.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus konten.');
      }

      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus konten.');
    }
  };

  const openCreateFaqForm = () => {
    const nextOrder = faqs.length
      ? Math.max(...faqs.map((item) => Number(item.sort_order) || 0)) + 1
      : 1;

    setFaqEditingId(null);
    setFaqForm({ ...initialFaqForm, sort_order: nextOrder });
    setFaqFormOpen(true);
    setError('');
  };

  const openEditFaqForm = (item) => {
    if (item.status === 'published') {
      setError('Unpublish FAQ terlebih dahulu sebelum mengedit.');
      return;
    }

    setFaqEditingId(item.id);
    setFaqForm({
      category: item.category || 'Umum',
      question: item.question || '',
      answer: item.answer || '',
      status: item.status || 'draft',
      sort_order: item.sort_order ?? 1,
    });
    setFaqFormOpen(true);
    setError('');
  };

  const closeFaqForm = () => {
    if (faqSaving) return;
    setFaqFormOpen(false);
    setFaqEditingId(null);
    setFaqForm(initialFaqForm);
  };

  const updateFaqField = (field, value) => {
    setFaqForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleFaqSubmit = async (event) => {
    event.preventDefault();


    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      setError('Pertanyaan dan jawaban wajib diisi.');
      return;
    }

    const payload = {
      category: faqForm.category,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
      status: faqForm.status,
      sort_order: Number(faqForm.sort_order) || 1,
    };

    setFaqSaving(true);
    setError('');

    try {
      const url = faqEditingId
        ? `${API_URL}/faqs/${faqEditingId}`
        : `${API_URL}/faqs`;

      const response = await adminFetch(url, {
        method: faqEditingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan FAQ.');
      }

      setFaqFormOpen(false);
      setFaqEditingId(null);
      setFaqForm(initialFaqForm);
      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menyimpan FAQ.');
    } finally {
      setFaqSaving(false);
    }
  };

  const handleFaqStatus = async (item) => {
    const nextStatus = item.status === 'published' ? 'draft' : 'published';
    const actionLabel = nextStatus === 'published'
      ? 'mempublikasikan'
      : 'membatalkan publikasi';

    const confirmed = window.confirm(
      `Yakin ingin ${actionLabel} FAQ "${item.question}"?`
    );

    if (!confirmed) return;


    setUpdatingStatusId(item.id);
    setError('');

    try {
      const response = await adminFetch(`${API_URL}/faqs/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: item.category || 'Umum',
          question: item.question,
          answer: item.answer,
          status: nextStatus,
          sort_order: Number(item.sort_order) || 1,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengubah status publikasi FAQ.');
      }

      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengubah status FAQ.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleFaqDelete = async (item) => {
    if (item.status === 'published') {
      setError('Unpublish FAQ terlebih dahulu sebelum menghapus.');
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin menghapus FAQ "${item.question}"? Data yang dihapus tidak dapat dikembalikan.`
    );

    if (!confirmed) return;


    setError('');

    try {
      const response = await adminFetch(`${API_URL}/faqs/${item.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus FAQ.');
      }

      await fetchData();
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat menghapus FAQ.');
    }
  };

  return (
    <div className="space-y-5">
      {/* NAVIGASI INFORMASI */}
      <InformasiTabs
        activeTab={activeTab}
        onTabChange={(tabId) => {
          setFormOpen(false);
          setActiveTab(tabId);
          setError('');
        }}
      />

      {/* HEADER KONTEN */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#10C35D]">
            <CurrentIcon size={25} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#0a3d2e]">
              Manajemen {currentTab.label}
            </h3>
            <p className="text-sm text-gray-500">
              Kelola konten {currentTab.label.toLowerCase()} website UPA Bahasa.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Muat Ulang
          </button>

          {activeTab === 'faq' ? (
            <button
              type="button"
              onClick={openCreateFaqForm}
              className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0eaa50]"
            >
              <Plus size={17} />
              Tambah FAQ
            </button>
          ) : (
            <button
              type="button"
              onClick={openCreateForm}
              className="flex items-center gap-2 rounded-lg bg-[#10C35D] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0eaa50]"
            >
              <Plus size={17} />
              Tambah {currentTab.label}
            </button>
          )}
        </div>
      </div>

      {/* PESAN ERROR */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* FORM FAQ */}
      {activeTab === 'faq' && faqFormOpen && (
        <FaqForm
          faqEditingId={faqEditingId}
          closeFaqForm={closeFaqForm}
          faqSaving={faqSaving}
          handleFaqSubmit={handleFaqSubmit}
          faqForm={faqForm}
          updateFaqField={updateFaqField}
        />
      )}

      {/* FORM BERITA / PENGUMUMAN */}
      {formOpen && activeTab !== 'faq' && (
        <PostForm
          editingId={editingId}
          currentTab={currentTab}
          closeForm={closeForm}
          saving={saving}
          handleSubmit={handleSubmit}
          form={form}
          handleTitleChange={handleTitleChange}
          handleSlugChange={handleSlugChange}
          updateField={updateField}
          activeTab={activeTab}
          posts={posts}
        />
      )}

      {/* DAFTAR KONTEN */}
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="font-bold text-[#0a3d2e]">
            Daftar {currentTab.label}
          </h4>

          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            {activeTab === 'faq' ? faqs.length : filteredPosts.length} data
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-gray-500">
            Memuat data...
          </div>
        ) : activeTab === 'faq' ? (
          <FaqTable
            faqs={faqs}
            updatingStatusId={updatingStatusId}
            handleFaqStatus={handleFaqStatus}
            openEditFaqForm={openEditFaqForm}
            handleFaqDelete={handleFaqDelete}
          />
        ) : (
          <PostTable
            filteredPosts={filteredPosts}
            activeTab={activeTab}
            currentTab={currentTab}
            CurrentIcon={CurrentIcon}
            formatDate={formatDate}
            updatingStatusId={updatingStatusId}
            handlePostStatus={handlePostStatus}
            openEditForm={openEditForm}
            handleDelete={handleDelete}
          />
        )}
      </section>
    </div>
  );
}
