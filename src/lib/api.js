import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4444';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// API Service methods
export const emailService = {
  // Generate a new email address
  async generateEmail(customPrefix = null) {
    try {
      // Send empty body or only include customPrefix if provided
      const requestBody = {};
      if (customPrefix && typeof customPrefix === 'string' && customPrefix.trim()) {
        requestBody.customPrefix = customPrefix.trim();
      }
      
      console.log('Generating email with body:', requestBody);
      const response = await api.post('/api/emails/generate', requestBody);
      console.log('Generate email response:', response.data);
      return response.data;
    } catch (error) {
      console.error('generateEmail error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to generate email';
      throw new Error(errorMessage);
    }
  },
  // Get emails for a specific address
  async getEmails(address, options = {}) {
    try {
      const { page = 1, limit = 20, search = '', unreadOnly = false } = options;
      const params = { page, limit };
      
      if (search && search.trim()) {
        params.search = search.trim();
      }
      if (unreadOnly) {
        params.unreadOnly = 'true';
      }
      
      console.log('Fetching emails for address:', address);
      console.log('Encoded address:', encodeURIComponent(address));
      console.log('Request params:', params);
      
      const response = await api.get(`/api/emails/${encodeURIComponent(address)}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('getEmails error details:', {
        address,
        encodedAddress: encodeURIComponent(address),
        errorResponse: error.response?.data,
        errorStatus: error.response?.status,
        errorMessage: error.message
      });
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch emails';
      throw new Error(errorMessage);
    }
  },

  // Get a specific email by ID
  async getEmailById(id) {
    try {
      const response = await api.get(`/api/emails/message/${encodeURIComponent(id)}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch email';
      throw new Error(errorMessage);
    }
  },

  // Delete a specific email
  async deleteEmail(id) {
    try {
      const response = await api.delete(`/api/emails/message/${encodeURIComponent(id)}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to delete email';
      throw new Error(errorMessage);
    }
  },
  // Delete all emails for an address
  async deleteAllEmails(address) {
    try {
      const response = await api.delete(`/api/emails/${encodeURIComponent(address)}`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to delete emails';
      throw new Error(errorMessage);
    }
  },

  // Get unread count for an address
  async getUnreadCount(address) {
    try {
      const response = await api.get(`/api/emails/${encodeURIComponent(address)}/unread-count`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to get unread count';
      throw new Error(errorMessage);
    }
  },

  // Mark email as read
  async markEmailAsRead(id) {
    try {
      const response = await api.patch(`/api/emails/message/${encodeURIComponent(id)}/read`);
      return response.data;    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to mark email as read';
      throw new Error(errorMessage);
    }
  },

  // Mark email as unread
  async markEmailAsUnread(id) {
    try {
      const response = await api.patch(`/api/emails/message/${encodeURIComponent(id)}/unread`);
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to mark email as unread';
      throw new Error(errorMessage);
    }
  },

  // Get email attachments
  async getEmailAttachment(id, attachmentId) {
    try {
      const response = await api.get(`/api/emails/message/${encodeURIComponent(id)}/attachment/${encodeURIComponent(attachmentId)}`, {
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to download attachment';
      throw new Error(errorMessage);
    }
  },

  // Check API health
  async checkHealth() {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Health check failed';
      throw new Error(errorMessage);
    }
  },

  // Admin endpoints (require API key)
  async getAdminStats(apiKey) {
    try {
      const response = await api.get('/api/admin/stats', {
        headers: { 'x-api-key': apiKey }
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to get admin stats';
      throw new Error(errorMessage);
    }
  },

  async cleanupExpiredEmails(apiKey) {
    try {
      const response = await api.post('/api/admin/cleanup', {}, {
        headers: { 'x-api-key': apiKey }
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to cleanup emails';
      throw new Error(errorMessage);
    }
  },

  async addToBlacklist(apiKey, domain) {
    try {
      const response = await api.post('/api/admin/blacklist', { domain }, {
        headers: { 'X-API-Key': apiKey }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to add to blacklist');
    }
  },

  async getBlacklist(apiKey) {
    try {
      const response = await api.get('/api/admin/blacklist', {
        headers: { 'X-API-Key': apiKey }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get blacklist');
    }
  },

  // Health check
  async healthCheck() {
    try {
      const response = await api.get('/api/health');
      return response.data;
    } catch (error) {
      throw new Error('Service unavailable');
    }
  },

  // Get list of generated email addresses
  async getGeneratedAddresses(options = {}) {
    try {
      const { page = 1, limit = 50 } = options;
      const params = { page, limit };
      
      console.log('Fetching generated addresses with params:', params);
      
      const response = await api.get('/api/emails/addresses', { params });
      return response.data;
    } catch (error) {
      console.error('getGeneratedAddresses error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to fetch generated addresses';
      throw new Error(errorMessage);
    }
  },
};

export default api;
