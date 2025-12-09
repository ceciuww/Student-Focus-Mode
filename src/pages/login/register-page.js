import { Api } from '../../data/api.js';

class RegisterPage {
  constructor() {
    this.name = 'register';
  }

  async render() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <h2>FocusMode</h2>
          <div class="auth-tabs">
            <div class="auth-tab" data-tab="login">Login</div>
            <div class="auth-tab active" data-tab="register">Register</div>
          </div>
          
          <form id="registerForm" class="auth-form active">
            <div class="form-group">
              <label for="registerName">Nama Lengkap</label>
              <input type="text" id="registerName" placeholder="Masukkan nama lengkap Anda" required>
              <i class="fas fa-user"></i>
            </div>
            <div class="form-group">
              <label for="registerEmail">Email</label>
              <input type="email" id="registerEmail" placeholder="Masukkan email Anda" required>
              <i class="fas fa-envelope"></i>
            </div>
            <div class="form-group">
              <label for="registerPassword">Password</label>
              <input type="password" id="registerPassword" placeholder="Buat password Anda" required>
              <i class="fas fa-lock"></i>
            </div>
            <div class="form-group">
              <label for="registerConfirmPassword">Konfirmasi Password</label>
              <input type="password" id="registerConfirmPassword" placeholder="Konfirmasi password Anda" required>
              <i class="fas fa-lock"></i>
            </div>
            <button type="submit" class="btn" style="width: 100%;">Daftar</button>
            <div class="form-footer">
              <p>Sudah punya akun? <a href="#/login">Login di sini</a></p>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  async afterRender() {
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const tabName = tab.getAttribute('data-tab');
        this.switchAuthTab(tabName);
      });
    });

    // Register form
    document.getElementById('registerForm').addEventListener('submit', e => {
      e.preventDefault();
      this.handleRegister();
    });
  }

  switchAuthTab(tabName) {
    if (tabName === 'login') {
      window.location.hash = '#/login';
      return;
    }

    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    document.getElementById('registerForm').classList.add('active');
  }

  async handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById(
      'registerConfirmPassword'
    ).value;

    // Validation
    if (!name || !email || !password || !confirmPassword) {
      this.showError('Harap isi semua field');
      return;
    }

    if (password !== confirmPassword) {
      this.showError('Password dan konfirmasi password tidak cocok');
      return;
    }

    if (password.length < 6) {
      this.showError('Password harus minimal 6 karakter');
      return;
    }

    try {
      // Use centralized API
      const data = await Api.auth.register(name, email, password);

      // Redirect to home
      window.location.hash = '#/';
    } catch (error) {
      console.error('Registration error:', error);
      this.showError(error.message || 'Registrasi gagal. Silakan coba lagi.');
    }
  }

  showError(message) {
    // Remove existing error
    const existingError = document.querySelector('.auth-error');
    if (existingError) {
      existingError.remove();
    }

    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'auth-error';
    errorElement.style.cssText = `
      background: #e17055;
      color: white;
      padding: 10px;
      border-radius: 4px;
      margin-bottom: 1rem;
      text-align: center;
    `;
    errorElement.textContent = message;

    // Insert before form
    const form = document.getElementById('registerForm');
    form.parentNode.insertBefore(errorElement, form);
  }
}

export default RegisterPage;
