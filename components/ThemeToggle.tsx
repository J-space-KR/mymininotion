"use client";

import { Button } from "@/components/ds/Button";
import { setTheme, useTheme } from "@/lib/store";

/** 상단바 오른쪽의 다크/라이트 전환 버튼. 아이콘은 눌렀을 때 바뀔 모드를 보여 준다. */
export function ThemeToggle() {
  const theme = useTheme();
  const next = theme === "dark" ? "light" : "dark";
  const label = next === "light" ? "밝은 화면으로 바꾸기" : "어두운 화면으로 바꾸기";
  return (
    <Button
      variant="ghost"
      size="sm"
      icon={next === "light" ? "sun" : "moon"}
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
    />
  );
}
