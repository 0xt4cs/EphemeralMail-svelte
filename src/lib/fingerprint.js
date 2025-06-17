/**
 * Browser fingerprinting utility
 * Generates a consistent fingerprint based on browser characteristics
 */

export class BrowserFingerprint {
  static instance;
  fingerprint = null;

  constructor() {}

  static getInstance() {
    if (!BrowserFingerprint.instance) {
      BrowserFingerprint.instance = new BrowserFingerprint();
    }
    return BrowserFingerprint.instance;
  }

  /**
   * Generate browser fingerprint
   */
  async generateFingerprint() {
    if (this.fingerprint) {
      return this.fingerprint;
    }

    try {
      const components = [
        // User agent
        navigator.userAgent || '',
        
        // Language
        navigator.language || '',
        
        // Screen resolution
        `${screen.width}x${screen.height}`,
        
        // Color depth
        screen.colorDepth || '',
        
        // Timezone
        Intl.DateTimeFormat().resolvedOptions().timeZone || '',
        
        // Platform
        navigator.platform || '',
        
        // Hardware concurrency (CPU cores)
        navigator.hardwareConcurrency || '',
        
        // Pixel ratio
        window.devicePixelRatio || '',
      ];

      // Canvas fingerprint (more unique but also more complex)
      const canvasFingerprint = this.getCanvasFingerprint();
      components.push(canvasFingerprint);

      // Combine all components
      const combined = components.join('|');
      
      // Generate hash
      this.fingerprint = await this.simpleHash(combined);
      
      return this.fingerprint;
    } catch (error) {
      console.warn('Failed to generate browser fingerprint:', error);
      // Fallback to a random string that persists in localStorage
      const fallback = localStorage.getItem('browser_fingerprint');
      if (fallback) {
        this.fingerprint = fallback;
        return fallback;
      }
      
      const randomFingerprint = this.generateRandomFingerprint();
      localStorage.setItem('browser_fingerprint', randomFingerprint);
      this.fingerprint = randomFingerprint;
      return randomFingerprint;
    }
  }

  /**
   * Generate canvas fingerprint
   */
  getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return 'no_canvas';
      
      // Draw some text and shapes
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('EphemeralMail fingerprint', 2, 2);
      
      ctx.fillStyle = 'rgba(255,0,255, 0.5)';
      ctx.fillRect(100, 5, 20, 20);
      
      return canvas.toDataURL().substring(0, 100); // Take first 100 chars
    } catch (error) {
      return 'canvas_error';
    }
  }

  /**
   * Simple hash function for fingerprinting
   */
  async simpleHash(str) {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
      } catch (error) {
        // Fallback if crypto.subtle is not available
      }
    }
    
    // Simple hash fallback
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Generate random fingerprint as fallback
   */
  generateRandomFingerprint() {
    const chars = '0123456789abcdef';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }

  /**
   * Clear cached fingerprint (for testing)
   */
  clearCache() {
    this.fingerprint = null;
    localStorage.removeItem('browser_fingerprint');
  }
}

// Export singleton instance
export const browserFingerprint = BrowserFingerprint.getInstance();
