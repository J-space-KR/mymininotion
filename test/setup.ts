import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// 테스트에서는 진짜 Supabase(구글 로그인) 대신 가짜를 쓴다.
// 로그인 상태는 globalThis에 둬서 vi.resetModules() 뒤에도 남는다 (브라우저를 다시 연 것처럼).
// profile 테이블도 가짜로 둔다: user_id → name, introduction, "image-path". 진짜 DB처럼 처음 로그인할 때 한 줄이 생긴다.
// Storage는 profile-image 버킷만 가짜로 둔다: 파일 이름 → 올린 Blob.
type Cb = (event: string, session: unknown) => void;
const fakeAuth = globalThis as unknown as {
  __fakeSession: unknown;
  __fakeAuthCbs: Cb[];
  __fakeProfiles: Map<string, string>;
  __fakeIntros: Map<string, string | null>;
  __fakeImagePaths: Map<string, string | null>;
  __fakeFiles: Map<string, Blob>;
  __fakeStorageDown: boolean;
  __fakeDbDown: boolean;
  __fakePages: PageRow[];
  __fakeDeleteDown: boolean;
};
fakeAuth.__fakeSession = null;
fakeAuth.__fakeAuthCbs = [];
fakeAuth.__fakeProfiles = new Map();
fakeAuth.__fakeIntros = new Map();
fakeAuth.__fakeImagePaths = new Map();
fakeAuth.__fakeFiles = new Map();
fakeAuth.__fakeStorageDown = false;
fakeAuth.__fakeDbDown = false;
fakeAuth.__fakePages = [];
fakeAuth.__fakeDeleteDown = false;

const FAKE_USER_ID = "user-1";
const dbError = () => ({ message: "network down" });

type PageRow = { id: string; created_at: string; title: string; content: string; user_id: string };

/** Fake `page` table. Like the real RLS policies, every query only sees the signed-in user's rows. */
function fakePageTable() {
  const uid = () => (fakeAuth.__fakeSession as { user: { id: string } } | null)?.user.id;
  const filters: [keyof PageRow, string][] = [];
  let action: () => { data: unknown; error: unknown } = () => ({ data: null, error: null });
  const visible = () =>
    fakeAuth.__fakePages.filter((r) => r.user_id === uid() && filters.every(([c, v]) => r[c] === v));
  const query = {
    select: () => {
      action = () => ({
        data: visible()
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map(({ id, title, content, created_at }) => ({ id, title, content, created_at })),
        error: null,
      });
      return query;
    },
    insert: (row: Omit<PageRow, "created_at">) => {
      action = () => {
        if (row.user_id !== uid()) return { data: null, error: { message: "violates row-level security" } };
        fakeAuth.__fakePages.push({ ...row, created_at: new Date().toISOString() });
        return { data: null, error: null };
      };
      return query;
    },
    update: (patch: Partial<PageRow>) => {
      action = () => {
        visible().forEach((r) => Object.assign(r, patch));
        return { data: null, error: null };
      };
      return query;
    },
    delete: () => {
      action = () => {
        if (fakeAuth.__fakeDeleteDown) return { data: null, error: dbError() };
        const gone = new Set(visible());
        fakeAuth.__fakePages = fakeAuth.__fakePages.filter((r) => !gone.has(r));
        return { data: null, error: null };
      };
      return query;
    },
    eq: (col: keyof PageRow, value: string) => {
      filters.push([col, value]);
      return query;
    },
    order: () => query,
    then: <T>(resolve: (r: { data: unknown; error: unknown }) => T, reject?: (e: unknown) => T) =>
      Promise.resolve()
        .then(() => (fakeAuth.__fakeDbDown ? { data: null, error: dbError() } : action()))
        .then(resolve, reject),
  };
  return query;
}

