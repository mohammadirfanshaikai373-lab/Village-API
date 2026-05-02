import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface Profile {
  id: string;
  email: string;
  company_name: string;
  role: 'user' | 'admin';
  plan_id: number;
  is_active: boolean;
}

interface AuthCtx {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; redirectTo?: string }>;
  signUp: (email: string, password: string, companyName: string) => Promise<{ error: string | null; redirectTo?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  profile: null,
  loading: true,
  signIn: async () => ({ error: null, redirectTo: '/portal' }),
  signUp: async () => ({ error: null, redirectTo: '/portal' }),
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(Ctx);

// 👇 Change this to match your backend API prefix
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000/api';
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || window.location.origin;

// Helper: fetch JSON safely, returns null if not JSON (e.g. HTML)
async function safeFetchJson(url: string, options?: RequestInit) {
  const res = await fetch(url, { credentials: 'include', ...options });
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  console.warn(`Non-JSON response from ${url}:`, text.slice(0, 200));
  return null;
}

// Fetch CSRF token from NextAuth
async function fetchCsrfToken(): Promise<string> {
  const data = await safeFetchJson(`${BACKEND_URL}/auth/csrf`);
  return data?.csrfToken || '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId?: string) => {
    try {
      const url = userId
        ? `${BACKEND_URL}/user-profile?uid=${userId}`
        : `${BACKEND_URL}/user-profile`;
      const data = await safeFetchJson(url);
      if (data && !data.error) setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  const fetchSession = async () => {
    try {
      const data = await safeFetchJson(`${BACKEND_URL}/auth/session`);
      if (data?.user) {
        setUser(data.user);
        await fetchProfile(data.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Session fetch error:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const csrfToken = await fetchCsrfToken();
      const res = await fetch(`${BACKEND_URL}/auth/callback/credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        // 🔑 This is the magic – tell NextAuth to NOT redirect
        body: JSON.stringify({ email, password, csrfToken, redirect: false }),
      });

      // NextAuth should return JSON (because of redirect: false)
      const data = await res.json().catch(() => null);

      if (!res.ok || data?.error) {
        return { error: data?.error || `Sign in failed (${res.status})` };
      }

      // Refresh our session (ignore errors – we still want to redirect)
      try {
        await fetchSession();
      } catch {}

      // ✅ Redirect to the frontend portal
      return { error: null, redirectTo: '/portal' };
    } catch (err: any) {
      return { error: err.message || 'Sign in failed' };
    }
  };

  const signUp = async (email: string, password: string, companyName: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: companyName, email, password, role: 'customer' }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || data?.error) {
        return { error: data?.error || `Sign up failed (${res.status})` };
      }

      // Auto‑login after registration
      const loginResult = await signIn(email, password);
      if (loginResult.error) {
        return { error: `Registered but sign in failed: ${loginResult.error}` };
      }

      return { error: null, redirectTo: '/portal' };
    } catch (err: any) {
      return { error: err.message || 'Sign up failed' };
    }
  };

  const signOut = async () => {
    try {
      const csrfToken = await fetchCsrfToken();
      await fetch(`${BACKEND_URL}/auth/signout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ csrfToken }),
      });
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setUser(null);
      setProfile(null);
      window.location.href = `${FRONTEND_URL}/auth`;
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  return (
    <Ctx.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}