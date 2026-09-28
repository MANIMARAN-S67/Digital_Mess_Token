// Use standard fetch wrapped nicely, or just plain fetch functions.
// Creating a helper API object.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const config: RequestInit = {
    ...options,
    headers
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }
  return data;
};

const api = {
  get: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint: string, body: any, options?: RequestInit) => request(endpoint, { ...options, method: 'POST', body: JSON.stringify(body) }),
  patch: (endpoint: string, body: any, options?: RequestInit) => request(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(body) }),
  delete: (endpoint: string, options?: RequestInit) => request(endpoint, { ...options, method: 'DELETE' })
};

export default api;
