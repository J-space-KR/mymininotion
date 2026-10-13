"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// Login uses real Supabase Auth (Google). The nickname lives in the Supabase `profile` table
// (`name`, one row per user, created by a DB trigger on first login) and is cached in localStorage.
// Pages and the avatar still live in localStorage until they move to Supabase (PRD §7.3).

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

/** What localStorage keeps. `profile` survives sign-out so nickname/avatar edits aren't lost. */
type Saved = {
  profile: User | null;
  pages: Page[];
};

const KEY = "mini-notion:v1";
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

let saved: Saved | null = null;
let state: State | null = null;
/** Email of the Supabase session, null when signed out. */
let sessionEmail: string | null = null;
/** auth.users id of the session — profile.user_id points to it. */
let sessionUserId: string | null = null;
/** False until Supabase has told us whether a session exists (avoids a wrong redirect on reload). */
let authReady = false;
let authStarted = false;
const listeners = new Set<() => void>();

function load(): Saved {
  if (saved) return saved;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Saved> & { user?: User | null }) : {};
    // Older saves stored the mock user under `user`.
    saved = { profile: parsed.profile ?? parsed.user ?? null, pages: parsed.pages ?? [] };
  } catch {
    saved = { profile: null, pages: [] };
  }
  return saved;
}

function read(): State {
  if (state) return state;
  const s = load();
  const user = sessionEmail && s.profile?.email === sessionEmail ? s.profile : null;
  state = { user, pages: s.pages };
  return state;
}

function save(next: Saved) {
  saved = next;
  state = null;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked — keep the in-memory state so the session still works.
  }
  listeners.forEach((l) => l());
}

function write(next: State) {
  const s = load();
  save({ profile: next.user ?? s.profile, pages: next.pages });
}

function applySession(session: Session | null) {
  authReady = true;
  const authUser = session?.user;
  sessionEmail = authUser?.email ?? null;
  sessionUserId = authUser?.id ?? null;
  if (!authUser || !sessionEmail) {
    state = null;
    listeners.forEach((l) => l());
    return;
  }
  const s = load();
  const meta = authUser.user_metadata ?? {};
  const profile: User =
    s.profile?.email === sessionEmail
      ? s.profile
      : {
          email: sessionEmail,
          nickname: meta.full_name || meta.name || sessionEmail.split("@")[0],
          avatarUrl: meta.avatar_url || meta.picture || null,
        };
  save({ profile, pages: s.pages.length ? s.pages : seedPages() });
  void loadProfileName(authUser.id);
}

/** M-1: the nickname saved in Supabase wins over the local copy (it may have changed on another device). */
async function loadProfileName(userId: string) {
  const { data, error } = await supabase.from("profile").select("name").eq("user_id", userId).maybeSingle();
  if (error || !data?.name || sessionUserId !== userId) return;
  const s = load();
  if (s.profile && s.profile.nickname !== data.name) {
    save({ ...s, profile: { ...s.profile, nickname: data.name } });
  }
}

/** Starts listening to Supabase Auth once. Fires INITIAL_SESSION after restoring the session
 *  (and after finishing the Google redirect, when the URL carries a login code). */
function startAuth() {
  if (authStarted) return;
  authStarted = true;
  supabase.auth.onAuthStateChange((_event, session) => applySession(session));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  startAuth();
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      saved = null;
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

function snapshot(): State | null {
  return authReady ? read() : null;
}

/** Returns null during SSR and until the login state is known, then the state. */
export function useStore(): State | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
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

/** L-1: sends the browser to Google. After login, Google → Supabase → back to "/" (then /workspace). */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/` },
  });
  if (error) throw error;
}

export async function signOut() {
  sessionEmail = null;
  sessionUserId = null;
  state = null;
  listeners.forEach((l) => l());
  await supabase.auth.signOut();
}

/** M-1: saves the nickname to Supabase `profile.name`, then shows it. Throws when it couldn't be saved. */
export async function saveNickname(nickname: string) {
  const userId = sessionUserId;
  if (!userId) throw new Error("not signed in");
  const { data, error } = await supabase
    .from("profile")
    .update({ name: nickname })
    .eq("user_id", userId)
    .select("name");
  if (error) throw error;
  if (!data?.length) throw new Error("profile row not found");
  const s = read();
  if (s.user && sessionUserId === userId) write({ ...s, user: { ...s.user, nickname } });
}

/** M-2: the avatar has no column in `profile`, so it stays in localStorage. */
export function updateProfile(patch: Partial<Pick<User, "avatarUrl">>) {
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

// ── UI preferences (사이드바 접기) ──
// Kept apart from KEY: a per-browser preference, not user data (stays local after the Supabase move).

const UI_KEY = "mini-notion:ui";
let sidebarCollapsed: boolean | null = null;
const uiListeners = new Set<() => void>();

function readSidebarCollapsed(): boolean {
  if (sidebarCollapsed !== null) return sidebarCollapsed;
  try {
    sidebarCollapsed = JSON.parse(localStorage.getItem(UI_KEY) ?? "{}").sidebarCollapsed === true;
  } catch {
    sidebarCollapsed = false;
  }
  return sidebarCollapsed;
}

function subscribeUi(listener: () => void) {
  uiListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === UI_KEY) {
      sidebarCollapsed = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    uiListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** True when the sidebar is folded to the icon rail. Survives reloads. */
export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(subscribeUi, readSidebarCollapsed, () => false);
}

export function setSidebarCollapsed(collapsed: boolean) {
  sidebarCollapsed = collapsed;
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ sidebarCollapsed: collapsed }));
  } catch {
    // Storage blocked — the choice still holds until the tab closes.
  }
  uiListeners.forEach((l) => l());
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
