import { Api } from '../../data/api.js';
import { DB } from '../../js/db.js';

export class SesiBelajarPage {
  constructor() {
    this.name = 'sesi-belajar';
    this.sessions = [];
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async render() {
    return `
      <section class="sessions">
        <div class="container">
          <h2>Sesi Belajar Saya</h2>
          <p>Kelola dan pantau sesi belajar Anda</p>
          
          <div class="session-actions">
            <button class="btn" id="addSessionBtn">Tambah Sesi Baru</button>
            <div class="filter-controls">
              <select id="sessionFilter">
                <option value="all">Semua Sesi</option>
                <option value="planned">Direncanakan</option>
                <option value="inprogress">Sedang Berlangsung</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
            <div class="search-box">
              <input type="text" id="sessionSearch" placeholder="Cari sesi...">
              <i class="fas fa-search"></i>
            </div>
          </div>
          
          <div class="session-list" id="sessionList">
            <div class="loading-indicator">
              <p>Memuat sesi belajar...</p>
            </div>
          </div>
        </div>
      </section>

      <div id="sessionModal" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h3 id="sessionModalTitle">Tambah Sesi Belajar</h3>
            <span class="close-modal">&times;</span>
          </div>
          <form id="sessionForm">
            <div class="form-group">
              <label for="sessionTitle">Judul Sesi</label>
              <input type="text" id="sessionTitle" placeholder="Masukkan judul sesi belajar" required>
            </div>
            <div class="form-group">
              <label for="sessionSubject">Mata Pelajaran</label>
              <input type="text" id="sessionSubject" placeholder="Masukkan mata pelajaran" required>
            </div>
            <div class="form-group">
              <label for="sessionDuration">Durasi (menit)</label>
              <input type="number" id="sessionDuration" placeholder="Durasi sesi dalam menit" required>
            </div>
            <div class="form-group">
              <label for="sessionStatus">Status</label>
              <select id="sessionStatus" required>
                <option value="planned">Direncanakan</option>
                <option value="inprogress">Sedang Berlangsung</option>
                <option value="completed">Selesai</option>
              </select>
            </div>
            <div class="form-group">
              <label for="sessionNotes">Catatan</label>
              <textarea id="sessionNotes" placeholder="Tambahkan catatan untuk sesi ini" rows="3"></textarea>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" id="cancelSession">Batal</button>
              <button type="submit" class="btn">Simpan Sesi</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    await this.loadSessions();
    this.setupEventListeners();
  }

  async loadSessions() {
    try {
      if (Api.auth.isLoggedIn()) {
        this.sessions = await Api.sessions.getAll();
        this.renderSessions();
        return;
      }

      // Fallback to local DB
      this.sessions = await DB.getAll('sessions');
      this.renderSessions();
    } catch (error) {
      console.error('Error loading sessions:', error);
      // Fallback to local DB
      try {
        this.sessions = await DB.getAll('sessions');
        this.renderSessions();
      } catch (dbError) {
        this.showError('Gagal memuat sesi belajar');
      }
    }
  }

  renderSessions() {
    const sessionList = document.getElementById('sessionList');
    const filter = document.getElementById('sessionFilter')?.value || 'all';

    const filteredSessions = this.sessions.filter(session => {
      if (filter === 'all') return true;
      return session.status === filter;
    });

    if (filteredSessions.length === 0) {
      sessionList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-calendar-plus"></i>
          <h3>Belum ada sesi belajar</h3>
          <p>Tambahkan sesi baru untuk memulai perencanaan belajar Anda</p>
          <button class="btn" id="addFirstSession">Tambah Sesi Pertama</button>
        </div>
      `;
      return;
    }

    sessionList.innerHTML = filteredSessions
      .map(
        session => `
      <div class="session-card" data-id="${session.id}">
        <div class="session-header">
          <h3>${this.escapeHtml(session.title)}</h3>
          <span class="session-status ${session.status}">
            ${this.getStatusText(session.status)}
          </span>
        </div>
        <div class="session-details">
          <p><strong>Mata Pelajaran:</strong> ${this.escapeHtml(session.subject)}</p>
          <p><strong>Durasi:</strong> ${session.duration} menit</p>
          <p><strong>Dibuat:</strong> ${new Date(
            session.created_at || session.createdAt
          ).toLocaleDateString('id-ID')}</p>
          ${
            session.description
              ? `<p><strong>Deskripsi:</strong> ${this.escapeHtml(session.description)}</p>`
              : ''
          }
          ${
            session.notes
              ? `<p><strong>Catatan:</strong> ${this.escapeHtml(session.notes)}</p>`
              : ''
          }
        </div>
        <div class="session-actions">
          <button class="action-btn edit-btn" data-id="${
            session.id
          }">Edit</button>
          <button class="action-btn delete-btn" data-id="${
            session.id
          }">Hapus</button>
          ${
            session.status === 'planned'
              ? `<button class="action-btn start-btn" data-id="${session.id}">Mulai</button>`
              : ''
          }
          ${
            session.status === 'inprogress'
              ? `<button class="action-btn complete-btn" data-id="${session.id}">Selesai</button>`
              : ''
          }
        </div>
      </div>
    `
      )
      .join('');
  }

