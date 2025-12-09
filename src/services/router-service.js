import routes from '../routes/routes.js';
import UrlParser from '../routes/url-parser.js';

class RouterService {
  constructor() {
    this._app = document.getElementById('main-content');
    this._loading = document.getElementById('loading-indicator');
  }

  async renderPage() {
    try {
      this.showLoading();
      
      const url = UrlParser.parseActiveUrlWithCombiner();
      const page = routes[url] ? new routes[url]() : new routes['/']();
      
      this._app.innerHTML = await page.render();
      await page.afterRender();
      
      this.hideLoading();
    } catch (error) {
      console.error('Error rendering page:', error);
      this.hideLoading();
      this.showError();
    }
  }

  showLoading() {
    if (this._loading) {
      this._loading.style.display = 'block';
    }
  }

  hideLoading() {
    if (this._loading) {
      this._loading.style.display = 'none';
    }
  }

  showError() {
    this._app.innerHTML = `
      <div class="error-page">
        <h2>Terjadi Kesalahan</h2>
        <p>Maaf, halaman tidak dapat dimuat. Silakan refresh halaman.</p>
        <button onclick="window.location.reload()" class="btn">Refresh Halaman</button>
      </div>
    `;
  }
}

export default RouterService;