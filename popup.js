document.addEventListener('DOMContentLoaded', function() {
  const searchInput = document.getElementById('searchInput');
  const goButton = document.getElementById('goButton');
  const recentLinksContainer = document.getElementById('recentLinks');
  const addLinkBtn = document.getElementById('addLinkBtn');
  const manageLinkBtn = document.getElementById('manageLinkBtn');

  loadRecentLinks();

  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleGoLink();
    }
  });

  goButton.addEventListener('click', handleGoLink);
  addLinkBtn.addEventListener('click', showAddLinkForm);
  manageLinkBtn.addEventListener('click', showManageLinks);

  function handleGoLink() {
    const input = searchInput.value.trim();
    if (!input) return;

    chrome.storage.sync.get(['golinks'], function(result) {
      const golinks = result.golinks || {};
      
      if (golinks[input]) {
        chrome.tabs.create({ url: golinks[input] });
        addToRecentLinks(input, golinks[input]);
        window.close();
      } else {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        chrome.tabs.create({ url: searchUrl });
        window.close();
      }
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

  function showAddLinkForm() {
    const name = prompt('Enter go link name:');
    const url = prompt('Enter URL:');
    
    if (name && url) {
      chrome.storage.sync.get(['golinks'], function(result) {
        const golinks = result.golinks || {};
        golinks[name] = url;
        chrome.storage.sync.set({ golinks }, function() {
          alert('Go link added successfully!');
        });
      });
    }
  }

  function showManageLinks() {
    chrome.storage.sync.get(['golinks'], function(result) {
      const golinks = result.golinks || {};
      const linksList = Object.entries(golinks)
        .map(([name, url]) => `${name} -> ${url}`)
        .join('\n');
      
      if (linksList) {
        alert('Current go links:\n\n' + linksList);
      } else {
        alert('No go links found.');
      }
    });
  }
});