// Check if we're in a service worker context
const isServiceWorker = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getManifest;

// Show error notification
async function showErrorNotification(errorCount) {
  if (!chrome?.notifications?.create) return;

  try {
    // Show system notification only for errors
    await chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Code Issues Detected',
      message: `Found ${errorCount} issue${errorCount > 1 ? 's' : ''}`,
      priority: 2,
      requireInteraction: true
    });

    // Update badge for errors
    if (chrome.action?.setBadgeText) {
      await chrome.action.setBadgeText({ text: String(errorCount) });
      await chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
    }
  } catch (error) {
    console.error('Error in showErrorNotification:', error);
  }
}

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['content1.js']
  });
});

// Message handling setup
if (chrome?.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      switch (message.action) {
        case "errorsFound":
          if (message.errorCount) {
            showErrorNotification(message.errorCount);
          }
          break;

        case "noErrors":
          // Just clear the badge, no notification
          if (chrome.action?.setBadgeText) {
            chrome.action.setBadgeText({ text: "" });
          }
          break;

        case "openStackOverflow":
          if (chrome.tabs?.create) {
            const url = `https://stackoverflow.com/search?q=${encodeURIComponent(message.query || '')}`;
            chrome.tabs.create({ url });
          }
          break;
      }
    } catch (error) {
      console.error('Error in message handler:', error);
    }
  });
}

// Error tracking
const errorLog = [];

function logError(error) {
  const entry = {
    timestamp: new Date().toISOString(),
    error: error?.message || String(error),
    stack: error?.stack
  };
  
  errorLog.push(entry);
  if (errorLog.length > 100) errorLog.shift();
  
  console.error('Extension Error:', entry);
}

// Error listener setup
if (chrome?.runtime?.onError) {
  chrome.runtime.onError.addListener((error) => {
    logError(error);
  });
}

// Export for service worker
if (isServiceWorker) {
  self.showErrorNotification = showErrorNotification;
  self.logError = logError;
}