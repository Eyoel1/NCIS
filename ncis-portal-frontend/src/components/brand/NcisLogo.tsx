import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
  subtitle?: boolean;
}

export const NcisLogo: React.FC<LogoProps> = ({
  className = '',
  size = 40,
  showText = true,
  subtitle = true,
}) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
        role="img"
        aria-label="NCIS Portal Logo"
      >
        <defs>
          <linearGradient id="ncisShieldGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </linearGradient>
          <linearGradient id="corridorGold" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
          <linearGradient id="cyanLine" x1="0" y1="0" x2="100" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Shield Hexagon Outer */}
        <polygon
          points="50,6 88,24 88,72 50,94 12,72 12,24"
          fill="url(#ncisShieldGrad)"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Inner Shield Border */}
        <polygon
          points="50,14 80,29 80,67 50,86 20,67 20,29"
          fill="#0a1426"
          stroke="#1e3a5f"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Maritime Vessel Bow / Anchor Wave at Base */}
        <path
          d="M32 64 C42 70, 58 70, 68 64 L65 69 C56 74, 44 74, 35 69 Z"
          fill="url(#cyanLine)"
          opacity="0.9"
        />

        {/* Inland Highway / Rail Corridor Converging Lines */}
        <path
          d="M48 38 L30 62 L38 62 L50 46 L62 62 L70 62 L52 38 Z"
          fill="url(#cyanLine)"
          opacity="0.85"
        />
        {/* Center Golden Transit Track */}
        <polygon
          points="49,38 51,38 53,62 47,62"
          fill="url(#corridorGold)"
        />

        {/* Stylized Modern Car Silhouette / Roofline */}
        <path
          d="M36 49 C39 42, 45 38, 50 38 C55 38, 61 42, 64 49 L68 53 C69 54, 69 56, 67 56 L33 56 C31 56, 31 54, 32 53 Z"
          fill="#ffffff"
          opacity="0.95"
        />
        {/* Headlights (Cyan/Sky) */}
        <circle cx="37" cy="54" r="1.5" fill="#38bdf8" />
        <circle cx="63" cy="54" r="1.5" fill="#38bdf8" />

        {/* National Verification Star at Top Apex */}
        <polygon
          points="50,18 52,24 58,24 53,28 55,34 50,30 45,34 47,28 42,24 48,24"
          fill="#fbbf24"
        />
      </svg>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black tracking-wider text-white">NCIS</span>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-400 bg-sky-950/80 px-1.5 py-0.5 rounded border border-sky-800/60">
              Portal
            </span>
          </div>
          {subtitle && (
            <span className="text-[10px] font-medium tracking-tight text-slate-400">
              National Car Import Supply Chain • Ethiopia
            </span>
          )}
        </div>
      )}
    </div>
  );
};