/** Supports only the chains lib/store.ts uses on `profile` and `page`. */
function fakeFrom(table: string) {
  if (table === "page") return fakePageTable();
  const rows = fakeAuth.__fakeProfiles;
  const intros = fakeAuth.__fakeIntros;
  const images = fakeAuth.__fakeImagePaths;
  // store는 하이픈 컬럼을 `imagePath:"image-path"`로 이름을 바꿔 읽는다.
  const rowOf = (userId: string) => ({
    name: rows.get(userId),
    introduction: intros.get(userId) ?? null,
    imagePath: images.get(userId) ?? null,
  });
  return {
    select: () => ({
      eq: (_col: string, userId: string) => ({
        maybeSingle: async () =>
          fakeAuth.__fakeDbDown
            ? { data: null, error: dbError() }
            : { data: rows.has(userId) ? rowOf(userId) : null, error: null },
      }),
    }),
    update: (patch: { name?: string; introduction?: string | null; "image-path"?: string | null }) => ({
      eq: (_col: string, userId: string) => ({
        select: async () => {
          if (fakeAuth.__fakeDbDown) return { data: null, error: dbError() };
          if (!rows.has(userId)) return { data: [], error: null };
          if (patch.name !== undefined) rows.set(userId, patch.name);
          if (patch.introduction !== undefined) intros.set(userId, patch.introduction);
          if (patch["image-path"] !== undefined) images.set(userId, patch["image-path"]);
          return { data: [rowOf(userId)], error: null };
        },
      }),
    }),
  };
}

vi.mock("@/lib/supabase", () => {
  const emit = (event: string) => fakeAuth.__fakeAuthCbs.forEach((cb) => cb(event, fakeAuth.__fakeSession));
  return {
    supabase: {
      from: fakeFrom,
      storage: {
        from: (bucket: string) => ({
          upload: async (name: string, file: Blob) => {
            if (bucket !== "profile-image" || fakeAuth.__fakeStorageDown) return { data: null, error: dbError() };
            if (fakeAuth.__fakeFiles.has(name)) return { data: null, error: { message: "already exists" } };
            fakeAuth.__fakeFiles.set(name, file);
            return { data: { path: name }, error: null };
          },
          remove: async (names: string[]) => {
            names.forEach((n) => fakeAuth.__fakeFiles.delete(n));
            return { data: [], error: null };
          },
        }),
      },
      auth: {
        // 진짜는 비동기로 알려 주지만, 테스트가 단순하도록 바로 알려 준다.
        onAuthStateChange: (cb: Cb) => {
          fakeAuth.__fakeAuthCbs.push(cb);
          cb("INITIAL_SESSION", fakeAuth.__fakeSession);
          return { data: { subscription: { unsubscribe: () => {} } } };
        },
        signInWithOAuth: async () => {
          fakeAuth.__fakeSession = {
            user: { id: FAKE_USER_ID, email: "gildong.hong@gmail.com", user_metadata: { full_name: "홍길동" } },
          };
          // DB 트리거(on_auth_user_created) 흉내: 첫 로그인 때 구글 이름으로 profile 생성
          if (!fakeAuth.__fakeProfiles.has(FAKE_USER_ID)) fakeAuth.__fakeProfiles.set(FAKE_USER_ID, "홍길동");
          emit("SIGNED_IN");
          return { data: {}, error: null };
        },
        signOut: async () => {
          fakeAuth.__fakeSession = null;
          emit("SIGNED_OUT");
          return { error: null };
        },
      },
    },
  };
});

// 테스트끼리 상태가 새지 않게, 매 테스트 뒤에 실제 환경을 초기화한다.
// localStorage는 jsdom이 제공하는 진짜 구현을 그대로 쓴다 (모킹하지 않음).
afterEach(() => {
  cleanup(); // 렌더링한 컴포넌트 제거
  localStorage.clear(); // lib/store.ts가 쓰는 저장소 비우기
  fakeAuth.__fakeSession = null; // 가짜 로그인 상태 비우기
  fakeAuth.__fakeAuthCbs = [];
  fakeAuth.__fakeProfiles = new Map(); // 가짜 profile 테이블 비우기
  fakeAuth.__fakeIntros = new Map();
  fakeAuth.__fakeImagePaths = new Map();
  fakeAuth.__fakeFiles = new Map();
  fakeAuth.__fakeStorageDown = false;
  fakeAuth.__fakeDbDown = false;
  fakeAuth.__fakePages = []; // 가짜 page 테이블 비우기
  fakeAuth.__fakeDeleteDown = false;
  vi.resetModules(); // 다음 `await import("@/lib/store")`가 메모리 캐시 없이 새로 시작
  vi.restoreAllMocks(); // spy가 있었다면 원래대로
});
