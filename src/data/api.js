// API Configuration - Local server
const BASE_URL = 'http://localhost:3001/api';

// Helper to get auth token
const getAuthToken = () => localStorage.getItem('authToken');

// Helper to get headers with auth
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Handle API response
const handleResponse = async response => {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  return response.json();
};

export const Api = {
  // Get base URL for external access
  getBaseUrl() {
    return BASE_URL;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!getAuthToken();
  },

  // Generic GET request
  async get(endpoint, requireAuth = true) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: getHeaders(requireAuth),
    });
    return handleResponse(response);
  },

  // Generic POST request
  async post(endpoint, data, requireAuth = true) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(requireAuth),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Generic PUT request
  async put(endpoint, data, requireAuth = true) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: getHeaders(requireAuth),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  // Generic DELETE request
  async delete(endpoint, requireAuth = true) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(requireAuth),
    });
    return handleResponse(response);
  },

  // ==================== AUTH ENDPOINTS ====================
  auth: {
    async login(email, password) {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await handleResponse(response);

      // Store token and user data
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }

      return data;
    },

    async register(name, email, password) {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await handleResponse(response);

      // Store token and user data
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('currentUser', JSON.stringify(data.user));
      }

      return data;
    },

    logout() {
      localStorage.removeItem('authToken');
      localStorage.removeItem('currentUser');
    },

    getCurrentUser() {
      const user = localStorage.getItem('currentUser');
      return user ? JSON.parse(user) : null;
    },

    isLoggedIn() {
      return !!getAuthToken() && !!localStorage.getItem('currentUser');
    },
  },

  // ==================== USER/DASHBOARD ENDPOINTS ====================
  user: {
    async getDashboard() {
      return Api.get('/user/dashboard');
    },

    async updateSettings(settings) {
      return Api.put('/settings', settings);
    },
  },

  // ==================== SESSIONS ENDPOINTS ====================
  sessions: {
    async getAll() {
      return Api.get('/sessions');
    },

    async create(sessionData) {
      return Api.post('/sessions', sessionData);
    },

    async update(id, sessionData) {
      return Api.put(`/sessions/${id}`, sessionData);
    },

    async delete(id) {
      return Api.delete(`/sessions/${id}`);
    },

    async start(id) {
      return Api.post(`/sessions/${id}/start`, {});
    },

    async complete(id) {
      return Api.post(`/sessions/${id}/complete`, {});
    },
  },

  // ==================== NOTES ENDPOINTS ====================
  notes: {
    async getAll(category = 'all') {
      const query = category !== 'all' ? `?category=${category}` : '';
      return Api.get(`/notes${query}`);
    },

    async create(noteData) {
      return Api.post('/notes', noteData);
    },

    async update(id, noteData) {
      return Api.put(`/notes/${id}`, noteData);
    },

    async delete(id) {
      return Api.delete(`/notes/${id}`);
    },
  },

  // ==================== BOOKS ENDPOINTS ====================
  books: {
    async getAll() {
      return Api.get('/books');
    },

    async create(bookData) {
      return Api.post('/books', bookData);
    },

    async update(id, bookData) {
      return Api.put(`/books/${id}`, bookData);
    },

    async delete(id) {
      return Api.delete(`/books/${id}`);
    },

    async toggleStatus(id) {
      return Api.post(`/books/${id}/toggle`, {});
    },
  },

  // ==================== TIMERS ENDPOINTS ====================
  timers: {
    async getAll() {
      return Api.get('/timers');
    },

    async create(timerData) {
      return Api.post('/timers', timerData);
    },

    async complete(id) {
      return Api.post(`/timers/${id}/complete`, {});
    },
  },

  // ==================== STATS ENDPOINTS ====================
  stats: {
    async getWeekly() {
      return Api.get('/stats/weekly');
    },
  },

  // ==================== HEALTH CHECK ====================
  async healthCheck() {
    try {
      const response = await fetch(`${BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
};
