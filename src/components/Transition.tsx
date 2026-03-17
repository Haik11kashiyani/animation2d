// Transition.tsx — Scene transition effects: fade, wipe, zoom, dissolve, flash, glitch
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

type TransitionType = 'fade' | 'wipe' | 'zoom' | 'dissolve' | 'flash' | 'glitch';

interface TransitionProps {
  type: TransitionType;
  durationFrames?: number; // default 30 (0.5s at 60fps)
  color?: string;
}

const Transition: React.FC<TransitionProps> = ({
  type,
  durationFrames = 30,
  color = '#000000',
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(frame, [0, durationFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });

  // Fade in then out (V-shape)
  const fadeInOut = frame < durationFrames / 2
    ? interpolate(frame, [0, durationFrames / 2], [0, 1], { extrapolateRight: 'clamp' })
    : interpolate(frame, [durationFrames / 2, durationFrames], [1, 0], { extrapolateRight: 'clamp' });

  switch (type) {
    case 'fade':
      return (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: color,
          opacity: fadeInOut,
          zIndex: 100,
        }} />
      );

    case 'wipe':
      return (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: color,
          clipPath: `inset(0 ${(1 - fadeInOut) * 100}% 0 0)`,
          zIndex: 100,
        }} />
      );

    case 'zoom':
      return (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: color,
          borderRadius: `${(1 - fadeInOut) * 50}%`,
          transform: `scale(${fadeInOut * 1.5})`,
          opacity: fadeInOut,
          zIndex: 100,
        }} />
      );

    case 'dissolve':
      return (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 100,
        }}>
          {/* Many small squares appearing/disappearing */}
          {Array.from({ length: 24 }, (_, i) => {
            const row = Math.floor(i / 6);
            const col = i % 6;
            const delay = (i * 0.04);
            const cellOpacity = interpolate(
              fadeInOut,
              [delay, delay + 0.3],
              [0, 1],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            );
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${col * (100 / 6)}%`,
                  top: `${row * 25}%`,
                  width: `${100 / 6 + 1}%`,
                  height: '26%',
                  backgroundColor: color,
                  opacity: cellOpacity,
                }}
              />
            );
          })}
        </div>
      );

    case 'flash':
      return (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#FFFFFF',
          opacity: fadeInOut * fadeInOut,
          zIndex: 100,
        }} />
      );

    case 'glitch': {
      const glitchOffset = Math.sin(frame * 2) * 20;
      const sliceCount = 8;
      return (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          zIndex: 100,
          opacity: fadeInOut,
        }}>
          {Array.from({ length: sliceCount }, (_, i) => {
            const offset = Math.sin(frame * 3 + i * 7) * 30;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: `${offset}px`,
                  top: `${(i / sliceCount) * 100}%`,
                  width: '100%',
                  height: `${100 / sliceCount + 1}%`,
                  backgroundColor: i % 2 === 0 ? '#FF0040' : '#00FFFF',
                  opacity: 0.3,
                  mixBlendMode: 'screen',
                }}
              />
            );
          })}
        </div>
      );
    }

    default:
      return null;
  }
};

export default Transition;
