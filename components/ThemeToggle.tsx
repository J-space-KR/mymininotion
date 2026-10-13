"use client";

import { Button } from "@/components/ds/Button";
import { setTheme, useTheme } from "@/lib/store";
import type { Theme } from "@/lib/theme";

const OPTIONS: { theme: Theme; label: string }[] = [
  { theme: "dark", label: "다크" },
  { theme: "pc", label: "PC통신" },
];

/** 상단바의 화면 모드 전환. 두 모드를 글자로 나란히 보여 주고, 지금 모드를 white 버튼으로 강조한다. */
export function ThemeToggle() {
  const current = useTheme();
  return (
    <div className="theme-switch" role="group" aria-label="화면 모드">
      {OPTIONS.map(({ theme, label }) => (
        <Button
          key={theme}
          variant={theme === current ? "white" : "ghost"}
          size="sm"
          aria-pressed={theme === current}
          onClick={() => setTheme(theme)}
        >
          {label}
          <span className="theme-switch__suffix"> 모드</span>
        </Button>
      ))}
    </div>
  );
}
