"use client";

import { useSyncExternalStore } from "react";

// MVP mock backend: session + pages live in localStorage.
// Swap these functions for Supabase calls later (PRD §7.3) — the pages only use this API.

export type User = {
  email: string;
  nickname: string;
  avatarUrl: string | null;
};

export type Page = {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  /** 목표 글자 수. 1 이상의 안전한 정수 또는 null. 없으면(예전 글) 목표 없음으로 읽는다. */
  targetLength?: number | null;
};

export type State = {
  user: User | null;
  pages: Page[];
};

const KEY = "mini-notion:v1";
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let state: State | null = null;
const listeners = new Set<() => void>();

function read(): State {
  if (state) return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as State) : { user: null, pages: [] };
  } catch {
    state = { user: null, pages: [] };
  }
  return state;
}

function write(next: State) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked — keep the in-memory state so the session still works.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Returns null during SSR / before hydration, then the persisted state. */
export function useStore(): State | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

function newId() {
  return Math.random().toString(36).slice(2, 10);
}

function seedPages(): Page[] {
  const now = Date.now();
  const rows: [string, number, string][] = [
    [
      "주간 회의 정리",
      0,
      "1. 지난주 진행 상황 공유\n   — 구글 로그인, 로그인 유지 완료\n   — /page 새 글 만들기 1초 이내 확인\n\n2. 이번 주 할 일\n   — 마이 페이지 별명·이미지 변경\n   — 글 삭제 확인 창\n\n3. 메모\n   — 자동 저장 간격은 1초로 시작",
    ],
    ["이번 달 할 일", 2 * HOUR, "마이 페이지 이미지 업로드, 자동 저장 테스트, 배포"],
    ["아이디어 메모", DAY, "/todo 명령어로 체크리스트 만들기 — 2단계 후보"],
    ["", 3 * DAY, ""],
    ["Supabase 설정 기록", 7 * DAY, "RLS 정책: 자기 글만 select / update / delete"],
  ];
  return rows.map(([title, ago, content]) => ({
    id: newId(),
    title,
    content,
    createdAt: now - ago,
    updatedAt: now - ago,
  }));
}

// ── Auth (L-1 ~ L-3, M-3) ──

export function signInWithGoogle() {
  const s = read();
  write({
    user: { email: "gildong.hong@gmail.com", nickname: "홍길동", avatarUrl: null },
    pages: s.pages.length ? s.pages : seedPages(),
  });
}

export function signOut() {
  write({ ...read(), user: null });
}

export function updateProfile(patch: Partial<Omit<User, "email">>) {
  const s = read();
  if (!s.user) return;
  write({ ...s, user: { ...s.user, ...patch } });
}

// ── Pages (W-1 ~ W-5) ──

export function sortedPages(pages: Page[]) {
  return [...pages].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createPage(): string {
  const s = read();
  const now = Date.now();
  const page: Page = { id: newId(), title: "", content: "", createdAt: now, updatedAt: now };
  write({ ...s, pages: [page, ...s.pages] });
  return page.id;
}

export function savePage(
  id: string,
  patch: Pick<Page, "title" | "content"> & { targetLength?: number | null },
) {
  const s = read();
  write({
    ...s,
    pages: s.pages.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
  });
}

export function deletePage(id: string) {
  const s = read();
  write({ ...s, pages: s.pages.filter((p) => p.id !== id) });
}

// ── Formatting ──

export function relativeTime(ts: number, now = Date.now()) {
  const diff = now - ts;
  if (diff < MIN) return "방금";
  if (diff < HOUR) return `${Math.floor(diff / MIN)}분 전`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`;
  if (diff < 2 * DAY) return "어제";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전`;
  return monthDay(ts);
}

export function monthDay(ts: number) {
  const d = new Date(ts);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}
