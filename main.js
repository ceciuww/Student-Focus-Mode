// Import service worker dan notifikasi
import { NotificationManager } from './src/js/notification.js';
import { OfflineManager } from './src/js/offline.js';
import './src/styles/responsive.css';
import './src/styles/styles.css';

// Tambahkan di bagian atas main.js
const API_BASE_URL = 'http://localhost:3001/api';
let authToken = null;

// Fungsi helper untuk API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Update fungsi login/register di main.js untuk menggunakan API

// Inisialisasi Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

// Inisialisasi Notifikasi
async function initializeNotifications() {
  try {
    await NotificationManager.requestPermission();
    console.log('Notification permission granted');
  } catch (error) {
    console.log('Notification permission denied');
  }
}

// Panggil inisialisasi notifikasi
initializeNotifications();

// Simple authentication state
let currentUser = null;

// Check if user is logged in
function checkAuth() {
  try {
    const userStr = localStorage.getItem('currentUser');
    const token = localStorage.getItem('authToken');

    if (userStr) {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        currentUser = user;
        if (token) {
          authToken = token;
        }
        showMainApp();
        return;
      }
    }
    // No valid user found
    showAuthPage();
  } catch (error) {
    console.error('Error checking auth:', error);
    // Clear corrupted data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    showAuthPage();
  }
}

// Show authentication page dengan soft blue theme
function showAuthPage() {
  document.getElementById('auth-container').classList.remove('hidden');
  document.getElementById('app').classList.add('hidden');
  document.getElementById('loading-indicator').classList.add('hidden');

  document.getElementById('auth-container').innerHTML = `
    <div class="auth-container" style="background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);">
      <div class="auth-card" style="background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(20px); border: 1px solid rgba(187, 222, 251, 0.3);">
        <div class="logo" style="text-align: center; margin-bottom: 2rem;">
          <i class="fas fa-brain" style="font-size: 3rem; background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
          <h2 style="margin-top: 1rem; font-weight: 700; color: #1565c0;">FocusMode</h2>
          <p style="color: #546e7a; margin-top: 0.5rem;">Premium Learning Experience</p>
        </div>
        
        <div class="auth-tabs" style="background: rgba(187, 222, 251, 0.3); border-radius: 50px; padding: 5px; backdrop-filter: blur(10px);">
          <div class="auth-tab active" data-tab="login" style="color: #1565c0;">Login</div>
          <div class="auth-tab" data-tab="register" style="color: #1565c0;">Register</div>
        </div>
        
        <form id="loginForm" class="auth-form active">
          <div class="form-group">
            <label for="email" style="color: #1565c0; font-weight: 600;">Email</label>
            <input type="email" id="email" placeholder="Masukkan email Anda" required 
                   style="border: 2px solid #bbdefb; border-radius: 12px; padding: 0.8rem 1rem; font-size: 1rem; transition: all 0.3s ease; background: white;">
          </div>
          <div class="form-group">
            <label for="password" style="color: #1565c0; font-weight: 600;">Password</label>
            <input type="password" id="password" placeholder="Masukkan password Anda" required 
                   style="border: 2px solid #bbdefb; border-radius: 12px; padding: 0.8rem 1rem; font-size: 1rem; transition: all 0.3s ease; background: white;">
          </div>
          <button type="submit" class="btn" style="width: 100%; background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); color: white; border: none; border-radius: 50px; padding: 1rem 2rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease;">Login</button>
          <div class="form-footer">
            <p style="color: #546e7a;">Belum punya akun? <a href="#" id="switchToRegister" style="color: #1976d2; text-decoration: none; font-weight: 500;">Daftar di sini</a></p>
          </div>
        </form>
        
        <form id="registerForm" class="auth-form">
          <div class="form-group">
            <label for="regName" style="color: #1565c0; font-weight: 600;">Nama Lengkap</label>
            <input type="text" id="regName" placeholder="Masukkan nama lengkap" required 
                   style="border: 2px solid #bbdefb; border-radius: 12px; padding: 0.8rem 1rem; font-size: 1rem; transition: all 0.3s ease; background: white;">
          </div>
          <div class="form-group">
            <label for="regEmail" style="color: #1565c0; font-weight: 600;">Email</label>
            <input type="email" id="regEmail" placeholder="Masukkan email Anda" required 
                   style="border: 2px solid #bbdefb; border-radius: 12px; padding: 0.8rem 1rem; font-size: 1rem; transition: all 0.3s ease; background: white;">
          </div>
          <div class="form-group">
            <label for="regPassword" style="color: #1565c0; font-weight: 600;">Password</label>
            <input type="password" id="regPassword" placeholder="Buat password (min. 6 karakter)" required minlength="6" 
                   style="border: 2px solid #bbdefb; border-radius: 12px; padding: 0.8rem 1rem; font-size: 1rem; transition: all 0.3s ease; background: white;">
          </div>
          <div class="form-group">
            <label for="regConfirmPassword" style="color: #1565c0; font-weight: 600;">Konfirmasi Password</label>
            <input type="password" id="regConfirmPassword" placeholder="Konfirmasi password Anda" required 
                   style="border: 2px solid #bbdefb; border-radius: 12px; padding: 0.8rem 1rem; font-size: 1rem; transition: all 0.3s ease; background: white;">
          </div>
          <button type="submit" class="btn" style="width: 100%; background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%); color: white; border: none; border-radius: 50px; padding: 1rem 2rem; font-weight: 700; cursor: pointer; transition: all 0.3s ease;">Daftar</button>
          <div class="form-footer">
            <p style="color: #546e7a;">Sudah punya akun? <a href="#" id="switchToLogin" style="color: #1976d2; text-decoration: none; font-weight: 500;">Login di sini</a></p>
          </div>
        </form>
      </div>
    </div>
  `;

  // Add hover effects for inputs
  const style = document.createElement('style');
  style.textContent = `
    .auth-container input:focus {
      outline: none;
      border-color: #1976d2 !important;
      box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.1) !important;
    }
    
    .auth-tab.active {
      background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%) !important;
      color: white !important;
      box-shadow: 0 4px 15px rgba(25, 118, 210, 0.3) !important;
    }
    
    .auth-tab {
      transition: all 0.3s ease !important;
    }
    
    .auth-tab:hover:not(.active) {
      background: rgba(25, 118, 210, 0.1) !important;
    }
    
    .btn:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 25px rgba(25, 118, 210, 0.4) !important;
    }
    
    a:hover {
      text-decoration: underline !important;
    }
  `;
  document.head.appendChild(style);

  // Tab switching
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      switchAuthTab(tabName);
    });
  });

  document.getElementById('switchToRegister').addEventListener('click', e => {
    e.preventDefault();
    switchAuthTab('register');
  });

  document.getElementById('switchToLogin').addEventListener('click', e => {
    e.preventDefault();
    switchAuthTab('login');
  });

  // Handle login
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      // Try API login first
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: { email, password },
      });

      authToken = data.token;
      localStorage.setItem('authToken', data.token);
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      showMainApp();
      NotificationManager.show('Selamat Datang!', {
        body: `Halo ${currentUser.name}, selamat belajar!`,
        icon: '/icons/icon-192x192.png',
      });
    } catch (error) {
      console.warn('API login failed, trying local login:', error.message);
      // Fallback to local login
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const user = users.find(
        u => u.email === email && u.password === password
      );

      if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        NotificationManager.show('Selamat Datang!', {
          body: `Halo ${user.name}, selamat belajar!`,
          icon: '/icons/icon-192x192.png',
        });
      } else {
        showToast('Email atau password salah!', 'error');
      }
    }
  });

  // Handle register
  document
    .getElementById('registerForm')
    .addEventListener('submit', async e => {
      e.preventDefault();
      const name = document.getElementById('regName').value.trim();
      const email = document.getElementById('regEmail').value.trim();
      const password = document.getElementById('regPassword').value;
      const confirmPassword =
        document.getElementById('regConfirmPassword').value;

      if (password !== confirmPassword) {
        showToast('Password dan konfirmasi tidak cocok!', 'error');
        return;
      }

      if (password.length < 6) {
        showToast('Password harus minimal 6 karakter!', 'error');
        return;
      }

      try {
        // Try API registration first
        const data = await apiCall('/auth/register', {
          method: 'POST',
          body: { name, email, password },
        });

        authToken = data.token;
        localStorage.setItem('authToken', data.token);
        currentUser = data.user;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        showToast('Akun berhasil dibuat!', 'success');
        NotificationManager.show('Akun Berhasil Dibuat!', {
          body: `Selamat ${name}, akun premium Anda telah aktif!`,
          icon: '/icons/icon-192x192.png',
        });
      } catch (error) {
        console.warn(
          'API registration failed, trying local registration:',
          error.message
        );

        // Check if error is about existing user
        if (
          error.message.includes('exists') ||
          error.message.includes('terdaftar')
        ) {
          showToast('Email sudah terdaftar!', 'error');
          return;
        }

        // Fallback to local registration
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.find(u => u.email === email)) {
          showToast('Email sudah terdaftar!', 'error');
          return;
        }

        const newUser = {
          id: Date.now(),
          name,
          email,
          password,
          avatar: name.charAt(0).toUpperCase(),
          createdAt: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showMainApp();
        showToast('Akun berhasil dibuat (offline)!', 'success');
        NotificationManager.show('Akun Berhasil Dibuat!', {
          body: `Selamat ${name}, akun premium Anda telah aktif!`,
          icon: '/icons/icon-192x192.png',
        });
      }
    });
}

function switchAuthTab(tabName) {
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
  });
  document
    .getElementById('loginForm')
    .classList.toggle('active', tabName === 'login');
  document
    .getElementById('registerForm')
    .classList.toggle('active', tabName === 'register');
}

