"use client";

import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { THEME_KEY, type Theme } from "@/lib/theme";

// Login uses real Supabase Auth (Google). The nickname and introduction live in the Supabase `profile`
// table (`name`, `introduction`; one row per user, created by a DB trigger on first login) and are
// cached in localStorage.
// Pages live in the Supabase `page` table (id, created_at, title, content, user_id). RLS lets a user
// read/insert/update/delete only rows whose user_id is their own; queries also filter by user_id.
// The table has no columns for the last-edit time or the target length, so those two stay in
// localStorage per page id (`meta`).
// M-2: an uploaded avatar is stored in the Storage bucket `profile-image` as `<uuid v4>.jpg`. Only the
// part after the bucket (`<uuid>.jpg`) goes into `profile."image-path"`; the part before it comes from
// NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL. Without an upload, the Google photo (cached locally) is used.

export type User = {
  email: string;
  nickname: string;
  avatarUrl: string | null;
  /** Self-introduction (M-4). "" when empty. */
  introduction: string;
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

/** Per-page data the `page` table has no column for. Kept on this browser only. */
type PageMeta = { updatedAt?: number; targetLength?: number | null };

/** What localStorage keeps. `profile` survives sign-out so nickname/avatar edits aren't lost. */
type Saved = {
  profile: User | null;
  meta: Record<string, PageMeta>;
};

/** Public URL of the `profile-image` bucket, e.g. https://<ref>.supabase.co/storage/v1/object/public/profile-image */
const PROFILE_IMAGE_BASE_URL = (process.env.NEXT_PUBLIC_PROFILE_IMAGE_BASE_URL ?? "").replace(/\/+$/, "");
const PROFILE_IMAGE_BUCKET = "profile-image";

function profileImageUrl(imagePath: string) {
  return `${PROFILE_IMAGE_BASE_URL}/${imagePath}`;
}

/** One row of the Supabase `page` table, as selected. */
type PageRow = { id: string; title: string; content: string; created_at: string };

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
/** The signed-in user's pages from Supabase. null until the first load finishes. */
let dbPages: { id: string; title: string; content: string; createdAt: number }[] | null = null;
/** Writes per page run in order, so an edit never reaches the DB before the page's insert. */
const pending = new Map<string, Promise<unknown>>();
/** False until Supabase has told us whether a session exists (avoids a wrong redirect on reload). */
let authReady = false;
let authStarted = false;
const listeners = new Set<() => void>();

function load(): Saved {
  if (saved) return saved;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Saved> & { user?: User | null }) : {};
    // Older saves stored the mock user under `user`. Their mock `pages` are no longer read.
    const profile = parsed.profile ?? parsed.user ?? null;
    // Saves from before M-4 have no introduction.
    saved = { profile: profile && { ...profile, introduction: profile.introduction ?? "" }, meta: parsed.meta ?? {} };
  } catch {
    saved = { profile: null, meta: {} };
  }
  return saved;
}

function read(): State {
  if (state) return state;
  const s = load();
  const user = sessionEmail && s.profile?.email === sessionEmail ? s.profile : null;
  const pages = (user && dbPages ? dbPages : []).map((p) => {
    const m = s.meta[p.id] ?? {};
    return { ...p, updatedAt: m.updatedAt ?? p.createdAt, targetLength: m.targetLength ?? null };
  });
  state = { user, pages };
  return state;
}

function notify() {
  state = null;
  listeners.forEach((l) => l());
}

function save(next: Saved) {
  saved = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked — keep the in-memory state so the session still works.
  }
  notify();
}

function applySession(session: Session | null) {
  authReady = true;
  const authUser = session?.user;
  const prevUserId = sessionUserId;
  sessionEmail = authUser?.email ?? null;
  sessionUserId = authUser?.id ?? null;
  if (!authUser || !sessionEmail) {
    dbPages = null;
    notify();
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
          introduction: "",
        };
  // Token refreshes fire again for the same user — only reload pages when the user changed.
  const userChanged = prevUserId !== authUser.id || !dbPages;
  if (userChanged) dbPages = null;
  save({ ...s, profile });
  if (userChanged) void loadPages(authUser.id);
  void loadProfile(authUser.id);
}

