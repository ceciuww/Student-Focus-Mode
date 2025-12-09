import { DB, initDB } from './db.js';

export class OfflineManager {
  static async initialize() {
    try {
      await initDB();
      this.setupOnlineHandler();
      this.setupServiceWorkerListener();
      await this.checkConnectivity();
      console.log('Offline Manager initialized');
    } catch (error) {
      console.error('Failed to initialize Offline Manager:', error);
    }
  }

  static setupServiceWorkerListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', event => {
        console.log('Message from SW:', event.data);

        if (event.data && event.data.type === 'SYNC_DATA') {
          this.syncData();
        }
      });
    }
  }

  static async checkConnectivity() {
    if (!navigator.onLine) {
      this.showOfflineStatus();
      return false;
    }
    return true;
  }

  static async syncData() {
    const isOnline = await this.checkConnectivity();
    if (!isOnline) {
      console.log('Offline - data will be synced when online');
      this.queueSync();
      return;
    }

    try {
      console.log('Starting data sync...');

      // Sync sessions
      const sessions = await DB.getAll('sessions');
      await this.syncToServer('sessions', sessions);

      // Sync notes
      const notes = await DB.getAll('notes');
      await this.syncToServer('notes', notes);

      // Sync books
      const books = await DB.getAll('books');
      await this.syncToServer('books', books);

      console.log('Data synced successfully');

      // Show success notification
      this.showSyncSuccess();
    } catch (error) {
      console.error('Sync failed:', error);
      this.queueSync();
      this.showSyncError();
    }
  }

  static async syncToServer(type, items) {
    console.log(`Syncing ${items.length} ${type} to server`);

    // Simulate API call - replace with actual API endpoints
    return new Promise(resolve => {
      setTimeout(() => {
        console.log(`Successfully synced ${items.length} ${type}`);
        resolve();
      }, 1000);
    });
  }

  static queueSync() {
    if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
      navigator.serviceWorker.ready
        .then(registration => {
          return registration.sync.register('sync-data');
        })
        .then(() => console.log('Sync registered for when online'))
        .catch(err => console.log('Sync registration failed:', err));
    }
  }

  static setupOnlineHandler() {
    window.addEventListener('online', () => {
      console.log('App is online');
      this.syncData();
      this.showOnlineStatus();
    });

    window.addEventListener('offline', () => {
      console.log('App is offline');
      this.showOfflineStatus();
    });

    // Periodic sync every 5 minutes when online
    setInterval(() => {
      if (navigator.onLine) {
        this.syncData();
      }
    }, 5 * 60 * 1000);
  }

  static showOnlineStatus() {
    this.showToast(
      '🟢 Koneksi internet tersedia - Data disinkronisasi',
      'success'
    );

    // Update offline indicator
    this.updateOfflineIndicator(true);

    // Dispatch custom event for other components
    document.dispatchEvent(
      new CustomEvent('onlineStatusChanged', {
        detail: { online: true },
      })
    );
  }

  static showOfflineStatus() {
    this.showToast(
      '🔴 Anda sedang offline - Bekerja dalam mode offline',
      'warning'
    );

    // Update offline indicator
    this.updateOfflineIndicator(false);

    // Dispatch custom event for other components
    document.dispatchEvent(
      new CustomEvent('onlineStatusChanged', {
        detail: { online: false },
      })
    );
  }

  static updateOfflineIndicator(isOnline) {
    let indicator = document.getElementById('offline-indicator');

    if (!indicator) {
      // Create indicator if it doesn't exist
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.className = 'offline-indicator';
      document.body.appendChild(indicator);
    }

    // Update indicator state
    indicator.className = `offline-indicator ${
      isOnline ? 'online' : 'offline'
    }`;

    const icon = isOnline ? '🟢' : '🔴';
    const title = isOnline ? 'Online' : 'Offline';
    const message = isOnline ? 'Tersinkronisasi' : 'Mode Offline';

    indicator.innerHTML = `
      <div class="offline-indicator-icon">${icon}</div>
      <div class="offline-indicator-text">
        <div class="offline-indicator-title">${title}</div>
        <div class="offline-indicator-message">${message}</div>
      </div>
    `;

    // Auto-hide after 5 seconds if online
    if (isOnline) {
      setTimeout(() => {
        if (indicator && navigator.onLine) {
          indicator.style.opacity = '0';
          setTimeout(() => {
            if (indicator && indicator.parentNode) {
              indicator.remove();
            }
          }, 300);
        }
      }, 5000);
    }
  }

  static showSyncSuccess() {
    this.showToast('✅ Data berhasil disinkronisasi', 'success');

    // Show browser notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🔄 Sync Berhasil', {
        body: 'Data Anda telah disinkronisasi',
        icon: '/icons/icon-192x192.png',
      });
    }
  }

  static showSyncError() {
    this.showToast('❌ Gagal menyinkronisasi data', 'error');
  }

  static showToast(message, type = 'info') {
    // Create toast notification
    const event = new CustomEvent('show-toast', {
      detail: {
        message: message,
        type: type,
      },
    });
    document.dispatchEvent(event);
  }

  // Backup data ke localStorage sebagai cadangan
  static async backupData() {
    try {
      const sessions = await DB.getAll('sessions');
      const notes = await DB.getAll('notes');
      const books = await DB.getAll('books');

      const backup = {
        sessions,
        notes,
        books,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem('focusmode_backup', JSON.stringify(backup));
      localStorage.setItem(
        'focusmode_backup_timestamp',
        new Date().toISOString()
      );
      console.log('Data backup created');
    } catch (error) {
      console.error('Backup failed:', error);
    }
  }

  // Restore data dari backup
  static async restoreData() {
    try {
      const backup = JSON.parse(localStorage.getItem('focusmode_backup'));
      if (!backup) {
        console.log('No backup found');
        return false;
      }

      // Clear existing data
      await DB.clear('sessions');
      await DB.clear('notes');
      await DB.clear('books');

      // Restore data
      for (const session of backup.sessions) {
        await DB.set('sessions', session);
      }
      for (const note of backup.notes) {
        await DB.set('notes', note);
      }
      for (const book of backup.books) {
        await DB.set('books', book);
      }

      console.log('Data restored from backup');
      return true;
    } catch (error) {
      console.error('Restore failed:', error);
      return false;
    }
  }

  // Get storage statistics
  static async getStorageStats() {
    try {
      const sessions = await DB.getAll('sessions');
      const notes = await DB.getAll('notes');
      const books = await DB.getAll('books');

      return {
        sessions: sessions.length,
        notes: notes.length,
        books: books.length,
        lastBackup: localStorage.getItem('focusmode_backup_timestamp'),
        totalItems: sessions.length + notes.length + books.length,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return null;
    }
  }

  // Cache management
  static async clearOldData() {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Clear old sessions, notes, etc.
    // Implementation depends on your data structure
    console.log('Clearing old data...');
  }

  // Storage quota management
  static async checkStorage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { usage, quota } = await navigator.storage.estimate();
      const percentage = ((usage / quota) * 100).toFixed(2);
      console.log(`Storage usage: ${percentage}%`);

      if (percentage > 80) {
        this.showToast('💾 Penyimpanan hampir penuh', 'warning');
      }
    }
  }
}

// Initialize offline manager when app starts
document.addEventListener('DOMContentLoaded', () => {
  OfflineManager.initialize();
});