// Show main application
function showMainApp() {
  document.getElementById('auth-container').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('loading-indicator').classList.add('hidden');

  const userProfile = document.getElementById('user-profile');
  if (userProfile) {
    document.getElementById('user-name').textContent = currentUser.name;
    document.getElementById(
      'user-avatar'
    ).innerHTML = `<span class="avatar-initial premium-avatar">${currentUser.avatar}</span>`;
  }

  if (!isLoadingPage) {
    loadPage();
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('authToken');
      authToken = null;
      currentUser = null;
      location.reload();
    });
  }
}

// Data management with API integration
const DataManager = {
  // Notes
  async getNotes(category = 'all') {
    try {
      if (authToken && currentUser) {
        const query = category !== 'all' ? `?category=${category}` : '';
        const notes = await apiCall(`/notes${query}`);
        // Map database fields to frontend format
        return notes.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          category: note.category,
          createdAt: note.created_at || note.createdAt,
          updatedAt: note.updated_at || note.updatedAt,
        }));
      }
    } catch (error) {
      console.warn('API getNotes failed, using localStorage:', error.message);
    }
    // Fallback to localStorage
    if (!currentUser || !currentUser.id) return [];
    try {
      const notes = JSON.parse(
        localStorage.getItem(`notes_${currentUser.id}`) || '[]'
      );
      if (category === 'all') return notes;
      return notes.filter(n => n.category === category);
    } catch (e) {
      console.error('Error parsing localStorage notes:', e);
      return [];
    }
  },

  async saveNote(note) {
    try {
      if (authToken && currentUser) {
        // Prepare data for API
        const noteData = {
          title: note.title,
          content: note.content,
          category: note.category || 'study',
        };

        if (note.id) {
          // Update existing note
          await apiCall(`/notes/${note.id}`, { method: 'PUT', body: noteData });
          console.log('✅ Note updated in database:', note.id);
          return { ...note, ...noteData, updatedAt: new Date().toISOString() };
        } else {
          // Create new note
          const result = await apiCall('/notes', {
            method: 'POST',
            body: noteData,
          });
          console.log('✅ Note created in database:', result.id);
          return {
            ...note,
            ...noteData,
            id: result.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error('API saveNote failed:', error);
      console.warn('Falling back to localStorage');
    }

    // Fallback to localStorage
    if (!currentUser || !currentUser.id) {
      throw new Error('User not logged in');
    }

    const notes = JSON.parse(
      localStorage.getItem(`notes_${currentUser.id}`) || '[]'
    );
    if (note.id) {
      const index = notes.findIndex(n => n.id === note.id);
      if (index !== -1) {
        notes[index] = {
          ...notes[index],
          ...note,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      note.id = Date.now();
      note.createdAt = new Date().toISOString();
      note.updatedAt = note.createdAt;
      note.userId = currentUser.id;
      notes.push(note);
    }
    localStorage.setItem(`notes_${currentUser.id}`, JSON.stringify(notes));
    return note;
  },

  async deleteNote(id) {
    try {
      if (authToken && currentUser) {
        await apiCall(`/notes/${id}`, { method: 'DELETE' });
        console.log('✅ Note deleted from database:', id);
        return;
      }
    } catch (error) {
      console.warn('API deleteNote failed, using localStorage:', error.message);
    }
    // Fallback to localStorage
    if (!currentUser || !currentUser.id) return;
    const notes = JSON.parse(
      localStorage.getItem(`notes_${currentUser.id}`) || '[]'
    ).filter(n => n.id !== id);
    localStorage.setItem(`notes_${currentUser.id}`, JSON.stringify(notes));
  },

  // Books
  async getBooks() {
    try {
      if (authToken && currentUser) {
        const books = await apiCall('/books');
        // Map database fields to frontend format
        return books.map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          description: book.description || '',
          category: book.category,
          isComplete: book.is_complete === 1 || book.is_complete === true,
          createdAt: book.created_at || book.createdAt,
          updatedAt: book.updated_at || book.updatedAt,
        }));
      }
    } catch (error) {
      console.warn('API getBooks failed, using localStorage:', error.message);
    }
    // Fallback to localStorage
    if (!currentUser || !currentUser.id) return [];
    try {
      return JSON.parse(
        localStorage.getItem(`books_${currentUser.id}`) || '[]'
      );
    } catch (e) {
      console.error('Error parsing localStorage books:', e);
      return [];
    }
  },

  async saveBook(book) {
    try {
      if (authToken && currentUser) {
        // Prepare data for API (match database schema)
        const bookData = {
          title: book.title,
          author: book.author,
          description: book.description || '',
          category: book.category || 'academic',
          is_complete: book.isComplete || false,
        };

        if (book.id) {
          // Update existing book
          await apiCall(`/books/${book.id}`, { method: 'PUT', body: bookData });
          console.log('✅ Book updated in database:', book.id);
          return { ...book, ...bookData, updatedAt: new Date().toISOString() };
        } else {
          // Create new book
          const result = await apiCall('/books', {
            method: 'POST',
            body: bookData,
          });
          console.log('✅ Book created in database:', result.id);
          return {
            ...book,
            ...bookData,
            id: result.id,
            isComplete: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error('API saveBook failed:', error);
      console.warn('Falling back to localStorage');
    }

    // Fallback to localStorage
    if (!currentUser || !currentUser.id) {
      throw new Error('User not logged in');
    }

    const books = JSON.parse(
      localStorage.getItem(`books_${currentUser.id}`) || '[]'
    );
    if (book.id) {
      const index = books.findIndex(b => b.id === book.id);
      if (index !== -1) {
        books[index] = {
          ...books[index],
          ...book,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      book.id = Date.now();
      book.createdAt = new Date().toISOString();
      book.updatedAt = book.createdAt;
      book.userId = currentUser.id;
      book.isComplete = false;
      books.push(book);
    }
    localStorage.setItem(`books_${currentUser.id}`, JSON.stringify(books));
    return book;
  },

  async deleteBook(id) {
    try {
      if (authToken && currentUser) {
        await apiCall(`/books/${id}`, { method: 'DELETE' });
        console.log('✅ Book deleted from database:', id);
        return;
      }
    } catch (error) {
      console.warn('API deleteBook failed, using localStorage:', error.message);
    }
    // Fallback to localStorage
    if (!currentUser || !currentUser.id) return;
    const books = JSON.parse(
      localStorage.getItem(`books_${currentUser.id}`) || '[]'
    ).filter(b => b.id !== id);
    localStorage.setItem(`books_${currentUser.id}`, JSON.stringify(books));
  },

  async toggleBookStatus(id) {
    try {
      if (authToken && currentUser) {
        await apiCall(`/books/${id}/toggle`, { method: 'POST' });
        console.log('✅ Book status toggled in database:', id);
        return;
      }
    } catch (error) {
      console.warn(
        'API toggleBookStatus failed, using localStorage:',
        error.message
      );
    }
    // Fallback to localStorage
    if (!currentUser || !currentUser.id) return;
    const books = JSON.parse(
      localStorage.getItem(`books_${currentUser.id}`) || '[]'
    );
    const book = books.find(b => b.id === id);
    if (book) {
      book.isComplete = !book.isComplete;
      book.updatedAt = new Date().toISOString();
      localStorage.setItem(`books_${currentUser.id}`, JSON.stringify(books));
    }
  },

  // Sessions
  async getSessions() {
    try {
      if (authToken && currentUser) {
        const sessions = await apiCall('/sessions');
        // Map database fields to frontend format
        return sessions.map(session => ({
          id: session.id,
          title: session.title,
          description: session.description || '',
          subject: session.subject,
          duration: session.duration,
          status: session.status,
          startedAt: session.started_at,
          completedAt: session.completed_at,
          createdAt: session.created_at,
          updatedAt: session.updated_at,
        }));
      }
    } catch (error) {
      console.warn(
        'API getSessions failed, using localStorage:',
        error.message
      );
    }
    // Fallback to localStorage
    if (!currentUser || !currentUser.id) return [];
    try {
      return JSON.parse(
        localStorage.getItem(`sessions_${currentUser.id}`) || '[]'
      );
    } catch (e) {
      console.error('Error parsing localStorage sessions:', e);
      return [];
    }
  },

  async saveSession(session) {
    try {
      if (authToken) {
        // Prepare data for API (match database schema)
        const sessionData = {
          title: session.title,
          description: session.description || '',
          subject: session.subject,
          duration: parseInt(session.duration) || 25,
          status: session.status || 'planned',
        };

        if (session.id) {
          // Update existing session
          await apiCall(`/sessions/${session.id}`, {
            method: 'PUT',
            body: sessionData,
          });
          console.log('✅ Session updated in database:', session.id);
          return { ...session, ...sessionData };
        } else {
          // Create new session
          const result = await apiCall('/sessions', {
            method: 'POST',
            body: sessionData,
          });
          console.log('✅ Session created in database:', result.id);
          return {
            ...session,
            ...sessionData,
            id: result.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }
    } catch (error) {
      console.error('API saveSession failed:', error);
      console.warn('Falling back to localStorage');
    }

    // Fallback to localStorage if API fails
    const sessions = JSON.parse(
      localStorage.getItem(`sessions_${currentUser.id}`) || '[]'
    );
    if (session.id) {
      const index = sessions.findIndex(s => s.id === session.id);
      if (index !== -1) {
        sessions[index] = {
          ...sessions[index],
          ...session,
          updatedAt: new Date().toISOString(),
        };
      }
    } else {
      session.id = Date.now();
      session.createdAt = new Date().toISOString();
      session.updatedAt = session.createdAt;
      session.userId = currentUser.id;
      session.status = session.status || 'planned';
      sessions.push(session);
    }
    localStorage.setItem(
      `sessions_${currentUser.id}`,
      JSON.stringify(sessions)
    );
    return session;
  },

  async deleteSession(id) {
    try {
      if (authToken) {
        await apiCall(`/sessions/${id}`, { method: 'DELETE' });
        console.log('✅ Session deleted from database:', id);
        return;
      }
    } catch (error) {
      console.warn(
        'API deleteSession failed, using localStorage:',
        error.message
      );
    }
    const sessions = JSON.parse(
      localStorage.getItem(`sessions_${currentUser.id}`) || '[]'
    ).filter(s => s.id !== id);
    localStorage.setItem(
      `sessions_${currentUser.id}`,
      JSON.stringify(sessions)
    );
  },

  async startSession(id) {
    try {
      if (authToken) {
        await apiCall(`/sessions/${id}/start`, { method: 'POST' });
        console.log('✅ Session started in database:', id);
        return;
      }
    } catch (error) {
      console.warn(
        'API startSession failed, using localStorage:',
        error.message
      );
    }
    const sessions = JSON.parse(
      localStorage.getItem(`sessions_${currentUser.id}`) || '[]'
    );
    const session = sessions.find(s => s.id === id);
    if (session) {
      session.status = 'inprogress';
      session.startedAt = new Date().toISOString();
      localStorage.setItem(
        `sessions_${currentUser.id}`,
        JSON.stringify(sessions)
      );
    }
  },

  async completeSession(id) {
    try {
      if (authToken) {
        await apiCall(`/sessions/${id}/complete`, { method: 'POST' });
        console.log('✅ Session completed in database:', id);
        return;
      }
    } catch (error) {
      console.warn(
        'API completeSession failed, using localStorage:',
        error.message
      );
    }
    const sessions = JSON.parse(
      localStorage.getItem(`sessions_${currentUser.id}`) || '[]'
    );
    const session = sessions.find(s => s.id === id);
    if (session) {
      session.status = 'completed';
      session.completedAt = new Date().toISOString();
      localStorage.setItem(
        `sessions_${currentUser.id}`,
        JSON.stringify(sessions)
      );
    }
  },

  // Dashboard & Stats
  async getDashboard() {
    try {
      if (authToken && currentUser) {
        const data = await apiCall('/user/dashboard');
        console.log('📊 Dashboard data from API:', data);
        return {
          user: data.user,
          dashboard: {
            completed_sessions: data.dashboard?.completed_sessions || 0,
            total_notes: data.dashboard?.total_notes || 0,
            total_books: data.dashboard?.total_books || 0,
            name: data.dashboard?.name,
            email: data.dashboard?.email,
          },
          todayStats: {
            total_minutes: parseInt(data.todayStats?.total_minutes) || 0,
            total_sessions: parseInt(data.todayStats?.total_sessions) || 0,
          },
        };
      }
    } catch (error) {
      console.warn('API getDashboard failed:', error.message);
    }
    // Fallback: Return local stats
    if (!currentUser || !currentUser.id) {
      return { dashboard: {}, todayStats: {} };
    }

    try {
      const sessions = JSON.parse(
        localStorage.getItem(`sessions_${currentUser.id}`) || '[]'
      );
      const notes = JSON.parse(
        localStorage.getItem(`notes_${currentUser.id}`) || '[]'
      );
      const books = JSON.parse(
        localStorage.getItem(`books_${currentUser.id}`) || '[]'
      );

      const completedSessions = sessions.filter(s => s.status === 'completed');
      const totalMinutes = completedSessions.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      );

      return {
        dashboard: {
          completed_sessions: completedSessions.length,
          total_notes: notes.length,
          total_books: books.length,
        },
        todayStats: {
          total_minutes: totalMinutes,
          total_sessions: completedSessions.length,
        },
      };
    } catch (e) {
      console.error('Error getting local stats:', e);
      return { dashboard: {}, todayStats: {} };
    }
  },

  // Weekly Stats
  async getWeeklyStats() {
    try {
      if (authToken && currentUser) {
        const data = await apiCall('/stats/weekly');
        console.log('📊 Weekly stats from API:', data);
        return data;
      }
    } catch (error) {
      console.warn('API getWeeklyStats failed:', error.message);
    }
    // Fallback to empty
    return [];
  },

  // Today Stats
  async getTodayStats() {
    try {
      if (authToken && currentUser) {
        const data = await apiCall('/stats/today');
        return {
          total_minutes: parseInt(data.total_minutes) || 0,
          total_sessions: parseInt(data.total_sessions) || 0,
        };
      }
    } catch (error) {
      console.warn('API getTodayStats failed:', error.message);
    }
    // Fallback to local calculation
    if (!currentUser || !currentUser.id) {
      return { total_minutes: 0, total_sessions: 0 };
    }

    const sessions = JSON.parse(
      localStorage.getItem(`sessions_${currentUser.id}`) || '[]'
    );
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(
      s =>
        s.status === 'completed' &&
        new Date(s.completedAt || s.createdAt).toDateString() === today
    );

    return {
      total_minutes: todaySessions.reduce(
        (sum, s) => sum + (s.duration || 0),
        0
      ),
      total_sessions: todaySessions.length,
    };
  },

  // Get current streak
  async getStreak() {
    try {
      if (authToken && currentUser) {
        const data = await apiCall('/stats/streak');
        return data.streak_days || 0;
      }
    } catch (error) {
      console.warn('API getStreak failed:', error.message);
    }
    return 0; // Fallback
  },

  // Get stats summary (all stats in one call)
  async getStatsSummary() {
    try {
      if (authToken && currentUser) {
        const data = await apiCall('/stats/summary');
        console.log('📊 Stats summary from API:', data);
        return data;
      }
    } catch (error) {
      console.warn('API getStatsSummary failed:', error.message);
    }
    // Fallback to individual calls
    const dashboard = await this.getDashboard();
    const weekly = await this.getWeeklyStats();
    return {
      ...dashboard,
      weekly: {
        total_minutes: weekly.reduce(
          (sum, d) => sum + (d.total_minutes || 0),
          0
        ),
        total_sessions: weekly.reduce(
          (sum, d) => sum + (d.sessions_count || 0),
          0
        ),
        daily_breakdown: weekly,
      },
      streak: 0,
    };
  },

  // Get monthly stats
  async getMonthlyStats() {
    try {
      if (authToken && currentUser) {
        const data = await apiCall('/stats/monthly');
        return data;
      }
    } catch (error) {
      console.warn('API getMonthlyStats failed:', error.message);
    }
    return [];
  },
};

// Focus Mode Timer
let timerInterval;
let timerMinutes = 25;
let timerSeconds = 0;
let isTimerRunning = false;
let currentTimerType = 'pomodoro';

const TimerManager = {
  startTimer(minutes = 25) {
    if (isTimerRunning) return;

    timerMinutes = minutes;
    timerSeconds = 0;
    isTimerRunning = true;
    currentTimerType =
      minutes === 25
        ? 'pomodoro'
        : minutes === 5
        ? 'short-break'
        : 'long-break';

    this.updateTimerDisplay();

    timerInterval = setInterval(() => {
      if (timerSeconds === 0) {
        if (timerMinutes === 0) {
          this.timerComplete();
          return;
        }
        timerMinutes--;
        timerSeconds = 59;
      } else {
        timerSeconds--;
      }
      this.updateTimerDisplay();
    }, 1000);

    // Update UI
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    const resetBtn = document.getElementById('reset-timer');

    if (startBtn) startBtn.disabled = true;
    if (pauseBtn) pauseBtn.disabled = false;
    if (resetBtn) resetBtn.disabled = false;

    // Show notification
    NotificationManager.show('Timer Dimulai!', {
      body: `Fokus selama ${minutes} menit dimulai sekarang!`,
      icon: '/icons/icon-192x192.png',
    });
  },

  pauseTimer() {
    if (!isTimerRunning) return;

    clearInterval(timerInterval);
    isTimerRunning = false;

    // Update UI
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;

    // Show notification
    NotificationManager.show('Timer Dijeda', {
      body: 'Sesi fokus Anda telah dijeda.',
      icon: '/icons/icon-192x192.png',
    });
  },

  resetTimer() {
    clearInterval(timerInterval);
    isTimerRunning = false;

    // Reset to current timer type
    if (currentTimerType === 'pomodoro') timerMinutes = 25;
    else if (currentTimerType === 'short-break') timerMinutes = 5;
    else timerMinutes = 15;

    timerSeconds = 0;
    this.updateTimerDisplay();

    // Update UI
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');
    const resetBtn = document.getElementById('reset-timer');

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;
    if (resetBtn) resetBtn.disabled = false;
  },

  updateTimerDisplay() {
    const display = document.querySelector('.timer-display');
    if (display) {
      display.textContent = `${timerMinutes
        .toString()
        .padStart(2, '0')}:${timerSeconds.toString().padStart(2, '0')}`;
    }
  },

  async timerComplete() {
    clearInterval(timerInterval);
    isTimerRunning = false;

    // Get the duration that was completed
    const completedDuration =
      currentTimerType === 'pomodoro'
        ? 25
        : currentTimerType === 'short-break'
        ? 5
        : 15;

    // Show notification
    showToast('Timer selesai!', 'success');
    NotificationManager.showTimerComplete();

    // Play sound (jika diperlukan)
    this.playCompletionSound();

    // Update UI
    const startBtn = document.getElementById('start-timer');
    const pauseBtn = document.getElementById('pause-timer');

    if (startBtn) startBtn.disabled = false;
    if (pauseBtn) pauseBtn.disabled = true;

    // Sync stats to database if logged in (only for pomodoro sessions)
    if (currentTimerType === 'pomodoro' && authToken && currentUser) {
      try {
        // Save timer to database
        const response = await apiCall('/timers', {
          method: 'POST',
          body: JSON.stringify({
            timer_type: currentTimerType,
            duration: completedDuration,
            task_description: 'Pomodoro Focus Session',
          }),
        });

        if (response && response.id) {
          // Complete the timer which will also update stats
          await apiCall(`/timers/${response.id}/complete`, {
            method: 'POST',
            body: JSON.stringify({ duration: completedDuration }),
          });
          console.log('📊 Timer stats synced to database');
        }
      } catch (error) {
        console.warn('Failed to sync timer stats:', error.message);
      }
    }

    // Auto-start break if it was a pomodoro session
    if (currentTimerType === 'pomodoro') {
      setTimeout(() => {
        if (confirm('Pomodoro selesai! Mulai istirahat pendek?')) {
          this.startTimer(5);
        }
      }, 1000);
    }
  },

  playCompletionSound() {
    // Implement sound notification jika diperlukan
    console.log('Timer completed - play sound');
  },
};

// Session Manager - Updated to use API
const SessionManager = {
  async getSessions() {
    return await DataManager.getSessions();
  },

  async saveSession(session) {
    return await DataManager.saveSession(session);
  },

  async deleteSession(id) {
    await DataManager.deleteSession(id);
  },

  async startSession(id) {
    await DataManager.startSession(id);
  },

  async completeSession(id) {
    await DataManager.completeSession(id);
  },
};

// Modal Manager - FIXED VERSION
const ModalManager = {
  showModal(title, content) {
    // Remove existing modal if any
    const existingModal = document.querySelector('.modal');
    if (existingModal) {
      existingModal.remove();
    }

    const modal = document.createElement('div');
    modal.className = 'modal premium-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-content premium-modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <span class="close-modal">×</span>
        </div>
        ${content}
      </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners
    modal
      .querySelector('.close-modal')
      .addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.remove();
    });

    return modal;
  },

  showNoteModal(note = null) {
    const isEdit = !!note;
    const content = `
      <form id="noteForm" class="premium-form">
        <div class="form-group">
          <label>Judul Catatan</label>
          <input type="text" id="noteTitle" value="${
            note?.title || ''
          }" required class="premium-input">
        </div>
        <div class="form-group">
          <label>Isi Catatan</label>
          <textarea id="noteContent" rows="6" required class="premium-input">${
            note?.content || ''
          }</textarea>
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select id="noteCategory" class="premium-input">
            ${['study', 'personal', 'work', 'other']
              .map(
                cat => `
              <option value="${cat}" ${
                  note?.category === cat ? 'selected' : ''
                }>
                ${getCategoryLabel(cat)}
              </option>
            `
              )
              .join('')}
          </select>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="button" class="btn btn-secondary premium-btn-secondary" id="cancelNote">Batal</button>
          <button type="submit" class="btn premium-btn">${
            isEdit ? 'Update' : 'Simpan'
          }</button>
        </div>
      </form>
    `;

    const modal = this.showModal(
      isEdit ? 'Edit Catatan' : 'Tambah Catatan',
      content
    );

    // Add event listeners
    modal
      .querySelector('#cancelNote')
      .addEventListener('click', () => modal.remove());
    modal.querySelector('#noteForm').addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        title: document.getElementById('noteTitle').value.trim(),
        content: document.getElementById('noteContent').value.trim(),
        category: document.getElementById('noteCategory').value,
      };
      if (isEdit) data.id = note.id;

      try {
        await DataManager.saveNote(data);
        modal.remove();
        showToast(
          isEdit ? 'Catatan diperbarui!' : 'Catatan ditambahkan!',
          'success'
        );
        await reloadNotesPage();
      } catch (error) {
        console.error('Error saving note:', error);
        showToast('Gagal menyimpan catatan', 'error');
      }
    });
  },

  showBookModal(book = null) {
    const isEdit = !!book;
    const content = `
      <form id="bookForm" class="premium-form">
        <div class="form-group">
          <label>Judul Buku</label>
          <input type="text" id="bookTitle" value="${
            book?.title || ''
          }" required class="premium-input">
        </div>
        <div class="form-group">
          <label>Penulis</label>
          <input type="text" id="bookAuthor" value="${
            book?.author || ''
          }" required class="premium-input">
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea id="bookDescription" rows="4" class="premium-input">${
            book?.description || ''
          }</textarea>
        </div>
        <div class="form-group">
          <label>Kategori</label>
          <select id="bookCategory" class="premium-input">
            ${['academic', 'fiction', 'non-fiction', 'reference']
              .map(
                cat => `
              <option value="${cat}" ${
                  book?.category === cat ? 'selected' : ''
                }>
                ${getBookCategoryLabel(cat)}
              </option>
            `
              )
              .join('')}
          </select>
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="button" class="btn btn-secondary premium-btn-secondary" id="cancelBook">Batal</button>
          <button type="submit" class="btn premium-btn">${
            isEdit ? 'Update' : 'Simpan'
          }</button>
        </div>
      </form>
    `;

    const modal = this.showModal(isEdit ? 'Edit Buku' : 'Tambah Buku', content);

    // Add event listeners
    modal
      .querySelector('#cancelBook')
      .addEventListener('click', () => modal.remove());
    modal.querySelector('#bookForm').addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        title: document.getElementById('bookTitle').value.trim(),
        author: document.getElementById('bookAuthor').value.trim(),
        description: document.getElementById('bookDescription').value.trim(),
        category: document.getElementById('bookCategory').value,
      };
      if (isEdit) {
        data.id = book.id;
        data.isComplete = book.isComplete;
      }

      try {
        await DataManager.saveBook(data);
        modal.remove();
        showToast(isEdit ? 'Buku diperbarui!' : 'Buku ditambahkan!', 'success');
        await reloadBooksPage();
      } catch (error) {
        console.error('Error saving book:', error);
        showToast('Gagal menyimpan buku', 'error');
      }
    });
  },

  showSessionModal(session = null) {
    const isEdit = !!session;
    const content = `
      <form id="sessionForm" class="premium-form">
        <div class="form-group">
          <label>Judul Sesi</label>
          <input type="text" id="sessionTitle" value="${
            session?.title || ''
          }" required class="premium-input">
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea id="sessionDescription" rows="3" class="premium-input">${
            session?.description || ''
          }</textarea>
        </div>
        <div class="form-group">
          <label>Durasi (menit)</label>
          <input type="number" id="sessionDuration" value="${
            session?.duration || 25
          }" min="5" max="180" required class="premium-input">
        </div>
        <div class="form-group">
          <label>Mata Pelajaran/Topik</label>
          <input type="text" id="sessionSubject" value="${
            session?.subject || ''
          }" required class="premium-input">
        </div>
        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
          <button type="button" class="btn btn-secondary premium-btn-secondary" id="cancelSession">Batal</button>
          <button type="submit" class="btn premium-btn">${
            isEdit ? 'Update' : 'Simpan'
          }</button>
        </div>
      </form>
    `;

    const modal = this.showModal(
      isEdit ? 'Edit Sesi Belajar' : 'Tambah Sesi Belajar',
      content
    );

    // Add event listeners
    modal
      .querySelector('#cancelSession')
      .addEventListener('click', () => modal.remove());
    modal.querySelector('#sessionForm').addEventListener('submit', async e => {
      e.preventDefault();
      const data = {
        title: document.getElementById('sessionTitle').value.trim(),
        description: document.getElementById('sessionDescription').value.trim(),
        duration: parseInt(document.getElementById('sessionDuration').value),
        subject: document.getElementById('sessionSubject').value.trim(),
        status: session?.status || 'planned',
      };
      if (isEdit) data.id = session.id;

      try {
        await SessionManager.saveSession(data);
        modal.remove();
        showToast(isEdit ? 'Sesi diperbarui!' : 'Sesi ditambahkan!', 'success');
        await reloadSessionsPage();
      } catch (error) {
        console.error('Error saving session:', error);
        showToast('Gagal menyimpan sesi', 'error');
      }
    });
  },
};

