document.addEventListener('DOMContentLoaded', function() {
  const golinkNameInput = document.getElementById('golinkName');
  const currentUrlInput = document.getElementById('currentUrl');
  const addGolinkForm = document.getElementById('addGolinkForm');
  const createGolinkBtn = document.getElementById('createGolinkBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const manageGolinkLink = document.getElementById('manageGolinkLink');
  const configureLink = document.getElementById('configureLink');

  async function getServiceUrl() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['serviceUrl'], function(result) {
        resolve(result.serviceUrl || 'http://localhost:3030');
      });
    });
  }

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

    const serviceUrl = await getServiceUrl();
    fetch(`${serviceUrl}/golinks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(golinkData)
    })
    .then(async response => {
      if (response.ok) {
        alert(`Golink "go/${golinkName}" created successfully!`);
        window.close();
      } else if (response.status === 409) {
        const errorData = await response.json();
        if (errorData.error === 'Golink already exists') {
          const shouldOverwrite = confirm(`Golink "go/${golinkName}" already exists. Do you want to overwrite it?`);
          if (shouldOverwrite) {
            updateExistingGolink(golinkName, currentUrl);
          }
        } else {
          alert('Failed to create golink. Please try again.');
        }
      } else {
        alert('Failed to create golink. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error creating golink:', error);
      alert('Error creating golink. Please make sure the golink service is running.');
    });
  }

  async function updateExistingGolink(golinkName, currentUrl) {
    const serviceUrl = await getServiceUrl();
    fetch(`${serviceUrl}/golinks/go/${golinkName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: currentUrl })
    })
    .then(response => {
      if (response.ok) {
        alert(`Golink "go/${golinkName}" updated successfully!`);
        window.close();
      } else {
        alert('Failed to update golink. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error updating golink:', error);
      alert('Error updating golink. Please make sure the golink service is running.');
    });
  }


});