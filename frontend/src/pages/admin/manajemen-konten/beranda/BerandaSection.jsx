import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { adminFetch } from '../../../../adminSession';
import HeroForm from './components/HeroForm';
import ProfilSingkatForm from './components/ProfilSingkatForm';
import BeritaPilihanForm from './components/BeritaPilihanForm';
import GaleriPilihanForm from './components/GaleriPilihanForm';
import BerandaTabs from './components/BerandaTabs';

const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/cms/admin';

const SETTING_KEYS = {
  heroTitle: 'beranda_hero_title',
  heroDescription: 'beranda_hero_description',
  profileTitle: 'beranda_profil_title',
  profileDescription: 'beranda_profil_description',
  profileImage: 'beranda_profil_image',
  featuredPosts: 'beranda_berita_pilihan',
  featuredGalleries: 'beranda_galeri_pilihan',
};

const defaultProfile = {
  title: '',
  description: '',
  image_path: '',
  image: null,
};

async function readResponse(response) {
  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.success === false) {
    throw new Error(result.message || 'Permintaan ke server gagal.');
  }

  return result;
}

function sortPostsByDate(posts) {
  return [...posts].sort((a, b) => {
    const dateA = new Date(a.published_at || a.created_at || 0).getTime();
    const dateB = new Date(b.published_at || b.created_at || 0).getTime();
    return dateB - dateA;
  });
}

