"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ds/Badge";
import { Button } from "@/components/ds/Button";
import { signInWithGoogle, useStore } from "@/lib/store";

// 1a 로그인 페이지 · L-1, L-2
export default function LoginPage() {
  const state = useStore();
  const router = useRouter();
  const signedIn = !!state?.user;
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (signedIn) router.replace("/workspace");
  }, [signedIn, router]);

  // L-1: 구글 로그인 창으로 이동한다. 돌아오면 위 effect가 업무 페이지로 보낸다.
  async function login() {
    setPending(true);
    setFailed(false);
    try {
      await signInWithGoogle();
    } catch {
      setPending(false);
      setFailed(true);
    }
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
          <Button variant="white" size="lg" onClick={login} disabled={state === null || pending} style={{ minWidth: 300 }}>
            <span className="g-mark">G</span>
            구글로 로그인
          </Button>
          <span role="status" style={{ fontSize: 13, color: failed ? "var(--text-secondary)" : "var(--ink-500)" }}>
            {failed ? "로그인하지 못했어요. 잠시 후 다시 눌러 주세요" : "한 번 로그인하면 다음부터 바로 열려요"}
          </span>
        </div>
      </main>
      <footer className="login__foot">
        <span>1인 전용 · 공유 기능 없음</span>
        <span>© 미니 노션</span>
      </footer>
    </div>
  );
}
