import { useCallback, useEffect, useState } from 'react';
import {
  normalizeCmsPost,
  normalizeCmsFaq,
} from '../utils/informasiUtils';

const API_BASE_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/cms';

export default function useInformasiData() {
  const [posts, setPosts] = useState([]);
  const [faqs, setFaqs] = useState([]);

  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  const [postsError, setPostsError] = useState('');
  const [faqsError, setFaqsError] = useState('');

  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');

  const fetchPosts = useCallback(async (signal) => {
    try {
      setLoadingPosts(true);
      setPostsError('');

      const response = await fetch(`${API_BASE_URL}/posts`, {
        method: 'GET',
        signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil berita dan pengumuman.'
        );
      }

      const data = Array.isArray(result.data) ? result.data : [];
      setPosts(data.map(normalizeCmsPost));
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Fetch CMS Posts Error:', error);
      setPostsError(error.message || 'Gagal mengambil data informasi.');
      setPosts([]);
    } finally {
      if (!signal?.aborted) {
        setLoadingPosts(false);
      }
    }
  }, []);

  const fetchFaqs = useCallback(async (signal) => {
    try {
      setLoadingFaqs(true);
      setFaqsError('');

      const response = await fetch(`${API_BASE_URL}/faqs`, {
        method: 'GET',
        signal,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message || 'Gagal mengambil daftar pertanyaan.'
        );
      }

      const data = Array.isArray(result.data) ? result.data : [];
      setFaqs(data.map(normalizeCmsFaq));
    } catch (error) {
      if (error.name === 'AbortError') return;

      console.error('Fetch CMS FAQs Error:', error);
      setFaqsError(error.message || 'Gagal mengambil data FAQ.');
      setFaqs([]);
    } finally {
      if (!signal?.aborted) {
        setLoadingFaqs(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchPosts(controller.signal);
    fetchFaqs(controller.signal);

    return () => controller.abort();
  }, [fetchPosts, fetchFaqs]);

  const fetchPostBySlug = useCallback(async (slug) => {
    if (!slug) {
      throw new Error('Slug berita tidak valid.');
    }

    try {
      setLoadingDetail(true);
      setDetailError('');

      const response = await fetch(
        `${API_BASE_URL}/posts/${encodeURIComponent(slug)}`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            'Konten tidak tersedia atau sudah tidak dipublikasikan.'
        );
      }

      return normalizeCmsPost(result.data);
    } catch (error) {
      console.error('Fetch CMS Post Detail Error:', error);
      setDetailError(error.message || 'Gagal mengambil detail informasi.');
      throw error;
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const news = posts.filter((item) => item.type === 'Berita');
  const announcements = posts.filter(
    (item) => item.type === 'Pengumuman'
  );

  const refreshPosts = useCallback(() => fetchPosts(), [fetchPosts]);
  const refreshFaqs = useCallback(() => fetchFaqs(), [fetchFaqs]);

  return {
    posts,
    news,
    announcements,
    faqs,

    loadingPosts,
    loadingFaqs,

    postsError,
    faqsError,

    fetchPostBySlug,
    loadingDetail,
    detailError,

    refreshPosts,
    refreshFaqs,
  };
}
