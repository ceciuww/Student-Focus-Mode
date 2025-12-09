class UIHelper {
  static showLoading(container) {
    const loadingHtml = `
      <div class="loading">
        <div class="loading-spinner"></div>
        <p>Memuat...</p>
      </div>
    `;
    
    if (container) {
      container.innerHTML = loadingHtml;
    }
    
    return loadingHtml;
  }

  static hideLoading(container) {
    if (container) {
      const loading = container.querySelector('.loading');
      if (loading) {
        loading.remove();
      }
    }
  }

  static showEmptyState(container, message = 'Belum ada data', icon = 'fas fa-inbox') {
    const emptyHtml = `
      <div class="empty-state">
        <i class="${icon}"></i>
        <p>${message}</p>
      </div>
    `;
    
    if (container) {
      container.innerHTML = emptyHtml;
    }
    
    return emptyHtml;
  }

  static formatDate(dateString) {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  }

  static formatDuration(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours} jam ${mins} menit`;
    }
    return `${mins} menit`;
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

export default UIHelper;