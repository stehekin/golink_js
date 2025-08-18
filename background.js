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
      const response = await fetch(`http://localhost:3030/golinks/go/${golinkName}`);
      const data = await response.json();

      if (response.ok && data.url) {
        const normalizedUrl = normalizeUrl(data.url);
        if (normalizedUrl) {
          chrome.tabs.update(details.tabId, { url: normalizedUrl });
        } else {
          console.error("Invalid URL returned from server:", data.url);
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