/** W-1: the signed-in user's own pages from Supabase, newest first. */
async function loadPages(userId: string) {
  const { data, error } = await supabase
    .from("page")
    .select("id, title, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (sessionUserId !== userId) return;
  if (error) {
    console.error("글 목록을 불러오지 못했어요", error);
    // Keep what is on screen; a first load that fails shows an empty list instead of hanging.
    dbPages ??= [];
    notify();
    return;
  }
  dbPages = ((data ?? []) as PageRow[]).map((r) => ({
    id: r.id,
    title: r.title ?? "",
    content: r.content ?? "",
    createdAt: new Date(r.created_at).getTime(),
  }));
  notify();
}

/** Runs `write` after earlier writes to the same page; rejects with the Supabase error if it fails. */
function enqueue(id: string, write: () => PromiseLike<{ error: unknown }>) {
  const run = async () => {
    const { error } = await write();
    if (error) throw error;
  };
  const next = (pending.get(id) ?? Promise.resolve()).catch(() => {}).then(run);
  pending.set(id, next);
  return next;
}

/** M-1, M-2, M-4: the nickname, introduction and uploaded image saved in Supabase win over the local copy
 *  (they may have changed on another device). With no uploaded image the local avatar stays. */
async function loadProfile(userId: string) {
  const { data, error } = await supabase
    .from("profile")
    .select('name, introduction, imagePath:"image-path"')
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data || sessionUserId !== userId) return;
  const s = load();
  if (!s.profile) return;
  const nickname = data.name || s.profile.nickname;
  const introduction = data.introduction ?? "";
  const imagePath: string | null = data.imagePath;
  const avatarUrl = imagePath ? profileImageUrl(imagePath) : s.profile.avatarUrl;
  if (
    s.profile.nickname !== nickname ||
    s.profile.introduction !== introduction ||
    s.profile.avatarUrl !== avatarUrl
  ) {
    save({ ...s, profile: { ...s.profile, nickname, introduction, avatarUrl } });
  }
}

/** The uploaded image's path (after the bucket) in `profile."image-path"`, or null. */
async function currentImagePath(userId: string): Promise<string | null> {
  const { data, error } = await supabase.from("profile").select('imagePath:"image-path"').eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return data?.imagePath ?? null;
}

/** Removes an image that is no longer used. Failing only leaves an unused file behind. */
function removeImage(imagePath: string | null) {
  if (!imagePath) return;
  void supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .remove([imagePath])
    .then(({ error }) => error && console.error("예전 프로필 이미지를 지우지 못했어요", error));
}

/** Points `profile."image-path"` at `imagePath` (null = no uploaded image). Throws when it couldn't be saved. */
async function saveImagePath(userId: string, imagePath: string | null) {
  const { data, error } = await supabase
    .from("profile")
    .update({ "image-path": imagePath })
    .eq("user_id", userId)
    .select('imagePath:"image-path"');
  if (error) throw error;
  if (!data?.length) throw new Error("profile row not found");
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
  if (!authReady) return null;
  if (sessionUserId && !dbPages) return null;
  return read();
}

/** Returns null during SSR and until the login state (and the user's pages) are known, then the state. */
export function useStore(): State | null {
  return useSyncExternalStore(subscribe, snapshot, () => null);
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
  dbPages = null;
  notify();
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
  const s = load();
  if (s.profile && sessionUserId === userId) save({ ...s, profile: { ...s.profile, nickname } });
}

/** M-4: saves the introduction to Supabase `profile.introduction` ("" is stored as null), then shows it.
 *  Throws when it couldn't be saved. */
export async function saveIntroduction(introduction: string) {
  const userId = sessionUserId;
  if (!userId) throw new Error("not signed in");
  const { data, error } = await supabase
    .from("profile")
    .update({ introduction: introduction || null })
    .eq("user_id", userId)
    .select("introduction");
  if (error) throw error;
  if (!data?.length) throw new Error("profile row not found");
  const s = load();
  if (s.profile && sessionUserId === userId) save({ ...s, profile: { ...s.profile, introduction } });
}

/** M-2: uploads the image to Storage as `<uuid v4>.jpg`, saves that path in `profile."image-path"`,
 *  then shows it. The previous upload is removed. Throws when it couldn't be saved. */
