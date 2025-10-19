// ======== SHADOW SEARCH SERVER ========
// 🔮 Meta search engine by HitBoy
// Aggregates Google + DuckDuckGo + Startpage + SearXNG
// Serves static frontend and JSON API

import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// === CONFIG ===
const GOOGLE_KEY = "AIzaSyBRgF-ld8IYZ-6aDucPZxrHvqyulTB6VPc";
const GOOGLE_CX  = "e548168d0afe5452f";
const SEARX_URL  = "https://searx.be"; // public instance

// === SEARCH ROUTE ===
app.get("/api/search", async (req, res) => {
  const { q, type = "web" } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });

  const tasks = [];

  try {
    // === GOOGLE ===
    if (GOOGLE_KEY && GOOGLE_CX) {
      tasks.push(
        axios
          .get("https://www.googleapis.com/customsearch/v1", {
            params: {
              key: GOOGLE_KEY,
              cx: GOOGLE_CX,
              q,
              searchType: type === "images" ? "image" : undefined,
            },
          })
          .then((r) =>
            (r.data.items || []).map((i) => ({
              title: i.title,
              link: i.link,
              snippet: i.snippet || "",
              image: i.pagemap?.cse_thumbnail?.[0]?.src || null,
              source: "Google",
            }))
          )
          .catch(() => [])
      );
    }

    // === DUCKDUCKGO ===
    tasks.push(
      axios
        .get("https://api.duckduckgo.com/", {
          params: { q, format: "json", no_html: 1, skip_disambig: 1 },
        })
        .then((r) => {
          const data = r.data;
          const out = [];
          if (data.AbstractText) {
            out.push({
              title: data.Heading || q,
              link: data.AbstractURL || "",
              snippet: data.AbstractText,
              source: "DuckDuckGo",
            });
          }
          if (Array.isArray(data.RelatedTopics)) {
            data.RelatedTopics.slice(0, 5).forEach((t) => {
              if (t.Text && t.FirstURL) {
                out.push({
                  title: t.Text,
                  link: t.FirstURL,
                  snippet: t.Text,
                  source: "DuckDuckGo",
                });
              }
            });
          }
          return out;
        })
        .catch(() => [])
    );

    // === STARTPAGE ===
    tasks.push(
      axios
        .get("https://api.startpage.com/do/search", {
          params: { q, format: "json" },
        })
        .then((r) => {
          const items = r.data?.results || [];
          return items.map((i) => ({
            title: i.title || i.url,
            link: i.url,
            snippet: i.description || "",
            source: "Startpage",
          }));
        })
        .catch(() => [])
    );

    // === SEARXNG ===
    tasks.push(
      axios
        .get(`${SEARX_URL}/search`, {
          params: {
            q,
            format: "json",
            categories: type === "images" ? "images" : "general",
          },
        })
        .then((r) =>
          (r.data.results || []).map((i) => ({
            title: i.title,
            link: i.url,
            snippet: i.content || "",
            image: i.img_src || null,
            source: "SearXNG",
          }))
        )
        .catch(() => [])
    );

    const responses = await Promise.all(tasks);
    const merged = responses.flat();

    // Deduplicate by link
    const unique = Array.from(new Map(merged.map((r) => [r.link, r])).values());

    res.json(unique);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).json({ error: "Search failed." });
  }
});

// === SUMMARY ROUTE (non-AI) ===
app.post("/api/summary", (req, res) => {
  const { query, results = [] } = req.body;
  if (!query) return res.status(400).json({ error: "Missing query" });

  const top = results.slice(0, 5);
  const summary =
    top.length > 0
      ? `Summary of top results for "${query}": ${top
          .map((r) => r.title)
          .join(", ")}.`
      : `No results to summarize for "${query}".`;

  res.json({ summary });
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(
    `💜 Shadow Search running → http://localhost:${PORT} (Google + DuckDuckGo + Startpage + SearXNG)`
  )
);
