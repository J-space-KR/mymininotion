import type { CSSProperties } from "react";

// Volt DS Icon — Lucide glyphs rendered as a CSS mask so they take `color`.
const CDN = "https://unpkg.com/lucide-static@0.460.0/icons/";

type IconProps = {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 16, color = "currentColor", style }: IconProps) {
  const url = `url(${CDN}${name}.svg)`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block",
        flex: "none",
        width: size,
        height: size,
        background: color,
        WebkitMask: `${url} center/contain no-repeat`,
        mask: `${url} center/contain no-repeat`,
        ...style,
      }}
    />
  );
}
