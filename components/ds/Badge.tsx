import type { CSSProperties, ReactNode } from "react";
import { Icon } from "./Icon";

const TONES: Record<string, CSSProperties> = {
  new: { background: "var(--volt-300)", color: "#000" },
  hot: { background: "var(--pink-500)", color: "#fff" },
  soft: { background: "var(--volt-800)", color: "var(--volt-300)", boxShadow: "inset 0 0 0 1px var(--volt-700)" },
  neutral: { background: "var(--ink-300)", color: "var(--ink-800)" },
  dark: { background: "rgba(0,0,0,.55)", color: "#fff" },
};

type BadgeProps = {
  tone?: keyof typeof TONES;
  icon?: string;
  pill?: boolean;
  children?: ReactNode;
  style?: CSSProperties;
};

export function Badge({ tone = "new", icon, pill, children, style }: BadgeProps) {
  const pillish = pill || tone === "soft";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        height: pillish ? 26 : 18,
        padding: pillish ? "0 10px" : "0 6px",
        borderRadius: pillish ? 999 : 4,
        fontWeight: 800,
        fontSize: pillish ? 13 : 11,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        ...TONES[tone],
        ...style,
      }}
    >
      {icon && <Icon name={icon} size={pillish ? 13 : 11} />}
      {children}
    </span>
  );
}
