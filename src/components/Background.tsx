// Background.tsx — Illustrated SVG scene backgrounds (not just gradients!)
// Each scene type gets a fully drawn environment with multiple layers
import React from 'react';
import { useCurrentFrame, interpolate } from 'remotion';

interface BackgroundProps {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  elements: string[];
  lightingDirection: string;
  durationFrames: number;
}

// Helper: deterministic pseudo-random from seed
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

// --------------------------------------------------
// Scene element library — richly illustrated SVG
// --------------------------------------------------

function Sky({ primary, secondary, frame }: { primary: string; secondary: string; frame: number }) {
  const gradientShift = Math.sin(frame * 0.005) * 5;
  return (
    <rect x={0} y={0} width={1080} height={1200}
      fill={`url(#skyGrad)`}>
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={primary} />
          <stop offset={`${60 + gradientShift}%`} stopColor={secondary} />
        </linearGradient>
      </defs>
    </rect>
  );
}

function Stars({ frame, count }: { frame: number; count: number }) {
  const rng = seededRandom(42);
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = rng() * 1080;
        const y = rng() * 800;
        const size = rng() * 2 + 0.5;
        const twinkle = Math.sin(frame * 0.03 + i * 1.5) * 0.4 + 0.6;
        return <circle key={i} cx={x} cy={y} r={size} fill="white" opacity={twinkle} />;
      })}
    </g>
  );
}

function Moon({ frame }: { frame: number }) {
  const glow = Math.sin(frame * 0.02) * 0.1 + 0.9;
  return (
    <g>
      <circle cx={850} cy={150} r={65} fill="#FFF8DC" opacity={glow} />
      <circle cx={870} cy={140} r={60} fill="url(#skyGrad)" />
      {/* Moon craters */}
      <circle cx={835} cy={155} r={8} fill="#F0E68C" opacity={0.3} />
      <circle cx={845} cy={138} r={5} fill="#F0E68C" opacity={0.2} />
      {/* Moon glow */}
      <circle cx={850} cy={150} r={90} fill="#FFF8DC" opacity={0.05} />
    </g>
  );
}

function Sun({ frame }: { frame: number }) {
  const pulse = Math.sin(frame * 0.03) * 5;
  const rayRotation = frame * 0.2;
  return (
    <g>
      {/* Sun glow */}
      <circle cx={200} cy={200} r={120 + pulse} fill="#FFD700" opacity={0.08} />
      <circle cx={200} cy={200} r={80 + pulse * 0.5} fill="#FFA500" opacity={0.12} />
      {/* Sun body */}
      <circle cx={200} cy={200} r={55} fill="#FFD700" />
      <circle cx={200} cy={200} r={50} fill="#FFC107" />
      {/* Rays */}
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 + rayRotation) * (Math.PI / 180);
        return (
          <line key={i}
            x1={200 + Math.cos(angle) * 60}
            y1={200 + Math.sin(angle) * 60}
            x2={200 + Math.cos(angle) * (80 + pulse)}
            y2={200 + Math.sin(angle) * (80 + pulse)}
            stroke="#FFD700" strokeWidth="3" opacity={0.6} strokeLinecap="round"
          />
        );
      })}
    </g>
  );
}

function Mountains({ color, offset, height }: { color: string; offset: number; height: number }) {
  return (
    <g>
      <path d={`M${-50 + offset},${height + 400} L${180 + offset},${height} L${350 + offset},${height + 350} L${480 + offset},${height + 50} L${650 + offset},${height + 380} L${750 + offset},${height + 80} L${950 + offset},${height + 300} L${1130 + offset},${height} L${1200 + offset},${height + 400} Z`}
        fill={color} />
      {/* Snow caps */}
      <path d={`M${160 + offset},${height + 30} L${180 + offset},${height} L${200 + offset},${height + 30} Q${180 + offset},${height + 25} ${160 + offset},${height + 30}`}
        fill="white" opacity={0.7} />
      <path d={`M${1110 + offset},${height + 30} L${1130 + offset},${height} L${1150 + offset},${height + 30} Q${1130 + offset},${height + 25} ${1110 + offset},${height + 30}`}
        fill="white" opacity={0.7} />
    </g>
  );
}

