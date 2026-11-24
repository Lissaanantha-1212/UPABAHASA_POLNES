const API_URL = 'https://upabahasa-polnes-4p4a.vercel.app/api/admin';
const LOGIN_REDIRECT_URL = '/admin/login';

const REFRESH_BUFFER_MS = 60 * 1000;
const REFRESH_RETRY_MS = 30 * 1000;

let refreshPromise = null;
let refreshTimer = null;
let sessionVersion = 0;
let refreshPromiseVersion = null;

const notifySessionExpired = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('admin-session-expired'));
  }
};

export const clearAdminSession = (redirectToLogin = false) => {
  sessionVersion += 1;
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRefreshToken');
  localStorage.removeItem('adminTokenExpiresAt');
  localStorage.removeItem('adminUser');

  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('active_user_app_id');
    sessionStorage.removeItem('active_user_app_email');

    if (redirectToLogin) {
      window.location.replace(LOGIN_REDIRECT_URL);
    }
  }
};

export const logoutAdminToCustomLogin = () => {
  clearAdminSession(true);
};

export const saveAdminSession = (session) => {
  localStorage.setItem('adminToken', session.token);
  localStorage.setItem('adminRefreshToken', session.refreshToken || '');
  localStorage.setItem(
    'adminTokenExpiresAt',
    session.expiresAt ? String(session.expiresAt) : ''
  );

  if (session.user) {
    localStorage.setItem('adminUser', JSON.stringify(session.user));
  }

  scheduleAdminRefresh();
};

const scheduleRetry = () => {
  if (refreshTimer) clearTimeout(refreshTimer);

  refreshTimer = setTimeout(async () => {
    refreshTimer = null;

    const result = await refreshAdminSession();

    if (!result.ok && result.reason === 'temporary') {
      scheduleRetry();
    }
  }, REFRESH_RETRY_MS);
};

const scheduleAdminRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }

  const expiresAt = Number(
    localStorage.getItem('adminTokenExpiresAt')
  );

  if (!expiresAt || !Number.isFinite(expiresAt)) return;

  const delay = Math.max(
    1000,
    expiresAt * 1000 - Date.now() - REFRESH_BUFFER_MS
  );

  refreshTimer = setTimeout(async () => {
    refreshTimer = null;

    const result = await refreshAdminSession();

    if (!result.ok && result.reason === 'temporary') {
      scheduleRetry();
    }
  }, Math.min(delay, 2147483647));
};

const refreshAdminSession = async () => {
  const currentVersion = sessionVersion;

  if (
    refreshPromise &&
    refreshPromiseVersion === currentVersion
  ) {
    return refreshPromise;
  }

  const promise = (async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');

    if (!refreshToken) {
      if (currentVersion !== sessionVersion) {
        return {
          ok: false,
          reason: 'cancelled'
        };
      }

      clearAdminSession();
      notifySessionExpired();

      return {
        ok: false,
        reason: 'revoked'
      };
    }

    let response;

    try {
      response = await fetch(`${API_URL}/refresh-supabase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refreshToken })
      });
    } catch (error) {
      if (currentVersion !== sessionVersion) {
        return {
          ok: false,
          reason: 'cancelled'
        };
      }

      console.error('Koneksi refresh sesi gagal:', error);

      return {
        ok: false,
        reason: 'temporary'
      };
    }

    const result = await response.json().catch(() => null);

    if (currentVersion !== sessionVersion) {
      return {
        ok: false,
        reason: 'cancelled'
      };
    }

    if (
      response.ok &&
      result?.success &&
      result.data?.token &&
      result.data?.refreshToken
    ) {
      saveAdminSession(result.data);

      return {
        ok: true
      };
    }

    if (response.status === 401 || response.status === 403) {
      clearAdminSession();
      notifySessionExpired();

      return {
        ok: false,
        reason: 'revoked'
      };
    }

    console.error(
      'Refresh sesi belum berhasil:',
      result?.message || `HTTP ${response.status}`
    );

    return {
      ok: false,
      reason: 'temporary'
    };
  })();

  refreshPromise = promise;
  refreshPromiseVersion = currentVersion;

  try {
    return await promise;
  } finally {
    if (refreshPromise === promise) {
      refreshPromise = null;
      refreshPromiseVersion = null;
    }
  }
};

const verifyAdminSession = async () => {
  const token = localStorage.getItem('adminToken');

  if (!token) return false;

  let response;

  try {
    response = await fetch(`${API_URL}/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Pemeriksaan sesi gagal:', error);
    throw new Error('Tidak dapat menghubungi server backend.');
  }

  if (response.ok) return true;

  if (response.status === 401) return false;

  if (response.status === 403) {
    throw new Error(
      'Akses Admin ditolak. Periksa status akun dan hak akses.'
    );
  }

  throw new Error('Server sedang mengalami gangguan.');
};

export const ensureAdminSession = async () => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const uidFromUrl = params.get('uid');
    if (uidFromUrl) {
      sessionStorage.setItem('active_user_app_id', uidFromUrl);
      return true;
    }
    if (sessionStorage.getItem('active_user_app_id')) {
      return true;
    }
  }

  let token = localStorage.getItem('adminToken');
  const refreshToken = localStorage.getItem('adminRefreshToken');

  if (!token && !refreshToken) return false;

  const expiresAt = Number(
    localStorage.getItem('adminTokenExpiresAt')
  );

  if (
    !token ||
    (expiresAt > 0 &&
      expiresAt * 1000 <= Date.now() + REFRESH_BUFFER_MS)
  ) {
    const refreshed = await refreshAdminSession();

    if (!refreshed.ok) {
      if (refreshed.reason === 'revoked') return false;

      throw new Error('Refresh sesi gagal sementara. Silakan coba lagi.');
    }

    token = localStorage.getItem('adminToken');
  }

  const valid = await verifyAdminSession();

  if (valid) {
    scheduleAdminRefresh();
    return true;
  }

  const refreshed = await refreshAdminSession();

  if (!refreshed.ok) {
    if (refreshed.reason === 'revoked') return false;

    throw new Error('Refresh sesi gagal sementara. Silakan coba lagi.');
  }

  const retry = await verifyAdminSession();

  if (!retry) {
    clearAdminSession();
    notifySessionExpired();
    return false;
  }

  scheduleAdminRefresh();
  return true;
};

export const adminFetch = async (input, init = {}) => {
  const expiresAt = Number(
    localStorage.getItem('adminTokenExpiresAt')
  );

  if (
    expiresAt > 0 &&
    expiresAt * 1000 <= Date.now() + REFRESH_BUFFER_MS
  ) {
    const refreshed = await refreshAdminSession();

    if (!refreshed.ok && refreshed.reason === 'temporary') {
      console.warn('Refresh tertunda karena gangguan sementara.');
    }
  }

  const sendRequest = () => {
    const headers = new Headers(init.headers || {});
    const token = localStorage.getItem('adminToken');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      headers.delete('Authorization');
    }

    return fetch(input, {
      ...init,
      headers
    });
  };

  const response = await sendRequest();

  if (response.status !== 401) {
    return response;
  }

  const refreshed = await refreshAdminSession();

  if (!refreshed.ok) {
    return response;
  }

  return sendRequest();
};