/* ===== Element References ===== */
const input = document.getElementById("searchInput");
const form = document.getElementById("searchForm");
const resultsDiv = document.getElementById("results");
const tabs = document.querySelectorAll("#tabs button");
const pagination = document.getElementById("pagination");
const pageNum = document.getElementById("pageNum");
const nextBtn = document.getElementById("nextPage");
const prevBtn = document.getElementById("prevPage");

const chatSection = document.getElementById("chatSection");
const bookmarkSection = document.getElementById("bookmarkSection");
const historySection = document.getElementById("historySection");
const settingsSection = document.getElementById("settingsSection");

const bookmarkList = document.getElementById("bookmarkList");
const historyList = document.getElementById("historyList");

/* Buttons */
const downloadBookmarks = document.getElementById("downloadBookmarks");
const clearBookmarks = document.getElementById("clearBookmarks");
const downloadHistory = document.getElementById("downloadHistory");
const clearHistory = document.getElementById("clearHistory");
const downloadSettings = document.getElementById("downloadSettings");
const resetAll = document.getElementById("resetAll");
const darkToggle = document.getElementById("darkModeToggle");
const safeSearch = document.getElementById("safeSearch");
const defaultTab = document.getElementById("defaultTab");

/* ===== Data ===== */
let activeType = "web";
let currentPage = 1;
let bookmarks = JSON.parse(localStorage.getItem("bookmarks") || "[]");
let historyData = JSON.parse(localStorage.getItem("history") || "[]");
let settings = JSON.parse(localStorage.getItem("settings") || "{}");

/* ===== Initialization ===== */
window.addEventListener("DOMContentLoaded", () => {
  const url = new URLSearchParams(window.location.search);
  const q = url.get("q");
  const p = url.get("page");
  if (p) currentPage = Number(p);
  if (q) {
    input.value = q;
    runSearch(q, currentPage);
  }
  applySettings();
  renderBookmarks();
  renderHistory();
});

/* ===== Tabs ===== */
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeType = tab.dataset.type;
    hideAllSections();
    if (activeType === "chat") chatSection.classList.remove("hidden");
    else if (activeType === "bookmarks") bookmarkSection.classList.remove("hidden");
    else if (activeType === "history") historySection.classList.remove("hidden");
    else if (activeType === "settings") settingsSection.classList.remove("hidden");
    else runSearch(input.value.trim(), 1);
  };
});

function hideAllSections() {
  chatSection.classList.add("hidden");
  bookmarkSection.classList.add("hidden");
  historySection.classList.add("hidden");
  settingsSection.classList.add("hidden");
  resultsDiv.innerHTML = "";
}

/* ===== Search Handling ===== */
form.addEventListener("submit", e => {
  e.preventDefault();
  runSearch(input.value.trim(), 1);
});

