import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// ==== API KEYS (put yours here directly) ====
// ⚠️ For personal use only — don’t expose these in public repos
const GOOGLE_KEY = "YOUR_GOOGLE_API_KEY";
const GOOGLE_CX = "YOUR_GOOGLE_CX";
const BRAVE_KEY  = "YOUR_BRAVE_API_KEY";
const BING_KEY   = "YOUR_BING_API_KEY";
const NAVER_ID   = "YOUR_NAVER_CLIENT_ID";
const NAVER_SECRET = "YOUR_NAVER_CLIENT_SECRET";

// Unified Search Route
app.get("/api/search", async (req, res) => {
  const { q, type = "web" } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });

  const results = [];
  const tasks = [];

  try {
    // === Google Search ===
    if (type === "web" && GOOGLE_KEY && GOOGLE_CX) {
      tasks.push(
        axios
          .get("https://www.googleapis.com/customsearch/v1", {
            params: { key: GOOGLE_KEY, cx: GOOGLE_CX, q }
          })
          .then(r => (r.data.items || []).map(i => ({
            title: i.title,
            link: i.link,
            snippet: i.snippet,
            source: "Google"
          })))
      );
    }

    // === Bing Web ===
    if (type === "web" && BING_KEY) {
      tasks.push(
        axios
          .get("https://api.bing.microsoft.com/v7.0/search", {
            headers: { "Ocp-Apim-Subscription-Key": BING_KEY },
            params: { q }
          })
          .then(r => (r.data.webPages?.value || []).map(i => ({
            title: i.name,
            link: i.url,
            snippet: i.snippet,
            source: "Bing"
          })))
      );
    }

    // === Brave Web ===
    if (type === "web" && BRAVE_KEY) {
      tasks.push(
        axios
          .get("https://api.search.brave.com/res/v1/web/search", {
            headers: { "X-Subscription-Token": BRAVE_KEY },
            params: { q }
          })
          .then(r => (r.data.web?.results || []).map(i => ({
            title: i.title,
            link: i.url,
            snippet: i.description,
            source: "Brave"
          })))
      );
    }

    // === Bing Images ===
    if (type === "images" && BING_KEY) {
      tasks.push(
        axios
          .get("https://api.bing.microsoft.com/v7.0/images/search", {
            headers: { "Ocp-Apim-Subscription-Key": BING_KEY },
            params: { q }
          })
          .then(r => (r.data.value || []).map(i => ({
            title: i.name,
            link: i.contentUrl,
            image: i.thumbnailUrl,
            source: "Bing Images"
          })))
      );
    }

    // === Brave Images ===
    if (type === "images" && BRAVE_KEY) {
      tasks.push(
        axios
          .get("https://api.search.brave.com/res/v1/images/search", {
            headers: { "X-Subscription-Token": BRAVE_KEY },
            params: { q }
          })
          .then(r => (r.data.results || []).map(i => ({
            title: i.title,
            link: i.url,
            image: i.thumbnail?.src,
            source: "Brave Images"
          })))
      );
    }

    // === Bing Videos ===
    if (type === "videos" && BING_KEY) {
      tasks.push(
        axios
          .get("https://api.bing.microsoft.com/v7.0/videos/search", {
            headers: { "Ocp-Apim-Subscription-Key": BING_KEY },
            params: { q }
          })
          .then(r => (r.data.value || []).map(i => ({
            title: i.name,
            link: i.contentUrl,
            image: i.thumbnailUrl,
            snippet: i.description,
            source: "Bing Videos"
          })))
      );
    }

    // === Brave Videos ===
    if (type === "videos" && BRAVE_KEY) {
      tasks.push(
        axios
          .get("https://api.search.brave.com/res/v1/videos/search", {
            headers: { "X-Subscription-Token": BRAVE_KEY },
            params: { q }
          })
          .then(r => (r.data.results || []).map(i => ({
            title: i.title,
            link: i.url,
            image: i.thumbnail?.src,
            snippet: i.description,
            source: "Brave Videos"
          })))
      );
    }

    // === News (Bing + Brave) ===
    if (type === "news" && BING_KEY) {
      tasks.push(
        axios
          .get("https://api.bing.microsoft.com/v7.0/news/search", {
            headers: { "Ocp-Apim-Subscription-Key": BING_KEY },
            params: { q }
          })
          .then(r => (r.data.value || []).map(i => ({
            title: i.name,
            link: i.url,
            snippet: i.description,
            source: "Bing News"
          })))
      );
    }

    if (type === "news" && BRAVE_KEY) {
      tasks.push(
        axios
          .get("https://api.search.brave.com/res/v1/news/search", {
            headers: { "X-Subscription-Token": BRAVE_KEY },
            params: { q }
          })
          .then(r => (r.data.results || []).map(i => ({
            title: i.title,
            link: i.url,
            snippet: i.description,
            source: "Brave News"
          })))
      );
    }

    // Execute all calls concurrently
    const responses = await Promise.all(tasks);
    const merged = responses.flat();

    // Deduplicate by link
    const unique = Array.from(new Map(merged.map(i => [i.link, i])).values());
    res.json(unique);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

// AI Summary — Shadow Chat
app.post("/api/summary", async (req, res) => {
  const { query } = req.body;
  try {
    const r = await axios.post("https://shadow-chat-a5f1.onrender.com/api/summary", { query });
    res.json(r.data);
  } catch {
    res.status(500).json({ error: "Shadow Chat offline or unreachable" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`💜 Shadow Search running → http://localhost:${PORT}`));
