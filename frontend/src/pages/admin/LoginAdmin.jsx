import { useEffect } from 'react';
import { clearAdminSession } from '../../adminSession';

export default function LoginAdmin() {
  useEffect(() => {
    clearAdminSession();
    sessionStorage.removeItem('active_user_app_id');
    sessionStorage.removeItem('active_user_app_email');
    window.location.replace('https://upabahasa.vercel.app/login.html');
  }, []);

  return null;
}