// Render Notification Settings Page
function renderNotificationSettings() {
  return `
    <section class="settings-section premium-section">
      <div class="container">
        <h1 class="text-center premium-section-title">Pengaturan Notifikasi</h1>
        <p class="text-center premium-section-subtitle">Kelola preferensi notifikasi Anda</p>
       
        <div class="settings-card premium-card" style="max-width: 600px; margin: 0 auto;">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="push-enabled" ${
                NotificationManager.getSettings().isPushEnabled ? 'checked' : ''
              }>
              <span>Web Push Notifications</span>
            </label>
            <small>Terima notifikasi bahkan ketika aplikasi tidak terbuka</small>
          </div>
         
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="daily-reminders" ${
                NotificationManager.getSettings().dailyReminders
                  ? 'checked'
                  : ''
              }>
              <span>Pengingat Harian</span>
            </label>
            <small>Notifikasi pengingat belajar setiap hari</small>
          </div>
         
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="session-reminders" ${
                NotificationManager.getSettings().sessionReminders
                  ? 'checked'
                  : ''
              }>
              <span>Pengingat Sesi</span>
            </label>
            <small>Pengingat sebelum sesi belajar dimulai</small>
          </div>
         
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="achievement-alerts" ${
                NotificationManager.getSettings().achievementAlerts
                  ? 'checked'
                  : ''
              }>
              <span>Pencapaian & Laporan</span>
            </label>
            <small>Notifikasi pencapaian dan laporan mingguan</small>
          </div>
         
          <div class="form-actions" style="margin-top: 2rem;">
            <button class="btn premium-btn" id="save-notification-settings">
              <i class="fas fa-save"></i> Simpan Pengaturan
            </button>
            <button class="btn premium-btn-secondary" id="test-notification">
              <i class="fas fa-bell"></i> Test Notifikasi
            </button>
          </div>
         
          <div class="notification-status" style="margin-top: 1.5rem; padding: 1rem; background: var(--soft-blue); border-radius: var(--border-radius-md);">
            <h4>Status Notifikasi:</h4>
            <p>Permission: <strong>${Notification.permission}</strong></p>
            <p>Service Worker: <strong>${
              'serviceWorker' in navigator ? 'Supported' : 'Not Supported'
            }</strong></p>
            <p>Push Manager: <strong>${
              'PushManager' in window ? 'Supported' : 'Not Supported'
            }</strong></p>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Initialize Notification Settings Page
function initializeNotificationSettings() {
  const saveBtn = document.getElementById('save-notification-settings');
  const testBtn = document.getElementById('test-notification');

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const settings = {
        pushEnabled: document.getElementById('push-enabled').checked,
        dailyReminders: document.getElementById('daily-reminders').checked,
        sessionReminders: document.getElementById('session-reminders').checked,
        achievementAlerts:
          document.getElementById('achievement-alerts').checked,
      };

      NotificationManager.updateSettings(settings);
      showToast('Pengaturan notifikasi disimpan!', 'success');

      // Jika daily reminders diaktifkan, jadwalkan pengingat
      if (settings.dailyReminders) {
        NotificationManager.scheduleDailyReminder(8, 0); // Setiap jam 8 pagi
      }
    });
  }

  if (testBtn) {
    testBtn.addEventListener('click', () => {
      NotificationManager.testNotification();
    });
  }
}

// Routing & Page Rendering
let isLoadingPage = false;
async function loadPage() {
  // Prevent multiple simultaneous page loads
  if (isLoadingPage) {
    console.log('Page already loading, skipping...');
    return;
  }

  isLoadingPage = true;

  try {
    const hash = window.location.hash.slice(2) || 'beranda';
    const mainContent = document.getElementById('main-content');

    if (!mainContent) {
      console.error('Main content element not found');
      return;
    }

    const pages = {
      beranda: renderHomePage(),
      fitur: renderFeaturesPage(),
      'focus-mode': renderFocusModePage(),
      'sesi-belajar': renderSessionsPage(),
      catatan: renderNotesPage(),
      'rak-buku': renderBooksPage(),
      'pengaturan-notifikasi': renderNotificationSettings(),
    };

    mainContent.innerHTML = pages[hash] || pages.beranda;

    // Initialize specific page functionality
    try {
      if (hash === 'beranda' || hash === '') await initializeHomePage();
      if (hash === 'focus-mode') initializeFocusModePage();
      if (hash === 'sesi-belajar') await initializeSessionsPage();
      if (hash === 'catatan') await initializeNotesPage();
      if (hash === 'rak-buku') await initializeBooksPage();
      if (hash === 'pengaturan-notifikasi') initializeNotificationSettings();
    } catch (error) {
      console.error('Error initializing page:', error);
      showToast('Terjadi kesalahan saat memuat halaman', 'error');
    }

    injectComponentStyles();
    updateActiveNav();
  } catch (error) {
    console.error('Error loading page:', error);
    showToast('Gagal memuat halaman', 'error');
  } finally {
    isLoadingPage = false;
  }
}

// Render functions - Enhanced with premium styling
function renderHomePage() {
  return `
    <section class="hero premium-hero">
      <div class="container">
        <h1 class="premium-title">Selamat Datang di FocusMode</h1>
        <p class="premium-subtitle">Platform pembelajaran premium untuk meningkatkan produktivitas belajar dengan teknik Pomodoro, manajemen waktu, dan pencatatan yang efektif.</p>
        <div class="hero-actions">
          <a href="#/focus-mode" class="btn premium-btn">Mulai Fokus</a>
          <a href="#/fitur" class="btn premium-btn-secondary">Pelajari Fitur</a>
        </div>
      </div>
    </section>

    <section class="stats-overview premium-stats">
      <div class="container">
        <h2 class="text-center premium-section-title">Statistik Belajar Anda</h2>
        <div class="stats-grid" id="stats-grid">
          <div class="stat-card premium-card">
            <div class="stat-icon">
              <i class="fas fa-clock"></i>
            </div>
            <div class="stat-info">
              <h3 id="stat-total-minutes">-</h3>
              <p>Menit Belajar Hari Ini</p>
            </div>
          </div>
          <div class="stat-card premium-card">
            <div class="stat-icon">
              <i class="fas fa-check-circle"></i>
            </div>
            <div class="stat-info">
              <h3 id="stat-completed-sessions">-</h3>
              <p>Sesi Selesai</p>
            </div>
          </div>
          <div class="stat-card premium-card">
            <div class="stat-icon" style="background: linear-gradient(135deg, #fd79a8, #e84393);">
              <i class="fas fa-fire"></i>
            </div>
            <div class="stat-info">
              <h3 id="stat-streak">-</h3>
              <p>Streak Hari</p>
            </div>
          </div>
          <div class="stat-card premium-card">
            <div class="stat-icon">
              <i class="fas fa-sticky-note"></i>
            </div>
            <div class="stat-info">
              <h3 id="stat-total-notes">-</h3>
              <p>Total Catatan</p>
            </div>
          </div>
          <div class="stat-card premium-card">
            <div class="stat-icon">
              <i class="fas fa-book"></i>
            </div>
            <div class="stat-info">
              <h3 id="stat-total-books">-</h3>
              <p>Total Buku</p>
            </div>
          </div>
        </div>
        
        <div class="weekly-stats-container" style="margin-top: 2rem;">
          <h3 class="text-center" style="margin-bottom: 1rem;">Aktivitas 7 Hari Terakhir</h3>
          <div class="weekly-chart" id="weekly-chart">
            <div class="chart-loading">Memuat data...</div>
          </div>
        </div>
      </div>
    </section>
    
    <section class="features premium-features">
      <div class="container">
        <h2 class="text-center premium-section-title">Fitur Unggulan</h2>
        <div class="features-grid">
          <div class="feature-card premium-card">
            <i class="fas fa-clock feature-icon"></i>
            <h3>Timer Pomodoro</h3>
            <p>Teknik 25 menit fokus, 5 menit istirahat untuk meningkatkan konsentrasi belajar.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-book feature-icon"></i>
            <h3>Manajemen Catatan</h3>
            <p>Buat dan kelola catatan belajar dengan kategori yang terorganisir.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-tasks feature-icon"></i>
            <h3>Sesi Belajar</h3>
            <p>Jadwalkan dan pantau sesi belajar Anda dengan sistem pelacakan waktu.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-books feature-icon"></i>
            <h3>Rak Buku Digital</h3>
            <p>Kelola daftar bacaan dan progress belajar dari berbagai sumber.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Initialize Home Page with Stats
async function initializeHomePage() {
  try {
    // Check if user is logged in
    if (!currentUser || !authToken) {
      // Show default values for non-logged in users
      const statsElements = [
        'stat-total-minutes',
        'stat-completed-sessions',
        'stat-streak',
        'stat-total-notes',
        'stat-total-books',
      ];
      statsElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '0';
      });

      // Show login prompt in chart
      const chartContainer = document.getElementById('weekly-chart');
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div style="text-align: center; padding: 2rem; color: #666;">
            <i class="fas fa-sign-in-alt" style="font-size: 2rem; margin-bottom: 1rem; color: var(--primary);"></i>
            <p>Login untuk melihat statistik belajar Anda</p>
            <a href="#/login" class="btn premium-btn" style="margin-top: 1rem;">Login Sekarang</a>
          </div>
        `;
      }
      return;
    }

    // Load stats summary (combines dashboard + weekly + streak in one call)
    const statsSummary = await DataManager.getStatsSummary();

    // Update stats display
    const totalMinutesEl = document.getElementById('stat-total-minutes');
    const completedSessionsEl = document.getElementById(
      'stat-completed-sessions'
    );
    const streakEl = document.getElementById('stat-streak');
    const totalNotesEl = document.getElementById('stat-total-notes');
    const totalBooksEl = document.getElementById('stat-total-books');

    if (totalMinutesEl) {
      totalMinutesEl.textContent = `${
        statsSummary.today?.total_minutes ||
        statsSummary.todayStats?.total_minutes ||
        0
      } menit`;
    }
    if (completedSessionsEl) {
      completedSessionsEl.textContent =
        statsSummary.overview?.completed_sessions ||
        statsSummary.dashboard?.completed_sessions ||
        0;
    }
    if (streakEl) {
      streakEl.textContent = statsSummary.streak || 0;
    }
    if (totalNotesEl) {
      totalNotesEl.textContent =
        statsSummary.overview?.total_notes ||
        statsSummary.dashboard?.total_notes ||
        0;
    }
    if (totalBooksEl) {
      totalBooksEl.textContent =
        statsSummary.overview?.total_books ||
        statsSummary.dashboard?.total_books ||
        0;
    }

    // Load weekly stats for chart
    const weeklyData =
      statsSummary.weekly?.daily_breakdown ||
      (await DataManager.getWeeklyStats());
    renderWeeklyChart(weeklyData);

    console.log('📊 Home page stats loaded:', statsSummary);
  } catch (error) {
    console.error('Error initializing home page:', error);
  }
}

// Render Weekly Chart
function renderWeeklyChart(weeklyData) {
  const chartContainer = document.getElementById('weekly-chart');
  if (!chartContainer) return;

  // Get last 7 days
  const days = [];
  const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      dayName: dayNames[date.getDay()],
      dateStr: date.getDate(),
    });
  }

  // Map weekly data to days
  const dataMap = {};
  if (weeklyData && Array.isArray(weeklyData)) {
    weeklyData.forEach(item => {
      const dateKey = new Date(item.study_date).toISOString().split('T')[0];
      dataMap[dateKey] = {
        sessions: item.sessions_count || 0,
        minutes: item.total_minutes || 0,
      };
    });
  }

  // Find max value for scaling
  const maxMinutes = Math.max(
    ...days.map(d => dataMap[d.date]?.minutes || 0),
    60
  );

  chartContainer.innerHTML = `
    <div class="chart-bars" style="display: flex; justify-content: space-around; align-items: flex-end; height: 150px; padding: 10px 0;">
      ${days
        .map(day => {
          const data = dataMap[day.date] || { sessions: 0, minutes: 0 };
          const height = maxMinutes > 0 ? (data.minutes / maxMinutes) * 100 : 0;
          const isToday = day.date === new Date().toISOString().split('T')[0];

          return `
          <div class="chart-bar-container" style="display: flex; flex-direction: column; align-items: center; flex: 1;">
            <div class="chart-value" style="font-size: 0.75rem; color: var(--primary); margin-bottom: 4px;">
              ${data.minutes > 0 ? data.minutes + 'm' : ''}
            </div>
            <div class="chart-bar" style="
              width: 30px;
              height: ${Math.max(height, 5)}%;
              min-height: 4px;
              background: ${
                isToday
                  ? 'linear-gradient(135deg, #0984e3, #74b9ff)'
                  : 'linear-gradient(135deg, #74b9ff, #a29bfe)'
              };
              border-radius: 4px 4px 0 0;
              transition: height 0.3s ease;
            " title="${data.sessions} sesi, ${data.minutes} menit"></div>
            <div class="chart-label" style="margin-top: 8px; font-size: 0.75rem; color: ${
              isToday ? 'var(--primary)' : '#666'
            }; font-weight: ${isToday ? '600' : '400'};">
              ${day.dayName}
            </div>
            <div class="chart-date" style="font-size: 0.65rem; color: #999;">
              ${day.dateStr}
            </div>
          </div>
        `;
        })
        .join('')}
    </div>
    <div class="chart-summary" style="text-align: center; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee;">
      <p style="color: #666; font-size: 0.9rem;">
        Total minggu ini: <strong style="color: var(--primary);">${
          weeklyData?.reduce((sum, d) => sum + (d.total_minutes || 0), 0) || 0
        } menit</strong> 
        dalam <strong style="color: var(--primary);">${
          weeklyData?.reduce((sum, d) => sum + (d.sessions_count || 0), 0) || 0
        } sesi</strong>
      </p>
    </div>
  `;
}

function renderFeaturesPage() {
  return `
    <section class="features premium-features">
      <div class="container">
        <h1 class="text-center premium-section-title">Fitur FocusMode</h1>
        <p class="text-center premium-section-subtitle">
          Temukan semua fitur premium yang akan membantu Anda belajar lebih fokus dan produktif
        </p>
        
        <div class="features-grid">
          <div class="feature-card premium-card">
            <i class="fas fa-clock feature-icon"></i>
            <h3>Pomodoro Timer</h3>
            <p>Teknik waktu 25/5 untuk fokus maksimal dengan istirahat teratur.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-book feature-icon"></i>
            <h3>Smart Notes</h3>
            <p>Catatan terorganisir dengan kategori dan pencarian cepat.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-chart-line feature-icon"></i>
            <h3>Progress Tracking</h3>
            <p>Pantau perkembangan belajar dengan statistik visual.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-bell feature-icon"></i>
            <h3>Smart Reminders</h3>
            <p>Pengingat sesi belajar dan istirahat yang cerdas.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-moon feature-icon"></i>
            <h3>Focus Mode</h3>
            <p>Mode bebas gangguan untuk konsentrasi penuh.</p>
          </div>
          <div class="feature-card premium-card">
            <i class="fas fa-sync feature-icon"></i>
            <h3>Sync Across Devices</h3>
            <p>Data tersinkronisasi di semua perangkat Anda.</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderFocusModePage() {
  return `
    <section class="focus-mode premium-section">
      <div class="container">
        <h1 class="text-center premium-section-title">Focus Mode</h1>
        <p class="text-center premium-section-subtitle">Gunakan teknik Pomodoro premium untuk meningkatkan fokus belajar</p>
        
        <div class="timer-controls premium-timer-controls">
          <button class="timer-btn premium-timer-btn active" data-minutes="25">Pomodoro (25m)</button>
          <button class="timer-btn premium-timer-btn" data-minutes="5">Istirahat Pendek (5m)</button>
          <button class="timer-btn premium-timer-btn" data-minutes="15">Istirahat Panjang (15m)</button>
        </div>
        
        <div class="timer-display premium-timer-display">25:00</div>
        
        <div class="timer-actions">
          <button class="btn premium-btn" id="start-timer">Mulai</button>
          <button class="btn premium-btn-secondary" id="pause-timer" disabled>Jeda</button>
          <button class="btn premium-btn-secondary" id="reset-timer">Reset</button>
        </div>
        
        <div class="session-info mt-2 premium-session-info">
          <h3>Sesi Saat Ini</h3>
          <p>Fokus pada: <span id="current-task" contenteditable="true">Belajar</span></p>
        </div>
      </div>
    </section>
  `;
}

function renderSessionsPage() {
  return `
    <section class="sessions premium-section">
      <div class="container">
        <h1 class="text-center premium-section-title">Sesi Belajar</h1>
        <p class="text-center premium-section-subtitle">Kelola jadwal dan progress sesi belajar Anda</p>
        
        <div class="session-actions">
          <button class="btn premium-btn" id="add-session">Tambah Sesi Baru</button>
        </div>
        
        <div class="session-list" id="session-list">
          <!-- Sessions will be populated by JavaScript -->
        </div>
      </div>
    </section>
  `;
}

function renderNotesPage() {
  return `
    <section class="notes-section premium-section">
      <div class="container">
        <h1 class="text-center premium-section-title">Catatan Belajar</h1>
        <p class="text-center premium-section-subtitle">Kelola semua catatan belajar Anda di satu tempat</p>
        
        <div class="notes-actions">
          <button class="btn premium-btn" id="add-note">Tambah Catatan Baru</button>
        </div>
        
        <div class="notes-filter" style="margin-bottom: 2rem; text-align: center;">
          <select id="note-category-filter" class="premium-input" style="display: inline-block; width: auto;">
            <option value="all">Semua Kategori</option>
            <option value="study">Studi</option>
            <option value="personal">Personal</option>
            <option value="work">Pekerjaan</option>
            <option value="other">Lainnya</option>
          </select>
        </div>
        
        <div class="notes-grid">
          <!-- Notes will be populated by JavaScript -->
        </div>
      </div>
    </section>
  `;
}

function renderBooksPage() {
  return `
    <section class="bookshelf-section premium-section">
      <div class="container">
        <h1 class="text-center premium-section-title">Rak Buku Digital</h1>
        <p class="text-center premium-section-subtitle">Kelola daftar bacaan dan progress belajar Anda</p>
        
        <div class="bookshelf-actions">
          <button class="btn premium-btn" id="add-book">Tambah Buku Baru</button>
        </div>
        
        <div class="bookshelf premium-bookshelf">
          <div class="bookshelf-rack premium-rack">
            <h3>Sedang Dibaca</h3>
            <div class="book-list" id="reading-books">
              <!-- Reading books will be populated here -->
            </div>
          </div>
          
          <div class="bookshelf-rack premium-rack">
            <h3>Selesai Dibaca</h3>
            <div class="book-list" id="completed-books">
              <!-- Completed books will be populated here -->
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}

// Initialize Focus Mode Page
function initializeFocusModePage() {
  // Timer controls
  const timerButtons = document.querySelectorAll('.timer-btn');
  timerButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all buttons
      timerButtons.forEach(b => b.classList.remove('active'));
      // Add active class to clicked button
      btn.classList.add('active');

      // Reset timer dengan durasi baru
      const minutes = parseInt(btn.getAttribute('data-minutes'));
      TimerManager.resetTimer();
      timerMinutes = minutes;
      TimerManager.updateTimerDisplay();
    });
  });

  // Timer actions
  const startBtn = document.getElementById('start-timer');
  const pauseBtn = document.getElementById('pause-timer');
  const resetBtn = document.getElementById('reset-timer');

  if (startBtn)
    startBtn.addEventListener('click', () =>
      TimerManager.startTimer(timerMinutes)
    );
  if (pauseBtn)
    pauseBtn.addEventListener('click', () => TimerManager.pauseTimer());
  if (resetBtn)
    resetBtn.addEventListener('click', () => TimerManager.resetTimer());

  // Task input
  const currentTask = document.getElementById('current-task');
  if (currentTask) {
    currentTask.addEventListener('blur', () => {
      if (currentTask.textContent.trim() === '') {
        currentTask.textContent = 'Belajar';
      }
    });
  }
}

// Initialize Sessions Page - FIXED VERSION
let sessionsPageInitialized = false;
async function initializeSessionsPage() {
  const sessionList = document.getElementById('session-list');
  if (!sessionList) return;

  // Prevent multiple simultaneous initializations
  if (sessionsPageInitialized) {
    console.log('Sessions page already initializing, skipping...');
    return;
  }

  sessionsPageInitialized = true;

  try {
    const sessions = await SessionManager.getSessions();

    if (sessions.length === 0) {
      sessionList.innerHTML = `
      <div class="empty-state premium-empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-calendar-plus"></i>
        <h3>Belum Ada Sesi</h3>
        <p>Mulai dengan menambahkan sesi belajar pertama Anda</p>
      </div>
    `;
    } else {
      sessionList.innerHTML = sessions
        .map(
          session => `
      <div class="session-card premium-card" data-session-id="${session.id}">
        <div class="session-header">
          <h3>${session.title}</h3>
          <span class="session-status ${session.status}">
            ${
              session.status === 'planned'
                ? 'Direncanakan'
                : session.status === 'inprogress'
                ? 'Berlangsung'
                : 'Selesai'
            }
          </span>
        </div>
        <div class="session-details">
          <p><strong>Topik:</strong> ${session.subject}</p>
          <p><strong>Durasi:</strong> ${session.duration} menit</p>
          <p><strong>Deskripsi:</strong> ${session.description || '-'}</p>
          <p><strong>Dibuat:</strong> ${new Date(
            session.createdAt || session.created_at
          ).toLocaleDateString('id-ID')}</p>
        </div>
        <div class="session-actions">
          ${
            session.status === 'planned'
              ? `
            <button class="action-btn start-btn premium-action-btn" data-action="start">
              <i class="fas fa-play"></i> Mulai
            </button>
          `
              : session.status === 'inprogress'
              ? `
            <button class="action-btn complete-btn premium-action-btn" data-action="complete">
              <i class="fas fa-check"></i> Selesai
            </button>
          `
              : ''
          }
          <button class="action-btn edit-btn premium-action-btn" data-action="edit">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="action-btn delete-btn premium-action-btn" data-action="delete">
            <i class="fas fa-trash"></i> Hapus
          </button>
        </div>
      </div>
    `
        )
        .join('');
    }

    // Remove old event listeners and add new one (event delegation)
    const newSessionList = sessionList.cloneNode(true);
    sessionList.parentNode.replaceChild(newSessionList, sessionList);

    // Event delegation untuk session actions
    document
      .getElementById('session-list')
      .addEventListener('click', handleSessionAction);

    // FIXED: Event listener untuk tombol tambah sesi
    const addSessionBtn = document.getElementById('add-session');
    if (addSessionBtn) {
      // Remove any existing event listeners
      const newBtn = addSessionBtn.cloneNode(true);
      addSessionBtn.parentNode.replaceChild(newBtn, addSessionBtn);

      // Add new event listener
      document.getElementById('add-session').addEventListener('click', () => {
        ModalManager.showSessionModal();
      });
    }
  } catch (error) {
    console.error('Error initializing sessions page:', error);
    const sessionListElement = document.getElementById('session-list');
    if (sessionListElement) {
      sessionListElement.innerHTML = `
        <div class="empty-state premium-empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Gagal Memuat Sesi</h3>
          <p>Terjadi kesalahan saat memuat data: ${error.message}</p>
          <button onclick="location.reload()" class="btn premium-btn" style="margin-top: 1rem;">Refresh Halaman</button>
        </div>
      `;
    }
  } finally {
    sessionsPageInitialized = false;
  }
}

// Helper function to reload sessions page
async function reloadSessionsPage() {
  if (window.location.hash.slice(2) === 'sesi-belajar') {
    await initializeSessionsPage();
  }
}

// Initialize Notes Page - ASYNC VERSION
let notesPageInitialized = false;
async function initializeNotesPage() {
  const notesGrid = document.querySelector('.notes-grid');
  if (!notesGrid) return;

  // Prevent multiple simultaneous initializations
  if (notesPageInitialized) {
    console.log('Notes page already initializing, skipping...');
    return;
  }

  notesPageInitialized = true;

  try {
    const filter =
      document.getElementById('note-category-filter')?.value || 'all';
    const notes = await DataManager.getNotes(filter);

    if (notes.length === 0) {
      notesGrid.innerHTML = `
      <div class="empty-state premium-empty-state" style="grid-column: 1 / -1;">
        <i class="fas fa-sticky-note"></i>
        <h3>Belum Ada Catatan</h3>
        <p>Mulai dengan menambahkan catatan pertama Anda</p>
      </div>
    `;
    } else {
      notesGrid.innerHTML = notes
        .map(
          note => `
        <div class="note-card premium-card" data-note-id="${note.id}">
          <div class="note-header">
            <h3>${note.title}</h3>
            <span class="note-category ${note.category}">${getCategoryLabel(
            note.category
          )}</span>
          </div>
          <div class="note-date">${new Date(
            note.createdAt || note.created_at
          ).toLocaleDateString('id-ID')}</div>
          <div class="note-body">${note.content}</div>
          <div class="note-actions">
            <button class="action-btn edit-btn premium-action-btn" data-action="edit">
              <i class="fas fa-edit"></i> Edit
            </button>
            <button class="action-btn delete-btn premium-action-btn" data-action="delete">
              <i class="fas fa-trash"></i> Hapus
            </button>
          </div>
        </div>
      `
        )
        .join('');
    }

    // Remove old event listeners and add new one (event delegation)
    const newNotesGrid = notesGrid.cloneNode(true);
    notesGrid.parentNode.replaceChild(newNotesGrid, notesGrid);

    // Event delegation untuk note actions
    document
      .querySelector('.notes-grid')
      .addEventListener('click', handleNoteAction);

    // Filter - remove old listener and add new
    const filterSelect = document.getElementById('note-category-filter');
    if (filterSelect) {
      const newFilterSelect = filterSelect.cloneNode(true);
      filterSelect.parentNode.replaceChild(newFilterSelect, filterSelect);
      document
        .getElementById('note-category-filter')
        .addEventListener('change', async () => {
          notesPageInitialized = false;
          await initializeNotesPage();
        });
    }

    // FIXED: Event listener untuk tombol tambah catatan
    const addNoteBtn = document.getElementById('add-note');
    if (addNoteBtn) {
      // Remove any existing event listeners
      const newBtn = addNoteBtn.cloneNode(true);
      addNoteBtn.parentNode.replaceChild(newBtn, addNoteBtn);

      // Add new event listener
      document.getElementById('add-note').addEventListener('click', () => {
        ModalManager.showNoteModal();
      });
    }
  } catch (error) {
    console.error('Error initializing notes page:', error);
    const notesGridElement = document.querySelector('.notes-grid');
    if (notesGridElement) {
      notesGridElement.innerHTML = `
        <div class="empty-state premium-empty-state" style="grid-column: 1 / -1;">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>Gagal Memuat Catatan</h3>
          <p>Terjadi kesalahan saat memuat data: ${error.message}</p>
          <button onclick="location.reload()" class="btn premium-btn" style="margin-top: 1rem;">Refresh Halaman</button>
        </div>
      `;
    }
  } finally {
    notesPageInitialized = false;
  }
}

// Helper function to reload notes page
async function reloadNotesPage() {
  if (window.location.hash.slice(2) === 'catatan') {
    await initializeNotesPage();
  }
}

// Initialize Books Page - ASYNC VERSION
let booksPageInitialized = false;
async function initializeBooksPage() {
  const readingContainer = document.getElementById('reading-books');
  const completedContainer = document.getElementById('completed-books');
  if (!readingContainer || !completedContainer) return;

  // Prevent multiple simultaneous initializations
  if (booksPageInitialized) {
    console.log('Books page already initializing, skipping...');
    return;
  }

  booksPageInitialized = true;

  try {
    const books = await DataManager.getBooks();
    const readingBooks = books.filter(book => !book.isComplete);
    const completedBooks = books.filter(book => book.isComplete);

    readingContainer.innerHTML =
      readingBooks.length === 0
        ? '<p class="empty-state premium-empty-state">Belum ada buku yang sedang dibaca</p>'
        : readingBooks
            .map(
              book => `
        <div class="book-card premium-card" data-book-id="${book.id}">
          <div class="book-info">
            <h4>${book.title}</h4>
            <p><strong>Penulis:</strong> ${book.author}</p>
            <p><strong>Kategori:</strong> ${getBookCategoryLabel(
              book.category
            )}</p>
            ${
              book.description
                ? `<p class="book-description">${book.description}</p>`
                : ''
            }
            <p class="book-date">Ditambahkan: ${new Date(
              book.createdAt || book.created_at
            ).toLocaleDateString('id-ID')}</p>
          </div>
          <div class="book-actions">
            <button class="move-btn premium-action-btn" data-action="toggle">
              <i class="fas fa-check"></i> Tandai Selesai
            </button>
            <button class="action-btn edit-btn premium-action-btn" data-action="edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn premium-action-btn" data-action="delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `
            )
            .join('');

    completedContainer.innerHTML =
      completedBooks.length === 0
        ? '<p class="empty-state premium-empty-state">Belum ada buku yang selesai dibaca</p>'
        : completedBooks
            .map(
              book => `
        <div class="book-card premium-card" data-book-id="${book.id}">
          <div class="book-info">
            <h4>${book.title}</h4>
            <p><strong>Penulis:</strong> ${book.author}</p>
            <p><strong>Kategori:</strong> ${getBookCategoryLabel(
              book.category
            )}</p>
            ${
              book.description
                ? `<p class="book-description">${book.description}</p>`
                : ''
            }
            <p class="book-date">Selesai: ${new Date(
              book.updatedAt || book.updated_at
            ).toLocaleDateString('id-ID')}</p>
          </div>
          <div class="book-actions">
            <button class="move-btn premium-action-btn" data-action="toggle">
              <i class="fas fa-undo"></i> Kembalikan
            </button>
            <button class="action-btn edit-btn premium-action-btn" data-action="edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn premium-action-btn" data-action="delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `
            )
            .join('');

    // Remove old event listeners and add new one (event delegation)
    const bookshelf = document.querySelector('.bookshelf');
    if (bookshelf) {
      const newBookshelf = bookshelf.cloneNode(true);
      bookshelf.parentNode.replaceChild(newBookshelf, bookshelf);
      document
        .querySelector('.bookshelf')
        .addEventListener('click', handleBookAction);
    }

    // Add book button
    const addBookBtn = document.getElementById('add-book');
    if (addBookBtn) {
      // Remove any existing event listeners
      const newBtn = addBookBtn.cloneNode(true);
      addBookBtn.parentNode.replaceChild(newBtn, addBookBtn);

      // Add new event listener
      document
        .getElementById('add-book')
        .addEventListener('click', () => ModalManager.showBookModal());
    }
  } catch (error) {
    console.error('Error initializing books page:', error);
    if (readingContainer) {
      readingContainer.innerHTML = `
        <p class="empty-state premium-empty-state">
          <i class="fas fa-exclamation-triangle"></i>
          Gagal memuat buku: ${error.message}
        </p>
      `;
    }
  } finally {
    booksPageInitialized = false;
  }
}