function Trees({ frame, groundY, count, color }: { frame: number; groundY: number; count: number; color: string }) {
  const rng = seededRandom(77);
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = rng() * 1100;
        const h = 80 + rng() * 100;
        const sway = Math.sin(frame * 0.015 + i * 2) * 3;
        const treeColor = `hsl(${120 + rng() * 40}, ${50 + rng() * 30}%, ${20 + rng() * 20}%)`;
        return (
          <g key={i} transform={`translate(${x}, ${groundY})`}>
            {/* Trunk */}
            <rect x={-4} y={-h * 0.4} width={8} height={h * 0.5} fill="#5D4037" rx={2} />
            {/* Foliage layers */}
            <g transform={`rotate(${sway}, 0, ${-h * 0.4})`}>
              <ellipse cx={0} cy={-h * 0.5} rx={h * 0.25} ry={h * 0.22} fill={color || treeColor} />
              <ellipse cx={-h * 0.1} cy={-h * 0.6} rx={h * 0.2} ry={h * 0.18} fill={color || treeColor} opacity="0.9" />
              <ellipse cx={h * 0.08} cy={-h * 0.7} rx={h * 0.15} ry={h * 0.15} fill={color || treeColor} opacity="0.8" />
              {/* Highlight */}
              <ellipse cx={-h * 0.05} cy={-h * 0.55} rx={h * 0.1} ry={h * 0.08} fill="white" opacity="0.08" />
            </g>
          </g>
        );
      })}
    </g>
  );
}

function Water({ frame, y, accentColor }: { frame: number; y: number; accentColor: string }) {
  const waveOffset = frame * 0.5;
  return (
    <g>
      <rect x={0} y={y} width={1080} height={1920 - y} fill={accentColor} opacity="0.3" />
      {/* Waves */}
      {Array.from({ length: 6 }).map((_, i) => (
        <path key={i}
          d={`M${-50 + waveOffset * (i % 2 === 0 ? 1 : -1) % 100},${y + i * 40} Q${270 + Math.sin(frame * 0.02 + i) * 30},${y + i * 40 - 15} ${540},${y + i * 40} Q${810 + Math.sin(frame * 0.02 + i + 1) * 30},${y + i * 40 + 15} ${1130},${y + i * 40}`}
          fill="none" stroke="white" strokeWidth="1.5" opacity={0.15 - i * 0.02}
        />
      ))}
      {/* Reflections */}
      <rect x={0} y={y} width={1080} height={30} fill="white" opacity={Math.sin(frame * 0.015) * 0.03 + 0.04} />
    </g>
  );
}

function Clouds({ frame, count }: { frame: number; count: number }) {
  const rng = seededRandom(99);
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const baseX = rng() * 1200 - 100;
        const y = 80 + rng() * 300;
        const size = 60 + rng() * 80;
        const speed = 0.1 + rng() * 0.2;
        const x = (baseX + frame * speed) % 1300 - 100;
        return (
          <g key={i} opacity={0.7}>
            <ellipse cx={x} cy={y} rx={size} ry={size * 0.4} fill="white" />
            <ellipse cx={x - size * 0.3} cy={y + 5} rx={size * 0.7} ry={size * 0.3} fill="white" />
            <ellipse cx={x + size * 0.35} cy={y + 3} rx={size * 0.6} ry={size * 0.28} fill="white" />
          </g>
        );
      })}
    </g>
  );
}

function Buildings({ frame, groundY }: { frame: number; groundY: number }) {
  const rng = seededRandom(55);
  return (
    <g>
      {Array.from({ length: 8 }).map((_, i) => {
        const x = i * 140 + rng() * 40;
        const h = 200 + rng() * 350;
        const w = 80 + rng() * 60;
        const buildingColor = `hsl(${220 + rng() * 30}, ${20 + rng() * 15}%, ${25 + rng() * 15}%)`;
        return (
          <g key={i}>
            <rect x={x} y={groundY - h} width={w} height={h} fill={buildingColor} rx={2} />
            {/* Windows */}
            {Array.from({ length: Math.floor(h / 35) }).map((_, row) => (
              Array.from({ length: Math.floor(w / 20) }).map((_, col) => {
                  const lit = rng() > 0.3;
                  return (
                    <rect key={`${row}-${col}`}
                      x={x + 8 + col * 18}
                      y={groundY - h + 15 + row * 32}
                      width={10} height={15} rx={1}
                      fill={lit ? `hsl(45, 80%, ${60 + Math.sin(frame * 0.02 + row + col) * 10}%)` : '#1A1A2E'}
                      opacity={lit ? 0.8 : 0.5}
                    />
                  );
                })
            ))}
            {/* Roof */}
            <rect x={x - 3} y={groundY - h - 3} width={w + 6} height={6} fill={buildingColor} rx={1} />
          </g>
        );
      })}
    </g>
  );
}

function Ground({ y, color, hasGrass }: { y: number; color: string; hasGrass: boolean }) {
  const rng = seededRandom(33);
  return (
    <g>
      <rect x={0} y={y} width={1080} height={1920 - y} fill={color} />
      {hasGrass && (
        <g>
          {Array.from({ length: 60 }).map((_, i) => {
            const gx = rng() * 1080;
            const gh = 10 + rng() * 25;
            return (
              <line key={i}
                x1={gx} y1={y}
                x2={gx + rng() * 6 - 3} y2={y - gh}
                stroke={`hsl(${100 + rng() * 40}, 60%, ${30 + rng() * 20}%)`}
                strokeWidth="2" strokeLinecap="round"
              />
            );
          })}
        </g>
      )}
    </g>
  );
}

