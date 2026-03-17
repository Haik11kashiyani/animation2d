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

const PROMPT = `You are a world-class animation director and screenwriter. Create a complete cinematic story for a 60-90 second vertical 2D animation video.

TOPIC: "${TOPIC}"

You must return ONLY a valid JSON object (no markdown, no backticks, no explanation) with this exact schema:

{
  "title": "Catchy, viral-worthy title (max 8 words)",
  "genre": "one of: fantasy, scifi, mystery, adventure, romance, horror, comedy, drama",
  "mood": "overall mood description in 2-3 words",
  "colorPalette": {
    "primary": "#hex color — dominant color",
    "secondary": "#hex color — supporting color",
    "accent": "#hex for highlights/glows",
    "background": "#hex for deep background",
    "text": "#hex for text (high contrast)"
  },
  "scenes": [
    {
      "id": 1,
      "title": "Scene title (3-5 words)",
      "narration": "The narration text to be spoken aloud (2-3 engaging sentences, ~15-25 words). Write dramatically with pauses.",
      "mood": "one of: peaceful, tense, joyful, mysterious, dramatic, melancholic, epic, romantic",
      "background": {
        "type": "gradient",
        "primaryColor": "#hex",
        "secondaryColor": "#hex",
        "accentColor": "#hex",
        "elements": ["element1", "element2"],
        "lightingDirection": "one of: left, right, center, top"
      },
      "characters": [
        {
          "id": "char1",
          "name": "Character name",
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
    "text": "A memorable closing line (1 sentence)",
    "cta": "Engaging call-to-action text"
  }
}

IMPORTANT RULES:
- Create exactly 6 scenes that tell a complete, engaging story arc (setup → rising action → climax → resolution)
- Each scene narration should be 2-3 sentences, dramatic and engaging
- Vary the camera movements, transitions, particles across scenes for visual variety
- Use different character emotions/poses per scene to show progression
- Make color palettes vivid and cinematic — think Pixar/Studio Ghibli vibes
- Background elements should be descriptive (e.g., "towering mountains", "glowing crystals", "dark storm clouds")
- Include 1-3 characters in the story
- Make it viral-worthy — emotional, unexpected, visually stunning
- Return ONLY the JSON, no other text`;

async function generateStory() {
  console.log('🎬 Generating cinematic story...');
  console.log(`📝 Topic: "${TOPIC}"`);

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
        background: { type: "gradient", primaryColor: "#1A1A2E", secondaryColor: "#16213E", accentColor: "#6C3CE1", elements: ["distant mountains", "fading stars"], lightingDirection: "center" },
        characters: [{ id: "hero", name: "Aria", emotion: "thinking", pose: "idle", position: "center", scale: 1.0 }],
        camera: "slowPush", transition: "fade", colorGrade: "midnight", particles: "dust", ambientSfx: "wind"
      },
      {
        id: 2,
        title: "The Journey Begins",
        narration: "Aria stepped through the ancient gate, leaving behind everything she knew. The path ahead shimmered with an otherworldly glow.",
        mood: "dramatic",
        background: { type: "gradient", primaryColor: "#0F3460", secondaryColor: "#533483", accentColor: "#E94560", elements: ["glowing portal", "ancient ruins"], lightingDirection: "left" },
        characters: [{ id: "hero", name: "Aria", emotion: "excited", pose: "walking", position: "left", scale: 1.0 }],
        camera: "panRight", transition: "dissolve", colorGrade: "cool", particles: "sparkles", ambientSfx: "night"
      },
      {
        id: 3,
        title: "The Guardian's Test",
        narration: "A towering figure emerged from the shadows. 'Only those who carry true light may pass,' the Guardian whispered. Aria's heart raced.",
        mood: "tense",
        background: { type: "gradient", primaryColor: "#2C003E", secondaryColor: "#512B58", accentColor: "#FE346E", elements: ["dark forest", "glowing eyes"], lightingDirection: "right" },
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
        background: { type: "gradient", primaryColor: "#FFD700", secondaryColor: "#FF6B35", accentColor: "#FFFFFF", elements: ["energy waves", "floating crystals"], lightingDirection: "center" },
        characters: [{ id: "hero", name: "Aria", emotion: "excited", pose: "celebrating", position: "center", scale: 1.1 }],
        camera: "zoomOut", transition: "glitch", colorGrade: "golden", particles: "sparkles", ambientSfx: "silence"
      },
      {
        id: 5,
        title: "The World Reborn",
        narration: "Light cascaded across the land like a golden wave. Mountains glowed, rivers sparkled, and the sky burst into a symphony of color.",
        mood: "joyful",
        background: { type: "gradient", primaryColor: "#00B4D8", secondaryColor: "#90E0EF", accentColor: "#FFD700", elements: ["blooming flowers", "rainbow sky", "flying birds"], lightingDirection: "top" },
        characters: [{ id: "hero", name: "Aria", emotion: "happy", pose: "celebrating", position: "center", scale: 1.0 }],
        camera: "panUp", transition: "dissolve", colorGrade: "warm", particles: "orbs", ambientSfx: "ocean"
      },
      {
        id: 6,
        title: "The New Dawn",
        narration: "And so Aria stood at the edge of a new world, knowing that the light within her would never fade. This was just the beginning.",
        mood: "peaceful",
        background: { type: "gradient", primaryColor: "#FF6B6B", secondaryColor: "#FFA07A", accentColor: "#FFE66D", elements: ["sunrise", "calm ocean", "distant city"], lightingDirection: "center" },
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
