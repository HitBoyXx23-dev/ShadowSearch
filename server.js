import express from "express";
import axios from "axios";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ==== CONFIG (public demo keys — replace for production) ====
const GOOGLE_KEY = "AIzaSyBRgF-ld8IYZ-6aDucPZxrHvqyulTB6VPc";
const GOOGLE_CX  = "e548168d0afe5452f";
const SEARX_URL  = "https://searx.be";

// ==== SEARCH ENDPOINT ====
app.get("/api/search", async (req, res) => {
  const { q, type = "web", page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });
  const start = (page - 1) * 10 + 1;

  console.log(`🔎  ShadowSearch → [${type}] "${q}" (page ${page})`);

  const calls = [
    // Google
    axios
      .get("https://www.googleapis.com/customsearch/v1", {
        params: {
          key: GOOGLE_KEY,
          cx: GOOGLE_CX,
          q,
          searchType: type === "images" ? "image" : undefined,
          start,
        },
      })
      .then(r =>
        (r.data.items || []).map(i => ({
          title: i.title,
          link: i.link,
          snippet: i.snippet || "",
          image: i.pagemap?.cse_image?.[0]?.src || null,
          source: "Google",
        }))
      )
      .catch(() => [])
  ];

  // SearXNG
  calls.push(
    axios
      .get(`${SEARX_URL}/search`, {
        params: {
          q,
          format: "json",
          categories: type === "images" ? "images" : "general",
          pageno: page,
        },
      })
      .then(r =>
        (r.data.results || []).map(i => ({
          title: i.title,
          link: i.url,
          snippet: i.content || "",
          image: i.img_src || null,
          source: "SearXNG",
        }))
      )
      .catch(() => [])
  );

  try {
    const results = (await Promise.all(calls)).flat();
    const unique = Array.from(new Map(results.map(r => [r.link, r])).values());
    res.json(unique);
  } catch (err) {
    console.error("❌  Search failed:", err.message);
    res.status(500).json({ error: "Search failed." });
  }
});

// ==== PROXY VIEWER ====
app.get("/api/proxy", (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send("Missing URL");

  res.send(`
    <!DOCTYPE html><html><head>
    <title>Shadow Proxy – ${url}</title>
    <style>
      html,body{margin:0;height:100%;background:#000;color:#fff;}
      iframe{width:100%;height:100%;border:none;}
      #bar{position:fixed;top:0;left:0;width:100%;background:#111;
           padding:8px;color:#aaa;z-index:99;font-family:sans-serif;}
      #bar a{color:#7f3ff0;text-decoration:none;margin-left:1rem;}
    </style></head>
    <body>
      <div id="bar">
        Proxy View: ${url}
        <a href="${url}" target="_blank">Open Directly</a>
        <a href="/" style="float:right">✖ Close</a>
      </div>
      <iframe src="${url}"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
    </body></html>
  `);
});

// ==== START SERVER ====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`💜 Shadow Search Ultimate → http://localhost:${PORT}`)
);
