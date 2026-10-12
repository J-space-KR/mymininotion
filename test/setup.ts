import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// 테스트에서는 진짜 Supabase(구글 로그인) 대신 가짜를 쓴다.
// 로그인 상태는 globalThis에 둬서 vi.resetModules() 뒤에도 남는다 (브라우저를 다시 연 것처럼).
// profile 테이블도 가짜로 둔다: user_id → name. 진짜 DB처럼 처음 로그인할 때 한 줄이 생긴다.
type Cb = (event: string, session: unknown) => void;
const fakeAuth = globalThis as unknown as {
  __fakeSession: unknown;
  __fakeAuthCbs: Cb[];
  __fakeProfiles: Map<string, string>;
  __fakeDbDown: boolean;
};
fakeAuth.__fakeSession = null;
fakeAuth.__fakeAuthCbs = [];
fakeAuth.__fakeProfiles = new Map();
fakeAuth.__fakeDbDown = false;

const FAKE_USER_ID = "user-1";
const dbError = () => ({ message: "network down" });

/** Supports only the chains lib/store.ts uses on `profile`. */
function fakeFrom() {
  const rows = fakeAuth.__fakeProfiles;
  return {
    select: () => ({
      eq: (_col: string, userId: string) => ({
        maybeSingle: async () =>
          fakeAuth.__fakeDbDown
            ? { data: null, error: dbError() }
            : { data: rows.has(userId) ? { name: rows.get(userId) } : null, error: null },
      }),
    }),
    update: ({ name }: { name: string }) => ({
      eq: (_col: string, userId: string) => ({
        select: async () => {
          if (fakeAuth.__fakeDbDown) return { data: null, error: dbError() };
          if (!rows.has(userId)) return { data: [], error: null };
          rows.set(userId, name);
          return { data: [{ name }], error: null };
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
  fakeAuth.__fakeDbDown = false;
  vi.resetModules(); // 다음 `await import("@/lib/store")`가 메모리 캐시 없이 새로 시작
  vi.restoreAllMocks(); // spy가 있었다면 원래대로
});
