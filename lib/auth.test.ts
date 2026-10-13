import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

// 구글 로그인은 test/setup.ts의 가짜 Supabase로 대신한다.
async function freshStore() {
  return import("@/lib/store");
}

function stateOf(store: typeof import("@/lib/store")) {
  return renderHook(() => store.useStore()).result;
}

describe("store — 구글 로그인 (L-1 ~ L-3, M-3)", () => {
  it("로그인 전에는 user가 없다", async () => {
    const store = await freshStore();
    expect(stateOf(store).current?.user).toBeNull();
  });

  it("로그인하면 구글 이름이 별명이 된다", async () => {
    const store = await freshStore();
    const result = stateOf(store);
    await act(() => store.signInWithGoogle());
    expect(result.current?.user).toMatchObject({ email: "gildong.hong@gmail.com", nickname: "홍길동" });
  });

  it("다시 열어도 로그인 상태가 유지된다 (L-2)", async () => {
    const store = await freshStore();
    await store.signInWithGoogle();
    vi.resetModules();
    const reloaded = await freshStore();
    const result = stateOf(reloaded);
    await waitFor(() => expect(result.current?.user?.nickname).toBe("홍길동"));
  });

  it("로그아웃하면 user가 없어지고, 다시 로그인하면 바꾼 별명이 남아 있다 (M-3)", async () => {
    const store = await freshStore();
    const result = stateOf(store);
    await act(() => store.signInWithGoogle());
    await act(() => store.saveNickname("길동이"));
    await act(() => store.signOut());
    expect(result.current?.user).toBeNull();
    await act(() => store.signInWithGoogle());
    expect(result.current?.user?.nickname).toBe("길동이");
  });
});

type FakeDb = { __fakeProfiles: Map<string, string>; __fakeDbDown: boolean };
const fakeDb = globalThis as unknown as FakeDb;

describe("store — 별명은 Supabase profile에 저장 (M-1)", () => {
  it("첫 로그인 때 만들어진 profile.name이 별명이 된다", async () => {
    const store = await freshStore();
    const result = stateOf(store);
    await act(() => store.signInWithGoogle());
    expect(fakeDb.__fakeProfiles.get("user-1")).toBe("홍길동");
    expect(result.current?.user?.nickname).toBe("홍길동");
  });

  it("별명을 저장하면 profile.name이 바뀌고 화면에도 바로 보인다", async () => {
    const store = await freshStore();
    const result = stateOf(store);
    await act(() => store.signInWithGoogle());
    await act(() => store.saveNickname("길동이"));
    expect(fakeDb.__fakeProfiles.get("user-1")).toBe("길동이");
    expect(result.current?.user?.nickname).toBe("길동이");
  });

  it("다른 기기에서 바꾼 별명(profile.name)이 로그인할 때 반영된다", async () => {
    const store = await freshStore();
    const result = stateOf(store);
    await act(() => store.signInWithGoogle());
    await act(() => store.signOut());
    fakeDb.__fakeProfiles.set("user-1", "다른기기별명");
    await act(() => store.signInWithGoogle());
    expect(result.current?.user?.nickname).toBe("다른기기별명");
  });

  it("저장에 실패하면 오류를 내고 별명은 그대로다", async () => {
    const store = await freshStore();
    const result = stateOf(store);
    await act(() => store.signInWithGoogle());
    fakeDb.__fakeDbDown = true;
    await expect(store.saveNickname("길동이")).rejects.toBeTruthy();
    expect(result.current?.user?.nickname).toBe("홍길동");
    expect(fakeDb.__fakeProfiles.get("user-1")).toBe("홍길동");
  });
});
