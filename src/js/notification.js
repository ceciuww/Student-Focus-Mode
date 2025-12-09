// notification.js - Enhanced Notification Manager with Web Push Support
export class NotificationManager {
  static VAPID_PUBLIC_KEY = 'BLx1h6WDRdQQuR3L7Q7eB7e8e9e0e1e2e3e4e5e6e7e8e9e0e1e2e3e4e5e6e7e8e9e0e1e2e3e4e5e6';

  static async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      await this.subscribeToPush();
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await this.subscribeToPush();
      return true;
    }
    return false;
  }

  static async subscribeToPush() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        console.log('Already subscribed to push notifications');
        return subscription;
      }

      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.VAPID_PUBLIC_KEY)
      });

      console.log('Subscribed to push notifications:', subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  static async unsubscribeFromPush() {
    if (!('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('Unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  static async sendSubscriptionToServer(subscription) {
    // In a real application, send this to your backend
    console.log('Sending subscription to server:', subscription);

    // Simulate API call
    try {
      const response = await fetch('/api/push-subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription,
          userId: localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')).id : 'anonymous'
        })
      });

      if (response.ok) {
        console.log('Subscription saved on server');
      }
    } catch (error) {
      console.error('Failed to save subscription on server:', error);
    }
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static show(title, options = {}) {
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    const notification = new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();

      // Navigate to relevant page based on notification data
      if (options.data && options.data.url) {
        window.location.hash = options.data.url;
      }
    };

    notification.onclose = () => {
      console.log('Notification closed');
    };

    return notification;
  }

  // Specialized notification methods
  static showTimerComplete() {
    return this.show('🎯 Focus Mode - Timer Selesai', {
      body: 'Waktu fokus Anda telah habis! Saatnya untuk istirahat sejenak.',
      tag: 'timer-complete',
      requireInteraction: true,
      data: { url: '#/focus-mode' },
      actions: [
        { action: 'restart', title: 'Mulai Lagi' },
        { action: 'break', title: 'Istirahat' }
      ]
    });
  }

  static showBreakComplete() {
    return this.show('⏰ Focus Mode - Istirahat Selesai', {
      body: 'Waktu istirahat telah habis! Kembali fokus untuk sesi berikutnya.',
      tag: 'break-complete',
      requireInteraction: true,
      data: { url: '#/focus-mode' }
    });
  }

  static showSessionReminder(sessionTitle, minutesBefore = 5) {
    return this.show('📚 Focus Mode - Pengingat Sesi', {
      body: `Sesi "${sessionTitle}" akan dimulai dalam ${minutesBefore} menit. Siapkan diri Anda!`,
      tag: 'session-reminder',
      data: { url: '#/sesi-belajar' }
    });
  }

  static showAchievement(title, message) {
    return this.show('🏆 ' + title, {
      body: message,
      tag: 'achievement',
      icon: '/icons/icon-512x512.png',
      requireInteraction: true,
      data: { url: '#/' }
    });
  }

  static showOfflineReady() {
    return this.show('📱 Focus Mode - Siap Offline', {
      body: 'Aplikasi telah siap digunakan dalam mode offline!',
      tag: 'offline-ready',
      data: { url: '#/' }
    });
  }

  static showDataSynced() {
    return this.show('🔄 Focus Mode - Data Disinkronisasi', {
      body: 'Data Anda telah berhasil disinkronisasi dengan server.',
      tag: 'data-synced',
      data: { url: '#/' }
    });
  }

  static showDailyReminder() {
    return this.show('📖 FocusMode - Pengingat Harian', {
      body: 'Sudah siap belajar hari ini? Ayo mulai sesi fokus Anda!',
      tag: 'daily-reminder',
      requireInteraction: true,
      data: { url: '#/focus-mode' }
    });
  }

  static showStudyStreak(streakDays) {
    return this.show('🔥 Streak Belajar!', {
      body: `Anda telah belajar ${streakDays} hari berturut-turut! Pertahankan semangatnya!`,
      tag: 'study-streak',
      requireInteraction: true,
      data: { url: '#/' }
    });
  }

  static showWeeklyReport(totalSessions, totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return this.show('📊 Laporan Mingguan', {
      body: `Minggu ini: ${totalSessions} sesi, ${hours}j ${minutes}m belajar. Hebat!`,
      tag: 'weekly-report',
      requireInteraction: true,
      data: { url: '#/' }
    });
  }

  // Schedule notifications
  static scheduleDailyReminder(hour = 8, minute = 0) {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hour, minute, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    return setTimeout(() => {
      this.showDailyReminder();
      // Reschedule for next day
      this.scheduleDailyReminder(hour, minute);
    }, delay);
  }

  // Test notification
  static async testNotification() {
    const permission = await this.requestPermission();
    if (permission) {
      this.show('🔔 Test Notification', {
        body: 'Push notification berhasil diaktifkan!',
        tag: 'test',
        requireInteraction: true,
        data: { url: '#/' }
      });
    }
  }

  // Notification settings
  static getSettings() {
    return {
      permission: Notification.permission,
      isPushEnabled: localStorage.getItem('pushEnabled') === 'true',
      dailyReminders: localStorage.getItem('dailyReminders') === 'true',
      sessionReminders: localStorage.getItem('sessionReminders') === 'true',
      achievementAlerts: localStorage.getItem('achievementAlerts') === 'true'
    };
  }

  static updateSettings(settings) {
    if (settings.dailyReminders !== undefined) {
      localStorage.setItem('dailyReminders', settings.dailyReminders.toString());
    }
    if (settings.sessionReminders !== undefined) {
      localStorage.setItem('sessionReminders', settings.sessionReminders.toString());
    }
    if (settings.achievementAlerts !== undefined) {
      localStorage.setItem('achievementAlerts', settings.achievementAlerts.toString());
    }
    if (settings.pushEnabled !== undefined) {
      localStorage.setItem('pushEnabled', settings.pushEnabled.toString());
      if (settings.pushEnabled) {
        this.subscribeToPush();
      } else {
        this.unsubscribeFromPush();
      }
    }
  }
}