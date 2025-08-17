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
        chrome.tabs.update(details.tabId, { url: "https://www.google.com" });
      }
    } catch (error) {
      console.error("Error fetching golink:", error);
      chrome.tabs.update(details.tabId, { url: "https://www.google.com" });
    }
  }
});
