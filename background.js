importScripts('storage-manager.js');

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Check if extension has been configured
    const result = await chrome.storage.sync.get(['serviceUrl', 'storageMode']);
    
    // If no configuration exists, open options page
    if (!result.serviceUrl && !result.storageMode) {
      chrome.tabs.create({ url: chrome.runtime.getURL('options.html') });
    }
  }
});

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  const trimmedUrl = url.trim();
  
  // If URL already has a protocol, validate it
  if (/^https?:\/\//i.test(trimmedUrl)) {
    try {
      new URL(trimmedUrl);
      return trimmedUrl;
    } catch {
      return null;
    }
  }
  
  // If no protocol, add https:// and validate
  const urlWithProtocol = `https://${trimmedUrl}`;
  try {
    new URL(urlWithProtocol);
    return urlWithProtocol;
  } catch {
    return null;
  }
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  const golinkMatch = details.url.match(/go\/([a-zA-Z0-9_-]+)/);
  if (details.frameId === 0 && golinkMatch) {
    const golinkName = golinkMatch[1];
    try {
      const data = await storageManager.getGolink(golinkName);

      if (data && data.url) {
        const normalizedUrl = normalizeUrl(data.url);
        if (normalizedUrl) {
          chrome.tabs.update(details.tabId, { url: normalizedUrl });
        } else {
          console.error("Invalid URL returned:", data.url);
          const notFoundUrl = chrome.runtime.getURL(`404.html?golink=${encodeURIComponent(golinkName)}`);
          chrome.tabs.update(details.tabId, { url: notFoundUrl });
        }
      } else {
        const notFoundUrl = chrome.runtime.getURL(`404.html?golink=${encodeURIComponent(golinkName)}`);
        chrome.tabs.update(details.tabId, { url: notFoundUrl });
      }
    } catch (error) {
      console.error("Error fetching golink:", error);
      const notFoundUrl = chrome.runtime.getURL(`404.html?golink=${encodeURIComponent(golinkName)}`);
      chrome.tabs.update(details.tabId, { url: notFoundUrl });
    }
  }
});
