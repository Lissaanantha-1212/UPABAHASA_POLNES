import { useEffect } from 'react';
import { clearAdminSession } from '../../adminSession';

export default function LoginAdmin() {
  useEffect(() => {
    clearAdminSession();
    window.location.replace('https://upabahasa.vercel.app/login.html');
  }, []);

  return null;
}