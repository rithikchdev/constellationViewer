import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { spawn } from "child_process";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const allowedOrigins = [
  "https://your-app-name.netlify.app" 
];
app.use(
  cors({
    origin: (origin, callback) => {
      
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("CORS policy violation"));
    },
    methods: ["GET", "POST"],
  })
);
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


const computeSkyfield = (lat, lon) => {
  return new Promise((resolve, reject) => {
    const python = spawn("python", ["compute_sky.py", lat.toString(), lon.toString()]);
    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    python.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        return reject(new Error(`Skyfield script failed: ${errorOutput}`));
      }
      try {
        resolve(JSON.parse(output));
      } catch (err) {
        reject(err);
      }
    });
  });
};


const fetchWikimediaImage = async (query) => {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrnamespace=6&gsrlimit=1&gsrsearch=${encodeURIComponent(query + " constellation")}&prop=imageinfo&iiprop=url`;
    const res = await fetch(searchUrl, { headers: { "User-Agent": "CelestialTracker/1.0" } });
    const data = await res.json();
    const pages = data?.query?.pages;
    if (pages) {
      const firstPage = Object.values(pages)[0];
      return firstPage?.imageinfo?.[0]?.url || null;
    }
    return null;
  } catch {
    return null;
  }
};


const fetchUnsplashImage = async (query) => {
  if (!process.env.UNSPLASH_ACCESS_KEY) return null;
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + " night sky")}&per_page=1&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    const data = await res.json();
    return data?.results?.[0]?.urls?.regular || null;
  } catch {
    return null;
  }
};

app.post("/api/sky-view", async (req, res) => {
  try {
    const { latitude, longitude, timezone } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    
    const visibleTargets = await computeSkyfield(latitude, longitude);

    // 2. Fetch images in parallel
    const enrichedTargets = await Promise.all(
      visibleTargets.map(async (target) => {
        let imageUrl = await fetchWikimediaImage(target.name);
        let imageSource = "Wikimedia Commons";

        if (!imageUrl) {
          imageUrl = await fetchUnsplashImage(target.name);
          imageSource = "Unsplash";
        }

        return {
          ...target,
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=600&auto=format&fit=crop&q=80",
          imageSource: imageUrl ? imageSource : "Stock Astrophotography"
        };
      })
    );

    
    let geminiGuide = "Look upward toward the directions indicated on each constellation card.";
    if (visibleTargets.length > 0) {
      const prompt = `
The observer is located at Latitude: ${latitude}, Longitude: ${longitude} (${timezone}).
The following constellations are verified above their local horizon right now:
${JSON.stringify(visibleTargets, null, 2)}

Provide a concise, vivid stargazing guide:
1. Advise which 2 constellations are easiest to find first, stating the compass direction to face.
2. Provide a 1-sentence historical or mythological detail for each.
3. Keep the tone inspiring and direct.`;

      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt
      });

      geminiGuide = aiResponse.text;
    }

    res.json({
      location: { latitude, longitude, timezone },
      visibleConstellations: enrichedTargets,
      geminiGuide
    });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Celestial backend active on port ${PORT}`);
});