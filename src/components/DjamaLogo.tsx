"use client";

import Image from "next/image";

interface Props {
  /** true = fond sombre (lettres blanches + j jaune), false = fond clair (lettres noires + j jaune) */
  dark?: boolean;
  /** Hauteur en px — largeur calculée automatiquement (ratio 1600:533) */
  size?: number;
  className?: string;
}

export default function DjamaLogo({ dark = false, size = 36, className = "" }: Props) {
  const src    = dark ? "/djama-logo-white-v2.png" : "/djama-logo-v2.png";
  const height = size;
  const width  = Math.round(size * (1600 / 533));

  return (
    <Image
      src={src}
      alt="DJAMA"
      width={width}
      height={height}
      className={`object-contain select-none ${className}`}
      style={{ height, width: "auto" }}
    />
  );
}