export async function uploadProfileImage(image: Blob) {
  const userId = sessionUserId;
  if (!userId) throw new Error("not signed in");
  const previous = await currentImagePath(userId);
  const imagePath = `${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage
    .from(PROFILE_IMAGE_BUCKET)
    .upload(imagePath, image, { contentType: "image/jpeg" });
  if (error) throw error;
  try {
    await saveImagePath(userId, imagePath);
  } catch (e) {
    removeImage(imagePath);
    throw e;
  }
  removeImage(previous);
  const s = load();
  if (s.profile && sessionUserId === userId) {
    save({ ...s, profile: { ...s.profile, avatarUrl: profileImageUrl(imagePath) } });
  }
}

/** M-2 "기본으로": clears `profile."image-path"`, removes the uploaded file and shows the initial.
 *  Throws when it couldn't be saved. */
export async function resetProfileImage() {
  const userId = sessionUserId;
  if (!userId) throw new Error("not signed in");
  const previous = await currentImagePath(userId);
  if (previous) await saveImagePath(userId, null);
  removeImage(previous);
  const s = load();
  if (s.profile && sessionUserId === userId) save({ ...s, profile: { ...s.profile, avatarUrl: null } });
}

// ── Pages (W-1 ~ W-5) ──

export function sortedPages(pages: Page[]) {
  return [...pages].sort((a, b) => b.updatedAt - a.updatedAt);
}

/** W-2: adds the page on screen right away (so the editor opens instantly) and inserts the row
 *  in the background. Returns the new page id. */
export function createPage(): string {
  const userId = sessionUserId;
  if (!userId || !dbPages) throw new Error("not signed in");
  const id = crypto.randomUUID();
  dbPages = [{ id, title: "", content: "", createdAt: Date.now() }, ...dbPages];
  notify();
  enqueue(id, () => supabase.from("page").insert({ id, user_id: userId, title: "", content: "" })).catch(
    (error) => console.error("새 글을 저장하지 못했어요", error),
  );
  return id;
}

/** W-4: shows the edit right away, then saves title/content to Supabase. The edit time and the
 *  target length go to localStorage (no columns for them). Rejects when the DB save failed. */
export function savePage(
  id: string,
  patch: Pick<Page, "title" | "content"> & { targetLength?: number | null },
): Promise<void> {
  const userId = sessionUserId;
  if (!userId || !dbPages?.some((p) => p.id === id)) return Promise.resolve();
  const { title, content, targetLength } = patch;
  dbPages = dbPages.map((p) => (p.id === id ? { ...p, title, content } : p));
  const s = load();
  const meta: PageMeta = { ...s.meta[id], updatedAt: Date.now() };
  if (targetLength !== undefined) meta.targetLength = targetLength;
  save({ ...s, meta: { ...s.meta, [id]: meta } });
  const saving = enqueue(id, () =>
    supabase.from("page").update({ title, content }).eq("id", id).eq("user_id", userId),
  );
  saving.catch((error) => console.error("글을 저장하지 못했어요", error));
  return saving;
}

/** W-5: removes the page from the screen, then deletes the row. If that fails, the list is reloaded
 *  from Supabase so the page shows up again. */
export function deletePage(id: string): Promise<void> {
  const userId = sessionUserId;
  if (!userId || !dbPages) return Promise.resolve();
  dbPages = dbPages.filter((p) => p.id !== id);
  const s = load();
  const { [id]: _removed, ...meta } = s.meta;
  save({ ...s, meta });
  const deleting = enqueue(id, () => supabase.from("page").delete().eq("id", id).eq("user_id", userId));
  deleting.catch((error) => {
    console.error("글을 삭제하지 못했어요", error);
    if (sessionUserId === userId) void loadPages(userId);
  });
  return deleting;
}

// ── Theme ──
// The choice lives in localStorage and as `data-theme` on <html>. app/layout.tsx applies it
// before the first paint (THEME_SCRIPT in lib/theme.ts).

const themeListeners = new Set<() => void>();

function themeSnapshot(): Theme {
  return document.documentElement.dataset.theme === "pc" ? "pc" : "dark";
}

function subscribeTheme(listener: () => void) {
  themeListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== THEME_KEY) return;
    applyTheme(e.newValue === "pc" ? "pc" : "dark");
  };
  window.addEventListener("storage", onStorage);
  return () => {
    themeListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function applyTheme(theme: Theme) {
  if (theme === "pc") document.documentElement.dataset.theme = "pc";
  else delete document.documentElement.dataset.theme;
  themeListeners.forEach((l) => l());
}

/** Dark during SSR, then the theme the page is actually showing. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, themeSnapshot, () => "dark");
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  try {
    if (theme === "pc") localStorage.setItem(THEME_KEY, "pc");
    else localStorage.removeItem(THEME_KEY);
  } catch {
    // Storage blocked — the theme still applies until the page is closed.
  }
}

// ── UI preferences (sidebar) ──
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
