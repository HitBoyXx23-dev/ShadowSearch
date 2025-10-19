const apiBase = ""; // same origin
const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const tabs = document.querySelectorAll("#tabs button");

let activeType = "web";

tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeType = tab.dataset.type;
    if (input.value.trim()) runSearch();
  };
});

btn.onclick = runSearch;
input.addEventListener("keydown", e => e.key === "Enter" && runSearch());

async function runSearch() {
  const q = input.value.trim();
  if (!q) return;
  resultsDiv.innerHTML = `<p>🔍 Searching the shadows...</p>`;

  try {
    if (activeType === "summary") {
      const res = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      resultsDiv.innerHTML = `<div class="result-card"><h3>🧠 AI Summary</h3><p>${data.summary || "No summary."}</p></div>`;
      return;
    }

    const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await r.json();
    if (!data.length) {
      resultsDiv.innerHTML = `<p>No results found.</p>`;
      return;
    }

    resultsDiv.innerHTML = data
      .map(
        x => `
        <div class="result-card">
          <a href="${x.link}" target="_blank">${x.title}</a>
          <p>${x.snippet || ""}</p>
          <span style="color:#7f3ff0;font-size:0.8em;">${x.source}</span>
        </div>`
      )
      .join("");
  } catch {
    resultsDiv.innerHTML = `<p>⚠️ Error fetching results.</p>`;
  }
}
