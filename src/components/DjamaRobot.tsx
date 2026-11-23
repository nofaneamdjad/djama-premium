"use client";

export type RobotState = "idle" | "greeting" | "thinking" | "chat";
export type RobotTheme = "light" | "dark" | "gold";

interface DjamaRobotProps {
  size?: number;
  state?: RobotState;
  theme?: RobotTheme;
  className?: string;
  reducedMotion?: boolean;
}

const THEMES = {
  light: { BF: "#1C1C1F", PF: "#141416", SF: 0.3,  AC: "#FFB900" },
  dark:  { BF: "#46464E", PF: "#2E2E36", SF: 0.95, AC: "#FFB900" },
  gold:  { BF: "#1A1A1A", PF: "rgba(0,0,0,0.6)", SF: 0.5, AC: "rgba(0,0,0,0.5)" },
} as const;

export default function DjamaRobot({
  size = 56,
  state = "idle",
  theme = "light",
  className = "",
  reducedMotion = false,
}: DjamaRobotProps) {
  const h = size;
  const w = Math.round(h * (160 / 192));
  const { BF, PF, SF, AC } = THEMES[theme];

  const cls = [
    "djama-robot-wrap",
    `djama-robot--${state}`,
    reducedMotion ? "djama-robot--reduced" : "",
    "inline-flex items-center justify-center",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls} aria-hidden="true">
      <svg
        viewBox="0 0 160 192"
        width={w}
        height={h}
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: "block" }}
      >
        <g className="r-robot">

          {/* Antenna */}
          <rect x="68" y="0" width="24" height="12" rx="4" fill={BF} stroke={AC} strokeWidth={0.5} strokeOpacity={0.6} />
          <circle cx="80" cy="2" r="4.5" fill={AC} className="r-antenna" />
          <circle cx="80" cy="2" r="2" fill={PF} />

          {/* Head group */}
          <g className="r-head">
            {/* Ear sensors */}
            <rect x="2" y="28" width="10" height="28" rx="4" fill={BF} stroke={AC} strokeWidth={0.4} strokeOpacity={0.5} />
            <rect x="2" y="34" width="10" height="6" rx="2" fill={AC} fillOpacity={0.35} />
            <rect x="148" y="28" width="10" height="28" rx="4" fill={BF} stroke={AC} strokeWidth={0.4} strokeOpacity={0.5} />
            <rect x="148" y="34" width="10" height="6" rx="2" fill={AC} fillOpacity={0.35} />

            {/* Head main */}
            <rect x="12" y="12" width="136" height="82" rx="12" fill={BF} stroke={AC} strokeWidth={0.5} strokeOpacity={SF} />
            <rect x="12" y="12" width="136" height="3" rx="12" fill={AC} fillOpacity={0.08} />

            {/* Eyebrows — adult expressivity marker */}
            <path d="M22,26 Q50,16 68,24" fill="none" stroke={AC} strokeWidth={2.4} strokeLinecap="round" className="r-brow-l" />
            <path d="M92,24 Q110,16 138,26" fill="none" stroke={AC} strokeWidth={2.4} strokeLinecap="round" className="r-brow-r" />

            {/* Left eye */}
            <rect x="22" y="28" width="46" height="34" rx="5" fill="#0A0A0A" />
            <circle cx="45" cy="45" r="12" fill="none" stroke={AC} strokeWidth={1.5} strokeOpacity={0.9} />
            <circle cx="45" cy="45" r="7.5" fill={AC} fillOpacity={0.92} className="r-eye-l" />
            <circle cx="45" cy="45" r="3" fill="#0A0A0A" />
            <line x1="24" y1="45" x2="66" y2="45" stroke={AC} strokeWidth={0.4} strokeOpacity={0.3} />

            {/* Right eye */}
            <rect x="92" y="28" width="46" height="34" rx="5" fill="#0A0A0A" />
            <circle cx="115" cy="45" r="12" fill="none" stroke={AC} strokeWidth={1.5} strokeOpacity={0.9} />
            <circle cx="115" cy="45" r="7.5" fill={AC} fillOpacity={0.92} className="r-eye-r" />
            <circle cx="115" cy="45" r="3" fill="#0A0A0A" />
            <line x1="94" y1="45" x2="136" y2="45" stroke={AC} strokeWidth={0.4} strokeOpacity={0.3} />

            {/* Mouth panel — LED segments */}
            <rect x="52" y="74" width="56" height="12" rx="5" fill="#070708" />
            <rect x="57" y="77" width="10" height="6" rx="3" fill={AC} fillOpacity={0.9} className="r-led-1" />
            <rect x="71" y="77" width="10" height="6" rx="3" fill={AC} fillOpacity={0.5} />
            <rect x="85" y="77" width="10" height="6" rx="3" fill={AC} fillOpacity={0.25} />
            <rect x="99" y="77" width="4" height="6" rx="2" fill={AC} fillOpacity={0.12} />

            {/* Thinking dots — hidden by default, animated in thinking state */}
            <circle cx="136" cy="16" r="3.5" fill={AC} className="r-think-dot" opacity={0} style={{ animationDelay: "0.1s" }} />
            <circle cx="146" cy="10" r="3.5" fill={AC} className="r-think-dot" opacity={0} style={{ animationDelay: "0.25s" }} />
            <circle cx="154" cy="4" r="3.5" fill={AC} className="r-think-dot" opacity={0} style={{ animationDelay: "0.4s" }} />
          </g>

          {/* Neck */}
          <rect x="62" y="94" width="36" height="20" rx="4" fill={PF} />
          <rect x="56" y="112" width="48" height="4" rx="2" fill={AC} fillOpacity={0.4} />

          {/* Body group */}
          <g className="r-body">
            {/* Left arm */}
            <g className="r-arm-l">
              <rect x="4" y="118" width="13" height="52" rx="6" fill={BF} stroke={AC} strokeWidth={0.4} strokeOpacity={SF} />
              <circle cx="10.5" cy="128" r="4" fill={PF} stroke={AC} strokeWidth={0.5} strokeOpacity={0.5} />
            </g>
            {/* Right arm — animated for wave */}
            <g className="r-arm-r-grp">
              <g className="r-arm-r">
                <rect x="143" y="118" width="13" height="52" rx="6" fill={BF} stroke={AC} strokeWidth={0.4} strokeOpacity={SF} />
                <circle cx="149.5" cy="128" r="4" fill={PF} stroke={AC} strokeWidth={0.5} strokeOpacity={0.5} />
              </g>
            </g>

            {/* Body main */}
            <rect x="17" y="118" width="126" height="68" rx="10" fill={BF} stroke={AC} strokeWidth={0.5} strokeOpacity={SF} />

            {/* Shoulder detail lines */}
            <line x1="17" y1="130" x2="42" y2="130" stroke={AC} strokeWidth={0.5} strokeOpacity={0.4} />
            <line x1="118" y1="130" x2="143" y2="130" stroke={AC} strokeWidth={0.5} strokeOpacity={0.4} />

            {/* Chest panel */}
            <rect x="38" y="128" width="84" height="50" rx="7" fill={PF} stroke={AC} strokeWidth={0.4} strokeOpacity={0.55} />

            {/* Power ring */}
            <circle cx="80" cy="150" r="12" fill="none" stroke={AC} strokeWidth={1.4} strokeOpacity={0.6} />
            <circle cx="80" cy="150" r="8" fill={AC} fillOpacity={0.92} />
            <circle cx="80" cy="150" r="3.5" fill={PF} />
            <circle cx="80" cy="150" r="1.5" fill={AC} />

            {/* Circuit traces */}
            <path d="M44 162 L44 168 L58 168" fill="none" stroke={AC} strokeWidth={0.6} strokeOpacity={0.5} strokeLinecap="round" />
            <circle cx="58" cy="168" r="1.5" fill={AC} fillOpacity={0.5} />
            <path d="M116 162 L116 168 L102 168" fill="none" stroke={AC} strokeWidth={0.6} strokeOpacity={0.5} strokeLinecap="round" />
            <circle cx="102" cy="168" r="1.5" fill={AC} fillOpacity={0.5} />

            {/* Status bar */}
            <rect x="46" y="172" width="68" height="3.5" rx="1.75" fill="#0A0A0A" />
            <rect x="46" y="172" width="42" height="3.5" rx="1.75" fill={AC} fillOpacity={0.65} />

            {/* Base */}
            <rect x="30" y="184" width="100" height="8" rx="4" fill={PF} stroke={AC} strokeWidth={0.3} strokeOpacity={0.4} />
          </g>

          {/* Chat bubble — hidden by default, shown in chat state */}
          <g className="r-chat-bubble" opacity={0}>
            <rect x="88" y="2" width="68" height="34" rx="8" fill={AC} />
            <polygon points="96,36 88,44 108,36" fill={AC} />
            <rect x="94" y="10" width="40" height="4" rx="2" fill={PF} fillOpacity={0.5} />
            <rect x="94" y="18" width="28" height="4" rx="2" fill={PF} fillOpacity={0.3} />
            <circle cx="140" cy="12" r="3" fill={PF} fillOpacity={0.3} />
          </g>

        </g>
      </svg>
    </span>
  );
}
