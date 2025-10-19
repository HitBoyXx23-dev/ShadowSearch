import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// === Hard-coded API keys ===
// ⚠️ (for demo only — replace with your real ones before deploying)
const GOOGLE_KEY = "YOUR_GOOGLE_KEY";
const GOOGLE_CX = "YOUR_GOOGLE_CX";
const BRAVE_KEY  = "YOUR_BRAVE_KEY";
const BING_KEY   = "YOUR_BING_KEY";
const NAVER_ID   = "YOUR_NAVER_CLIENT_ID";
const NAVER_SECRET = "YOUR_NAVER_CLIENT_SECRET";

// === Search endpoint ===
app.get("/api/search", async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: "missing query" });

  const results = [];

  try {
    // Google
    if (GOOGLE_KEY && GOOGLE_CX) {
      const g = await axios.get("https://www.googleapis.com/customsearch/v1", {
        params: { key: GOOGLE_KEY, cx: GOOGLE_CX, q }
      });
      g.data.items?.forEach(i => results.push({
        title: i.title,
        link: i.link,
        snippet: i.snippet,
        source: "Google"
      }));
    }

    // Brave
    if (BRAVE_KEY) {
      const b = await axios.get("https://api.search.brave.com/res/v1/web/search", {
        headers: { "X-Subscription-Token": BRAVE_KEY },
        params: { q }
      });
      b.data.web?.results?.forEach(i => results.push({
        title: i.title,
        link: i.url,
        snippet: i.description,
        source: "Brave"
      }));
    }

    // Bing
    if (BING_KEY) {
      const bing = await axios.get("https://api.bing.microsoft.com/v7.0/search", {
        headers: { "Ocp-Apim-Subscription-Key": BING_KEY },
        params: { q }
      });
      bing.data.webPages?.value?.forEach(i => results.push({
        title: i.name,
        link: i.url,
        snippet: i.snippet,
        source: "Bing"
      }));
    }

    // DuckDuckGo
    const ddg = await axios.get("https://api.duckduckgo.com/", {
      params: { q, format: "json" }
    });
    if (ddg.data.AbstractText) {
      results.push({
        title: ddg.data.Heading || q,
        link: ddg.data.AbstractURL || "",
        snippet: ddg.data.AbstractText,
        source: "DuckDuckGo"
      });
    }

    // Naver
    if (NAVER_ID && NAVER_SECRET) {
      const naver = await axios.get("https://openapi.naver.com/v1/search/webkr.json", {
        headers: {
          "X-Naver-Client-Id": NAVER_ID,
          "X-Naver-Client-Secret": NAVER_SECRET
        },
        params: { query: q }
      });
      naver.data.items?.forEach(i => results.push({
        title: i.title.replace(/<[^>]+>/g, ""),
        link: i.link,
        snippet: i.description,
        source: "Naver"
      }));
    }

    // Deduplicate
    const unique = Array.from(new Map(results.map(r => [r.link, r])).values());
    res.json(unique);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// === AI Summary via Shadow Chat ===
app.post("/api/summary", async (req, res) => {
  const { query } = req.body;
  try {
    const r = await axios.post("https://shadow-chat-a5f1.onrender.com/api/summary", { query });
    res.json(r.data);
  } catch {
    res.status(500).json({ error: "Shadow Chat API failed" });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🌑 Shadow Search running on http://localhost:${PORT}`));
