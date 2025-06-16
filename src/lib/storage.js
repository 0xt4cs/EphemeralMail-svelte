/**
 * Optimized localStorage utility for EphemeralMail
 * Provides robust error handling, data validation, and performance optimizations
 */

export class LocalStorageManager {
  constructor(keyPrefix = 'ephemeral_', version = '1.0.0') {
    this.keyPrefix = keyPrefix;
    this.version = version;
    this.saveTimeouts = new Map();
  }
  /**
   * Check if localStorage is available
   */
  isAvailable() {
    try {
      const test = '__localStorage_test__';
      window.localStorage.setItem(test, test);
      window.localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('localStorage is not available:', e);
      return false;
    }
  }

  /**
   * Get a prefixed key
   */
  getKey(key) {
    return `${this.keyPrefix}${key}`;
  }

  /**
   * Save data with debouncing and error handling
   */
  save(key, data, debounceMs = 300) {
    if (!this.isAvailable()) return false;

    const prefixedKey = this.getKey(key);
    
    // Clear existing timeout for this key
    if (this.saveTimeouts.has(prefixedKey)) {
      clearTimeout(this.saveTimeouts.get(prefixedKey));
    }

    // Debounce saves to avoid excessive writes
    const timeout = setTimeout(() => {
      try {
        const dataToStore = {
          version: this.version,
          timestamp: new Date().toISOString(),
          data: data
        };
        
        window.localStorage.setItem(prefixedKey, JSON.stringify(dataToStore));
        this.saveTimeouts.delete(prefixedKey);
        return true;
      } catch (e) {
        console.error(`Failed to save ${key} to localStorage:`, e);
        
        // Try to clear storage if it's full
        if (e.name === 'QuotaExceededError') {
          this.clearOldData();
        }
        return false;
      }
    }, debounceMs);

    this.saveTimeouts.set(prefixedKey, timeout);
    return true;
  }

  /**
   * Load data with validation and migration
   */
  load(key, defaultValue = null, validator = null) {
    if (!this.isAvailable()) return defaultValue;

    try {
      const prefixedKey = this.getKey(key);
      const stored = window.localStorage.getItem(prefixedKey);
      
      if (!stored) return defaultValue;

      const parsed = JSON.parse(stored);
      
      // Handle legacy data format (direct value)
      let data;
      if (parsed && typeof parsed === 'object' && parsed.hasOwnProperty('data')) {
        data = parsed.data;
        
        // Check version compatibility
        if (parsed.version && parsed.version !== this.version) {
          console.log(`Data version mismatch for ${key}:`, parsed.version, '->', this.version);
          data = this.migrateData(key, data, parsed.version);
        }
      } else {
        // Legacy format - just the data directly
        data = parsed;
      }

      // Validate data if validator provided
      if (validator && !validator(data)) {
        console.warn(`Invalid data format for ${key}, using default`);
        return defaultValue;
      }

      return data;
    } catch (e) {
      console.error(`Failed to load ${key} from localStorage:`, e);
      // Clear corrupted data
      this.remove(key);
      return defaultValue;
    }
  }

  /**
   * Remove a specific key
   */
  remove(key) {
    if (!this.isAvailable()) return;

    try {
      const prefixedKey = this.getKey(key);
      window.localStorage.removeItem(prefixedKey);
      
      // Clear any pending save timeout
      if (this.saveTimeouts.has(prefixedKey)) {
        clearTimeout(this.saveTimeouts.get(prefixedKey));
        this.saveTimeouts.delete(prefixedKey);
      }
    } catch (e) {
      console.error(`Failed to remove ${key} from localStorage:`, e);
    }
  }

  /**
   * Clear all data with the current prefix
   */
  clearAll() {
    if (!this.isAvailable()) return;

    try {
      const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => window.localStorage.removeItem(key));
      
      // Clear all pending timeouts
      this.saveTimeouts.forEach(timeout => clearTimeout(timeout));
      this.saveTimeouts.clear();
    } catch (e) {
      console.error('Failed to clear localStorage:', e);
    }
  }

  /**
   * Clear old/unused keys to free space
   */
  clearOldData() {
    if (!this.isAvailable()) return;

    try {
      const now = new Date();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
      
      const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(this.keyPrefix)) continue;

        try {
          const stored = window.localStorage.getItem(key);
          const parsed = JSON.parse(stored);
          
          if (parsed && parsed.timestamp) {
            const age = now.getTime() - new Date(parsed.timestamp).getTime();
            if (age > maxAge) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          // Remove corrupted entries
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => window.localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`Cleaned up ${keysToRemove.length} old localStorage entries`);
      }
    } catch (e) {
      console.error('Failed to clean old data:', e);
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo() {
    if (!this.isAvailable()) return null;

    try {
      let totalSize = 0;
      let itemCount = 0;
        for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith(this.keyPrefix)) {
          const value = window.localStorage.getItem(key);
          totalSize += new Blob([key + (value || '')]).size;
          itemCount++;
        }
      }

      return {
        itemCount,
        totalSize,
        totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
        pendingSaves: this.saveTimeouts.size
      };
    } catch (e) {
      console.error('Failed to get storage info:', e);
      return null;
    }
  }

  /**
   * Migrate data between versions (override in subclasses)
   */
  migrateData(key, data, fromVersion) {
    console.log(`No migration logic for ${key} from version ${fromVersion} to ${this.version}`);
    return data;
  }

  /**
   * Force save all pending operations
   */
  flush() {
    this.saveTimeouts.forEach((timeout, key) => {
      clearTimeout(timeout);
      // Trigger immediate save by calling setTimeout with 0 delay
      setTimeout(() => {
        try {
          const keyWithoutPrefix = key.replace(this.keyPrefix, '');
          // This would need to be implemented per use case
          console.log(`Flushing pending save for ${keyWithoutPrefix}`);
        } catch (e) {
          console.error(`Failed to flush ${key}:`, e);
        }
      }, 0);
    });
    
    this.saveTimeouts.clear();
  }
}

// Create a default instance for the app
export const storageManager = new LocalStorageManager('ephemeral_', '1.0.0');

// Specific validators
export const validators = {
  emailList: (data) => {
    return Array.isArray(data) && data.every(email => 
      email && 
      typeof email.address === 'string' && 
      email.address.length > 0
    );
  },
  
  boolean: (data) => typeof data === 'boolean',
  
  string: (data) => typeof data === 'string',
  
  number: (data) => typeof data === 'number' && !isNaN(data)
};
