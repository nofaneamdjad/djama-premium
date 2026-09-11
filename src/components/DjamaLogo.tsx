"use client";

interface Props {
  /** true = footer sombre (lettres blanches + j jaune), false = navbar claire (lettres noires + j jaune) */
  dark?: boolean;
  /** Hauteur en px */
  size?: number;
  className?: string;
}

const YELLOW = "#f5a623"; // couleur exacte du "j" dans le logo original

export default function DjamaLogo({ dark = false, size = 36, className = "" }: Props) {
  const color = dark ? "#ffffff" : "#1a1a1a";

  return (
    <span
      role="img"
      aria-label="DJAMA"
      className={`inline-flex items-baseline select-none ${className}`}
      style={{
        fontFamily: "'Baloo 2', 'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        color,
      }}
    >
      d
      <span style={{ color: YELLOW }}>j</span>
      ama
    </span>
  );
}
