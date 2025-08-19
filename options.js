document.addEventListener('DOMContentLoaded', function() {
  const serviceUrlInput = document.getElementById('serviceUrl');
  const authTokenInput = document.getElementById('authToken');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const resetSettingsBtn = document.getElementById('resetSettings');
  const storageServiceRadio = document.getElementById('storageService');
  const storageExtensionRadio = document.getElementById('storageExtension');
  const serviceUrlSection = document.getElementById('serviceUrlSection');
  const authTokenSection = document.getElementById('authTokenSection');

  // Load saved settings
  loadSettings();

  // Event listeners
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);
  storageServiceRadio.addEventListener('change', updateServiceUrlVisibility);
  storageExtensionRadio.addEventListener('change', updateServiceUrlVisibility);

  function loadSettings() {
    chrome.storage.sync.get(['serviceUrl', 'storageMode', 'authToken'], function(result) {
      if (result.serviceUrl) {
        serviceUrlInput.value = result.serviceUrl;
      }
      
      if (result.authToken) {
        authTokenInput.value = result.authToken;
      }
      
      // Set storage mode (default to 'extension' if not set)
      const storageMode = result.storageMode || 'extension';
      if (storageMode === 'service') {
        storageServiceRadio.checked = true;
      } else {
        storageExtensionRadio.checked = true;
      }
      
      updateServiceUrlVisibility();
    });
  }

  function saveSettings() {
    const serviceUrl = serviceUrlInput.value.trim();
    const authToken = authTokenInput.value.trim();
    const storageMode = storageServiceRadio.checked ? 'service' : 'extension';
    
    // Validate service URL only if service mode is selected
    if (storageMode === 'service' && !serviceUrl) {
      alert('Please enter a valid service URL');
      return;
    }

    const settingsToSave = { storageMode: storageMode };
    
    if (storageMode === 'service') {
      settingsToSave.serviceUrl = serviceUrl;
      settingsToSave.authToken = authToken; // Save auth token even if empty
    }

    chrome.storage.sync.set(settingsToSave, function() {
      // Show success message
      const originalText = saveSettingsBtn.textContent;
      saveSettingsBtn.textContent = 'Saved!';
      saveSettingsBtn.style.backgroundColor = '#34a853';
      
      setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
        saveSettingsBtn.style.backgroundColor = '#4f46e5';
      }, 2000);
    });
  }

  function resetSettings() {
    if (confirm('Reset all settings to default values?')) {
      chrome.storage.sync.clear(function() {
        serviceUrlInput.value = 'http://localhost:3030';
        authTokenInput.value = '';
        storageServiceRadio.checked = false;
        storageExtensionRadio.checked = true;
        updateServiceUrlVisibility();
        alert('Settings reset to default values');
      });
    }
  }
  
  function updateServiceUrlVisibility() {
    if (storageServiceRadio.checked) {
      serviceUrlSection.style.display = 'block';
      authTokenSection.style.display = 'block';
    } else {
      serviceUrlSection.style.display = 'none';
      authTokenSection.style.display = 'none';
    }
  }
});