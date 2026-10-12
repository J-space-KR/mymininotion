"use client";

import { useParams, useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { CharCounter } from "@/components/CharCounter";
import { CoverImage } from "@/components/CoverImage";
import { Button } from "@/components/ds/Button";
import { Icon } from "@/components/ds/Icon";
import { Input } from "@/components/ds/Input";
import { parseTarget } from "@/lib/charCount";
import { deletePage, monthDay, savePage, type Page } from "@/lib/store";

const AUTOSAVE_MS = 1000;
// Ids deleted from this tab — skips the "not found" flash while navigating back to the list.
const justDeleted = new Set<string>();

// 1d 글 상세 (W-4) · 1e 삭제 확인 (W-5)
export default function DetailPage() {
  const { id } = useParams<{ id: string }>();
  return (
    <AuthGate>
      {({ pages }) => {
        const page = pages.find((p) => p.id === id);
        if (page) return <Editor key={page.id} page={page} />;
        return justDeleted.has(id) ? null : <NotFound />;
      }}
    </AuthGate>
  );
}

function useAutosize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return ref;
}

function Editor({ page }: { page: Page }) {
  const router = useRouter();
  const [title, setTitle] = useState(page.title);
  const [content, setContent] = useState(page.content);
  const [targetText, setTargetText] = useState(page.targetLength == null ? "" : String(page.targetLength));
  const [dirty, setDirty] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const titleRef = useAutosize(title);
  const bodyRef = useAutosize(content);
  // 긴 글에서도 입력 반영이 먼저, 글자 수 갱신은 바로 뒤에.
  const countedContent = useDeferredValue(content);
  const target = parseTarget(targetText);
  const targetLength = target.value;
  const latest = useRef({ title, content, targetLength, dirty });
  latest.current = { title, content, targetLength, dirty };

  // New, empty page → start typing the title right away.
  useEffect(() => {
    if (!page.title && !page.content) titleRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced auto-save.
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      savePage(page.id, { title, content, targetLength });
      setDirty(false);
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [dirty, title, content, targetLength, page.id]);

  // Flush pending edits when leaving the page.
  useEffect(() => {
    return () => {
      const { title, content, targetLength, dirty } = latest.current;
      if (dirty) savePage(page.id, { title, content, targetLength });
    };
  }, [page.id]);

  function remove() {
    justDeleted.add(page.id);
    router.replace("/workspace");
    deletePage(page.id);
  }

  return (
    <div className="app">
      <header className="topbar topbar--tight">
        <Button variant="ghost" size="sm" icon="arrow-left" href="/workspace">목록</Button>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="save-state" aria-live="polite">
            <span className="dot" style={{ background: dirty ? "var(--ink-500)" : "var(--green-500)" }} />
            {dirty ? "저장 중…" : "저장됨"}
          </span>
          <Button variant="secondary" size="sm" icon="trash-2" onClick={() => setConfirming(true)}>삭제</Button>
        </div>
      </header>

      <main className="container doc" style={{ maxWidth: 752 }}>
        <CoverImage />
        <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{monthDay(page.updatedAt)} 수정</span>
        <textarea
          ref={titleRef}
          className="doc__title"
          rows={1}
          value={title}
          placeholder="제목을 입력하세요"
          aria-label="제목"
          onChange={(e) => {
            setTitle(e.target.value.replace(/\n/g, ""));
            setDirty(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) {
              e.preventDefault();
              bodyRef.current?.focus();
            }
          }}
        />
        <Input
          label="목표 글자 수"
          inputMode="numeric"
          placeholder="예: 1,000"
          value={targetText}
          hint={target.error ?? "비워 두면 글자 수만 보여요"}
          style={{ maxWidth: 240 }}
          onChange={(e) => {
            setTargetText(e.target.value);
            setDirty(true);
          }}
        />
        <div className="rule" />
        <textarea
          ref={bodyRef}
          className="doc__body"
          value={content}
          placeholder="내용을 입력하세요..."
          aria-label="내용"
          onChange={(e) => {
            setContent(e.target.value);
            setDirty(true);
          }}
        />
        <CharCounter content={countedContent} target={targetLength} />
      </main>

      {confirming && (
        <DeleteDialog title={title || "제목 없음"} onCancel={() => setConfirming(false)} onConfirm={remove} />
      )}
    </div>
  );
}

function DeleteDialog({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: () => void }) {
  const confirmRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    confirmRef.current?.querySelector<HTMLButtonElement>("button:last-child")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="scrim" onClick={onCancel}>
      <div
        className="dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="del-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div className="danger-icon"><Icon name="trash-2" size={18} /></div>
          <h3 id="del-title">정말 삭제할까요?</h3>
          <p>‘{title}’를 지우면 되살릴 수 없어요.</p>
        </div>
        <div ref={confirmRef} style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={onCancel}>취소</Button>
          <Button variant="white" onClick={onConfirm}>삭제하기</Button>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="center-msg">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <p style={{ margin: 0 }}>글을 찾을 수 없어요. 이미 삭제됐을 수 있어요.</p>
        <Button variant="secondary" icon="arrow-left" href="/workspace">내 업무로</Button>
      </div>
    </div>
  );
}
