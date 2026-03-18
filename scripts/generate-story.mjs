// AI Story Generator — Uses Gemini 2.0 Flash (free) to produce cinematic story scripts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const OUTPUT_PATH = resolve(ROOT, 'public', 'story.json');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const TOPIC = process.env.STORY_TOPIC || 'A mysterious traveler discovers a hidden world beneath the ocean';

const PROMPT = `You are a world-class anime director like Makoto Shinkai (Your Name) and Hayao Miyazaki (Spirited Away). Create a **deeply emotional, meaningful** story for a 60-90 second vertical 2D animated video.

TOPIC: "${TOPIC}"

The story MUST make viewers FEEL something powerful. It needs:
- A clear character arc (the character must change/grow through the story)
- An emotional hook in the first 5 seconds
- Rising tension or mystery that builds
- A powerful climax moment that gives viewers chills
- A satisfying ending with a universal message about life/love/courage/hope

Return ONLY valid JSON (no markdown, no backticks, no explanation):

{
  "title": "Emotional, catchy title (max 8 words)",
  "genre": "one of: fantasy, scifi, mystery, adventure, romance, horror, comedy, drama",
  "mood": "overall mood in 2-3 words",
  "colorPalette": {
    "primary": "#hex — sky/upper color (vivid, cinematic)",
    "secondary": "#hex — horizon/lower color",
    "accent": "#hex — highlights, glows, magic",
    "background": "#hex — deep background",
    "text": "#FFFFFF"
  },
  "scenes": [
    {
      "id": 1,
      "title": "Scene title (3-5 words)",
      "narration": "2-3 sentences of dramatic, emotional narration (~20-30 words). Write like a movie trailer — use rhythm, pauses, emotion. Every word must count.",
      "mood": "one of: peaceful, tense, joyful, mysterious, dramatic, melancholic, epic, romantic",
      "background": {
        "type": "gradient",
        "primaryColor": "#hex — sky color for this scene",
        "secondaryColor": "#hex — ground/horizon color",
        "accentColor": "#hex — light/glow color",
        "elements": ["MUST use 2-3 of these keywords: mountains, forest, trees, ocean, river, city, buildings, stars, moon, sun, sunrise, sunset, clouds, storm, snow, flowers, garden, ruins, castle, night sky, dark forest, hills, lake"],
        "lightingDirection": "one of: left, right, center, top"
      },
      "characters": [
        {
          "id": "unique_id",
          "name": "Character first name",
          "emotion": "one of: neutral, happy, surprised, sad, angry, thinking, excited, scared",
          "pose": "one of: idle, talking, walking, pointing, sitting, celebrating",
          "position": "one of: left, center, right",
          "scale": 1.0
        }
      ],
      "camera": "one of: zoomIn, zoomOut, panLeft, panRight, panUp, panDown, slowPush, static",
      "transition": "one of: fade, wipe, zoom, dissolve, flash, glitch",
      "colorGrade": "one of: warm, cool, neon, desaturated, golden, midnight",
      "particles": "one of: dust, sparkles, snow, embers, rain, orbs, stars, none",
      "ambientSfx": "one of: rain, wind, crowd, night, forest, ocean, fire, silence"
    }
  ],
  "outro": {
    "text": "A profound, memorable closing line that captures the story's universal theme",
    "cta": "Follow for more stories ✨"
  }
}

CRITICAL RULES:
- Create exactly 6 scenes with COMPLETE story arc: hook → build → twist → climax → aftermath → resolution
- Each scene narration: 2-3 sentences, ~20-30 words — emotional and dramatic
- VARY the environments! Each scene should have DIFFERENT background elements (don't repeat the same scene)
- Background "elements" array MUST use real nature/environment keywords from the list above
- Use at least 2-3 environment keywords per scene (e.g., ["mountains", "sunset", "clouds"])
- Each scene needs a DIFFERENT mood, camera movement, and color grade
- Characters must show clear emotional progression across scenes
- Include 1-3 characters with distinct names
- Color palettes: vivid, cinematic — Makoto Shinkai style (dramatic skies, warm golden tones)
- The story should deliver a UNIVERSAL theme people connect with
- Make it viral-worthy — the kind of story people share because it moved them
- Return ONLY the JSON, no other text`;

// Rate limiter: max 2 API calls per minute (Gemini free tier safety)
const RATE_LIMIT_DELAY_MS = 35000; // 35 seconds between calls = max ~1.7 calls/min

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function generateStory() {
  console.log('🎬 Generating cinematic story...');
  console.log(`📝 Topic: "${TOPIC}"`);
  console.log(`⏱️ Rate limit: max 2 Gemini API calls per minute (${RATE_LIMIT_DELAY_MS / 1000}s cooldown between retries)`);

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    },
  });

  let story;
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    attempts++;

    // Rate limit: wait before retry (skip wait on first attempt)
    if (attempts > 1) {
      console.log(`⏳ Rate limit cooldown: waiting ${RATE_LIMIT_DELAY_MS / 1000}s before retry...`);
      await sleep(RATE_LIMIT_DELAY_MS);
    }

    try {
      console.log(`🔄 Attempt ${attempts}/${maxAttempts}...`);
      const result = await model.generateContent(PROMPT);
      const text = result.response.text();

      // Clean up response — remove markdown code blocks if present
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      story = JSON.parse(cleaned);

      // Validate basic structure
      if (!story.title || !story.scenes || story.scenes.length < 4) {
        throw new Error('Invalid story structure — missing title or insufficient scenes');
      }

      console.log(`✅ Story generated: "${story.title}"`);
      console.log(`🎭 Genre: ${story.genre} | Mood: ${story.mood}`);
      console.log(`🎬 Scenes: ${story.scenes.length}`);
      break;
    } catch (error) {
      console.error(`⚠️ Attempt ${attempts} failed: ${error.message}`);

      // If rate-limited by Google, wait extra
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        console.log(`🚦 Rate limit hit! Waiting 60s before next attempt...`);
        await sleep(60000);
      }

      if (attempts >= maxAttempts) {
        console.error('❌ All attempts failed. Using fallback story.');
        story = getFallbackStory();
      }
    }
  }

  // Ensure output directory exists
  const outDir = dirname(OUTPUT_PATH);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  writeFileSync(OUTPUT_PATH, JSON.stringify(story, null, 2));
  console.log(`💾 Story saved to: ${OUTPUT_PATH}`);
  return story;
}

