import { Api } from '../../data/api.js';

export class BerandaPage {
  constructor() {
    this.name = 'beranda';
    this.userStats = null;
  }

  async render() {
    return `
      <section class="hero">
        <div class="container">
          <h1>Tingkatkan Fokus Belajar Anda</h1>
          <p>FocusMode membantu siswa dan pelajar untuk meningkatkan produktivitas dengan teknik Pomodoro, pencatatan yang terorganisir, dan lingkungan belajar yang bebas gangguan.</p>
          <div class="hero-actions">
            <a href="#/focus-mode" class="btn">Mulai Fokus</a>
            <a href="#/fitur" class="btn btn-secondary">Pelajari Fitur</a>
          </div>
        </div>
      </section>

      <section class="stats-overview">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="stat-info">
                <h3 id="totalStudyTime">0 menit</h3>
                <p>Total Waktu Belajar</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-info">
                <h3 id="completedSessions">0</h3>
                <p>Sesi Selesai</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-sticky-note"></i>
              </div>
              <div class="stat-info">
                <h3 id="totalNotes">0</h3>
                <p>Catatan</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-book"></i>
              </div>
              <div class="stat-info">
                <h3 id="totalBooks">0</h3>
                <p>Buku</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="features-preview">
        <div class="container">
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-clock"></i>
            </div>
            <h3>Timer Pomodoro</h3>
            <p>Teknik 25 menit fokus dan 5 menit istirahat</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-sticky-note"></i>
            </div>
            <h3>Catatan Pintar</h3>
            <p>Kelola catatan belajar dengan mudah</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">
              <i class="fas fa-book"></i>
            </div>
            <h3>Rak Buku Digital</h3>
            <p>Organisir koleksi buku dan materi</p>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.loadDashboardData();
  }

  async loadDashboardData() {
    try {
      if (!Api.auth.isLoggedIn()) return;

      const data = await Api.user.getDashboard();
      this.userStats = data;
      this.updateStatsDisplay(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  }

  updateStatsDisplay(data) {
    if (data.dashboard) {
      document.getElementById('totalStudyTime').textContent = `${
        data.todayStats?.total_minutes || 0
      } menit`;
      document.getElementById('completedSessions').textContent =
        data.dashboard.completed_sessions || 0;
      document.getElementById('totalNotes').textContent =
        data.dashboard.total_notes || 0;
      document.getElementById('totalBooks').textContent =
        data.dashboard.total_books || 0;
    }
  }
}
