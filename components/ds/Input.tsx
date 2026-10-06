import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: ReactNode;
  icon?: string;
};

export function Input({ label, hint, icon, style, ...rest }: InputProps) {
  return (
    <label className="vt-field" style={style}>
      {label && <span className="vt-field__label">{label}</span>}
      <span className="vt-input">
        {icon && <Icon name={icon} size={16} />}
        <input {...rest} />
      </span>
      <span className="vt-field__hint">{hint}</span>
    </label>
  );
}
