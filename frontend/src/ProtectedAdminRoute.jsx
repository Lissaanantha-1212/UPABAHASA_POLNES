import React from 'react';

export default function ProtectedAdminRoute({ children }) {
  const params = new URLSearchParams(window.location.search);
  const uidFromUrl = params.get('uid');

  if (uidFromUrl) {
    sessionStorage.setItem('active_user_app_id', uidFromUrl);
  }

  const activeUid = uidFromUrl || sessionStorage.getItem('active_user_app_id');
  const adminToken = localStorage.getItem('adminToken');

  if (!activeUid && !adminToken) {
    window.location.replace('https://upabahasa.vercel.app/login.html');
    return null;
  }

  return children;
}