// Helper function to reload books page
async function reloadBooksPage() {
  if (window.location.hash.slice(2) === 'rak-buku') {
    await initializeBooksPage();
  }
}

// Event Delegation Handlers
function handleNoteAction(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const noteCard = button.closest('.note-card');
  if (!noteCard) return;

  const noteId = parseInt(noteCard.getAttribute('data-note-id'));
  const action = button.getAttribute('data-action');

  if (action === 'edit') editNote(noteId);
  if (action === 'delete') deleteNote(noteId);
}

function handleBookAction(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const bookCard = button.closest('.book-card');
  if (!bookCard) return;

  const bookId = parseInt(bookCard.getAttribute('data-book-id'));
  const action = button.getAttribute('data-action');

  if (action === 'toggle') toggleBookStatus(bookId);
  if (action === 'edit') editBook(bookId);
  if (action === 'delete') deleteBook(bookId);
}

function handleSessionAction(event) {
  const button = event.target.closest('button');
  if (!button) return;

  const sessionCard = button.closest('.session-card');
  if (!sessionCard) return;

  const sessionId = parseInt(sessionCard.getAttribute('data-session-id'));
  const action = button.getAttribute('data-action');

  if (action === 'start') startSession(sessionId);
  if (action === 'complete') completeSession(sessionId);
  if (action === 'edit') editSession(sessionId);
  if (action === 'delete') deleteSession(sessionId);
}

