import { Api } from '../../data/api.js';

export class FiturPage {
  constructor() {
    this.name = 'fitur';
  }

  async render() {
    return `
      <section class="features">
        <div class="container">
          <h1>Fitur FocusMode</h1>
          <p class="subtitle">Semua alat yang Anda butuhkan untuk belajar lebih fokus dan produktif</p>
          
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-clock"></i>
              </div>
              <h3>Timer Pomodoro</h3>
              <p>Teknik 25 menit fokus dan 5 menit istirahat untuk meningkatkan produktivitas belajar Anda.</p>
              <ul>
                <li>Timer yang dapat disesuaikan</li>
                <li>Notifikasi waktu habis</li>
                <li>Statistik sesi belajar</li>
                <li>Sync dengan database</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-sticky-note"></i>
              </div>
              <h3>Catatan Pintar</h3>
              <p>Buat dan kelola catatan belajar Anda dengan mudah. Terintegrasi dengan sistem fokus.</p>
              <ul>
                <li>Editor catatan yang sederhana</li>
                <li>Pencarian cepat</li>
                <li>Kategorisasi otomatis</li>
                <li>Backup cloud</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-book"></i>
              </div>
              <h3>Rak Buku Digital</h3>
              <p>Kelola koleksi buku dan materi belajar Anda dalam rak buku digital yang terorganisir.</p>
              <ul>
                <li>Status baca (selesai/belum)</li>
                <li>Pencarian dan filter</li>
                <li>Import dari ISBN</li>
                <li>Koleksi terorganisir</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-chart-line"></i>
              </div>
              <h3>Statistik Belajar</h3>
              <p>Pantau perkembangan belajar Anda dengan statistik dan laporan yang detail.</p>
              <ul>
                <li>Grafik waktu belajar</li>
                <li>Target harian/mingguan</li>
                <li>Pencapaian dan badge</li>
                <li>Laporan mingguan</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-database"></i>
              </div>
              <h3>Cloud Sync</h3>
              <p>Semua data tersimpan aman di cloud dan tersinkronisasi di semua perangkat.</p>
              <ul>
                <li>Backup otomatis</li>
                <li>Sync real-time</li>
                <li>Multi-device support</li>
                <li>Data recovery</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">
                <i class="fas fa-user-friends"></i>
              </div>
              <h3>User Management</h3>
              <p>Sistem autentikasi yang aman dengan JWT token dan manajemen pengguna.</p>
              <ul>
                <li>Login/Register aman</li>
                <li>Profil pengguna</li>
                <li>Pengaturan personal</li>
                <li>Keamanan data</li>
              </ul>
            </div>
          </div>

          <div class="api-status">
            <h3>Status Sistem</h3>
            <div class="status-grid">
              <div class="status-item">
                <span class="status-label">API Server</span>
                <span class="status-indicator" id="apiStatus">Checking...</span>
              </div>
              <div class="status-item">
                <span class="status-label">Database</span>
                <span class="status-indicator" id="dbStatus">Checking...</span>
              </div>
              <div class="status-item">
                <span class="status-label">Authentication</span>
                <span class="status-indicator" id="authStatus">Checking...</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  async afterRender() {
    await this.checkSystemStatus();
  }

  async checkSystemStatus() {
    // Check API status
    try {
      const isHealthy = await Api.healthCheck();
      if (isHealthy) {
        document.getElementById('apiStatus').textContent = 'Online';
        document.getElementById('apiStatus').className =
          'status-indicator online';

        // Try to get more health details
        try {
          const healthData = await Api.get('/health', false);
          document.getElementById('dbStatus').textContent =
            healthData.database === 'Connected' ? 'Online' : 'Offline';
          document.getElementById('dbStatus').className = `status-indicator ${
            healthData.database === 'Connected' ? 'online' : 'offline'
          }`;
        } catch {
          document.getElementById('dbStatus').textContent = 'Unknown';
          document.getElementById('dbStatus').className =
            'status-indicator offline';
        }
      } else {
        throw new Error('API not responding');
      }
    } catch (error) {
      document.getElementById('apiStatus').textContent = 'Offline';
      document.getElementById('apiStatus').className =
        'status-indicator offline';
      document.getElementById('dbStatus').textContent = 'Offline';
      document.getElementById('dbStatus').className =
        'status-indicator offline';
    }

    // Check auth status
    if (Api.auth.isLoggedIn()) {
      document.getElementById('authStatus').textContent = 'Logged In';
      document.getElementById('authStatus').className =
        'status-indicator online';
    } else {
      document.getElementById('authStatus').textContent = 'Logged Out';
      document.getElementById('authStatus').className =
        'status-indicator offline';
    }
  }
}
