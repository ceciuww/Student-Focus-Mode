class Auth {
  static getToken() {
    return localStorage.getItem('authToken');
  }

  static getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  static isLoggedIn() {
    return this.getToken() !== null && this.getCurrentUser() !== null;
  }

  static login(user, token) {
    if (token) {
      localStorage.setItem('authToken', token);
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  static logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    window.location.hash = '#/login';
  }

  static requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.hash = '#/login';
      return false;
    }
    return true;
  }

  static getUserId() {
    const user = this.getCurrentUser();
    return user ? user.id : null;
  }

  static getUserName() {
    const user = this.getCurrentUser();
    return user ? user.name : null;
  }

  static getUserAvatar() {
    const user = this.getCurrentUser();
    return user ? user.avatar : null;
  }

  static getAuthHeaders() {
    const token = this.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }
}

export default Auth;
