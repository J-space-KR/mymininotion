"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { Avatar } from "@/components/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ds/Icon";
import { createPage, relativeTime, sortedPages, type Page, type User } from "@/lib/store";

const COMMANDS = [{ name: "page", label: "새 글", desc: "빈 글을 만들고 바로 열어요", icon: "file-plus" }];

// 1b 업무 페이지 (W-1, W-3) · 1c /page 입력 (W-2)
export default function WorkspacePage() {
  return <AuthGate>{({ user, pages }) => <Workspace user={user} pages={pages} />}</AuthGate>;
}

function Workspace({ user, pages }: { user: User; pages: Page[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState("");
  const list = sortedPages(pages);

  // The box already shows a "/" glyph, so a typed leading slash is optional.
  const query = value.replace(/^\//, "").trim().toLowerCase();
  const menuOpen = value.length > 0;
  const matches = COMMANDS.filter((c) => c.name.startsWith(query));

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function runPage() {
    const id = createPage();
    router.push(`/pages/${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") setValue("");
    if (e.key === "Enter" && !e.nativeEvent.isComposing && matches.length > 0) {
      e.preventDefault();
      runPage();
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <Link href="/workspace" className="wordmark">MINI NOTION</Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle />
          <Link href="/me" className="profile-pill" aria-label="마이 페이지">
            <span className="profile-pill__name">{user.nickname}</span>
            <Avatar user={user} size={30} />
          </Link>
        </div>
      </header>

      <main className="container" style={{ maxWidth: 792, paddingTop: 56, paddingBottom: 80, display: "flex", flexDirection: "column", gap: 28 }}>
        <div className="page-head">
          <h2>내 업무</h2>
          <span className="muted">글 {list.length}개 · 최근 수정 순</span>
        </div>

        <div className="cmd">
          <div className="cmd__box">
            <span className="cmd__slash">/</span>
            <input
              ref={inputRef}
              className="cmd__input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="page 입력 후 Enter — 새 글 만들기"
              aria-label="명령어 입력"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="kbd">⌘K</span>
          </div>
          {menuOpen && (
            <div className="cmd__menu" role="listbox">
              <div className="cmd__menu-label">명령어</div>
              {matches.length === 0 && <div className="cmd__empty">일치하는 명령어가 없어요</div>}
              {matches.map((c, i) => (
                <button
                  key={c.name}
                  type="button"
                  role="option"
                  aria-selected={i === 0}
                  className="cmd__item"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={runPage}
                >
                  <span className="cmd__icon"><Icon name={c.icon} size={16} /></span>
                  <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>
                      <span className="mono-accent">/{c.name}</span> {c.label}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{c.desc}</span>
                  </span>
                  <span className="kbd" style={{ color: "var(--text-accent)", boxShadow: "inset 0 0 0 1px var(--border-accent)" }}>
                    Enter ↵
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {list.length === 0 ? (
          <div className="empty">
            아직 글이 없어요.
            <br />
            <span className="mono-accent">/page</span> 를 입력하고 Enter를 눌러 첫 글을 만들어 보세요.
          </div>
        ) : (
          <nav className={`list${menuOpen ? " list--dim" : ""}`} aria-label="글 목록">
            {list.map((p) => (
              <Link key={p.id} href={`/pages/${p.id}`} className="row">
                <Icon name="file-text" size={18} color="var(--text-secondary)" />
                <span className="row__text">
                  <span className={`row__title${p.title ? "" : " row__title--empty"}`}>{p.title || "제목 없음"}</span>
                  <span className="row__snippet">{p.content.split("\n").find((l) => l.trim()) || "내용 없음"}</span>
                </span>
                <span className="row__time">{relativeTime(p.updatedAt)}</span>
              </Link>
            ))}
          </nav>
        )}
      </main>
    </div>
  );
}
