chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  const golinkMatch = details.url.match(/go\/([a-zA-Z0-9_-]+)/);
  if (details.frameId === 0 && golinkMatch) {
    const golinkName = golinkMatch[1];
    try {
      const response = await fetch(`http://localhost:3030/golinks/go/${golinkName}`);
      const data = await response.json();

      if (response.ok && data.url) {
        chrome.tabs.update(details.tabId, { url: data.url });
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
