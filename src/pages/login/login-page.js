import { Api } from '../../data/api.js';

class LoginPage {
  constructor() {
    this.name = 'login';
  }

  async render() {
    return `
      <div class="auth-container">
        <div class="auth-card">
          <h2>FocusMode</h2>
          <div class="auth-tabs">
            <div class="auth-tab active" data-tab="login">Login</div>
            <div class="auth-tab" data-tab="register">Register</div>
          </div>
          
          <form id="loginForm" class="auth-form active">
            <div class="form-group">
              <label for="loginEmail">Email</label>
              <input type="email" id="loginEmail" placeholder="Masukkan email Anda" required>
              <i class="fas fa-envelope"></i>
            </div>
            <div class="form-group">
              <label for="loginPassword">Password</label>
              <input type="password" id="loginPassword" placeholder="Masukkan password Anda" required>
              <i class="fas fa-lock"></i>
            </div>
            <button type="submit" class="btn" style="width: 100%;">Login</button>
            <div class="form-footer">
              <p>Belum punya akun? <a href="#/register">Daftar di sini</a></p>
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

    // Login form
    document.getElementById('loginForm').addEventListener('submit', e => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  switchAuthTab(tabName) {
    if (tabName === 'register') {
      window.location.hash = '#/register';
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

    document.getElementById('loginForm').classList.add('active');
  }

  async handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simple validation
    if (!email || !password) {
      this.showError('Harap isi semua field');
      return;
    }

    try {
      // Use centralized API
      const data = await Api.auth.login(email, password);

      // Redirect to home
      window.location.hash = '#/';
    } catch (error) {
      console.error('Login error:', error);
      this.showError(
        error.message || 'Login gagal. Periksa email dan password Anda.'
      );
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
    const form = document.getElementById('loginForm');
    form.parentNode.insertBefore(errorElement, form);
  }
}

export default LoginPage;