// Helper functions
async function editNote(id) {
  try {
    const notes = await DataManager.getNotes();
    const note = notes.find(n => n.id === id);
    if (note) ModalManager.showNoteModal(note);
  } catch (error) {
    console.error('Error loading note for edit:', error);
    showToast('Gagal memuat catatan', 'error');
  }
}

async function deleteNote(id) {
  if (confirm('Hapus catatan ini?')) {
    try {
      await DataManager.deleteNote(id);
      showToast('Catatan dihapus!', 'success');
      await reloadNotesPage();
    } catch (error) {
      console.error('Error deleting note:', error);
      showToast('Gagal menghapus catatan', 'error');
    }
  }
}

async function editBook(id) {
  try {
    const books = await DataManager.getBooks();
    const book = books.find(b => b.id === id);
    if (book) ModalManager.showBookModal(book);
  } catch (error) {
    console.error('Error loading book for edit:', error);
    showToast('Gagal memuat buku', 'error');
  }
}

async function deleteBook(id) {
  if (confirm('Hapus buku ini?')) {
    try {
      await DataManager.deleteBook(id);
      showToast('Buku dihapus!', 'success');
      await reloadBooksPage();
    } catch (error) {
      console.error('Error deleting book:', error);
      showToast('Gagal menghapus buku', 'error');
    }
  }
}

