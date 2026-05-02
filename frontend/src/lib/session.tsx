// Session context for NextAuth integration
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface Session {
  user?: {
    id: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires?: string;
}

interface SessionCtx {
  session: Session | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionCtx>({
  session: null,
  loading: true,
  refreshSession: async () => {},
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const rawApiUrl = import.meta.env.VITE_API_URL ?? '/api';
      const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');
      const apiRoot = normalizedApiUrl.startsWith('/') || normalizedApiUrl.startsWith('http')
        ? normalizedApiUrl
        : `/${normalizedApiUrl}`;
      const apiBase = apiRoot.endsWith('/api') ? apiRoot : `${apiRoot}/api`;
      const response = await fetch(`${apiBase}/auth/session`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('Session fetch error:', err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    await fetchSession();
  };

  useEffect(() => {
    fetchSession();
    
    // Refresh session every 5 minutes
    const interval = setInterval(fetchSession, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <SessionContext.Provider value={{ session, loading, refreshSession }}>
      {children}
    </SessionContext.Provider>
  );
}
