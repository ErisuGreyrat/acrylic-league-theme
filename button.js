/* Acrylic League Theme: Activity Panel Toggle Checkbox */
(function () {
  // Fallback in-memory state
  let inMemoryState = false;
  let isDatastoreAvailableCached = false;
  let lastAppliedState = null; // Track last applied state to avoid redundant updates
  let isSettingsProcessed = false; // Flag to debounce settings updates

  // Inject CSS to hide activity panel by default
  const style = document.createElement('style');
  style.textContent = `
    .screen-root[data-screen-name="rcp-fe-lol-activity-center"] {
      opacity: 0 !important;
      pointer-events: none !important;
    }
    .screen-root[data-screen-name="rcp-fe-lol-activity-center"].theme-visible {
      opacity: 1 !important;
      pointer-events: auto !important;
    }
  `;
  document.head.appendChild(style);

  // Check if PenguDatastore is available
  function checkDatastoreAvailability() {
    isDatastoreAvailableCached = typeof window.PenguDatastore !== 'undefined' &&
                                 typeof window.PenguDatastore.getItem === 'function' &&
                                 typeof window.PenguDatastore.setItem === 'function';
    return isDatastoreAvailableCached;
  }

  // Datastore functions
  function saveToggleState(isHidden) {
    try {
      if (isDatastoreAvailableCached) {
        window.PenguDatastore.setItem('acrylicLeagueTheme_activityHidden', isHidden);
      } else {
        localStorage.setItem('acrylicLeagueTheme_activityHidden', isHidden);
      }
      inMemoryState = isHidden; // Update in-memory state
    } catch (e) {
      inMemoryState = isHidden; // Update in-memory state even on error
    }
  }

  function loadToggleState() {
    try {
      if (isDatastoreAvailableCached) {
        const isHidden = window.PenguDatastore.getItem('acrylicLeagueTheme_activityHidden');
        if (isHidden !== undefined && isHidden !== null) {
          inMemoryState = isHidden;
          return isHidden;
        }
      }
      const localStorageValue = localStorage.getItem('acrylicLeagueTheme_activityHidden');
      if (localStorageValue !== null) {
        const isHidden = localStorageValue === 'true';
        inMemoryState = isHidden;
        return isHidden;
      }
      return inMemoryState;
    } catch (e) {
      return inMemoryState;
    }
  }

  // Apply stored state to activity center
  function applyStoredStateToActivityCenter() {
    const isHidden = loadToggleState();
    const activityCenter = document.querySelector('.screen-root[data-screen-name="rcp-fe-lol-activity-center"]');
    if (activityCenter) {
      if (lastAppliedState !== isHidden) {
        activityCenter.classList.toggle('theme-visible', !isHidden);
        lastAppliedState = isHidden;
      }
      return true;
    }
    return false;
  }

  function addActivityToggleCheckbox() {
    const scrollable = document.querySelector('.lol-settings-options lol-uikit-scrollable');
    if (!scrollable) {
      return false;
    }

    // Check if checkbox already exists
    if (scrollable.querySelector('[for="theme-visibility-toggle"]')) {
      const existingCheckbox = scrollable.querySelector('lol-uikit-flat-checkbox[for="theme-visibility-toggle"]');
      const existingInput = existingCheckbox.querySelector('input');
      const isHidden = loadToggleState();
      if (existingInput.checked !== isHidden) {
        existingInput.checked = isHidden;
        if (isHidden) {
          existingCheckbox.classList.add('checked');
        } else {
          existingCheckbox.classList.remove('checked');
        }
      }
      applyStoredStateToActivityCenter(); // Apply state when settings opened
      isSettingsProcessed = true; // Mark settings as processed
      return true;
    }

    // Find the "Enable Low Spec Mode" checkbox row
    const lowSpecRow = scrollable.querySelector('lol-uikit-flat-checkbox[for="potatoModeEnabled"]')?.closest('.lol-settings-general-row');
    if (!lowSpecRow) {
      return false;
    }

    // Create new row for the toggle checkbox
    const row = document.createElement('div');
    row.classList.add('lol-settings-general-row');

    const checkbox = document.createElement('lol-uikit-flat-checkbox');
    checkbox.setAttribute('for', 'theme-visibility-toggle');
    const input = document.createElement('input');
    input.setAttribute('slot', 'input');
    input.setAttribute('name', 'theme-visibility-toggle');
    input.setAttribute('type', 'checkbox');
    input.id = `ember${Math.floor(Math.random() * 10000)}`;
    input.classList.add('ember-checkbox', 'ember-view');

    // Set checkbox state from stored value
    const isHidden = loadToggleState();
    input.checked = isHidden;
    if (isHidden) {
      checkbox.classList.add('checked');
    } else {
      checkbox.classList.remove('checked');
    }

    const label = document.createElement('label');
    label.setAttribute('slot', 'label');
    label.textContent = 'Hide Activity Panel';

    checkbox.appendChild(input);
    checkbox.appendChild(label);
    row.appendChild(checkbox);

    // Insert the new row before the Low Spec Mode row
    scrollable.insertBefore(row, lowSpecRow);

    // Add toggle functionality
    function attachToggleListener() {
      input.addEventListener('change', () => {
        const isHidden = input.checked;
        const activityCenter = document.querySelector('.screen-root[data-screen-name="rcp-fe-lol-activity-center"]');
        if (activityCenter) {
          activityCenter.classList.toggle('theme-visible', !isHidden);
        }
        if (isHidden) {
          checkbox.classList.add('checked');
        } else {
          checkbox.classList.remove('checked');
        }
        saveToggleState(isHidden);
      });
    }
    attachToggleListener();

    applyStoredStateToActivityCenter(); // Apply state when settings opened
    isSettingsProcessed = true; // Mark settings as processed
    return true;
  }

  function setupSettingsObserver() {
    if (!document.body) {
      setTimeout(setupSettingsObserver, 200);
      return;
    }

    const optionsContainer = document.querySelector('.lol-settings-options');
    if (!optionsContainer) {
      setTimeout(setupSettingsObserver, 200);
      return;
    }

    const observer = new MutationObserver((mutations) => {
      let shouldProcess = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' || mutation.type === 'subtree') {
          shouldProcess = true;
        }
      });

      if (shouldProcess && !isSettingsProcessed) {
        const scrollable = optionsContainer.querySelector('lol-uikit-scrollable');
        if (scrollable) {
          if (!scrollable.querySelector('[for="theme-visibility-toggle"]')) {
            addActivityToggleCheckbox();
          } else {
            const existingCheckbox = scrollable.querySelector('lol-uikit-flat-checkbox[for="theme-visibility-toggle"]');
            const existingInput = existingCheckbox.querySelector('input');
            const isHidden = loadToggleState();
            if (existingInput.checked !== isHidden) {
              existingInput.checked = isHidden;
              if (isHidden) {
                existingCheckbox.classList.add('checked');
              } else {
                existingCheckbox.classList.remove('checked');
              }
            }
            applyStoredStateToActivityCenter(); // Apply state on settings change
            isSettingsProcessed = true; // Mark as processed
          }
        }
      }
    });

    observer.observe(optionsContainer, { childList: true, subtree: true });

    // Reset isSettingsProcessed when settings UI is removed
    const bodyObserver = new MutationObserver((mutations) => {
      if (!document.querySelector('.lol-settings-options')) {
        isSettingsProcessed = false;
      }
    });
    bodyObserver.observe(document.body, { childList: true, subtree: true });
  }

  // Observe activity center for style changes
  function setupActivityObserver() {
    if (!document.body) {
      setTimeout(setupActivityObserver, 200);
      return;
    }

    const activityCenter = document.querySelector('.screen-root[data-screen-name="rcp-fe-lol-activity-center"]');
    if (activityCenter) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            applyStoredStateToActivityCenter();
          }
        });
      });

      observer.observe(activityCenter, { attributes: true });
    } else {
      setTimeout(setupActivityObserver, 200);
    }
  }

  // Initialize
  function initialize() {
    checkDatastoreAvailability(); // Check PenguDatastore once at startup
    applyStoredStateToActivityCenter(); // Apply state immediately
    setupActivityObserver();
    setupSettingsObserver();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initialize();
    });
  } else {
    initialize();
  }
})();