async function toggleBookStatus(id) {
  try {
    await DataManager.toggleBookStatus(id);
    showToast('Status buku diperbarui!', 'success');
    await reloadBooksPage();
  } catch (error) {
    console.error('Error toggling book status:', error);
    showToast('Gagal mengubah status buku', 'error');
  }
}

async function startSession(id) {
  try {
    await SessionManager.startSession(id);
    showToast('Sesi dimulai!', 'success');
    await reloadSessionsPage();
  } catch (error) {
    console.error('Error starting session:', error);
    showToast('Gagal memulai sesi', 'error');
  }
}

async function completeSession(id) {
  try {
    await SessionManager.completeSession(id);
    showToast('Sesi diselesaikan!', 'success');
    await reloadSessionsPage();
  } catch (error) {
    console.error('Error completing session:', error);
    showToast('Gagal menyelesaikan sesi', 'error');
  }
}

async function editSession(id) {
  const sessions = await SessionManager.getSessions();
  const session = sessions.find(s => s.id === id);
  if (session) ModalManager.showSessionModal(session);
}

async function deleteSession(id) {
  if (confirm('Hapus sesi ini?')) {
    try {
      await SessionManager.deleteSession(id);
      showToast('Sesi dihapus!', 'success');
      await reloadSessionsPage();
    } catch (error) {
      console.error('Error deleting session:', error);
      showToast('Gagal menghapus sesi', 'error');
    }
  }
}

