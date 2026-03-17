// Background.tsx — Multi-layer parallax background with dynamic gradients
import React from 'react';
import { useCurrentFrame, interpolate, Easing } from 'remotion';

interface BackgroundProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  elements: string[];
  lightingDirection: 'left' | 'right' | 'center' | 'top';
  durationFrames: number;
}

// Map element keywords to SVG shapes
const ELEMENT_SHAPES: Record<string, (color: string, idx: number) => React.ReactNode> = {
  mountains: (color, idx) => (
    <polygon
      key={`mount-${idx}`}
      points={`${100 + idx * 300},800 ${250 + idx * 300},400 ${400 + idx * 300},800`}
      fill={color}
      opacity={0.4}
    />
  ),
  stars: (color, idx) => (
    <circle
      key={`star-${idx}`}
      cx={80 + idx * 180}
      cy={60 + (idx % 3) * 120}
      r={2 + (idx % 3)}
      fill={color}
      opacity={0.8}
    />
  ),
  clouds: (color, idx) => (
    <ellipse
      key={`cloud-${idx}`}
      cx={150 + idx * 250}
      cy={100 + (idx % 2) * 80}
      rx={80}
      ry={30}
      fill={color}
      opacity={0.3}
    />
  ),
  crystals: (color, idx) => (
    <polygon
      key={`crystal-${idx}`}
      points={`${200 + idx * 200},600 ${230 + idx * 200},450 ${260 + idx * 200},600`}
      fill={color}
      opacity={0.5}
    />
  ),
  waves: (color, idx) => (
    <path
      key={`wave-${idx}`}
      d={`M0,${700 + idx * 30} Q${270},${670 + idx * 20} ${540},${700 + idx * 30} T${1080},${700 + idx * 30}`}
      fill="none"
      stroke={color}
      strokeWidth={2}
      opacity={0.3}
    />
  ),
};

const Background: React.FC<BackgroundProps> = ({
  primaryColor,
  secondaryColor,
  accentColor,
  elements,
  lightingDirection,
  durationFrames,
}) => {
  const frame = useCurrentFrame();

  // Parallax layer speeds
  const farOffset = interpolate(frame, [0, durationFrames], [0, -30], { extrapolateRight: 'clamp' });
  const midOffset = interpolate(frame, [0, durationFrames], [0, -60], { extrapolateRight: 'clamp' });
  const nearOffset = interpolate(frame, [0, durationFrames], [0, -100], { extrapolateRight: 'clamp' });

  // Floating animation for accent shapes
  const floatY = Math.sin(frame * 0.03) * 15;
  const floatX = Math.cos(frame * 0.02) * 8;

  // Gradient rotation based on lighting direction
  const gradientAngles: Record<string, string> = {
    left: '90deg',
    right: '270deg',
    center: '180deg',
    top: '180deg',
  };
  const gradAngle = gradientAngles[lightingDirection] || '180deg';

  // Subtle gradient shift animation
  const hueShift = interpolate(frame, [0, durationFrames], [0, 15], { extrapolateRight: 'clamp' });

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      {/* Layer 1: Deep gradient background */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `linear-gradient(${gradAngle}, ${primaryColor}, ${secondaryColor})`,
        filter: `hue-rotate(${hueShift}deg)`,
      }} />

      {/* Layer 2: Far background (slow parallax) */}
      <div style={{
        position: 'absolute',
        width: '120%',
        height: '120%',
        left: '-10%',
        top: '-10%',
        transform: `translateY(${farOffset}px)`,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920">
          {/* Far stars/dots */}
          {Array.from({ length: 20 }, (_, i) => (
            <circle
              key={`far-${i}`}
              cx={(i * 137) % 1080}
              cy={(i * 211) % 1920}
              r={1 + (i % 3)}
              fill={accentColor}
              opacity={0.15 + Math.sin(frame * 0.05 + i) * 0.1}
            />
          ))}
        </svg>
      </div>

      {/* Layer 3: Mid background (medium parallax) — scene elements */}
      <div style={{
        position: 'absolute',
        width: '120%',
        height: '120%',
        left: '-10%',
        top: '-10%',
        transform: `translateY(${midOffset}px) translateX(${floatX}px)`,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920">
          {elements.map((el, idx) => {
            const key = el.toLowerCase().replace(/[^a-z]/g, '');
            const matched = Object.keys(ELEMENT_SHAPES).find(k => key.includes(k));
            if (matched) {
              return ELEMENT_SHAPES[matched](accentColor, idx);
            }
            // Default: floating orbs
            return (
              <circle
                key={`el-${idx}`}
                cx={150 + idx * 250}
                cy={300 + (idx % 3) * 200 + floatY}
                r={20 + idx * 10}
                fill={accentColor}
                opacity={0.15}
              />
            );
          })}
        </svg>
      </div>

      {/* Layer 4: Near foreground (fast parallax) — decorative shapes */}
      <div style={{
        position: 'absolute',
        width: '130%',
        height: '130%',
        left: '-15%',
        bottom: '-15%',
        transform: `translateY(${nearOffset}px)`,
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1080 1920">
          {/* Foreground gradient shapes */}
          <ellipse
            cx={200 + floatX * 2}
            cy={1700}
            rx={300}
            ry={150}
            fill={primaryColor}
            opacity={0.3}
          />
          <ellipse
            cx={800 - floatX}
            cy={1750}
            rx={250}
            ry={100}
            fill={secondaryColor}
            opacity={0.25}
          />
        </svg>
      </div>

      {/* Ambient glow overlay */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at ${
          lightingDirection === 'left' ? '20% 50%' :
          lightingDirection === 'right' ? '80% 50%' :
          lightingDirection === 'top' ? '50% 20%' : '50% 50%'
        }, ${accentColor}22, transparent 70%)`,
      }} />
    </div>
  );
};

export default Background;
