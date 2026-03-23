// Background service worker - updates the toolbar badge with pending task count

const STORAGE_KEY = "tasks";

function updateBadge(tasks) {
  const count = tasks.filter((t) => t.status === "pending").length;
  const text = count === 0 ? "" : count > 99 ? "+99" : String(count);
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: "#ff5945" });
}

// Update badge whenever storage changes (covers popup edits)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync" || !changes[STORAGE_KEY]) return;
  updateBadge(changes[STORAGE_KEY].newValue || []);
});

// Set badge on browser startup / extension install
chrome.runtime.onStartup.addListener(async () => {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  updateBadge(result[STORAGE_KEY] || []);
});

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.sync.get(STORAGE_KEY);
  updateBadge(result[STORAGE_KEY] || []);
});
