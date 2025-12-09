// db.js - Database module for FocusMode with IndexedDB and localStorage fallback
import { openDB } from 'idb';

let dbPromise;
const DB_VERSION = 2;
const DB_NAME = 'FocusModeDB';

export const initDB = async () => {
  try {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        
        // Handle version upgrades
        if (oldVersion < 1) {
          // Version 1: Initial setup
          if (!db.objectStoreNames.contains('sessions')) {
            const sessionsStore = db.createObjectStore('sessions', {
              keyPath: 'id',
              autoIncrement: true,
            });
            sessionsStore.createIndex('createdAt', 'createdAt');
          }

          if (!db.objectStoreNames.contains('notes')) {
            const notesStore = db.createObjectStore('notes', {
              keyPath: 'id',
              autoIncrement: true,
            });
            notesStore.createIndex('createdAt', 'createdAt');
          }

          if (!db.objectStoreNames.contains('books')) {
            const booksStore = db.createObjectStore('books', {
              keyPath: 'id',
              autoIncrement: true,
            });
            booksStore.createIndex('isComplete', 'isComplete');
          }

          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings', { keyPath: 'id' });
          }
        }
        
        // Add any new migrations for version 2 here
        if (oldVersion < 2) {
          console.log('Running migration for version 2');
          // Example: Add new index or store if needed
        }
      },
    });
    
    console.log('Database initialized successfully');
    return dbPromise;
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
    
    // If version error, delete and recreate
    if (error.name === 'VersionError') {
      console.log('Version conflict detected, resetting database...');
      indexedDB.deleteDatabase(DB_NAME);
      // Retry initialization after a delay
      return new Promise((resolve) => {
        setTimeout(async () => {
          try {
            const db = await initDB();
            resolve(db);
          } catch (retryError) {
            console.error('Failed to reinitialize database:', retryError);
            resolve(null);
          }
        }, 1000);
      });
    }
    
    return null;
  }
};

// Database operations
export const DB = {
  async getAll(storeName) {
    try {
      if (!dbPromise) await initDB();
      const db = await dbPromise;
      return db.getAll(storeName);
    } catch (error) {
      console.warn('IndexedDB error, using localStorage fallback for getAll:', error);
      return this.getFromLocalStorage(storeName);
    }
  },

  async get(storeName, id) {
    try {
      if (!dbPromise) await initDB();
      const db = await dbPromise;
      return db.get(storeName, id);
    } catch (error) {
      console.warn('IndexedDB error, using localStorage fallback for get:', error);
      const items = this.getFromLocalStorage(storeName);
      return items.find(item => item.id === id) || null;
    }
  },

  async set(storeName, value) {
    try {
      if (!dbPromise) await initDB();
      const db = await dbPromise;
      return db.put(storeName, value);
    } catch (error) {
      console.warn('IndexedDB error, using localStorage fallback for set:', error);
      return this.saveToLocalStorage(storeName, value);
    }
  },

  async delete(storeName, id) {
    try {
      if (!dbPromise) await initDB();
      const db = await dbPromise;
      return db.delete(storeName, id);
    } catch (error) {
      console.warn('IndexedDB error, using localStorage fallback for delete:', error);
      return this.deleteFromLocalStorage(storeName, id);
    }
  },

  async clear(storeName) {
    try {
      if (!dbPromise) await initDB();
      const db = await dbPromise;
      return db.clear(storeName);
    } catch (error) {
      console.warn('IndexedDB error, using localStorage fallback for clear:', error);
      localStorage.removeItem(`focusmode_${storeName}`);
    }
  },

  // localStorage fallback methods
  getFromLocalStorage(storeName) {
    try {
      return JSON.parse(localStorage.getItem(`focusmode_${storeName}`)) || [];
    } catch {
      return [];
    }
  },

  saveToLocalStorage(storeName, value) {
    const items = this.getFromLocalStorage(storeName);
    
    if (value.id) {
      const index = items.findIndex(item => item.id === value.id);
      if (index !== -1) {
        items[index] = { ...items[index], ...value, updatedAt: new Date().toISOString() };
      } else {
        value.createdAt = value.createdAt || new Date().toISOString();
        value.updatedAt = new Date().toISOString();
        items.push(value);
      }
    } else {
      value.id = Date.now() + Math.random();
      value.createdAt = new Date().toISOString();
      value.updatedAt = value.createdAt;
      items.push(value);
    }
    
    localStorage.setItem(`focusmode_${storeName}`, JSON.stringify(items));
    return value;
  },

  deleteFromLocalStorage(storeName, id) {
    const items = this.getFromLocalStorage(storeName);
    const filteredItems = items.filter(item => item.id !== id);
    localStorage.setItem(`focusmode_${storeName}`, JSON.stringify(filteredItems));
  }
};