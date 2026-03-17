// Audio Generator — Uses edge-tts (free Microsoft neural TTS) with word-level timing
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const STORY_PATH = resolve(ROOT, 'public', 'story.json');
const AUDIO_DIR = resolve(ROOT, 'public', 'audio');
const TIMING_PATH = resolve(AUDIO_DIR, 'timing.json');

const FPS = 60;

// Voice selection based on mood
const VOICE_MAP = {
  peaceful: 'en-US-AriaNeural',
  tense: 'en-US-GuyNeural',
  joyful: 'en-US-JennyNeural',
  mysterious: 'en-US-AriaNeural',
  dramatic: 'en-US-GuyNeural',
  melancholic: 'en-US-AriaNeural',
  epic: 'en-US-GuyNeural',
  romantic: 'en-US-JennyNeural',
};

// Rate/pitch adjustments per mood for more expressive narration
const STYLE_MAP = {
  peaceful: { rate: '-5%', pitch: '-2Hz' },
  tense: { rate: '+10%', pitch: '+3Hz' },
  joyful: { rate: '+5%', pitch: '+2Hz' },
  mysterious: { rate: '-10%', pitch: '-5Hz' },
  dramatic: { rate: '+0%', pitch: '+0Hz' },
  melancholic: { rate: '-15%', pitch: '-3Hz' },
  epic: { rate: '+5%', pitch: '+2Hz' },
  romantic: { rate: '-5%', pitch: '-2Hz' },
};

async function getAudioDuration(filePath) {
  try {
    const mm = await import('music-metadata');
    const metadata = await mm.parseFile(filePath);
    return Math.round(metadata.format.duration * 1000); // ms
  } catch {
    // Fallback: estimate from file size (~16kbps for MP3)
    const { statSync } = await import('fs');
    const stats = statSync(filePath);
    return Math.round((stats.size / (16000 / 8)) * 1000);
  }
}

function estimateWordTimings(text, totalDurationMs) {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return [];

  // Add small padding at start/end
  const paddingMs = 300;
  const availableDuration = totalDurationMs - (paddingMs * 2);
  const avgWordDuration = availableDuration / words.length;

  // Vary word duration based on word length (longer words take longer to say)
  const totalWeight = words.reduce((sum, w) => sum + Math.max(w.length, 2), 0);

  let currentTime = paddingMs;
  return words.map((word) => {
    const weight = Math.max(word.length, 2);
    const duration = (weight / totalWeight) * availableDuration;
    const timing = {
      word: word.replace(/[.,!?;:'"()]/g, ''),
      startMs: Math.round(currentTime),
      endMs: Math.round(currentTime + duration),
    };
    currentTime += duration;
    return timing;
  });
}

async function generateAudio() {
  console.log('🎙️ Generating narration audio...');

  if (!existsSync(STORY_PATH)) {
    console.error('❌ Story file not found. Run generate-story.mjs first.');
    process.exit(1);
  }

  const story = JSON.parse(readFileSync(STORY_PATH, 'utf-8'));

  // Create audio output directory
  if (!existsSync(AUDIO_DIR)) {
    mkdirSync(AUDIO_DIR, { recursive: true });
  }

  const sceneTiming = [];
  let totalFrames = 0;

  for (const scene of story.scenes) {
    const audioFile = `scene-${scene.id}.mp3`;
    const audioPath = resolve(AUDIO_DIR, audioFile);
    const voice = VOICE_MAP[scene.mood] || 'en-US-AriaNeural';
    const style = STYLE_MAP[scene.mood] || { rate: '+0%', pitch: '+0Hz' };

    console.log(`  🔊 Scene ${scene.id}: "${scene.title}" (${voice})`);

    // Use edge-tts Python CLI (installed via: pip install edge-tts)
    try {
      // Escape double quotes for shell safety
      const escapedText = scene.narration.replace(/"/g, '\\"');
      const cmd = `edge-tts --text "${escapedText}" --voice ${voice} --rate="${style.rate}" --pitch="${style.pitch}" --write-media "${audioPath}"`;
      execSync(cmd, { stdio: 'pipe', timeout: 30000 });
    } catch (error) {
      console.warn(`  ⚠️ edge-tts failed for scene ${scene.id}, generating silence placeholder`);
      // Create a minimal silent MP3 (1 second of silence)
      generateSilence(audioPath, 5000);
    }

    // Get audio duration
    let durationMs;
    if (existsSync(audioPath)) {
      durationMs = await getAudioDuration(audioPath);
    } else {
      // Estimate: ~150 words per minute
      const wordCount = scene.narration.split(/\s+/).length;
      durationMs = Math.round((wordCount / 150) * 60 * 1000);
    }

    // Add 1 second buffer after narration for breathing room
    durationMs += 1000;

    // Minimum 5 seconds per scene
    durationMs = Math.max(durationMs, 5000);

    const durationFrames = Math.ceil((durationMs / 1000) * FPS);
    const words = estimateWordTimings(scene.narration, durationMs);

    sceneTiming.push({
      sceneId: scene.id,
      durationMs,
      durationFrames,
      audioFile,
      words,
    });

    totalFrames += durationFrames;
    console.log(`    ✅ Duration: ${(durationMs / 1000).toFixed(1)}s (${durationFrames} frames)`);
  }

  // Add intro (4s) and outro (3s)
  const introFrames = 4 * FPS;
  const outroFrames = 3 * FPS;
  totalFrames += introFrames + outroFrames;

  const timingData = {
    fps: FPS,
    totalFrames,
    totalDurationMs: Math.round((totalFrames / FPS) * 1000),
    introFrames,
    outroFrames,
    scenes: sceneTiming,
  };

  writeFileSync(TIMING_PATH, JSON.stringify(timingData, null, 2));
  console.log(`\n💾 Timing data saved to: ${TIMING_PATH}`);
  console.log(`📊 Total video: ${(totalFrames / FPS).toFixed(1)}s (${totalFrames} frames @ ${FPS}fps)`);
}

function generateSilence(outputPath, durationMs) {
  // Create a tiny valid MP3 file (silence)
  // This is a minimal MP3 frame header for silence
  const header = Buffer.from([
    0xFF, 0xFB, 0x90, 0x00, // MPEG1 Layer3, 128kbps, 44100Hz, stereo
  ]);
  const frameSize = 417; // bytes per frame at 128kbps/44100Hz
  const framesNeeded = Math.ceil((durationMs / 1000) * (44100 / 1152));
  const silence = Buffer.alloc(framesNeeded * frameSize);

  // Fill with valid but silent MP3 frames
  for (let i = 0; i < framesNeeded; i++) {
    header.copy(silence, i * frameSize);
  }

  writeFileSync(outputPath, silence);
}

generateAudio().catch(console.error);