function getFallbackStory() {
  return {
    title: "The Last Light of Avalon",
    genre: "fantasy",
    mood: "mysterious and epic",
    colorPalette: {
      primary: "#6C3CE1",
      secondary: "#1A1A2E",
      accent: "#FFD700",
      background: "#0A0A1A",
      text: "#FFFFFF"
    },
    scenes: [
      {
        id: 1,
        title: "The Ancient Prophecy",
        narration: "In a world where light was fading, one soul carried the last spark of hope. They didn't know it yet, but their journey would change everything.",
        mood: "mysterious",
        background: { type: "gradient", primaryColor: "#1A1A2E", secondaryColor: "#16213E", accentColor: "#6C3CE1", elements: ["mountains", "stars", "night sky"], lightingDirection: "center" },
        characters: [{ id: "hero", name: "Aria", emotion: "thinking", pose: "idle", position: "center", scale: 1.0 }],
        camera: "slowPush", transition: "fade", colorGrade: "midnight", particles: "dust", ambientSfx: "wind"
      },
      {
        id: 2,
        title: "The Journey Begins",
        narration: "Aria stepped through the ancient gate, leaving behind everything she knew. The path ahead shimmered with an otherworldly glow.",
        mood: "dramatic",
        background: { type: "gradient", primaryColor: "#0F3460", secondaryColor: "#533483", accentColor: "#E94560", elements: ["ruins", "moon", "hills"], lightingDirection: "left" },
        characters: [{ id: "hero", name: "Aria", emotion: "excited", pose: "walking", position: "left", scale: 1.0 }],
        camera: "panRight", transition: "dissolve", colorGrade: "cool", particles: "sparkles", ambientSfx: "night"
      },
      {
        id: 3,
        title: "The Guardian's Test",
        narration: "A towering figure emerged from the shadows. 'Only those who carry true light may pass,' the Guardian whispered. Aria's heart raced.",
        mood: "tense",
        background: { type: "gradient", primaryColor: "#2C003E", secondaryColor: "#512B58", accentColor: "#FE346E", elements: ["dark forest", "trees", "moon"], lightingDirection: "right" },
        characters: [
          { id: "hero", name: "Aria", emotion: "scared", pose: "idle", position: "left", scale: 0.9 },
          { id: "guardian", name: "The Guardian", emotion: "neutral", pose: "pointing", position: "right", scale: 1.2 }
        ],
        camera: "zoomIn", transition: "flash", colorGrade: "desaturated", particles: "embers", ambientSfx: "forest"
      },
      {
        id: 4,
        title: "The Hidden Power",
        narration: "Deep within herself, Aria found what she had always carried — a light that could never be extinguished. It burst forth like a supernova.",
        mood: "epic",
        background: { type: "gradient", primaryColor: "#FFD700", secondaryColor: "#FF6B35", accentColor: "#FFFFFF", elements: ["mountains", "sunrise", "clouds"], lightingDirection: "center" },
        characters: [{ id: "hero", name: "Aria", emotion: "excited", pose: "celebrating", position: "center", scale: 1.1 }],
        camera: "zoomOut", transition: "glitch", colorGrade: "golden", particles: "sparkles", ambientSfx: "silence"
      },
      {
        id: 5,
        title: "The World Reborn",
        narration: "Light cascaded across the land like a golden wave. Mountains glowed, rivers sparkled, and the sky burst into a symphony of color.",
        mood: "joyful",
        background: { type: "gradient", primaryColor: "#00B4D8", secondaryColor: "#90E0EF", accentColor: "#FFD700", elements: ["flowers", "river", "mountains", "clouds"], lightingDirection: "top" },
        characters: [{ id: "hero", name: "Aria", emotion: "happy", pose: "celebrating", position: "center", scale: 1.0 }],
        camera: "panUp", transition: "dissolve", colorGrade: "warm", particles: "orbs", ambientSfx: "ocean"
      },
      {
        id: 6,
        title: "The New Dawn",
        narration: "And so Aria stood at the edge of a new world, knowing that the light within her would never fade. This was just the beginning.",
        mood: "peaceful",
        background: { type: "gradient", primaryColor: "#FF6B6B", secondaryColor: "#FFA07A", accentColor: "#FFE66D", elements: ["sunrise", "ocean", "city"], lightingDirection: "center" },
        characters: [{ id: "hero", name: "Aria", emotion: "happy", pose: "idle", position: "center", scale: 1.0 }],
        camera: "slowPush", transition: "fade", colorGrade: "golden", particles: "stars", ambientSfx: "ocean"
      }
    ],
    outro: {
      text: "Every soul carries a light waiting to be discovered.",
      cta: "Follow for more stories that move your soul ✨"
    }
  };
}

generateStory().catch(console.error);
