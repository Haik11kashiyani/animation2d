// ParticleSystem.tsx — Ambient particles: dust, sparkles, snow, embers, rain, orbs, stars
import React from 'react';
import { useCurrentFrame } from 'remotion';

type ParticleType = 'dust' | 'sparkles' | 'snow' | 'embers' | 'rain' | 'orbs' | 'stars' | 'none';

interface ParticleSystemProps {
  type: ParticleType;
  color?: string;
  count?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  opacity: number;
  delay: number;
}

// Deterministic pseudo-random from seed
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateParticles(count: number, seed: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    x: seededRandom(seed + i * 13) * 100,
    y: seededRandom(seed + i * 17) * 100,
    size: 2 + seededRandom(seed + i * 23) * 6,
    speed: 0.3 + seededRandom(seed + i * 31) * 0.7,
    drift: (seededRandom(seed + i * 37) - 0.5) * 2,
    opacity: 0.2 + seededRandom(seed + i * 41) * 0.6,
    delay: seededRandom(seed + i * 43) * 200,
  }));
}

const ParticleSystem: React.FC<ParticleSystemProps> = ({
  type,
  color = '#FFD700',
  count = 30,
}) => {
  const frame = useCurrentFrame();

  if (type === 'none') return null;

  const particles = generateParticles(count, 42);

  const renderParticle = (p: Particle, idx: number) => {
    const time = frame + p.delay;

    switch (type) {
      case 'dust': {
        const x = (p.x + Math.sin(time * 0.01 * p.speed) * 10 + time * p.drift * 0.02) % 110 - 5;
        const y = (p.y + time * p.speed * 0.05) % 110 - 5;
        const opacity = p.opacity * (0.5 + Math.sin(time * 0.03 + p.delay) * 0.5);
        return (
          <circle
            key={idx}
            cx={`${x}%`}
            cy={`${y}%`}
            r={p.size * 0.5}
            fill={color}
            opacity={opacity * 0.4}
            filter="url(#blur)"
          />
        );
      }
      case 'sparkles': {
        const x = (p.x + Math.sin(time * 0.02 * p.speed) * 5) % 100;
        const y = (p.y + Math.cos(time * 0.015 * p.speed) * 5) % 100;
        const twinkle = Math.sin(time * 0.1 + p.delay) * 0.5 + 0.5;
        const starSize = p.size * twinkle;
        return (
          <g key={idx} transform={`translate(${x * 10.8}, ${y * 19.2})`}>
            <line x1={-starSize} y1={0} x2={starSize} y2={0} stroke={color} strokeWidth={1} opacity={twinkle * p.opacity} />
            <line x1={0} y1={-starSize} x2={0} y2={starSize} stroke={color} strokeWidth={1} opacity={twinkle * p.opacity} />
            <line x1={-starSize * 0.7} y1={-starSize * 0.7} x2={starSize * 0.7} y2={starSize * 0.7} stroke={color} strokeWidth={0.5} opacity={twinkle * p.opacity * 0.5} />
          </g>
        );
      }
      case 'snow': {
        const x = (p.x + Math.sin(time * 0.008 * p.speed) * 15 + time * p.drift * 0.01) % 105;
        const y = (p.y + time * p.speed * 0.08) % 110 - 5;
        return (
          <circle
            key={idx}
            cx={`${x}%`}
            cy={`${y}%`}
            r={p.size * 0.6}
            fill="white"
            opacity={p.opacity * 0.7}
          />
        );
      }
      case 'embers': {
        const x = (p.x + Math.sin(time * 0.015 * p.speed) * 8) % 100;
        const y = (p.y - time * p.speed * 0.1 + 200) % 110;
        const glow = Math.sin(time * 0.08 + p.delay) * 0.3 + 0.7;
        return (
          <circle
            key={idx}
            cx={`${x}%`}
            cy={`${y}%`}
            r={p.size * 0.4}
            fill="#FF6B35"
            opacity={glow * p.opacity}
            filter="url(#glow)"
          />
        );
      }
      case 'rain': {
        const x = (p.x + time * p.drift * 0.03) % 105;
        const y = (p.y + time * p.speed * 0.3) % 110 - 5;
        return (
          <line
            key={idx}
            x1={`${x}%`}
            y1={`${y}%`}
            x2={`${x + 0.2}%`}
            y2={`${y + 1.5}%`}
            stroke="rgba(180,220,255,0.5)"
            strokeWidth={1}
            opacity={p.opacity}
          />
        );
      }
      case 'orbs': {
        const x = (p.x + Math.sin(time * 0.01 * p.speed) * 12) % 100;
        const y = (p.y + Math.cos(time * 0.008 * p.speed) * 10) % 100;
        const pulse = Math.sin(time * 0.04 + p.delay) * 0.3 + 0.7;
        return (
          <circle
            key={idx}
            cx={`${x}%`}
            cy={`${y}%`}
            r={p.size * 1.2}
            fill={color}
            opacity={pulse * p.opacity * 0.3}
            filter="url(#glow)"
          />
        );
      }
      case 'stars': {
        const twinkle = Math.sin(time * 0.05 + p.delay) * 0.5 + 0.5;
        return (
          <circle
            key={idx}
            cx={`${p.x}%`}
            cy={`${(p.y * 0.6)}%`}
            r={p.size * 0.3 * (0.5 + twinkle * 0.5)}
            fill="white"
            opacity={twinkle * p.opacity}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 10,
    }}>
      <svg width="100%" height="100%" viewBox="0 0 1080 1920" preserveAspectRatio="none">
        <defs>
          <filter id="blur"><feGaussianBlur stdDeviation="2" /></filter>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="glow" />
            <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {particles.map(renderParticle)}
      </svg>
    </div>
  );
};

export default ParticleSystem;
