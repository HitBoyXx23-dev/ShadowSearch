const input = document.getElementById("searchInput");
const btn = document.getElementById("searchBtn");
const resultsDiv = document.getElementById("results");
const tabs = document.querySelectorAll("#tabs button");
const chatSection = document.getElementById("chatSection");
const chatWindow = document.getElementById("chatWindow");
const chatInput = document.getElementById("chatMessage");
const sendChatBtn = document.getElementById("sendChat");

const viewerOverlay = document.getElementById("viewerOverlay");
const viewerFrame = document.getElementById("viewerFrame");
const viewerLink = document.getElementById("viewerLink");
const closeViewer = document.getElementById("closeViewer");

let activeType = "web";

// detect ?q= query param
window.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const q = urlParams.get("q");
  if (q) {
    input.value = q;
    runSearch(q);
  }
});

// tab switching
tabs.forEach(tab => {
  tab.onclick = () => {
    tabs.forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    activeType = tab.dataset.type;
    resultsDiv.innerHTML = "";
    chatSection.classList.add("hidden");
    if (activeType === "chat") {
      chatSection.classList.remove("hidden");
      loadChat();
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
    resultsDiv.innerHTML = `<p>No results.</p>`;
    return;
  }

  resultsDiv.innerHTML = data.map(r => `
    <div class="result-card" data-link="${r.link}">
      <h3>${r.title}</h3>
      ${r.image ? `<img src="${r.image}" alt="${r.title}" style="width:100%;border-radius:10px;">` : ""}
      <p>${r.snippet || ""}</p>
      <span style="color:#7f3ff0;font-size:0.8em;">${r.source}</span>
    </div>
  `).join("");

  document.querySelectorAll(".result-card").forEach(card => {
    card.addEventListener("click", () => {
      const link = card.dataset.link;
      viewerOverlay.classList.remove("hidden");
      viewerFrame.src = link;
      viewerLink.href = link;
    });
  });
}

// internal viewer close
closeViewer.addEventListener("click", () => {
  viewerOverlay.classList.add("hidden");
  viewerFrame.src = "";
});

// chat
async function loadChat() {
  try {
    const res = await fetch("https://shadow-chat-a5f1.onrender.com/api/messages");
    const data = await res.json();
    chatWindow.innerHTML = data.map(m => `<div><b>${m.username}:</b> ${m.text}</div>`).join("");
  } catch {
    chatWindow.innerHTML = "<p>⚠️ Unable to load chat.</p>";
  }
}

sendChatBtn.onclick = async () => {
  const text = chatInput.value.trim();
  if (!text) return;
  await fetch("https://shadow-chat-a5f1.onrender.com/api/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Guest", text })
  });
  chatInput.value = "";
  loadChat();
};
