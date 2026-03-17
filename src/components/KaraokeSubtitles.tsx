// KaraokeSubtitles.tsx — Word-by-word highlight synced to audio timing
import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig } from 'remotion';

interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

interface KaraokeSubtitlesProps {
  words: WordTiming[];
  textColor?: string;
  activeColor?: string;
  glowColor?: string;
  durationFrames: number;
}

const KaraokeSubtitles: React.FC<KaraokeSubtitlesProps> = ({
  words,
  textColor = 'rgba(255,255,255,0.4)',
  activeColor = '#FFFFFF',
  glowColor = '#FFD700',
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const currentTimeMs = (frame / fps) * 1000;

  // Split words into lines (~6 words per line)
  const wordsPerLine = 6;
  const lines: WordTiming[][] = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine));
  }

  // Find which line should be visible based on current time
  const currentLineIndex = lines.findIndex(line => {
    const lineStart = line[0]?.startMs ?? 0;
    const lineEnd = line[line.length - 1]?.endMs ?? 0;
    return currentTimeMs >= lineStart - 500 && currentTimeMs <= lineEnd + 300;
  });

  const visibleLine = currentLineIndex >= 0 ? lines[currentLineIndex] : null;

  if (!visibleLine || visibleLine.length === 0) return null;

  // Line entrance animation
  const lineStartMs = visibleLine[0].startMs;
  const lineStartFrame = Math.floor((lineStartMs / 1000) * fps);
  const lineEntrance = spring({
    frame: frame - lineStartFrame + 15,
    fps,
    config: { damping: 20, stiffness: 100 },
  });

  return (
    <div style={{
      position: 'absolute',
      bottom: '12%',
      left: '5%',
      right: '5%',
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '8px',
      transform: `translateY(${(1 - lineEntrance) * 30}px)`,
      opacity: lineEntrance,
    }}>
      {visibleLine.map((wordData, idx) => {
        const isActive = currentTimeMs >= wordData.startMs && currentTimeMs <= wordData.endMs;
        const isPast = currentTimeMs > wordData.endMs;
        const isFuture = currentTimeMs < wordData.startMs;

        // Active word scale pulse
        const wordFrame = isActive
          ? Math.floor(((currentTimeMs - wordData.startMs) / (wordData.endMs - wordData.startMs)) * 10)
          : 0;
        const activeScale = isActive ? 1 + Math.sin(wordFrame * 0.5) * 0.05 : 1;

        return (
          <span
            key={idx}
            style={{
              fontSize: '42px',
              fontWeight: 800,
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              color: isActive ? activeColor : isPast ? 'rgba(255,255,255,0.7)' : textColor,
              textShadow: isActive
                ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}80, 0 2px 4px rgba(0,0,0,0.8)`
                : '0 2px 4px rgba(0,0,0,0.6)',
              transform: `scale(${activeScale})`,
              transition: 'color 0.1s ease',
              letterSpacing: '0.02em',
              display: 'inline-block',
            }}
          >
            {wordData.word}
          </span>
        );
      })}
    </div>
  );
};

export default KaraokeSubtitles;
