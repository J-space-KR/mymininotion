import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type Variant = "primary" | "white" | "secondary" | "ghost" | "soft";
type Size = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: string;
  iconRight?: string;
  block?: boolean;
  /** Renders a Next.js <Link> with button styling instead of a <button>. */
  href?: string;
  children?: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  block,
  href,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = `vt-btn vt-btn--${variant} vt-btn--${size}${block ? " vt-btn--block" : ""} ${className}`;
  const is = size === "sm" ? 14 : 18;
  const inner = (
    <>
      {icon && <Icon name={icon} size={is} />}
      {children}
      {iconRight && <Icon name={iconRight} size={is} />}
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...rest}>
      {inner}
    </button>
  );
}
