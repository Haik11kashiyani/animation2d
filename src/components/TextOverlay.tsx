// TextOverlay.tsx — Cinematic title cards with typewriter + glow effects
import React from 'react';
import { useCurrentFrame, interpolate, spring, useVideoConfig, Easing } from 'remotion';

interface TextOverlayProps {
  text: string;
  fontSize?: number;
  color?: string;
  glowColor?: string;
  position?: 'top' | 'center' | 'bottom';
  effect?: 'typewriter' | 'fadeUp' | 'scaleIn';
  durationFrames: number;
}

const TextOverlay: React.FC<TextOverlayProps> = ({
  text,
  fontSize = 56,
  color = '#FFFFFF',
  glowColor = '#FFD700',
  position = 'top',
  effect = 'typewriter',
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const positionStyles: Record<string, React.CSSProperties> = {
    top: { top: '8%', left: '5%', right: '5%' },
    center: { top: '40%', left: '5%', right: '5%' },
    bottom: { bottom: '25%', left: '5%', right: '5%' },
  };

  // Entrance spring
  const entrance = spring({ frame, fps, config: { damping: 18, stiffness: 60 } });

  // Exit fade (last 20 frames of scene)
  const exit = interpolate(frame, [durationFrames - 20, durationFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  let content: React.ReactNode;
  let transformStyle = {};

  switch (effect) {
    case 'typewriter': {
      // Reveal characters one by one
      const totalChars = text.length;
      const revealDuration = Math.min(durationFrames * 0.6, totalChars * 3);
      const charsRevealed = Math.min(
        totalChars,
        Math.floor(interpolate(frame, [10, 10 + revealDuration], [0, totalChars], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }))
      );

      const visibleText = text.slice(0, charsRevealed);
      const showCursor = frame % 30 < 20 && charsRevealed < totalChars;

      content = (
        <>
          {visibleText}
          {showCursor && <span style={{ opacity: 0.8 }}>|</span>}
        </>
      );
      transformStyle = { opacity: exit };
      break;
    }
    case 'fadeUp': {
      const y = interpolate(entrance, [0, 1], [40, 0]);
      content = text;
      transformStyle = {
        transform: `translateY(${y}px)`,
        opacity: entrance * exit,
      };
      break;
    }
    case 'scaleIn': {
      const scale = interpolate(entrance, [0, 1], [0.5, 1]);
      content = text;
      transformStyle = {
        transform: `scale(${scale})`,
        opacity: entrance * exit,
      };
      break;
    }
    default:
      content = text;
      transformStyle = { opacity: entrance * exit };
  }

  // Glow intensity animation
  const glowPulse = Math.sin(frame * 0.04) * 0.3 + 0.7;

  return (
    <div style={{
      position: 'absolute',
      ...positionStyles[position],
      display: 'flex',
      justifyContent: 'center',
      textAlign: 'center',
      zIndex: 15,
      ...transformStyle,
    }}>
      <h2 style={{
        fontSize: `${fontSize}px`,
        fontWeight: 900,
        fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
        color,
        textShadow: `
          0 0 ${10 * glowPulse}px ${glowColor}60,
          0 0 ${20 * glowPulse}px ${glowColor}30,
          0 0 ${40 * glowPulse}px ${glowColor}15,
          0 2px 4px rgba(0,0,0,0.8)
        `,
        letterSpacing: '0.03em',
        lineHeight: 1.3,
        margin: 0,
        padding: '0 20px',
      }}>
        {content}
      </h2>
    </div>
  );
};

export default TextOverlay;
