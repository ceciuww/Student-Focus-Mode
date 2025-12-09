import BerandaPage from '../pages/beranda/beranda.js';
import CatatanPage from '../pages/catatan/catatan-page.js';
import FiturPage from '../pages/fitur/fitur.js';
import FocusModePage from '../pages/focus-mode/focus-mode-page.js';
import LoginPage from '../pages/login/login-page.js';
import RegisterPage from '../pages/login/register-page.js';
import RakBukuPage from '../pages/rak-buku/rak-buku-page.js';
import SesiBelajarPage from '../pages/sesi-belajar/sesi-belajar-page.js';

const routes = {
  '/': BerandaPage,
  '/beranda': BerandaPage,
  '/fitur': FiturPage,
  '/focus-mode': FocusModePage,
  '/sesi-belajar': SesiBelajarPage,
  '/catatan': CatatanPage,
  '/rak-buku': RakBukuPage,
  '/login': LoginPage,
  '/register': RegisterPage,
};

export default routes;