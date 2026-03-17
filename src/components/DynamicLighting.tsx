// DynamicLighting.tsx — Animated radial light source with shadows
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface DynamicLightingProps {
  direction: 'left' | 'right' | 'center' | 'top';
  color?: string;
  intensity?: number;
  durationFrames: number;
}

const DynamicLighting: React.FC<DynamicLightingProps> = ({
  direction,
  color = '#FFD700',
  intensity = 0.3,
  durationFrames,
}) => {
  const frame = useCurrentFrame();

  // Light position animation — slowly drifts
  const basePositions: Record<string, { x: number; y: number }> = {
    left: { x: 20, y: 40 },
    right: { x: 80, y: 40 },
    center: { x: 50, y: 35 },
    top: { x: 50, y: 15 },
  };

  const base = basePositions[direction] || basePositions.center;

  // Slow drift animation
  const driftX = Math.sin(frame * 0.008) * 8;
  const driftY = Math.cos(frame * 0.006) * 5;

  // Pulsing intensity
  const pulse = Math.sin(frame * 0.03) * 0.1 + 0.9;

  const lightX = base.x + driftX;
  const lightY = base.y + driftY;
  const lightIntensity = intensity * pulse;

  // Parse color to add alpha
  const parseHex = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${lightIntensity})`;
  };

  const lightColor = color.startsWith('#') ? parseHex(color) : `rgba(255,215,0,${lightIntensity})`;

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 8,
    }}>
      {/* Main light source */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at ${lightX}% ${lightY}%, ${lightColor}, transparent 65%)`,
      }} />

      {/* Secondary rim light */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `radial-gradient(ellipse at ${100 - lightX}% ${100 - lightY}%, rgba(100,150,255,${lightIntensity * 0.15}), transparent 50%)`,
      }} />

      {/* Bottom ambient bounce */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        background: `linear-gradient(to top, rgba(0,0,0,${0.15 * pulse}), transparent 30%)`,
      }} />
    </div>
  );
};

export default DynamicLighting;
