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
  resultsDiv.innerHTML = `<p>Loading ${activeType} results...</p>`;

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

  const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${activeType}`);
  const data = await res.json();

  if (!data.length) {
    resultsDiv.innerHTML = `<p>No results.</p>`;
    return;
  }

  resultsDiv.innerHTML = data
    .map(r => {
      if (activeType === "images" || activeType === "videos") {
        return `
          <div class="result-card">
            <a href="${r.link}" target="_blank"><img src="${r.image || ""}" alt="${r.title}" style="width:100%;border-radius:10px;"/></a>
            <a href="${r.link}" target="_blank">${r.title}</a>
            <p>${r.source}</p>
          </div>`;
      }
      return `
        <div class="result-card">
          <a href="${r.link}" target="_blank">${r.title}</a>
          <p>${r.snippet || ""}</p>
          <span style="color:#7f3ff0;font-size:0.8em;">${r.source}</span>
        </div>`;
    })
    .join("");
}
