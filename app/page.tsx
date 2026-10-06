"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Badge } from "@/components/ds/Badge";
import { Button } from "@/components/ds/Button";
import { signInWithGoogle, useStore } from "@/lib/store";

// 1a 로그인 페이지 · L-1, L-2
export default function LoginPage() {
  const state = useStore();
  const router = useRouter();
  const signedIn = !!state?.user;

  useEffect(() => {
    if (signedIn) router.replace("/workspace");
  }, [signedIn, router]);

  function login() {
    signInWithGoogle();
    router.push("/workspace");
  }

  return (
    <div className="login">
      <div className="login__bar">
        <span className="wordmark" style={{ fontSize: 18 }}>MINI NOTION</span>
        <span className="muted">v0.1</span>
      </div>
      <main className="login__main">
        <Badge tone="soft" pill>나만의 무료 업무 도구</Badge>
        <h1 className="login__title">
          Mini
          <br />
          <span style={{ color: "var(--volt-300)" }}>Notion</span>
        </h1>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.5, color: "var(--ink-700)" }}>
          필요한 기능만 담았어요. 적고, 찾고, 지우기.
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 8 }}>
          <Button variant="white" size="lg" onClick={login} disabled={state === null} style={{ minWidth: 300 }}>
            <span className="g-mark">G</span>
            구글로 로그인
          </Button>
          <span style={{ fontSize: 13, color: "var(--ink-500)" }}>한 번 로그인하면 다음부터 바로 열려요</span>
        </div>
      </main>
      <footer className="login__foot">
        <span>1인 전용 · 공유 기능 없음</span>
        <span>© 미니 노션</span>
      </footer>
    </div>
  );
}