async function runSearch(q, page) {
  if (!q) return;
  currentPage = page;
  const newUrl = `${window.location.origin}?q=${encodeURIComponent(q)}&page=${page}`;
  window.history.pushState({}, "", newUrl);
  resultsDiv.innerHTML = `<p>Loading ${activeType} results...</p>`;
  pagination.classList.add("hidden");

  addHistory(q);

  if (activeType === "summary") {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const summary = data.slice(0, 5).map(r => "• " + r.title).join("<br>");
    resultsDiv.innerHTML = `<div class="result-card"><h3>🧠 Summary</h3><p>${summary}</p></div>`;
    return;
  }

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${activeType}&page=${page}`);
  const data = await res.json();
  if (!data.length) {
    resultsDiv.innerHTML = "<p>No results found.</p>";
    return;
  }

  if (activeType === "images") {
    resultsDiv.innerHTML = `
      <div class="image-grid">
        ${data.map(r =>
          r.image
            ? `<a href="${r.link}" target="_blank">
                 <img src="${r.image}" alt="${r.title || 'Image'}">
               </a>`
            : ""
        ).join("")}
      </div>`;
  } else {
    resultsDiv.innerHTML = data.map(r => `
      <div class="result-card">
        <a href="${r.link}" target="_blank" class="result-title">${r.title}</a>
        <p>${r.snippet || ""}</p>
        <small style="color:#7f3ff0;">${r.source}</small><br/>
        <button class="proxyView" data-link="${r.link}">🕸 Proxy View</button>
        <button class="addBookmark" data-link="${r.link}" data-title="${r.title}">⭐ Save</button>
      </div>`).join("");

    document.querySelectorAll(".addBookmark").forEach(b => {
      b.onclick = () => addBookmark({ title: b.dataset.title, link: b.dataset.link });
    });
    document.querySelectorAll(".proxyView").forEach(b => {
      b.onclick = () =>
        window.open(`/api/proxy?url=${encodeURIComponent(b.dataset.link)}`, "_blank");
    });
  }

  pagination.classList.remove("hidden");
  pageNum.textContent = currentPage;
}

nextBtn.onclick = () => runSearch(input.value.trim(), currentPage + 1);
prevBtn.onclick = () => {
  if (currentPage > 1) runSearch(input.value.trim(), currentPage - 1);
};

/* ===== Bookmarks ===== */
function addBookmark(item) {
  if (!bookmarks.some(b => b.link === item.link)) {
    bookmarks.push(item);
    saveBookmarks();
  }
}
function renderBookmarks() {
  bookmarkList.innerHTML =
    bookmarks.length === 0
      ? "<p>No bookmarks yet.</p>"
      : bookmarks.map(
          b => `<li>
            <a href="${b.link}" target="_blank">${b.title}</a>
            <button onclick="deleteBookmark('${b.link}')">🗑</button>
          </li>`
        ).join("");
}
function deleteBookmark(link) {
  bookmarks = bookmarks.filter(b => b.link !== link);
  saveBookmarks();
}
clearBookmarks.onclick = () => {
  if (confirm("Delete all bookmarks?")) {
    bookmarks = [];
    saveBookmarks();
  }
};
downloadBookmarks.onclick = () => {
  downloadJSON(bookmarks, "shadow-bookmarks.json");
};
function saveBookmarks() {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
  renderBookmarks();
}

/* ===== History ===== */
function addHistory(query) {
  const entry = { query, time: new Date().toLocaleString() };
  historyData.unshift(entry);
  historyData = historyData.slice(0, 50);
  localStorage.setItem("history", JSON.stringify(historyData));
  renderHistory();
}
function renderHistory() {
  historyList.innerHTML =
    historyData.length === 0
      ? "<p>No searches yet.</p>"
      : historyData
          .map(
            h => `<li>
              <button class="historyRun" data-query="${h.query}">🔍 ${h.query}</button>
              <span style="font-size:0.8em;color:#888;">${h.time}</span>
              <button onclick="deleteHistory('${h.query}')">🗑</button>
            </li>`
          )
          .join("");
  document.querySelectorAll(".historyRun").forEach(btn => {
    btn.onclick = () => {
      input.value = btn.dataset.query;
      runSearch(btn.dataset.query, 1);
    };
  });
}
function deleteHistory(q) {
  historyData = historyData.filter(h => h.query !== q);
  saveHistory();
}
clearHistory.onclick = () => {
  if (confirm("Clear entire history?")) {
    historyData = [];
    saveHistory();
  }
};
downloadHistory.onclick = () => downloadJSON(historyData, "shadow-history.json");
function saveHistory() {
  localStorage.setItem("history", JSON.stringify(historyData));
  renderHistory();
}

/* ===== Settings ===== */
function applySettings() {
  if (settings.dark === false) document.body.classList.add("light");
  darkToggle.checked = settings.dark !== false;
  safeSearch.checked = !!settings.safe;
  if (settings.defaultTab) defaultTab.value = settings.defaultTab;
}

darkToggle.onchange = saveSettings;
safeSearch.onchange = saveSettings;
defaultTab.onchange = saveSettings;

downloadSettings.onclick = () => downloadJSON(settings, "shadow-settings.json");

resetAll.onclick = () => {
  if (confirm("Reset all data (bookmarks, history, settings)?")) {
    localStorage.clear();
    location.reload();
  }
};

function saveSettings() {
  settings = {
    dark: darkToggle.checked,
    safe: safeSearch.checked,
    defaultTab: defaultTab.value
  };
  localStorage.setItem("settings", JSON.stringify(settings));
  applySettings();
}

/* ===== Helpers ===== */
function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

/* ===== End ===== */
console.log("💜 Shadow Search Ultimate ready.");
