import type { ReactNode, TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: ReactNode;
};

/** Input의 여러 줄 버전. 라벨·힌트 구조와 모양은 Input과 같다. */
export function Textarea({ label, hint, style, rows = 4, ...rest }: TextareaProps) {
  return (
    <label className="vt-field" style={style}>
      {label && <span className="vt-field__label">{label}</span>}
      <span className="vt-input vt-input--multiline">
        <textarea rows={rows} {...rest} />
      </span>
      <span className="vt-field__hint">{hint}</span>
    </label>
  );
}
