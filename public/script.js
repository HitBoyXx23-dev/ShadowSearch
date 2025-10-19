const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const tabs = document.querySelectorAll("#tabs button");
const chatSection = document.getElementById("chatSection");
let activeType = "web";

// --- Detect ?q= from URL on load ---
window.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get("q");
  if (q) {
    input.value = q;
    runSearch(q);
  }
});

// --- Tab Switch ---
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeType = tab.dataset.type;
    resultsDiv.innerHTML = "";
    chatSection.classList.add("hidden");
    if (activeType === "chat") {
      chatSection.classList.remove("hidden");
      return;
    }
    if (input.value.trim()) runSearch(input.value.trim());
  };
});

btn.onclick = () => runSearch(input.value.trim());
input.addEventListener("keydown", e => e.key === "Enter" && runSearch(input.value.trim()));

async function runSearch(q) {
  if (!q) return;
  const newUrl = `${window.location.origin}?q=${encodeURIComponent(q)}`;
  window.history.pushState({}, "", newUrl);
  resultsDiv.innerHTML = `<p>Loading ${activeType} results...</p>`;

  if (activeType === "summary") {
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    const summary = data.slice(0, 5).map(r => "• " + r.title).join("<br>");
    resultsDiv.innerHTML = `<div class="result-card"><h3>🧠 Summary</h3><p>${summary}</p></div>`;
    return;
  }

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${activeType}`);
  const data = await res.json();

  if (!data.length) {
    resultsDiv.innerHTML = `<p>No results found.</p>`;
    return;
  }

  resultsDiv.innerHTML = data.map(r => `
    <div class="result-card">
      <a href="${r.link}" target="_blank" class="result-title">${r.title}</a>
      ${r.image ? `<img src="${r.image}" alt="${r.title}" style="width:100%;border-radius:10px;margin-top:5px;">` : ""}
      <p>${r.snippet || ""}</p>
      <span style="color:#7f3ff0;font-size:0.8em;">${r.source}</span>
    </div>
  `).join("");
}