function getCategoryLabel(cat) {
  const map = {
    study: 'Studi',
    personal: 'Personal',
    work: 'Pekerjaan',
    other: 'Lainnya',
  };
  return map[cat] || cat;
}

function getBookCategoryLabel(cat) {
  const map = {
    academic: 'Akademik',
    fiction: 'Fiksi',
    'non-fiction': 'Non-Fiksi',
    reference: 'Referensi',
  };
  return map[cat] || cat;
}

// Toast Notification - Enhanced Version
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type} premium-toast`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${
        type === 'success'
          ? 'fa-check-circle'
          : type === 'error'
          ? 'fa-times-circle'
          : type === 'warning'
          ? 'fa-exclamation-triangle'
          : 'fa-info-circle'
      }"></i>
      <span>${message}</span>
    </div>
  `;
  toastContainer.appendChild(toast);

  // Add show class after a small delay for animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Inject component styles
function injectComponentStyles() {
  const styles = document.createElement('style');
  styles.id = 'component-styles';
  styles.textContent = `
    .note-category { padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.7rem; font-weight: 600; }
    .note-category.study { background: var(--primary); color: white; }
    .note-category.personal { background: var(--accent); color: white; }
    .note-category.work { background: var(--warning); color: var(--dark); }
    .note-category.other { background: #636e72; color: white; }
    
    .session-status { padding: 0.3rem 0.8rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; white-space: nowrap; }
    .session-status.planned { background: var(--warning); color: var(--dark); }
    .session-status.inprogress { background: var(--primary); color: white; }
    .session-status.completed { background: var(--success); color: white; }
    
    .start-btn { background: var(--success); color: white; }
    .start-btn:hover { background: #00a085; }
    .complete-btn { background: var(--primary); color: white; }
    .complete-btn:hover { background: var(--secondary); }
    
    /* Stats Section Styles */
    .stats-overview { padding: 3rem 0; background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
    .stat-card { background: white; border-radius: 16px; padding: 1.5rem; display: flex; align-items: center; gap: 1rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .stat-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.12); }
    .stat-icon { width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, #74b9ff, #0984e3); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .stat-icon i { font-size: 1.5rem; color: white; }
    .stat-info h3 { font-size: 1.8rem; font-weight: 700; color: #2d3436; margin: 0; }
    .stat-info p { font-size: 0.9rem; color: #636e72; margin: 0.25rem 0 0 0; }
    
    /* Weekly Chart Styles */
    .weekly-stats-container { background: white; border-radius: 16px; padding: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
    .weekly-chart { min-height: 180px; }
    .chart-loading { text-align: center; padding: 2rem; color: #636e72; }
    .chart-bar:hover { opacity: 0.9; transform: scaleY(1.05); }
    
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
      .stat-card { padding: 1rem; flex-direction: column; text-align: center; }
      .stat-icon { width: 50px; height: 50px; }
      .stat-icon i { font-size: 1.2rem; }
      .stat-info h3 { font-size: 1.4rem; }
    }
  `;
  const existing = document.getElementById('component-styles');
  if (existing) existing.remove();
  document.head.appendChild(styles);
}

