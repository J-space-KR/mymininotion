"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/ds/Button";
import { Input } from "@/components/ds/Input";
import { saveNickname as saveNicknameToStore, signOut, updateProfile, type User } from "@/lib/store";

// 1f 마이 페이지 · M-1 별명, M-2 이미지, M-3 로그아웃
export default function MyPage() {
  return <AuthGate>{({ user }) => <Profile user={user} />}</AuthGate>;
}

/** Downscale to a 256px square JPEG data URL so it fits comfortably in localStorage. */
function toAvatarDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const side = Math.min(img.width, img.height);
      canvas
        .getContext("2d")!
        .drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(img.src);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function Profile({ user }: { user: User }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [nickname, setNickname] = useState(user.nickname);
  const [hint, setHint] = useState("처음엔 구글 이름을 써요");
  const [saving, setSaving] = useState(false);
  const trimmed = nickname.trim();
  const canSave = !saving && trimmed.length > 0 && trimmed !== user.nickname;

  // M-1: 별명은 Supabase profile에 저장한다. 실패하면 입력은 그대로 두고 다시 누르게 한다.
  async function saveNickname(e?: React.FormEvent) {
    e?.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setHint("저장 중…");
    try {
      await saveNicknameToStore(trimmed);
      setNickname(trimmed);
      setHint("저장했어요");
    } catch {
      setHint("저장하지 못했어요. 잠시 후 다시 눌러 주세요");
    } finally {
      setSaving(false);
    }
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      updateProfile({ avatarUrl: await toAvatarDataUrl(file) });
    } catch {
      setHint("이미지를 읽지 못했어요. 다른 파일을 골라 주세요");
    }
  }

  function logout() {
    signOut();
    router.replace("/");
  }

  return (
    <div className="app">
      <header className="topbar topbar--tight">
        <Button variant="ghost" size="sm" icon="arrow-left" href="/workspace">내 업무</Button>
        <Link href="/workspace" className="wordmark">MINI NOTION</Link>
        <span style={{ width: 90 }} />
      </header>

      <main className="container" style={{ maxWidth: 552, paddingTop: 72, paddingBottom: 80, display: "flex", flexDirection: "column", gap: 32 }}>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em" }}>마이 페이지</h2>

        <div className="profile-card">
          <Avatar user={user} size={96} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start", minWidth: 0 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>{user.nickname}</span>
              <span className="muted">{user.email}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" icon="image" onClick={() => fileRef.current?.click()}>이미지 변경</Button>
              {user.avatarUrl && (
                <Button variant="ghost" size="sm" onClick={() => updateProfile({ avatarUrl: null })}>기본으로</Button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
          </div>
        </div>

        <form onSubmit={saveNickname} style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input
              label="별명"
              value={nickname}
              maxLength={20}
              onChange={(e) => {
                setNickname(e.target.value);
                setHint("처음엔 구글 이름을 써요");
              }}
              hint={hint}
            />
          </div>
          <div style={{ paddingBottom: 24 }}>
            <Button type="submit" variant="primary" disabled={!canSave}>저장</Button>
          </div>
        </form>

        <div style={{ height: 1, background: "var(--border-subtle)" }} />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <span style={{ fontSize: 14, color: "var(--ink-600)" }}>이 기기에서 로그인 상태를 끝내요</span>
          <Button variant="ghost" icon="log-out" onClick={logout}>로그아웃</Button>
        </div>
      </main>
    </div>
  );
}
