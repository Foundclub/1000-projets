"use client";

interface WaveSeparatorProps {
  className?: string;
  height?: number;
  flip?: boolean;
}

export function WaveSeparator({ className = "", height = 40, flip = false }: WaveSeparatorProps) {
  const viewBox = `0 0 1200 ${height}`;
  const path = flip
    ? `M0,${height} C300,${height * 0.2} 600,${height * 0.8} 900,${height * 0.5} C1050,${height * 0.3} 1150,${height * 0.7} 1200,${height * 0.5} L1200,${height} L0,${height} Z`
    : `M0,0 C300,${height * 0.8} 600,${height * 0.2} 900,${height * 0.5} C1050,${height * 0.7} 1150,${height * 0.3} 1200,${height * 0.5} L1200,0 L0,0 Z`;

  return (
    <div className={`w-full overflow-hidden -my-2 ${className}`} style={{ height: `${height}px`, marginTop: '-20px', marginBottom: '-20px' }}>
      <svg
        viewBox={viewBox}
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ display: 'block' }}
      >
        <defs>
          <linearGradient id={`waveGradient-${flip ? 'flip' : 'normal'}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
            <stop offset="25%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.25" />
            <stop offset="75%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        <path
          d={path}
          fill={`url(#waveGradient-${flip ? 'flip' : 'normal'})`}
          className="transition-all duration-700"
        />
      </svg>
    </div>
  );
}