// Navigation active state
function updateActiveNav() {
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  const current = window.location.hash.slice(2) || 'beranda';
  const link = document.querySelector(`nav a[href="#/${current}"]`);
  if (link) link.classList.add('active');
}

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  console.log('FocusMode Premium App Initializing...');

  const loadingIndicator = document.getElementById('loading-indicator');

  // Helper to hide loading
  const hideLoading = () => {
    if (loadingIndicator) {
      loadingIndicator.classList.add('hidden');
    }
  };

  // Set a maximum loading timeout (safety net)
  const loadingTimeout = setTimeout(() => {
    console.log('Loading timeout reached, forcing hide');
    hideLoading();
  }, 3000);

  try {
    // Setup offline manager (non-blocking)
    try {
      await OfflineManager.initialize();
    } catch (offlineError) {
      console.warn('Offline manager failed to initialize:', offlineError);
    }

    // Check auth - this will show either auth page or main app
    checkAuth();

    // Initialize notifications (non-blocking)
    try {
      await NotificationManager.requestPermission();
      const settings = NotificationManager.getSettings();
      if (settings.dailyReminders) {
        NotificationManager.scheduleDailyReminder(8, 0);
      }
      console.log('Notification system initialized');
    } catch (notifError) {
      console.warn('Notification setup failed:', notifError);
    }

    // Create initial backup after delay
    setTimeout(() => {
      try {
        OfflineManager.backupData();
      } catch (backupError) {
        console.warn('Backup failed:', backupError);
      }
    }, 5000);

    console.log('FocusMode Premium App Initialized');
  } catch (error) {
    console.error('App initialization error:', error);
    // Show auth page as fallback
    showAuthPage();
  } finally {
    // Clear the safety timeout and hide loading
    clearTimeout(loadingTimeout);
    hideLoading();
  }
});

window.addEventListener('hashchange', async () => {
  if (currentUser && !isLoadingPage) {
    await loadPage();
  }
});
