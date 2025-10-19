import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const GOOGLE_KEY = "AIzaSyBRgF-ld8IYZ-6aDucPZxrHvqyulTB6VPc";
const GOOGLE_CX  = "e548168d0afe5452f";
const SEARX_URL  = "https://searx.be";

// unified search
app.get("/api/search", async (req, res) => {
  const { q, type = "web", page = 1 } = req.query;
  if (!q) return res.status(400).json({ error: "Missing query" });
  const start = (page - 1) * 10 + 1;
  const tasks = [];

  tasks.push(
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
  );

  tasks.push(
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
    const responses = await Promise.all(tasks);
    const merged = responses.flat();
    const unique = Array.from(new Map(merged.map(r => [r.link, r])).values());
    res.json(unique);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = 3000;
app.listen(PORT, () =>
  console.log(`💜 Shadow Search running → http://localhost:${PORT}`)
);
