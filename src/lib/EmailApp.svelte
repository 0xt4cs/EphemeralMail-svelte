<script>
  import { onMount, onDestroy } from 'svelte';
  import { emailService } from './api.js';
  import { dialogStore, dialogHelpers } from './dialogStore.js';
  import Dialog from './Dialog.svelte';  import { 
    Mail, 
    RefreshCw, 
    Trash2, 
    Copy, 
    Plus, 
    Search,
    Clock,
    Eye,
    EyeOff,
    Menu,
    X,
    Moon,
    Sun
  } from 'lucide-svelte';// State management
  let generatedEmails = [];
  let selectedEmailAddress = null;
  let emailsForAddress = [];
  let selectedEmailContent = null;
  let loading = false;  let loadingAddresses = false;
  let refreshInterval = null;
  let currentPanel = 'addresses'; // 'addresses', 'emails', 'content' for mobile navigation
  let isDarkMode = false;
  
  // Pagination for emails
  let currentPage = 1;
  let totalPages = 1;
  let emailsPerPage = 20;
  
  // Pagination for generated addresses
  let addressCurrentPage = 1;
  let addressTotalPages = 1;
  let addressesPerPage = 50;

  // LocalStorage configuration
  const STORAGE_KEYS = {
    GENERATED_EMAILS: 'ephemeral_generated_emails',
    DARK_MODE: 'ephemeral_dark_mode',
    LAST_SYNC: 'ephemeral_last_sync',
    DATA_VERSION: 'ephemeral_data_version'
  };
  
  const DATA_VERSION = '1.0.0';
  const SYNC_INTERVAL = 5 * 60 * 1000; // 5 minutes
  const MAX_STORED_EMAILS = 100; // Limit stored emails for performance
  
  let saveTimeout = null;  // Generate a new email address
  async function generateNewEmail() {
    loading = true;
    try {
      const response = await emailService.generateEmail();
      if (response.success && response.data) {
        // Add to the generated emails list
        const newEmail = {
          address: response.data.address,
          expiresAt: response.data.expiresAt,
          createdAt: response.data.createdAt || new Date().toISOString(),
          emailCount: 0
        };
        generatedEmails = [newEmail, ...generatedEmails];
        selectedEmailAddress = response.data.address;
        
        // Save to localStorage
        saveGeneratedEmailsToStorage();
        
        // Load emails for this new address
        await loadEmailsForAddress(response.data.address);
        
        await dialogHelpers.success('Email Generated!', `New email address <strong>${response.data.address}</strong> has been created successfully.`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      await dialogHelpers.error('Generation Failed', `Failed to generate email address: ${err.message}`);
    } finally {
      loading = false;
    }
  }
  // Load emails for a specific address
  async function loadEmailsForAddress(address, page = 1) {
    if (!address) return;
    
    try {
      const response = await emailService.getEmails(address, {
        page,
        limit: emailsPerPage
      });
      
      if (response.success && response.data) {
        emailsForAddress = response.data.emails || [];
        currentPage = response.data.page || page;
        totalPages = Math.ceil((response.data.total || 0) / emailsPerPage);
        
        // Update email count in generated emails list
        const emailCount = response.data.total || 0;
        generatedEmails = generatedEmails.map(email => 
          email.address === address 
            ? { ...email, emailCount } 
            : email
        );
        saveGeneratedEmailsToStorage();
      } else {
        emailsForAddress = [];
        currentPage = 1;
        totalPages = 1;
      }
    } catch (err) {
      console.error('Failed to load emails:', err);
      emailsForAddress = [];
    }
  }  // Load specific email content
  async function loadEmailContent(emailId) {
    try {
      console.log('Loading email content for ID:', emailId);
      const response = await emailService.getEmailById(emailId);
      console.log('Email content response:', response);
      
      if (response.success && response.data) {
        selectedEmailContent = response.data;
        console.log('Selected email content:', selectedEmailContent);
        console.log('HTML Body:', selectedEmailContent.htmlBody);
        console.log('Text Body:', selectedEmailContent.textBody);
      } else {
        console.error('Invalid response format:', response);
        await dialogHelpers.error('Load Failed', 'Invalid response format from server');
      }
    } catch (err) {
      console.error('Failed to load email content:', err);
      await dialogHelpers.error('Load Failed', `Failed to load email content: ${err.message}`);
    }
  }

  // Select an email address from the left panel
  function selectEmailAddress(address) {
    selectedEmailAddress = address;
    selectedEmailContent = null;
    loadEmailsForAddress(address);
    // Navigate to emails panel on mobile
    if (window.innerWidth < 1024) { // lg breakpoint
      currentPanel = 'emails';
    }
  }
  // Select an email to view content
  function selectEmail(email) {
    loadEmailContent(email.id);
    // Navigate to content panel on mobile
    if (window.innerWidth < 1024) { // lg breakpoint
      currentPanel = 'content';
    }
  }
  // Copy email address to clipboard
  async function copyEmailAddress(address) {
    try {
      await navigator.clipboard.writeText(address);
      await dialogHelpers.success('Copied!', `Email address <strong>${address}</strong> has been copied to your clipboard.`);
    } catch (err) {
      await dialogHelpers.error('Copy Failed', 'Failed to copy email address to clipboard. Please try selecting and copying manually.');
    }
  }  // Delete all emails for an address
  async function deleteAllEmails(address) {
    const confirmed = await dialogHelpers.confirm(
      'Delete All Emails',
      `Are you sure you want to delete all emails for <strong>${address}</strong>? This action cannot be undone.`,
      { 
        confirmText: 'Delete All', 
        isDangerous: true 
      }
    );
    
    if (!confirmed) return;
    
    try {
      await emailService.deleteAllEmails(address);
      emailsForAddress = [];
      selectedEmailContent = null;
      
      // Update email count in generated emails list
      generatedEmails = generatedEmails.map(email => 
        email.address === address 
          ? { ...email, emailCount: 0 } 
          : email
      );
      saveGeneratedEmailsToStorage();
      
      await dialogHelpers.success('Emails Deleted', `All emails for <strong>${address}</strong> have been deleted successfully.`);
    } catch (err) {
      await dialogHelpers.error('Delete Failed', `Failed to delete emails: ${err.message}`);
    }
  }

  // Refresh emails for current address
  async function refreshEmails() {
    if (selectedEmailAddress) {
      await loadEmailsForAddress(selectedEmailAddress, currentPage);
    }
  }

  // Auto-refresh functionality
  function startAutoRefresh() {
    refreshInterval = setInterval(refreshEmails, 10000); // Refresh every 10 seconds
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }
  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return date.toLocaleString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  }
  // Format email preview
  function getEmailPreview(email) {
    const subject = email.subject || 'No Subject';
    const from = email.from || 'Unknown Sender';
    
    // Extract preview text from HTML or text content
    let preview = '';
    if (email.htmlBody) {
      // Strip HTML tags and get first 100 characters
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = email.htmlBody;
      preview = tempDiv.textContent || tempDiv.innerText || '';
    } else if (email.textBody) {
      preview = email.textBody;
    }
    
    // Limit preview to 100 characters and add ellipsis if needed
    if (preview.length > 100) {
      preview = preview.substring(0, 100) + '...';
    }
    
    return { subject, from, preview: preview.trim() };
  }
  
  // Toggle dark mode with optimized storage
  function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    
    if (localStorageManager.isAvailable()) {
      try {
        localStorage.setItem(STORAGE_KEYS.DARK_MODE, isDarkMode.toString());
      } catch (e) {
        console.error('Failed to save dark mode preference:', e);
      }
    }
    
    updateDarkModeClass();
  }
  // Update dark mode class on document
  function updateDarkModeClass() {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  // Optimized LocalStorage functions for generated emails
  const localStorageManager = {
    // Check if localStorage is available
    isAvailable() {
      try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (e) {
        console.warn('localStorage is not available:', e);
        return false;
      }
    },

    // Validate email data structure
    validateEmailData(email) {
      return email && 
             typeof email.address === 'string' && 
             email.address.length > 0 &&
             (!email.createdAt || typeof email.createdAt === 'string') &&
             (!email.expiresAt || typeof email.expiresAt === 'string') &&
             (!email.emailCount || typeof email.emailCount === 'number');
    },

    // Clean and validate email list
    sanitizeEmailList(emails) {
      if (!Array.isArray(emails)) return [];
      
      const now = new Date();
      return emails
        .filter(email => this.validateEmailData(email))
        .filter(email => {
          // Remove expired emails
          if (email.expiresAt && new Date(email.expiresAt) <= now) {
            return false;
          }
          return true;
        })
        .slice(0, MAX_STORED_EMAILS) // Limit storage size
        .map(email => ({
          address: email.address,
          createdAt: email.createdAt || new Date().toISOString(),
          expiresAt: email.expiresAt || null,
          emailCount: email.emailCount || 0
        }));
    },

    // Save emails with debouncing and error handling
    saveEmails(emails) {
      if (!this.isAvailable()) return false;
      
      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
      
      // Debounce saves to avoid excessive writes
      saveTimeout = setTimeout(() => {
        try {
          const sanitizedEmails = this.sanitizeEmailList(emails);
          const dataToStore = {
            version: DATA_VERSION,
            timestamp: new Date().toISOString(),
            emails: sanitizedEmails
          };
          
          localStorage.setItem(STORAGE_KEYS.GENERATED_EMAILS, JSON.stringify(dataToStore));
          localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
          return true;
        } catch (e) {
          console.error('Failed to save emails to localStorage:', e);
          
          // Try to clear storage if it's full
          if (e.name === 'QuotaExceededError') {
            this.clearOldData();
          }
          return false;
        }
      }, 300); // 300ms debounce
      
      return true;
    },

    // Load emails with migration and validation
    loadEmails() {
      if (!this.isAvailable()) return [];
      
      try {
        const stored = localStorage.getItem(STORAGE_KEYS.GENERATED_EMAILS);
        if (!stored) return [];
        
        const data = JSON.parse(stored);
        
        // Handle legacy data format (direct array)
        let emails;
        if (Array.isArray(data)) {
          emails = data;
        } else if (data && Array.isArray(data.emails)) {
          emails = data.emails;
          
          // Check version compatibility
          if (data.version && data.version !== DATA_VERSION) {
            console.log('Data version mismatch, migrating...', data.version, '->', DATA_VERSION);
            emails = this.migrateData(emails, data.version);
          }
        } else {
          return [];
        }
        
        return this.sanitizeEmailList(emails);
      } catch (e) {
        console.error('Failed to load emails from localStorage:', e);
        // Clear corrupted data
        this.clearEmails();
        return [];
      }
    },

    // Migrate data between versions
    migrateData(emails, fromVersion) {
      // Add migration logic here if needed in the future
      console.log(`Migrating data from version ${fromVersion} to ${DATA_VERSION}`);
      return emails;
    },

    // Clear old data to free space
    clearOldData() {
      try {
        // Remove old/unused keys
        const keysToCheck = Object.values(STORAGE_KEYS);
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('ephemeral_') && !keysToCheck.includes(key)) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        console.error('Failed to clear old data:', e);
      }
    },

    // Clear all email data
    clearEmails() {
      if (!this.isAvailable()) return;
      
      try {
        localStorage.removeItem(STORAGE_KEYS.GENERATED_EMAILS);
        localStorage.removeItem(STORAGE_KEYS.LAST_SYNC);
      } catch (e) {
        console.error('Failed to clear email data:', e);
      }
    },

    // Check if data needs sync with backend
    needsSync() {
      if (!this.isAvailable()) return true;
      
      try {        const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
        if (!lastSync) return true;
        
        const syncTime = new Date(lastSync);
        const now = new Date();
        return (now.getTime() - syncTime.getTime()) > SYNC_INTERVAL;
      } catch (e) {
        return true;
      }
    },

    // Get storage usage info
    getStorageInfo() {
      if (!this.isAvailable()) return null;
      
      try {
        const emails = this.loadEmails();
        const emailsSize = new Blob([JSON.stringify(emails)]).size;
        
        return {
          emailCount: emails.length,
          storageSize: emailsSize,
          maxEmails: MAX_STORED_EMAILS,
          needsSync: this.needsSync()
        };
      } catch (e) {
        return null;
      }
    }
  };

  // Simplified wrapper functions for backward compatibility
  function saveGeneratedEmailsToStorage() {
    return localStorageManager.saveEmails(generatedEmails);
  }

  function loadGeneratedEmailsFromStorage() {
    const emails = localStorageManager.loadEmails();
    generatedEmails = emails;
    return emails;
  }  // Load generated emails from backend with intelligent sync
  async function loadGeneratedEmailsFromBackend(page = 1, forceSync = false) {
    loadingAddresses = true;
    try {
      // Skip backend call if we have recent data and it's not a forced sync
      if (!forceSync && page === 1 && !localStorageManager.needsSync() && generatedEmails.length > 0) {
        console.log('Using cached data, skipping backend sync');
        loadingAddresses = false;
        return generatedEmails;
      }

      const response = await emailService.getGeneratedAddresses({
        page,
        limit: addressesPerPage
      });
      
      if (response.success && response.data) {
        const backendEmails = response.data.addresses || [];
        addressCurrentPage = response.data.page || page;
        addressTotalPages = Math.ceil((response.data.total || 0) / addressesPerPage);
        
        if (page === 1) {
          // First page - replace the list and sync with backend truth
          // This ensures deleted emails don't come back from localStorage
          generatedEmails = backendEmails;
          
          // If no emails returned from backend but we have some locally, they were likely deleted
          if (backendEmails.length === 0 && generatedEmails.length > 0) {
            console.log('No emails in backend, clearing local storage');
            generatedEmails = [];
          }
        } else {
          // Additional pages - append to the list, avoiding duplicates
          const existingAddresses = new Set(generatedEmails.map(e => e.address));
          const newEmails = backendEmails.filter(e => !existingAddresses.has(e.address));
          generatedEmails = [...generatedEmails, ...newEmails];
        }
        
        // Save to localStorage with optimization
        saveGeneratedEmailsToStorage();
        
        return backendEmails;
      }
    } catch (err) {
      console.error('Failed to load generated emails from backend:', err);
      // Fall back to localStorage if backend fails, but only if it's not a forced sync
      if (page === 1 && !forceSync) {
        loadGeneratedEmailsFromStorage();
      }
    } finally {
      loadingAddresses = false;
    }
    return [];
  }

  // Load more generated emails (pagination)
  async function loadMoreGeneratedEmails() {
    if (addressCurrentPage < addressTotalPages && !loadingAddresses) {
      await loadGeneratedEmailsFromBackend(addressCurrentPage + 1);
    }
  }
  // Refresh generated emails list with force sync
  async function refreshGeneratedEmails() {
    await loadGeneratedEmailsFromBackend(1, true); // Force sync with backend
  }
  
  // Remove expired emails from the list with optimization
  function removeExpiredEmails() {
    const now = new Date();
    const initialCount = generatedEmails.length;
    
    const validEmails = generatedEmails.filter(email => {
      if (!email.expiresAt) return true;
      return new Date(email.expiresAt) > now;
    });
    
    if (validEmails.length !== initialCount) {
      generatedEmails = validEmails;
      saveGeneratedEmailsToStorage();
      
      console.log(`Removed ${initialCount - validEmails.length} expired emails`);
      
      // If the selected email was expired, clear selection
      if (selectedEmailAddress && !validEmails.find(e => e.address === selectedEmailAddress)) {
        selectedEmailAddress = null;
        emailsForAddress = [];
        selectedEmailContent = null;
      }
    }
  }  // Remove a specific generated email from the list
  async function removeGeneratedEmail(address) {
    const confirmed = await dialogHelpers.confirm(
      'Remove Email Address',
      `Remove <strong>${address}</strong> and permanently delete all its emails?<br><br>This action cannot be undone and will remove the address from both your list and the server.`,
      { 
        confirmText: 'Remove & Delete', 
        isDangerous: true 
      }
    );
    
    if (!confirmed) return;
    
    try {
      // First delete all emails for this address from the backend
      await emailService.deleteAllEmails(address);
      
      // Then remove from the frontend list
      generatedEmails = generatedEmails.filter(email => email.address !== address);
      saveGeneratedEmailsToStorage();
      
      // If this was the selected email, clear selection
      if (selectedEmailAddress === address) {
        selectedEmailAddress = null;
        emailsForAddress = [];
        selectedEmailContent = null;
      }
      
      await dialogHelpers.success('Address Removed', `<strong>${address}</strong> and all its emails have been permanently deleted.`);
    } catch (err) {
      console.error('Failed to delete email address:', err);
      await dialogHelpers.error('Removal Failed', `Failed to delete email address: ${err.message}`);
    }
  }  // Clear all local data
  async function clearAllLocalData() {
    const confirmed = await dialogHelpers.confirm(
      'Clear Local Data',
      'This will clear all locally stored email data from your browser. Generated emails will be reloaded from the server on next refresh.<br><br>Continue?',
      { 
        confirmText: 'Clear Data', 
        isDangerous: false 
      }
    );
    
    if (!confirmed) return;
    
    localStorageManager.clearEmails();
    generatedEmails = [];
    selectedEmailAddress = null;
    emailsForAddress = [];
    selectedEmailContent = null;
    
    await dialogHelpers.success('Data Cleared', 'Local data has been cleared successfully.');
  }
  // Clear all generated emails (frontend and backend)
  async function clearAllGeneratedEmails() {
    const confirmed = await dialogHelpers.confirm(
      'Delete All Generated Emails',
      `This will permanently delete <strong>ALL ${generatedEmails.length} generated email addresses</strong> and their emails from both your list and the server.<br><br><span style="color: #dc2626; font-weight: 600;">⚠️ This action cannot be undone!</span><br><br>Continue?`,
      { 
        confirmText: 'Delete Everything', 
        isDangerous: true 
      }
    );
    
    if (!confirmed) return;
    
    try {
      // Delete all emails for each generated address
      const deletePromises = generatedEmails.map(email => 
        emailService.deleteAllEmails(email.address).catch(err => {
          console.error(`Failed to delete emails for ${email.address}:`, err);
          return null; // Continue with other deletions
        })
      );
      
      await Promise.all(deletePromises);
      
      // Clear frontend state
      generatedEmails = [];
      selectedEmailAddress = null;
      emailsForAddress = [];
      selectedEmailContent = null;
      
      // Clear localStorage
      localStorageManager.clearEmails();
      
      await dialogHelpers.success('All Emails Deleted', 'All generated email addresses and their emails have been permanently deleted.');
    } catch (err) {
      console.error('Failed to clear all generated emails:', err);
      await dialogHelpers.error('Delete Failed', `Failed to delete some emails: ${err.message}`);
    }
  }

  // Get storage statistics
  function getStorageStats() {
    const stats = localStorageManager.getStorageInfo();
    if (stats) {
      console.log('Storage Stats:', stats);
      return stats;
    }
    return null;
  }
  onMount(async () => {
    // Load dark mode preference with fallback
    if (localStorageManager.isAvailable()) {
      try {
        const savedDarkMode = localStorage.getItem(STORAGE_KEYS.DARK_MODE);
        if (savedDarkMode !== null) {
          isDarkMode = savedDarkMode === 'true';
        } else {
          // Default to system preference
          isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
      } catch (e) {
        console.error('Failed to load dark mode preference:', e);
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
    } else {
      isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    updateDarkModeClass();
    
    // Load generated emails from localStorage first (for quick startup)
    loadGeneratedEmailsFromStorage();
    
    // Then load from backend to get the latest data (intelligent sync)
    await loadGeneratedEmailsFromBackend(1);
    
    // Set up periodic cleanup of expired emails (less frequent)
    setInterval(removeExpiredEmails, 5 * 60 * 1000); // Check every 5 minutes
    
    // Periodic storage cleanup
    setInterval(() => {
      localStorageManager.clearOldData();
    }, 30 * 60 * 1000); // Clean every 30 minutes
    
    startAutoRefresh();
    
    // Log storage stats for debugging
    if (import.meta.env.DEV) {
      console.log('Initial storage stats:', getStorageStats());
    }
  });
  onDestroy(() => {
    stopAutoRefresh();
    
    // Clear any pending saves
    if (saveTimeout) {
      clearTimeout(saveTimeout);
      saveTimeout = null;
    }
    
    // Final save of current state
    if (generatedEmails.length > 0) {
      saveGeneratedEmailsToStorage();
    }
  });
</script>

<!-- Mobile Header -->
<header class="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
  <div class="flex items-center gap-2">
    <img src="/eemail.png" alt="Ephemeral Mail" class="w-8 h-8" />
    <h1 class="text-xl font-bold text-gray-900 dark:text-white">EphemeralMail</h1>
  </div>
  <div class="flex items-center gap-2">
    <button 
      on:click={toggleDarkMode}
      class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
      title="Toggle dark mode"
    >
      {#if isDarkMode}
        <Sun size={20} />
      {:else}
        <Moon size={20} />      {/if}    </button>
    
    <!-- Mobile Navigation -->
    <div class="flex items-center gap-2">
      {#if currentPanel !== 'addresses'}
        <button 
          on:click={() => currentPanel = 'addresses'}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          title="Back to addresses"
        >
          <Mail size={20} />
        </button>
      {/if}
      
      {#if selectedEmailAddress && currentPanel !== 'emails'}
        <button 
          on:click={() => currentPanel = 'emails'}
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300"
          title="View emails"
        >
          <Menu size={20} />
        </button>
      {/if}
    </div>
  </div>
</header>

<!-- Main Container -->
<div class="flex h-screen bg-gray-50 dark:bg-gray-900">  <!-- Left Panel - Generated Emails -->  <div class="
    {currentPanel === 'addresses' ? 'block' : 'hidden'} lg:block
    w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
    absolute lg:relative z-10 lg:z-auto h-full
  "><div class="p-4 border-b border-gray-200 dark:border-gray-700">      <div class="flex items-center justify-between mb-3">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <img src="/eemail.png" alt="Ephemeral Mail" class="w-5 h-5" />
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Generated Emails</h2>
          </div>
          {#if generatedEmails.length > 0}            <p class="text-xs text-gray-500 dark:text-gray-400">
              {generatedEmails.length} emails
              {#if !localStorageManager.isAvailable()}
                <span class="text-red-500 dark:text-red-400">(Storage unavailable)</span>
              {:else if localStorageManager.needsSync()}
                <span class="text-yellow-500 dark:text-yellow-400">(Needs sync)</span>
              {/if}
            </p>
          {/if}
        </div>
        <div class="flex items-center gap-2">
          <button 
            on:click={refreshGeneratedEmails}
            disabled={loadingAddresses}
            class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
            title="Refresh generated emails"
          >
            <RefreshCw size={16} class="{loadingAddresses ? 'animate-spin' : ''}" />
          </button>
          {#if import.meta.env.DEV}
            <button 
              on:click={clearAllLocalData}
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
              title="Clear local data (dev only)"
            >
              <Trash2 size={16} />
            </button>
          {/if}
          <button 
            on:click={toggleDarkMode}
            class="hidden lg:block p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
            title="Toggle dark mode"
          >
            {#if isDarkMode}
              <Sun size={18} />
            {:else}
              <Moon size={18} />
            {/if}
          </button>
        </div>
      </div>      <button 
        on:click={generateNewEmail}
        disabled={loading}
        class="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
      >
        {#if loading}
          <RefreshCw size={18} class="animate-spin" />
        {:else}
          <Plus size={18} />
        {/if}
        Generate New Email
      </button>
      
      {#if generatedEmails.length > 0}
        <button 
          on:click={clearAllGeneratedEmails}
          class="w-full mt-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 size={18} />
          Clear All ({generatedEmails.length})
        </button>
      {/if}
    </div>    <div class="flex-1 overflow-y-auto">
      {#if loadingAddresses && generatedEmails.length === 0}
        <div class="p-4 text-center text-gray-500 dark:text-gray-400">
          <RefreshCw size={48} class="mx-auto mb-2 text-gray-300 dark:text-gray-600 animate-spin" />
          <p>Loading generated emails...</p>
        </div>
      {:else if generatedEmails.length === 0}
        <div class="p-4 text-center text-gray-500 dark:text-gray-400">
          <Mail size={48} class="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p>No emails generated yet</p>
          <p class="text-sm">Click "Generate New Email" to start</p>
        </div>
      {:else}
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          {#each generatedEmails as email}
            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <li 
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors {selectedEmailAddress === email.address ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' : ''}"
              on:click={() => selectEmailAddress(email.address)}
            >              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{email.address}</p>
                  <div class="flex items-center justify-between mt-1">
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {#if email.createdAt}
                        Created: {formatDate(email.createdAt)}
                      {:else}
                        Recently generated
                      {/if}
                    </p>
                    {#if email.emailCount !== undefined}
                      <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        {email.emailCount} email{email.emailCount !== 1 ? 's' : ''}
                      </span>
                    {/if}
                  </div>
                  {#if email.expiresAt}
                    <p class="text-xs text-red-500 dark:text-red-400">
                      Expires: {formatDate(email.expiresAt)}
                    </p>
                  {/if}
                </div>
                <div class="flex items-center gap-1 ml-2">
                  <button 
                    on:click|stopPropagation={() => copyEmailAddress(email.address)}
                    class="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    title="Copy address"
                  >
                    <Copy size={16} />
                  </button>
                  <button 
                    on:click|stopPropagation={() => removeGeneratedEmail(email.address)}
                    class="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                    title="Remove from list"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            </li>
          {/each}
        </ul>
        
        <!-- Load More Button -->
        {#if addressCurrentPage < addressTotalPages}
          <div class="p-4 border-t border-gray-200 dark:border-gray-700">
            <button 
              on:click={loadMoreGeneratedEmails}
              disabled={loadingAddresses}
              class="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
            >
              {#if loadingAddresses}
                <RefreshCw size={16} class="animate-spin" />
                Loading...
              {:else}
                Load More ({addressTotalPages - addressCurrentPage} page{addressTotalPages - addressCurrentPage !== 1 ? 's' : ''} remaining)
              {/if}
            </button>
          </div>
        {/if}
      {/if}
    </div>
  </div>
  <!-- Middle Panel - Emails for Selected Address -->  <div class="
    {currentPanel === 'emails' ? 'block' : 'hidden'} lg:block
    w-full lg:w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
  ">
    {#if selectedEmailAddress}      <div class="p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">            <button 
              on:click={() => currentPanel = 'addresses'}
              class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Back to addresses"
              aria-label="Back to addresses"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {selectedEmailAddress}
            </h3>
          </div>
          <div class="flex gap-2">
            <button 
              on:click={refreshEmails}
              class="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} />
            </button>
            <button 
              on:click={() => deleteAllEmails(selectedEmailAddress)}
              class="p-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
              title="Delete all emails"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">{emailsForAddress.length} emails</p>
      </div>
      
      <div class="flex-1 overflow-y-auto">
        {#if emailsForAddress.length === 0}
          <div class="p-4 text-center text-gray-500 dark:text-gray-400">
            <Mail size={48} class="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
            <p>No emails received yet</p>
            <p class="text-sm">Emails will appear here when received</p>
          </div>
        {:else}
          <ul class="divide-y divide-gray-100 dark:divide-gray-700">
            {#each emailsForAddress as email}
              {@const preview = getEmailPreview(email)}
              <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
              <!-- svelte-ignore a11y_click_events_have_key_events -->
              <li 
                class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors {selectedEmailContent?.id === email.id ? 'bg-blue-50 dark:bg-blue-900/30 border-r-2 border-blue-500' : ''}"
                on:click={() => selectEmail(email)}
              >                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      {#if !email.isRead}
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {/if}
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{preview.subject}</p>
                    </div>                    <p class="text-xs text-gray-600 dark:text-gray-400 truncate">{preview.from}</p>
                    {#if preview.preview}
                      <p class="text-xs text-gray-600 dark:text-gray-300 truncate mt-1 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded italic">{preview.preview}</p>
                    {/if}
                    <p class="text-xs text-gray-500 dark:text-gray-400">{formatDate(email.createdAt)}</p>
                  </div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </div>
    {:else}
      <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div class="text-center">
          <Mail size={48} class="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p>Select an email address</p>
          <p class="text-sm">Choose an email from the left panel</p>
        </div>
      </div>
    {/if}
  </div>
  <!-- Right Panel - Email Content -->  <div class="
    {currentPanel === 'content' ? 'block' : 'hidden'} lg:block
    flex-1 bg-white dark:bg-gray-800
  ">
    {#if selectedEmailContent}
      <div class="h-full flex flex-col">        <!-- Email Header -->
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div class="flex items-center gap-2 mb-2">            <button 
              on:click={() => currentPanel = 'emails'}
              class="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Back to emails"
              aria-label="Back to emails"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <h4 class="text-lg font-semibold text-gray-900 dark:text-white">{selectedEmailContent.subject || 'No Subject'}</h4>
          </div>
          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p><span class="font-medium">From:</span> {selectedEmailContent.from || 'Unknown'}</p>
            <p><span class="font-medium">To:</span> {selectedEmailContent.to || selectedEmailAddress}</p>
            <p><span class="font-medium">Date:</span> {formatDate(selectedEmailContent.createdAt)}</p>
            {#if selectedEmailContent.attachments && selectedEmailContent.attachments.length > 0}
              <p><span class="font-medium">Attachments:</span> {selectedEmailContent.attachments.length} file(s)</p>
            {/if}
          </div>
        </div>        <!-- Email Body -->
        <div class="flex-1 overflow-y-auto p-4">
          {#if selectedEmailContent.htmlBody}
            <!-- HTML Email Content with preserved styling -->
            <div class="email-content bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <div class="html-email-wrapper">
                {@html selectedEmailContent.htmlBody}
              </div>
            </div>
          {:else if selectedEmailContent.textBody}
            <!-- Plain Text Email Content -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
              <pre class="whitespace-pre-wrap font-mono text-sm text-gray-900 dark:text-gray-100 leading-relaxed">{selectedEmailContent.textBody}</pre>
            </div>
          {:else}
            <div class="flex items-center justify-center h-32 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
              <p class="text-gray-500 dark:text-gray-400 italic">No content available</p>
            </div>
          {/if}
        </div>
        
        <!-- Attachments -->
        {#if selectedEmailContent.attachments && selectedEmailContent.attachments.length > 0}
          <div class="border-t border-gray-200 dark:border-gray-700 p-4">
            <h5 class="font-medium text-gray-900 dark:text-white mb-2">Attachments</h5>
            <div class="space-y-2">
              {#each selectedEmailContent.attachments as attachment}
                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span class="text-sm text-gray-700 dark:text-gray-300">{attachment.filename}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{attachment.size || 'Unknown size'}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {:else}
      <div class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        <div class="text-center">
          <Eye size={48} class="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
          <p>Select an email to view</p>
          <p class="text-sm">Choose an email from the middle panel</p>
        </div>
      </div>
    {/if}  </div>
</div>

<!-- Global Dialog Component -->

<!-- Dialog Component -->
<Dialog
  isOpen={$dialogStore.isOpen}
  title={$dialogStore.title}
  message={$dialogStore.message}
  type={$dialogStore.type}
  confirmText={$dialogStore.confirmText}
  cancelText={$dialogStore.cancelText}
  showCancel={$dialogStore.showCancel}
  showConfirm={$dialogStore.showConfirm}
  isDangerous={$dialogStore.isDangerous}
  on:confirm={() => $dialogStore.onConfirm && $dialogStore.onConfirm()}
  on:cancel={() => $dialogStore.onCancel && $dialogStore.onCancel()}
  on:close={() => dialogHelpers.close()}
/>

<style>
  /* Ensure proper scrolling and layout */
  :global(html, body) {
    height: 100%;
    margin: 0;
    padding: 0;
  }
  
  /* Custom scrollbar for webkit browsers */
  :global(.overflow-y-auto::-webkit-scrollbar) {
    width: 6px;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-track) {
    background: #f1f1f1;
  }
  
  :global(.overflow-y-auto::-webkit-scrollbar-thumb) {
    background: #c1c1c1;
    border-radius: 3px;
  }
    :global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
    background: #a8a8a8;
  }

  /* ===== EMAIL CONTENT STYLING ===== */
  
  /* HTML Email Wrapper - preserve company designs while ensuring readability */
  :global(.html-email-wrapper) {
    line-height: 1.6;
    word-wrap: break-word;
    max-width: 100%;
    overflow-x: auto;
  }

  /* Reset and normalize HTML email styles */
  :global(.html-email-wrapper *) {
    max-width: 100% !important;
    box-sizing: border-box;
  }

  /* Ensure text is readable in both light and dark modes */
  :global(.html-email-wrapper) {
    color: #1f2937; /* Default dark gray for light mode */
  }

  :global(.dark .html-email-wrapper) {
    color: #f9fafb; /* Light gray for dark mode */
  }

  /* Company email styling preservation */
  :global(.html-email-wrapper table) {
    border-collapse: collapse;
    width: 100%;
    max-width: 100%;
    margin: 0 auto;
  }

  :global(.html-email-wrapper td, .html-email-wrapper th) {
    padding: 8px;
    vertical-align: top;
  }

  /* Headers styling */
  :global(.html-email-wrapper h1, .html-email-wrapper h2, .html-email-wrapper h3, .html-email-wrapper h4, .html-email-wrapper h5, .html-email-wrapper h6) {
    margin: 16px 0 8px 0;
    font-weight: 600;
    line-height: 1.2;
  }

  :global(.html-email-wrapper h1) { font-size: 1.875rem; }
  :global(.html-email-wrapper h2) { font-size: 1.5rem; }
  :global(.html-email-wrapper h3) { font-size: 1.25rem; }
  :global(.html-email-wrapper h4) { font-size: 1.125rem; }
  :global(.html-email-wrapper h5) { font-size: 1rem; }
  :global(.html-email-wrapper h6) { font-size: 0.875rem; }

  /* Paragraph and text styling */
  :global(.html-email-wrapper p) {
    margin: 12px 0;
    line-height: 1.6;
  }

  /* Links styling - preserve colors but ensure visibility */
  :global(.html-email-wrapper a) {
    text-decoration: underline;
    transition: opacity 0.2s ease;
  }

  :global(.html-email-wrapper a:hover) {
    opacity: 0.8;
  }

  /* Lists styling */
  :global(.html-email-wrapper ul, .html-email-wrapper ol) {
    margin: 12px 0;
    padding-left: 24px;
  }

  :global(.html-email-wrapper li) {
    margin: 4px 0;
    line-height: 1.5;
  }

  /* Images - responsive and contained */
  :global(.html-email-wrapper img) {
    max-width: 100% !important;
    height: auto !important;
    border-radius: 4px;
    display: block;
    margin: 8px auto;
  }

  /* Blockquotes */
  :global(.html-email-wrapper blockquote) {
    border-left: 4px solid #d1d5db;
    padding-left: 16px;
    margin: 16px 0;
    font-style: italic;
    background-color: rgba(249, 250, 251, 0.5);
    border-radius: 0 4px 4px 0;
  }

  :global(.dark .html-email-wrapper blockquote) {
    border-left-color: #4b5563;
    background-color: rgba(17, 24, 39, 0.5);
  }

  /* Code blocks */
  :global(.html-email-wrapper code) {
    background-color: #f3f4f6;
    color: #1f2937;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', Courier, monospace;
    font-size: 0.875em;
  }

  :global(.dark .html-email-wrapper code) {
    background-color: #374151;
    color: #f9fafb;
  }

  :global(.html-email-wrapper pre) {
    background-color: #f9fafb;
    color: #1f2937;
    padding: 16px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 16px 0;
    border: 1px solid #e5e7eb;
  }

  :global(.dark .html-email-wrapper pre) {
    background-color: #1f2937;
    color: #f9fafb;
    border-color: #4b5563;
  }

  /* Buttons and styled elements */
  :global(.html-email-wrapper .button, .html-email-wrapper button, .html-email-wrapper input[type="button"]) {
    display: inline-block;
    padding: 10px 20px;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 500;
    margin: 8px 4px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  /* Fix for white text on white background in dark mode */
  :global(.dark .html-email-wrapper *[style*="color: white"], .dark .html-email-wrapper *[style*="color: #fff"], .dark .html-email-wrapper *[style*="color: #ffffff"]) {
    color: #1f2937 !important;
    background-color: #f9fafb !important;
    padding: 4px 8px;
    border-radius: 4px;
  }

  /* Fix for black text on dark backgrounds */
  :global(.html-email-wrapper *[style*="color: black"], .html-email-wrapper *[style*="color: #000"], .html-email-wrapper *[style*="color: #000000"]) {
    color: #1f2937 !important;
  }

  :global(.dark .html-email-wrapper *[style*="color: black"], .dark .html-email-wrapper *[style*="color: #000"], .dark .html-email-wrapper *[style*="color: #000000"]) {
    color: #f9fafb !important;
  }

  /* Handle company email containers */
  :global(.html-email-wrapper div[style*="background-color"]) {
    border-radius: 6px;
    margin: 8px 0;
    overflow: hidden;
  }

  /* Ensure form elements are visible */
  :global(.html-email-wrapper input, .html-email-wrapper textarea, .html-email-wrapper select) {
    background-color: white;
    color: #1f2937;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    padding: 8px 12px;
  }

  :global(.dark .html-email-wrapper input, .dark .html-email-wrapper textarea, .dark .html-email-wrapper select) {
    background-color: #374151;
    color: #f9fafb;
    border-color: #4b5563;
  }

  /* Horizontal rules */
  :global(.html-email-wrapper hr) {
    border: none;
    border-top: 1px solid #e5e7eb;
    margin: 24px 0;
  }

  :global(.dark .html-email-wrapper hr) {
    border-top-color: #4b5563;
  }

  /* Small text */
  :global(.html-email-wrapper small) {
    font-size: 0.75rem;
    opacity: 0.8;
  }

  /* Strong emphasis */
  :global(.html-email-wrapper strong, .html-email-wrapper b) {
    font-weight: 700;
  }

  /* Italic emphasis */
  :global(.html-email-wrapper em, .html-email-wrapper i) {
    font-style: italic;
  }
</style>