export default function BerandaSection() {
  const [activeTab, setActiveTab] = useState('hero');
  const [hero, setHero] = useState({
    id: null,
    image_path: '',
    overlay_color: '#0a3d2e',
    title: '',
    description: '',
  });

  const [profile, setProfile] = useState(defaultProfile);
  const [posts, setPosts] = useState([]);
  const [selectedPostIds, setSelectedPostIds] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [selectedGalleryIds, setSelectedGalleryIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingHero, setSavingHero] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPosts, setSavingPosts] = useState(false);
  const [savingGalleries, setSavingGalleries] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');


  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');

    try {


      const [heroResponse, settingsResponse, postsResponse, galleriesResponse] = await Promise.all([
        adminFetch(`${API_URL}/hero`),
        adminFetch(`${API_URL}/site-settings`),
        adminFetch(`${API_URL}/posts`),
        adminFetch(`${API_URL}/galleries`),
      ]);

      const [heroResult, settingsResult, postsResult, galleriesResult] = await Promise.all([
        readResponse(heroResponse),
        readResponse(settingsResponse),
        readResponse(postsResponse),
        readResponse(galleriesResponse),
      ]);

      const heroRows = Array.isArray(heroResult.data)
        ? heroResult.data
        : [];

      const currentHero =
        heroRows.find((item) => item.page_name === 'home' && item.is_active) ||
        heroRows.find((item) => item.is_active) ||
        heroRows[0] ||
        null;

      const settings = Array.isArray(settingsResult.data)
        ? settingsResult.data
        : [];

      const settingMap = Object.fromEntries(
        settings.map((item) => [item.setting_key, item.setting_value || ''])
      );

      const publishedPosts = sortPostsByDate(
        (Array.isArray(postsResult.data) ? postsResult.data : [])
          .filter((item) => item.status === 'published')
      );

      setPosts(publishedPosts);

      const selectedSettingExists = settings.some(
        (item) => item.setting_key === SETTING_KEYS.featuredPosts
      );

      if (selectedSettingExists) {
        try {
          const parsed = JSON.parse(
            settingMap[SETTING_KEYS.featuredPosts] || '[]'
          );

          const validIds = Array.isArray(parsed)
            ? parsed.map(Number).filter((id) =>
                publishedPosts.some((post) => Number(post.id) === id)
              )
            : [];

          setSelectedPostIds([...new Set(validIds)]);
        } catch {
          setSelectedPostIds([]);
        }
      } else {
        setSelectedPostIds(
          publishedPosts.slice(0, 3).map((item) => Number(item.id))
        );
      }
      const publishedGalleries = (
        Array.isArray(galleriesResult.data) ? galleriesResult.data : []
      )
        .filter((item) => item.status === 'published')
        .sort((a, b) => {
          const dateA = new Date(a.event_date || 0).getTime();
          const dateB = new Date(b.event_date || 0).getTime();
          return dateB - dateA;
        });

      setGalleries(publishedGalleries);

      const gallerySettingExists = settings.some(
        (item) => item.setting_key === SETTING_KEYS.featuredGalleries
      );

      if (gallerySettingExists) {
        try {
          const parsed = JSON.parse(
            settingMap[SETTING_KEYS.featuredGalleries] || '[]'
          );

          const validIds = Array.isArray(parsed)
            ? parsed.map(Number).filter((id) =>
                publishedGalleries.some(
                  (gallery) => Number(gallery.id) === id
                )
              )
            : [];

          setSelectedGalleryIds([...new Set(validIds)]);
        } catch {
          setSelectedGalleryIds([]);
        }
      } else {
        setSelectedGalleryIds(
          publishedGalleries.slice(0, 3).map((item) => Number(item.id))
        );
      }

      setHero({
        id: currentHero?.id || null,
        image_path: currentHero?.image_path || '',
        overlay_color: currentHero?.overlay_color || '#0a3d2e',
        title: settingMap[SETTING_KEYS.heroTitle] || '',
        description: settingMap[SETTING_KEYS.heroDescription] || '',
      });

      setProfile({
        title: settingMap[SETTING_KEYS.profileTitle] || '',
        description: settingMap[SETTING_KEYS.profileDescription] || '',
        image_path: settingMap[SETTING_KEYS.profileImage] || '',
        image: null,
      });
    } catch (err) {
      setError(err.message || 'Gagal mengambil data Beranda.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage('');
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]);

  const saveSetting = async (settingKey, settingValue, settingType = 'text') => {
    const response = await adminFetch(`${API_URL}/site-settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        setting_key: settingKey,
        setting_value: settingValue,
        setting_type: settingType,
      }),
    });

    return readResponse(response);
  };

  const handleSaveHero = async (formData) => {
    setSavingHero(true);
    setError('');
    setMessage('');

    try {


      if (formData.image || !hero.id) {
        const body = new FormData();

        body.append('page_name', 'home');
        body.append('overlay_color', formData.overlay_color);
        body.append('is_active', 'true');

        if (formData.image) {
          body.append('image', formData.image);
        }

        const method = hero.id ? 'PUT' : 'POST';
        const endpoint = hero.id
          ? `${API_URL}/hero/${hero.id}`
          : `${API_URL}/hero`;

        const response = await adminFetch(endpoint, {
          method,
          body,
        });

        const result = await readResponse(response);

        if (result.data) {
          setHero((previous) => ({
            ...previous,
            id: result.data.id || previous.id,
            image_path: result.data.image_path || previous.image_path,
            overlay_color:
              result.data.overlay_color || formData.overlay_color,
          }));
        }
      } else {
        const response = await adminFetch(`${API_URL}/hero/${hero.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            overlay_color: formData.overlay_color,
          }),
        });

        await readResponse(response);
      }

      await Promise.all([
        saveSetting(SETTING_KEYS.heroTitle, formData.title),
        saveSetting(SETTING_KEYS.heroDescription, formData.description),
      ]);

      await loadData();
      setMessage('Pengaturan Cover berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pengaturan Cover.');
    } finally {
      setSavingHero(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    setMessage('');

    try {
      // Upload foto jika admin memilih foto baru.
      let updatedImagePath = profile.image_path;

      if (profile.image) {
        const body = new FormData();
        body.append('image', profile.image);

        const uploadResponse = await adminFetch(`${API_URL}/profile-image`, {
          method: 'PUT',
          body,
        });

        const uploadResult = await readResponse(uploadResponse);

        updatedImagePath =
          uploadResult.data?.image || updatedImagePath;
      }

      // Simpan judul dan deskripsi.
      await Promise.all([
        saveSetting(SETTING_KEYS.profileTitle, profile.title),
        saveSetting(SETTING_KEYS.profileDescription, profile.description),
      ]);

      // Perbarui state setelah seluruh proses berhasil.
      setProfile((previous) => ({
        ...previous,
        image_path: updatedImagePath,
        image: null,
      }));

      setMessage('Profil Singkat berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan Profil Singkat.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveFeaturedPosts = async () => {
    setSavingPosts(true);
    setError('');
    setMessage('');

    try {
      const validIds = selectedPostIds.filter((id) =>
        posts.some((post) => Number(post.id) === Number(id))
      );

      await saveSetting(
        SETTING_KEYS.featuredPosts,
        JSON.stringify(validIds),
        'json'
      );

      setSelectedPostIds(validIds);
      setMessage('Pilihan dan urutan berita berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pilihan berita.');
    } finally {
      setSavingPosts(false);
    }
  };

  const handleSaveFeaturedGalleries = async () => {
    setSavingGalleries(true);
    setError('');
    setMessage('');

    try {
      const validIds = selectedGalleryIds.filter((id) =>
        galleries.some((gallery) => Number(gallery.id) === Number(id))
      );

      await saveSetting(
        SETTING_KEYS.featuredGalleries,
        JSON.stringify(validIds),
        'json'
      );

      setSelectedGalleryIds(validIds);
      setMessage('Pilihan dan urutan galeri berhasil disimpan.');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan pilihan galeri.');
    } finally {
      setSavingGalleries(false);
    }
  };
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Memuat pengaturan Beranda...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
       
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-6 top-6 z-[100] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 text-sm font-medium text-green-700 shadow-lg"
        >
          <CheckCircle2 size={21} className="shrink-0 text-green-600" />
          <span>{message}</span>
        </div>
      )}

      <BerandaTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'hero' && (
        <HeroForm
          key={hero.id || 'new-hero'}
          data={hero}
          onSave={handleSaveHero}
          saving={savingHero}
        />
      )}

      {activeTab === 'profil' && (
        <ProfilSingkatForm
          data={profile}
          onChange={handleProfileChange}
          onSave={handleSaveProfile}
          saving={savingProfile}
        />
      )}

      {activeTab === 'berita' && (
        <BeritaPilihanForm
          posts={posts}
          selectedIds={selectedPostIds}
          onChange={setSelectedPostIds}
          onSave={handleSaveFeaturedPosts}
          saving={savingPosts}
        />
      )}
      {activeTab === 'galeri' && (
        <GaleriPilihanForm
          galleries={galleries}
          selectedIds={selectedGalleryIds}
          onChange={setSelectedGalleryIds}
          onSave={handleSaveFeaturedGalleries}
          saving={savingGalleries}
        />
      )}
</div>
  );
}






