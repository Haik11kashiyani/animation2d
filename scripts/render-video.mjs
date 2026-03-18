// render-video.mjs — End-to-end orchestrator: story → audio → render
import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function run(command, label) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🚀 ${label}`);
  console.log(`${'='.repeat(60)}\n`);

  try {
    execSync(command, {
      cwd: ROOT,
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' },
      timeout: 10 * 60 * 1000, // 10 min timeout per step
    });
    console.log(`\n✅ ${label} — complete\n`);
  } catch (error) {
    console.error(`\n❌ ${label} — FAILED`);
    console.error(error.message);
    process.exit(1);
  }
}

async function main() {
  console.log(`
╔════════════════════════════════════════════════════════╗
║    🎬  2D ANIMATION PIPELINE  —  PRODUCTION RENDER    ║
╠════════════════════════════════════════════════════════╣
║  Story Gen ➜ Audio Gen ➜ Remotion Render ➜ Video MP4  ║
╚════════════════════════════════════════════════════════╝
  `);

  const startTime = Date.now();

  // Step 1: Generate story with AI
  run('node scripts/generate-story.mjs', 'Step 1/3 — Generating AI Story (Gemini)');

  // Verify story was generated
  const storyPath = resolve(ROOT, 'public', 'story.json');
  if (!existsSync(storyPath)) {
    console.error('❌ Story generation failed — public/story.json not found');
    process.exit(1);
  }
  const story = JSON.parse(readFileSync(storyPath, 'utf-8'));
  console.log(`📖 Story: "${story.title}" (${story.scenes?.length || 0} scenes)`);

  // Step 2: Generate narration audio
  run('node scripts/generate-audio.mjs', 'Step 2/3 — Generating Narration Audio (edge-tts)');

  // Verify timing was generated
  const timingPath = resolve(ROOT, 'public', 'audio', 'timing.json');
  if (!existsSync(timingPath)) {
    console.error('❌ Audio generation failed — public/audio/timing.json not found');
    process.exit(1);
  }
  const timing = JSON.parse(readFileSync(timingPath, 'utf-8'));
  console.log(`🎙️ Audio: ${timing.scenes?.length || 0} scene tracks, ${timing.totalFrames} total frames`);

  // Ensure output directory exists
  const outDir = resolve(ROOT, 'out');
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  // Step 3: Render video with Remotion
  // Pass totalFrames as input props so the composition knows its duration
  const inputProps = JSON.stringify({ totalFrames: timing.totalFrames });
  const renderCommand = [
    'npx remotion render',
    'StoryVideo',
    'out/video.mp4',
    '--codec=h264',
    '--crf=18',
    '--pixel-format=yuv420p',
    '--log=verbose',
    '--gl=angle',              // Required for headless CI (no GPU)
    '--concurrency=1',         // Single thread to avoid OOM on CI
    '--timeout=90000',         // 90s timeout per frame (CI is slow)
    '--ignore-certificate-errors',
    '--disable-web-security',
  ].join(' ');

  run(renderCommand, 'Step 3/3 — Rendering 2D Animation Video (Remotion)');

  // Done
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const videoPath = resolve(ROOT, 'out', 'video.mp4');

  if (existsSync(videoPath)) {
    const { statSync } = await import('fs');
    const sizeMB = (statSync(videoPath).size / (1024 * 1024)).toFixed(1);
    console.log(`
╔════════════════════════════════════════════════════════╗
║                  🎉  RENDER COMPLETE!                  ║
╠════════════════════════════════════════════════════════╣
║  📁  Output: out/video.mp4                            ║
║  📊  Size: ${sizeMB.padEnd(6)} MB                              ║
║  ⏱️  Time: ${elapsed.padEnd(6)} seconds                        ║
║  🎬  "${story.title}"
╚════════════════════════════════════════════════════════╝
    `);
  } else {
    console.error('❌ Render completed but video file not found!');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('💥 Pipeline failed:', err);
  process.exit(1);
});
