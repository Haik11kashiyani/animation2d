// PostProcessing.tsx — Vignette, film grain, color grading, letterboxing
import React from 'react';
import { useCurrentFrame } from 'remotion';

type ColorGrade = 'warm' | 'cool' | 'neon' | 'desaturated' | 'golden' | 'midnight';

interface PostProcessingProps {
  colorGrade: ColorGrade;
  enableGrain?: boolean;
  enableVignette?: boolean;
  enableLetterbox?: boolean;
  children: React.ReactNode;
}

const COLOR_FILTERS: Record<ColorGrade, string> = {
  warm: 'sepia(0.15) saturate(1.2) brightness(1.05)',
  cool: 'hue-rotate(10deg) saturate(0.9) brightness(1.02)',
  neon: 'saturate(1.5) contrast(1.1) brightness(1.1)',
  desaturated: 'saturate(0.5) contrast(1.1)',
  golden: 'sepia(0.25) saturate(1.3) brightness(1.08)',
  midnight: 'hue-rotate(-10deg) saturate(0.8) brightness(0.85) contrast(1.15)',
};

const PostProcessing: React.FC<PostProcessingProps> = ({
  colorGrade,
  enableGrain = true,
  enableVignette = true,
  enableLetterbox = false,
  children,
}) => {
  const frame = useCurrentFrame();

  // Grain animation — subtle noise offset
  const grainX = (frame * 7.3) % 100;
  const grainY = (frame * 11.1) % 100;

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Content with color grading */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        filter: COLOR_FILTERS[colorGrade] || COLOR_FILTERS.warm,
      }}>
        {children}
      </div>

      {/* Film grain overlay */}
      {enableGrain && (
        <div style={{
          position: 'absolute',
          width: '300%',
          height: '300%',
          top: `-${grainY}%`,
          left: `-${grainX}%`,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          opacity: 0.04,
          mixBlendMode: 'overlay',
          pointerEvents: 'none',
        }} />
      )}

      {/* Vignette */}
      {enableVignette && (
        <div style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }} />
      )}

      {/* Cinematic letterboxing */}
      {enableLetterbox && (
        <>
          <div style={{
            position: 'absolute',
            top: 0,
            width: '100%',
            height: '8%',
            background: 'black',
          }} />
          <div style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            height: '8%',
            background: 'black',
          }} />
        </>
      )}
    </div>
  );
};

export default PostProcessing;
