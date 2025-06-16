<script>
  import { createEventDispatcher } from 'svelte';
  import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-svelte';

  export let isOpen = false;
  export let title = '';
  export let message = '';
  export let type = 'info'; // 'info', 'warning', 'error', 'success', 'confirm'
  export let confirmText = 'Confirm';
  export let cancelText = 'Cancel';
  export let showCancel = true;
  export let showConfirm = true;
  export let isDangerous = false;

  const dispatch = createEventDispatcher();

  function handleConfirm() {
    dispatch('confirm');
    close();
  }

  function handleCancel() {
    dispatch('cancel');
    close();
  }

  function close() {
    isOpen = false;
    dispatch('close');
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && !showCancel) {
      handleConfirm();
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  }

  $: iconComponent = {
    info: Info,
    warning: AlertTriangle,
    error: AlertCircle,
    success: CheckCircle,
    confirm: AlertTriangle
  }[type];

  $: iconColor = {
    info: 'text-blue-500',
    warning: 'text-yellow-500', 
    error: 'text-red-500',
    success: 'text-green-500',
    confirm: 'text-orange-500'
  }[type];

  $: bgColor = {
    info: 'bg-blue-50 dark:bg-blue-900/20',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20',
    error: 'bg-red-50 dark:bg-red-900/20', 
    success: 'bg-green-50 dark:bg-green-900/20',
    confirm: 'bg-orange-50 dark:bg-orange-900/20'
  }[type];
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity duration-200"
    on:click={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-message"
  >
    <!-- Dialog -->
    <div 
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-hidden transform transition-all duration-200 scale-100"
      role="document"
    >
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 {bgColor}">
        <div class="flex items-center gap-3">
          <svelte:component this={iconComponent} size={24} class={iconColor} />
          <h3 id="dialog-title" class="text-lg font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
        </div>
        <button
          on:click={close}
          class="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
      </div>

      <!-- Content -->
      <div class="p-4">
        <p id="dialog-message" class="text-gray-700 dark:text-gray-300 leading-relaxed">
          {@html message}
        </p>
      </div>

      <!-- Actions -->
      <div class="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
        {#if showCancel}
          <button
            on:click={handleCancel}
            class="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {cancelText}
          </button>
        {/if}
        
        {#if showConfirm}
          <button
            on:click={handleConfirm}
            class="flex-1 px-4 py-2 text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 {isDangerous 
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
              : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}"
          >
            {confirmText}
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  :global(body.dialog-open) {
    overflow: hidden;
  }
</style>
