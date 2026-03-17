# 🎬 Automated 2D Animation Pipeline

**Production-level 2D animated story videos, generated end-to-end by AI, rendered via GitHub Actions.**

Every video is unique — AI writes the story, directs the cinematography, narrates with neural voices, and renders polished 2D animations with characters, particles, cinematic camera, and karaoke subtitles.

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🤖 AI Story Generation | Gemini 2.0 Flash writes unique stories with full cinematic direction |
| 🎙️ Neural TTS Narration | Microsoft Edge neural voices with mood-based emotion |
| 🎥 Ken Burns Camera | Slow zoom/pan on every scene |
| ✨ Karaoke Subtitles | Word-by-word highlight synced to audio |
| 🎬 Post-Processing | Film grain, vignette, color grading |
| 🌊 Multi-Layer Parallax | 3+ depth layers for visual depth |
| 🎭 Animated Characters | SVG characters with 8 emotions, 6 poses, breathing, blinking |
| 💫 Particle System | 8 types: dust, sparkles, snow, embers, rain, orbs, stars |
| 🌟 Dynamic Lighting | Animated light source with rim and bounce lighting |
| 🎪 Scene Transitions | 6 effects: fade, wipe, zoom, dissolve, flash, glitch |
| 🎬 Pro Intro/Outro | Particle burst title reveal + end card with CTA |
| 📱 Vertical Format | 1080×1920 @ 60fps — optimized for social media |

## 🚀 Quick Start

### 1. Add Gemini API Key
Get a free key: [aistudio.google.com/apikey](https://aistudio.google.com/apikey)

Add to GitHub repo: **Settings → Secrets → Actions → New repository secret**
- Name: `GEMINI_API_KEY`
- Value: your key

### 2. Generate a Video
Go to **Actions tab → "Generate Animation Video" → Run workflow**

Optionally enter a story topic, or leave blank for AI to choose.

### 3. Download
When complete, download the video from the **Artifacts** section of the workflow run.

## 🏗️ Architecture

```
GitHub Actions Trigger
    ↓
Gemini API → Generate Story (scenes, characters, camera, colors)
    ↓
edge-tts → Generate Narration Audio (per-scene MP3 + word timing)
    ↓
Remotion → Render 2D Animated Video (60fps, 1080×1920)
    ↓
Upload → GitHub Actions Artifact (90-day retention)
```

## 📁 Project Structure

```
animation2d/
├── .github/workflows/
│   └── generate-video.yml     # CI: full render pipeline
├── scripts/
│   ├── generate-story.mjs     # Gemini AI story generator
│   ├── generate-audio.mjs     # edge-tts narration + timing
│   └── render-video.mjs       # End-to-end orchestrator
├── src/
│   ├── components/
│   │   ├── Background.tsx     # Multi-layer parallax backgrounds
│   │   ├── Character.tsx      # SVG characters (8 emotions, 6 poses)
│   │   ├── CinematicCamera.tsx # Ken Burns zoom/pan engine
│   │   ├── DynamicLighting.tsx # Animated light + shadows
│   │   ├── IntroSequence.tsx   # Particle burst + title reveal
│   │   ├── KaraokeSubtitles.tsx # Word-by-word glow subtitles
│   │   ├── OutroSequence.tsx   # End card + CTA
│   │   ├── ParticleSystem.tsx  # 8 particle types
│   │   ├── PostProcessing.tsx  # Grain, vignette, color grade
│   │   ├── SceneRenderer.tsx   # 8-layer scene compositor
│   │   ├── TextOverlay.tsx     # Typewriter + glow text
│   │   └── Transition.tsx      # 6 transition effects
│   ├── types/
│   │   └── story.ts           # TypeScript schema
│   ├── StoryVideo.tsx         # Main Remotion composition
│   ├── Root.tsx               # Remotion entry point
│   └── index.ts
├── public/
│   ├── story.json             # Generated story data
│   └── audio/                 # Generated narration MP3s + timing
├── package.json
├── tsconfig.json
└── remotion.config.ts
```

## 💰 Cost

**$0.** Everything is free:
- Gemini 2.0 Flash: free tier (15 RPM)
- edge-tts: free (Microsoft's Read Aloud API)
- Remotion: free for individuals
- GitHub Actions: 2,000 free minutes/month
- Artifacts: free storage

## 🛠️ Local Development

```bash
npm install
npm run dev          # Opens Remotion Studio (preview)
```

To render locally:
```bash
pip install edge-tts
export GEMINI_API_KEY=your_key
npm run render
```
