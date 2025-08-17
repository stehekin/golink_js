document.addEventListener('DOMContentLoaded', function() {
  const golinkNameInput = document.getElementById('golinkName');
  const currentUrlInput = document.getElementById('currentUrl');
  const addGolinkForm = document.getElementById('addGolinkForm');
  const createGolinkBtn = document.getElementById('createGolinkBtn');
  const cancelBtn = document.getElementById('cancelBtn');
  const recentLinksContainer = document.getElementById('recentLinks');

  loadCurrentUrl();
  loadRecentLinks();

  addGolinkForm.addEventListener('submit', handleCreateGolink);
  cancelBtn.addEventListener('click', function() {
    window.close();
  });

  function loadCurrentUrl() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) {
        currentUrlInput.value = tabs[0].url;
      }
    });
  }

  function handleCreateGolink(e) {
    e.preventDefault();
    
    const golinkName = golinkNameInput.value.trim();
    const currentUrl = currentUrlInput.value.trim();
    
    if (!golinkName || !currentUrl) {
      alert('Please enter a golink name.');
      return;
    }

    if (!/^[a-zA-Z_-]+$/.test(golinkName)) {
      alert('Golink name can only contain letters, underscores, and hyphens.');
      return;
    }

    const golinkData = {
      name: golinkName,
      url: currentUrl
    };

    fetch('http://localhost:3030/golinks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(golinkData)
    })
    .then(response => {
      if (response.ok) {
        alert(`Golink "go/${golinkName}" created successfully!`);
        addToRecentLinks(golinkName, currentUrl);
        window.close();
      } else {
        alert('Failed to create golink. Please try again.');
      }
    })
    .catch(error => {
      console.error('Error creating golink:', error);
      alert('Error creating golink. Please make sure the golink service is running.');
    });
  }

  function loadRecentLinks() {
    chrome.storage.local.get(['recentLinks'], function(result) {
      const recentLinks = result.recentLinks || [];
      displayRecentLinks(recentLinks);
    });
  }

  function displayRecentLinks(links) {
    recentLinksContainer.innerHTML = '';
    
    links.slice(0, 5).forEach(link => {
      const linkElement = document.createElement('div');
      linkElement.className = 'link-item';
      linkElement.innerHTML = `
        <span class="link-name">${link.name}</span>
        <span class="link-url">${link.url}</span>
      `;
      linkElement.addEventListener('click', function() {
        chrome.tabs.create({ url: link.url });
        window.close();
      });
      recentLinksContainer.appendChild(linkElement);
    });
  }

  function addToRecentLinks(name, url) {
    chrome.storage.local.get(['recentLinks'], function(result) {
      let recentLinks = result.recentLinks || [];
      
      recentLinks = recentLinks.filter(link => link.name !== name);
      recentLinks.unshift({ name, url, timestamp: Date.now() });
      recentLinks = recentLinks.slice(0, 10);
      
      chrome.storage.local.set({ recentLinks });
    });
  }

});