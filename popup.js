document.addEventListener('DOMContentLoaded', function() {
  const golinkNameInput = document.getElementById('golinkName');
  const currentUrlInput = document.getElementById('currentUrl');
  const addGolinkForm = document.getElementById('addGolinkForm');
  const createGolinkBtn = document.getElementById('createGolinkBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const manageGolinkLink = document.getElementById('manageGolinkLink');
  const configureLink = document.getElementById('configureLink');

  // Storage manager will be included via script tag in popup.html

  loadCurrentUrl();

  addGolinkForm.addEventListener('submit', handleCreateGolink);
  cancelBtn.addEventListener('click', function() {
    window.close();
  });

  manageGolinkLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({
      url: chrome.runtime.getURL('manage.html')
    });
  });

  configureLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  function loadCurrentUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        currentUrlInput.value = tabs[0].url;
      }
    });
  }

  async function handleCreateGolink(e) {
    e.preventDefault();
    
    const golinkName = golinkNameInput.value.trim();
    const currentUrl = currentUrlInput.value.trim();
    
    if (!golinkName || !currentUrl) {
      alert('Please enter a golink name.');
      return;
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(golinkName)) {
      alert('Golink name can only contain letters, numbers, underscores, and hyphens.');
      return;
    }

    const golinkData = {
      short_link: `go/${golinkName}`,
      url: currentUrl
    };

    try {
      await storageManager.createGolink(golinkData);
      alert(`Golink "go/${golinkName}" created successfully!`);
      window.close();
    } catch (error) {
      if (error.status === 409 && error.error === 'Golink already exists') {
        const shouldOverwrite = confirm(`Golink "go/${golinkName}" already exists. Do you want to overwrite it?`);
        if (shouldOverwrite) {
          updateExistingGolink(golinkName, currentUrl);
        }
      } else {
        console.error('Error creating golink:', error);
        alert('Error creating golink. Please check your connection or try again.');
      }
    }
  }

  async function updateExistingGolink(golinkName, currentUrl) {
    try {
      await storageManager.updateGolink(`go/${golinkName}`, { url: currentUrl });
      alert(`Golink "go/${golinkName}" updated successfully!`);
      window.close();
    } catch (error) {
      console.error('Error updating golink:', error);
      alert('Error updating golink. Please check your connection or try again.');
    }
  }


});