  getStatusText(status) {
    const statusMap = {
      planned: 'Direncanakan',
      inprogress: 'Sedang Berlangsung',
      completed: 'Selesai',
    };
    return statusMap[status] || status;
  }

  searchSessions(query) {
    if (!query.trim()) {
      this.renderSessions();
      return;
    }

    const filter = document.getElementById('sessionFilter')?.value || 'all';
    let filteredSessions = this.sessions;

    // Apply status filter first
    if (filter !== 'all') {
      filteredSessions = filteredSessions.filter(session => session.status === filter);
    }

    // Apply search filter
    filteredSessions = filteredSessions.filter(
      session =>
        session.title.toLowerCase().includes(query.toLowerCase()) ||
        session.subject.toLowerCase().includes(query.toLowerCase()) ||
        (session.description && session.description.toLowerCase().includes(query.toLowerCase()))
    );

    // Render filtered sessions
    const sessionList = document.getElementById('sessionList');
    if (filteredSessions.length === 0) {
      sessionList.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>Tidak ada hasil</h3>
          <p>Tidak ditemukan sesi yang sesuai dengan pencarian Anda</p>
        </div>
      `;
      return;
    }

    sessionList.innerHTML = filteredSessions
      .map(
        session => `
      <div class="session-card" data-id="${session.id}">
        <div class="session-header">
          <h3>${this.escapeHtml(session.title)}</h3>
          <span class="session-status ${session.status}">
            ${this.getStatusText(session.status)}
          </span>
        </div>
        <div class="session-details">
          <p><strong>Mata Pelajaran:</strong> ${this.escapeHtml(session.subject)}</p>
          <p><strong>Durasi:</strong> ${session.duration} menit</p>
          <p><strong>Dibuat:</strong> ${new Date(
            session.created_at || session.createdAt
          ).toLocaleDateString('id-ID')}</p>
          ${
            session.description
              ? `<p><strong>Deskripsi:</strong> ${this.escapeHtml(session.description)}</p>`
              : ''
          }
        </div>
        <div class="session-actions">
          <button class="action-btn edit-btn" data-id="${
            session.id
          }">Edit</button>
          <button class="action-btn delete-btn" data-id="${
            session.id
          }">Hapus</button>
          ${
            session.status === 'planned'
              ? `<button class="action-btn start-btn" data-id="${session.id}">Mulai</button>`
              : ''
          }
          ${
            session.status === 'inprogress'
              ? `<button class="action-btn complete-btn" data-id="${session.id}">Selesai</button>`
              : ''
          }
        </div>
      </div>
    `
      )
      .join('');
  }

  setupEventListeners() {
    // Add session button
    document
      .getElementById('addSessionBtn')
      .addEventListener('click', () => this.openSessionModal());

    // Search functionality
    document.getElementById('sessionSearch').addEventListener('input', e => {
      this.searchSessions(e.target.value);
    });

    // Filter change
    document
      .getElementById('sessionFilter')
      .addEventListener('change', () => this.renderSessions());

    // Modal events
    document
      .querySelector('.close-modal')
      .addEventListener('click', () => this.closeModal());
    document
      .getElementById('cancelSession')
      .addEventListener('click', () => this.closeModal());
    document
      .getElementById('sessionForm')
      .addEventListener('submit', e => this.handleSessionSubmit(e));

    // Event delegation for session actions
    document.getElementById('sessionList').addEventListener('click', e => {
      const target = e.target.closest('button');
      if (!target) return;

      const sessionId = parseInt(target.dataset.id);

      if (target.classList.contains('edit-btn')) {
        this.editSession(sessionId);
      } else if (target.classList.contains('delete-btn')) {
        this.deleteSession(sessionId);
      } else if (target.classList.contains('start-btn')) {
        this.startSession(sessionId);
      } else if (target.classList.contains('complete-btn')) {
        this.completeSession(sessionId);
      }
    });

    // Empty state button
    document.addEventListener('click', e => {
      if (e.target.id === 'addFirstSession') {
        this.openSessionModal();
      }
    });
  }

  openSessionModal(session = null) {
    const modal = document.getElementById('sessionModal');
    const title = document.getElementById('sessionModalTitle');
    const form = document.getElementById('sessionForm');

    if (session) {
      title.textContent = 'Edit Sesi Belajar';
      form.dataset.editId = session.id;
      document.getElementById('sessionTitle').value = session.title;
      document.getElementById('sessionSubject').value = session.subject;
      document.getElementById('sessionDuration').value = session.duration;
      document.getElementById('sessionStatus').value = session.status;
      document.getElementById('sessionNotes').value =
        session.description || session.notes || '';
    } else {
      title.textContent = 'Tambah Sesi Belajar';
      form.reset();
      delete form.dataset.editId;
    }

    modal.style.display = 'flex';
  }

  closeModal() {
    document.getElementById('sessionModal').style.display = 'none';
  }

  async handleSessionSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const sessionData = {
      title: document.getElementById('sessionTitle').value,
      subject: document.getElementById('sessionSubject').value,
      duration: parseInt(document.getElementById('sessionDuration').value),
      status: document.getElementById('sessionStatus').value,
      description: document.getElementById('sessionNotes').value,
    };

    try {
      if (Api.auth.isLoggedIn()) {
        if (form.dataset.editId) {
          // Update existing session
          await Api.sessions.update(form.dataset.editId, sessionData);
          
          // Reload sessions from API to get updated data
          this.sessions = await Api.sessions.getAll();
        } else {
          // Create new session
          const response = await Api.sessions.create(sessionData);
          
          // Reload sessions from API to get the complete data including the new session
          this.sessions = await Api.sessions.getAll();
        }
      } else {
        // Fallback to local DB
        if (form.dataset.editId) {
          sessionData.id = parseInt(form.dataset.editId);
          sessionData.updatedAt = new Date().toISOString();
        } else {
          sessionData.createdAt = new Date().toISOString();
        }
        
        const savedSession = await DB.set('sessions', sessionData);

        // Update local state
        if (form.dataset.editId) {
          const index = this.sessions.findIndex(s => s.id === parseInt(form.dataset.editId));
          if (index !== -1) {
            this.sessions[index] = savedSession;
          }
        } else if (savedSession) {
          this.sessions.push(savedSession);
        }
      }

      // Re-render with updated data
      this.renderSessions();
      this.closeModal();
      this.showSuccess(form.dataset.editId ? 'Sesi berhasil diperbarui' : 'Sesi berhasil dibuat');
    } catch (error) {
      console.error('Error saving session:', error);
      this.showError('Gagal menyimpan sesi');

      // Reload sessions on error to restore correct state
      await this.loadSessions();
    }
  }

  async editSession(id) {
    const session = this.sessions.find(s => s.id === id);
    if (session) {
      this.openSessionModal(session);
    }
  }

  async deleteSession(id) {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini?')) return;

    // Optimistic UI update - show loading state
    const sessionCard = document.querySelector(`.session-card[data-id="${id}"]`);
    if (sessionCard) {
      sessionCard.style.opacity = '0.5';
      sessionCard.style.pointerEvents = 'none';
    }

    try {
      if (Api.auth.isLoggedIn()) {
        await Api.sessions.delete(id);
        
        // Reload sessions from API to get updated list
        this.sessions = await Api.sessions.getAll();
      } else {
        await DB.delete('sessions', id);
        
        // Remove from local state
        this.sessions = this.sessions.filter(s => s.id !== id);
      }

      // Re-render the sessions list
      this.renderSessions();
      this.showSuccess('Sesi berhasil dihapus');
    } catch (error) {
      console.error('Error deleting session:', error);
      this.showError('Gagal menghapus sesi');

      // Reload sessions on error to restore correct state
      await this.loadSessions();
    }
  }

  async startSession(id) {
    // Optimistic UI update
    const sessionCard = document.querySelector(`.session-card[data-id="${id}"]`);
    if (sessionCard) {
      sessionCard.style.opacity = '0.5';
      sessionCard.style.pointerEvents = 'none';
    }

    try {
      const session = this.sessions.find(s => s.id === id);
      if (!session) {
        this.showError('Sesi tidak ditemukan');
        return;
      }

      if (Api.auth.isLoggedIn()) {
        await Api.sessions.start(id);
        
        // Reload sessions from API to get updated status
        this.sessions = await Api.sessions.getAll();
      } else {
        // Update local session
        session.status = 'inprogress';
        session.started_at = new Date().toISOString();
        await DB.set('sessions', session);
        
        // Update local state
        const index = this.sessions.findIndex(s => s.id === id);
        if (index !== -1) {
          this.sessions[index] = session;
        }
      }

      // Re-render to show updated status
      this.renderSessions();
      this.showSuccess('Sesi berhasil dimulai');

      // Navigate to focus mode after a brief delay
      setTimeout(() => {
        window.location.hash = '#/focus-mode';
      }, 500);
    } catch (error) {
      console.error('Error starting session:', error);
      this.showError('Gagal memulai sesi');

      // Reload sessions on error to restore correct state
      await this.loadSessions();
    }
  }

  async completeSession(id) {
    // Optimistic UI update
    const sessionCard = document.querySelector(`.session-card[data-id="${id}"]`);
    if (sessionCard) {
      sessionCard.style.opacity = '0.5';
      sessionCard.style.pointerEvents = 'none';
    }

    try {
      const session = this.sessions.find(s => s.id === id);
      if (!session) {
        this.showError('Sesi tidak ditemukan');
        return;
      }

      if (Api.auth.isLoggedIn()) {
        await Api.sessions.complete(id, session.duration);
        
        // Reload sessions from API to get updated status
        this.sessions = await Api.sessions.getAll();
      } else {
        // Update local session
        session.status = 'completed';
        session.completed_at = new Date().toISOString();
        await DB.set('sessions', session);
        
        // Update local state
        const index = this.sessions.findIndex(s => s.id === id);
        if (index !== -1) {
          this.sessions[index] = session;
        }
      }

      // Re-render to show updated status
      this.renderSessions();
      this.showSuccess('Sesi berhasil diselesaikan');
    } catch (error) {
      console.error('Error completing session:', error);
      this.showError('Gagal menyelesaikan sesi');

      // Reload sessions on error to restore correct state
      await this.loadSessions();
    }
  }

  showSuccess(message) {
    const event = new CustomEvent('show-toast', {
      detail: { message, type: 'success' },
    });
    document.dispatchEvent(event);
  }

  showError(message) {
    const event = new CustomEvent('show-toast', {
      detail: { message, type: 'error' },
    });
    document.dispatchEvent(event);
  }
}