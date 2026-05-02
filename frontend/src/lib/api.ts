// API client for communicating with backend
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const normalizedApiUrl = rawApiUrl.replace(/\/$/, '');
const API_URL = normalizedApiUrl.startsWith('/') || normalizedApiUrl.startsWith('http')
  ? normalizedApiUrl
  : `/${normalizedApiUrl}`;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || `${API_URL}/api/v1`;
const BACKEND_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: 'include' | 'omit' | 'same-origin';
}

async function apiCall(endpoint: string, options: ApiOptions = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config: RequestInit = {
    method: options.method || 'GET',
    headers,
    credentials: 'include', // Important for cookies/session
    ...options,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API error: ${response.status}`);
  }

  // Handle empty responses
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return await response.json();
  }
  
  return null;
}

// Address/Village APIs
export const addressApi = {
  search: (q: string, state?: string, district?: string, subDist?: string, limit?: number, offset?: number) =>
    apiCall('/address/search', {
      method: 'GET',
    }).then(() => 
      fetch(`${API_BASE_URL}/address/search?q=${encodeURIComponent(q)}${state ? `&state=${encodeURIComponent(state)}` : ''}${district ? `&district=${encodeURIComponent(district)}` : ''}${subDist ? `&sub_district=${encodeURIComponent(subDist)}` : ''}${limit ? `&limit=${limit}` : ''}${offset ? `&offset=${offset}` : ''}`, { credentials: 'include' }).then(r => r.json())
    ),

  autocomplete: (q: string) =>
    fetch(`${API_BASE_URL}/address/autocomplete?q=${encodeURIComponent(q)}`, { credentials: 'include' }).then(r => r.json()),

  states: () =>
    fetch(`${API_BASE_URL}/address/states`, { credentials: 'include' }).then(r => r.json()),

  districts: (stateId: string) =>
    fetch(`${API_BASE_URL}/address/states/${encodeURIComponent(stateId)}/districts`, { credentials: 'include' }).then(r => r.json()),

  subDistricts: (subId: string) =>
    fetch(`${API_BASE_URL}/address/sub-districts/${encodeURIComponent(subId)}/villages`, { credentials: 'include' }).then(r => r.json()),

  hierarchy: () =>
    fetch(`${API_BASE_URL}/address/hierarchy`, { credentials: 'include' }).then(r => r.json()),
};

// Auth APIs (Session-based via NextAuth)
export const authApi = {
  signIn: (email: string, password: string) =>
    apiCall(`${BACKEND_URL}/auth/callback/credentials`, {
      method: 'POST',
      body: { email, password },
    }),

  signUp: (email: string, password: string) =>
    apiCall(`${BACKEND_URL}/auth/register`, {
      method: 'POST',
      body: { email, password },
    }),

  getSession: () =>
    fetch(`${BACKEND_URL}/auth/session`, { credentials: 'include' }).then(r => r.json()),

  signOut: () =>
    fetch(`${BACKEND_URL}/auth/signout`, { method: 'POST', credentials: 'include' }).then(r => r.json()),
};

// User/Profile APIs
export const userApi = {
  getProfile: (userId?: string) =>
    apiCall('/user-profile', {
      method: 'GET',
    }).then(() =>
      fetch(`${BACKEND_URL}/user-profile${userId ? `?uid=${userId}` : ''}`, { credentials: 'include' }).then(r => r.json())
    ),

  updateProfile: (updates: any) =>
    apiCall('/user-profile', {
      method: 'PUT',
      body: updates,
    }),
};

export default apiCall;