// --------------------------------------------------
// Scene builder — picks elements based on keywords
// --------------------------------------------------

function hasElement(elements: string[], ...keywords: string[]) {
  const joined = elements.join(' ').toLowerCase();
  return keywords.some(k => joined.includes(k));
}

const Background: React.FC<BackgroundProps> = ({
  primaryColor, secondaryColor, accentColor, elements, lightingDirection, durationFrames,
}) => {
  const frame = useCurrentFrame();
  const parallax1 = interpolate(frame, [0, durationFrames], [0, -30]);
  const parallax2 = interpolate(frame, [0, durationFrames], [0, -60]);
  const parallax3 = interpolate(frame, [0, durationFrames], [0, -15]);

  const isNight = hasElement(elements, 'night', 'star', 'moon', 'dark', 'midnight', 'shadow');
  const hasOcean = hasElement(elements, 'ocean', 'sea', 'water', 'river', 'lake', 'wave');
  const hasForest = hasElement(elements, 'forest', 'tree', 'wood', 'jungle', 'plant', 'bloom', 'flower', 'garden');
  const hasMountains = hasElement(elements, 'mountain', 'peak', 'cliff', 'hill', 'canyon');
  const hasCity = hasElement(elements, 'city', 'building', 'tower', 'urban', 'ruin', 'castle');
  const hasSunrise = hasElement(elements, 'sunrise', 'sunset', 'dawn', 'sun', 'golden');
  const hasClouds = hasElement(elements, 'cloud', 'sky', 'storm');
  const hasSnow = hasElement(elements, 'snow', 'ice', 'frozen', 'winter');

  const groundY = hasOcean ? 1350 : 1400;

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    }}>
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} />
            <stop offset="70%" stopColor={secondaryColor} />
          </linearGradient>
          {/* Atmospheric haze */}
          <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={secondaryColor} stopOpacity="0" />
            <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Layer 0: Sky */}
        <rect x={0} y={0} width={1080} height={1920} fill="url(#skyGrad)" />

        {/* Night elements */}
        {isNight && (
          <g transform={`translate(${parallax3}, 0)`}>
            <Stars frame={frame} count={80} />
            <Moon frame={frame} />
          </g>
        )}

        {/* Day elements */}
        {hasSunrise && !isNight && (
          <g transform={`translate(${parallax3}, 0)`}>
            <Sun frame={frame} />
          </g>
        )}

        {/* Clouds */}
        {(hasClouds || (!isNight && !hasCity)) && (
          <g transform={`translate(0, ${parallax3})`}>
            <Clouds frame={frame} count={5} />
          </g>
        )}

        {/* Layer 1: Far mountains (parallax slow) */}
        {hasMountains && (
          <g transform={`translate(${parallax3}, ${parallax3 * 0.5})`}>
            <Mountains color={`${secondaryColor}99`} offset={0} height={600} />
          </g>
        )}

        {/* Layer 2: City / buildings */}
        {hasCity && (
          <g transform={`translate(${parallax2 * 0.5}, 0)`}>
            <Buildings frame={frame} groundY={groundY} />
          </g>
        )}

        {/* Layer 2b: Near mountains */}
        {hasMountains && (
          <g transform={`translate(${parallax2 * 0.3}, ${parallax2 * 0.2})`}>
            <Mountains color={`${primaryColor}CC`} offset={200} height={750} />
          </g>
        )}

        {/* Layer 3: Trees / forest */}
        {hasForest && (
          <g transform={`translate(${parallax2}, 0)`}>
            <Trees frame={frame} groundY={groundY} count={12} color={hasSnow ? '#E8E8E8' : ''} />
          </g>
        )}

        {/* Layer 4: Ground */}
        <Ground y={groundY} color={hasSnow ? '#E8E8E8' : hasOcean ? '#2E4057' : '#3D5A3A'}
          hasGrass={!hasOcean && !hasSnow && !hasCity} />

        {/* Layer 5: Water */}
        {hasOcean && <Water frame={frame} y={groundY + 30} accentColor={accentColor} />}

        {/* Atmospheric haze over everything */}
        <rect x={0} y={0} width={1080} height={1920} fill="url(#haze)" />

        {/* Ambient light from lightingDirection */}
        <rect x={0} y={0} width={1080} height={1920}
          fill={accentColor} opacity={0.04} />
      </svg>
    </div>
  );
};

export default Background;
