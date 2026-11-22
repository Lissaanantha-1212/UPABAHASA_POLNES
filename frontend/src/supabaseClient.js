import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
    throw new Error(
        'VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY wajib dikonfigurasi.'
    );
}

export const supabase = createClient(
    supabaseUrl,
    supabasePublishableKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        }
    }
);

const PASSWORD_RECOVERY_KEY = 'upa-bahasa-password-recovery';
const PASSWORD_RECOVERY_MAX_AGE = 60 * 60 * 1000;

// Catat event pemulihan sejak client dibuat.
supabase.auth.onAuthStateChange((event, session) => {
    try {
        if (event === 'PASSWORD_RECOVERY' && session?.user?.id) {
            window.sessionStorage.setItem(
                PASSWORD_RECOVERY_KEY,
                JSON.stringify({
                    userId: session.user.id,
                    createdAt: Date.now()
                })
            );
        }

        if (event === 'SIGNED_OUT') {
            window.sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
        }
    } catch (error) {
        console.error('Password Recovery Marker Error:', error);
    }
});

// Periksa apakah session cocok dengan event pemulihan yang tercatat.
export const isPasswordRecoverySession = (session) => {
    if (!session?.user?.id || typeof window === 'undefined') {
        return false;
    }

    try {
        const rawMarker = window.sessionStorage.getItem(
            PASSWORD_RECOVERY_KEY
        );

        if (!rawMarker) {
            return false;
        }

        const marker = JSON.parse(rawMarker);
        const createdAt = Number(marker.createdAt);
        const age = Date.now() - createdAt;

        const isValid =
            marker.userId === session.user.id &&
            Number.isFinite(createdAt) &&
            age >= 0 &&
            age <= PASSWORD_RECOVERY_MAX_AGE;

        if (!isValid) {
            window.sessionStorage.removeItem(PASSWORD_RECOVERY_KEY);
        }

        return isValid;
    } catch (error) {
        console.error('Password Recovery Validation Error:', error);
        return false;
    }
};
