"use client";

import { useMemo } from "react";
import { countChars, formatCount, overBy } from "@/lib/charCount";

/** 글 내용의 글자 수를 공백 포함 · 공백 제외 두 줄로 보여준다. 목표가 있으면 진행과 초과도 함께. */
export function CharCounter({ content, target }: { content: string; target: number | null }) {
  const { withSpaces, withoutSpaces } = useMemo(() => countChars(content), [content]);
  return (
    // aria-live는 쓰지 않는다: 글자마다 숫자를 읽어 입력을 방해하지 않게 (FR-008).
    <div className="doc-count" role="group" aria-label="글자 수">
      <CountLine label="공백 포함" count={withSpaces} target={target} />
      <CountLine label="공백 제외" count={withoutSpaces} target={target} />
    </div>
  );
}

function CountLine({ label, count, target }: { label: string; count: number; target: number | null }) {
  const over = overBy(count, target);
  const progress = target === null ? formatCount(count) : `${formatCount(count)} / ${formatCount(target)}`;
  return (
    <span className={over > 0 ? "doc-count__line doc-count__line--over" : "doc-count__line"}>
      {`${label} ${progress}자${over > 0 ? ` · ${formatCount(over)}자 초과` : ""}`}
    </span>
  );
}
