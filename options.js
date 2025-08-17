document.addEventListener('DOMContentLoaded', function() {
  const serviceUrlInput = document.getElementById('serviceUrl');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const resetSettingsBtn = document.getElementById('resetSettings');

  // Load saved settings
  loadSettings();

  // Event listeners
  saveSettingsBtn.addEventListener('click', saveSettings);
  resetSettingsBtn.addEventListener('click', resetSettings);

  function loadSettings() {
    chrome.storage.sync.get(['serviceUrl'], function(result) {
      if (result.serviceUrl) {
        serviceUrlInput.value = result.serviceUrl;
      }
    });
  }

  function saveSettings() {
    const serviceUrl = serviceUrlInput.value.trim();
    
    if (!serviceUrl) {
      alert('Please enter a valid service URL');
      return;
    }

    chrome.storage.sync.set({
      serviceUrl: serviceUrl
    }, function() {
      // Show success message
      const originalText = saveSettingsBtn.textContent;
      saveSettingsBtn.textContent = 'Saved!';
      saveSettingsBtn.style.backgroundColor = '#34a853';
      
      setTimeout(() => {
        saveSettingsBtn.textContent = originalText;
        saveSettingsBtn.style.backgroundColor = '#1a73e8';
      }, 2000);
    });
  }

  function resetSettings() {
    if (confirm('Reset all settings to default values?')) {
      chrome.storage.sync.clear(function() {
        serviceUrlInput.value = 'http://localhost:3030';
        alert('Settings reset to default values');
      });
    }
  }
});