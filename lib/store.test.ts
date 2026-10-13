import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

// store는 모듈 안에 메모리 캐시가 있어서 테스트마다 새로 불러온다.
// localStorage는 jsdom의 진짜 구현을, page 테이블은 test/setup.ts의 가짜 Supabase를 쓴다.
type FakeDb = {
  __fakePages: { id: string; created_at: string; title: string; content: string; user_id: string }[];
  __fakeDbDown: boolean;
  __fakeDeleteDown: boolean;
};
const fakeDb = globalThis as unknown as FakeDb;

async function freshStore() {
  return import("@/lib/store");
}

/** Signs in and waits until the user's pages have loaded from Supabase. */
async function signedIn() {
  const store = await freshStore();
  const result = renderHook(() => store.useStore()).result;
  await act(() => store.signInWithGoogle());
  await waitFor(() => expect(result.current?.pages).toBeDefined());
  return { store, result };
}

/** Waits until every queued DB write for these pages has finished. */
async function settled(store: typeof import("@/lib/store"), ...ids: string[]) {
  await act(() => Promise.all(ids.map((id) => store.savePage(id, { title: "", content: "" }).catch(() => {}))));
}

async function twoPages() {
  const { store, result } = await signedIn();
  let a = "";
  let b = "";
  act(() => {
    a = store.createPage();
    b = store.createPage();
  });
  return { store, result, a, b };
}

describe("store — 글은 Supabase page 테이블에 저장 (W-1 ~ W-5)", () => {
  it("새 글을 만들면 내 user_id로 page 테이블에 한 줄이 생긴다", async () => {
    const { store, result } = await signedIn();
    let id = "";
    act(() => {
      id = store.createPage();
    });
    expect(result.current?.pages[0].id).toBe(id);
    await waitFor(() => expect(fakeDb.__fakePages).toHaveLength(1));
    expect(fakeDb.__fakePages[0]).toMatchObject({ id, user_id: "user-1", title: "", content: "" });
  });

  it("제목·내용을 저장하면 DB에 남고, 다시 열어도 그대로 보인다", async () => {
    const { store, a } = await twoPages();
    await act(() => store.savePage(a, { title: "지원서", content: "본문" }));
    expect(fakeDb.__fakePages.find((r) => r.id === a)).toMatchObject({ title: "지원서", content: "본문" });

    vi.resetModules();
    const { result } = await signedIn();
    await waitFor(() => expect(result.current?.pages.find((p) => p.id === a)?.title).toBe("지원서"));
  });

  it("다른 사람의 글은 목록에 보이지 않는다", async () => {
    fakeDb.__fakePages.push({
      id: "other-1",
      created_at: new Date().toISOString(),
      title: "남의 글",
      content: "",
      user_id: "user-2",
    });
    const { result } = await signedIn();
    expect(result.current?.pages.map((p) => p.id)).not.toContain("other-1");
  });

  it("글을 삭제하면 화면과 DB 모두에서 없어진다", async () => {
    const { store, result, a, b } = await twoPages();
    await settled(store, a, b);
    await act(() => store.deletePage(a));
    expect(result.current?.pages.map((p) => p.id)).toEqual([b]);
    expect(fakeDb.__fakePages.map((r) => r.id)).toEqual([b]);
  });

  it("다른 사람의 글은 삭제되지 않는다", async () => {
    fakeDb.__fakePages.push({
      id: "other-1",
      created_at: new Date().toISOString(),
      title: "남의 글",
      content: "",
      user_id: "user-2",
    });
    const { store } = await signedIn();
    await act(() => store.deletePage("other-1"));
    expect(fakeDb.__fakePages.map((r) => r.id)).toContain("other-1");
  });

  it("삭제가 실패하면 목록을 다시 불러와 글이 되살아난다", async () => {
    const { store, result, a, b } = await twoPages();
    await settled(store, a, b);
    fakeDb.__fakeDeleteDown = true;
    await act(() => store.deletePage(a).catch(() => {}));
    expect(fakeDb.__fakePages.map((r) => r.id)).toContain(a);
    await waitFor(() => expect(result.current?.pages.map((p) => p.id)).toContain(a));
  });

  it("목록을 불러오지 못해도 화면에 있던 글은 그대로 남는다", async () => {
    const { store, result, a, b } = await twoPages();
    await settled(store, a, b);
    fakeDb.__fakeDbDown = true;
    fakeDb.__fakeDeleteDown = true;
    await act(() => store.deletePage(a).catch(() => {})); // 실패 → 목록 다시 불러오기도 실패
    await act(() => new Promise((r) => setTimeout(r, 0)));
    expect(result.current?.pages.map((p) => p.id)).toEqual([b]);
  });

  it("로그아웃하면 글 목록이 비워진다", async () => {
    const { store, result } = await twoPages();
    await act(() => store.signOut());
    expect(result.current?.pages ?? []).toEqual([]);
  });
});

describe("store — 목표 글자 수(targetLength)", () => {
  it("저장한 목표는 저장소를 새로 불러와도 남아 있다", async () => {
    const { store, a } = await twoPages();
    await act(() => store.savePage(a, { title: "지원서", content: "", targetLength: 5000 }));

    vi.resetModules();
    const { result } = await signedIn();
    await waitFor(() => expect(result.current?.pages.find((p) => p.id === a)?.targetLength).toBe(5000));
  });

  it("목표는 글마다 따로다", async () => {
    const { store, result, a, b } = await twoPages();
    act(() => void store.savePage(a, { title: "", content: "", targetLength: 5000 }));
    expect(result.current?.pages.find((p) => p.id === b)?.targetLength ?? null).toBeNull();
  });

  it("null을 저장하면 목표가 없어진다", async () => {
    const { store, result, a } = await twoPages();
    act(() => void store.savePage(a, { title: "", content: "", targetLength: 5000 }));
    act(() => void store.savePage(a, { title: "", content: "", targetLength: null }));
    expect(result.current?.pages.find((p) => p.id === a)?.targetLength).toBeNull();
  });

  it("목표 필드가 없는 기존 글도 오류 없이 '목표 없음'으로 읽힌다", async () => {
    fakeDb.__fakePages.push({
      id: "old1",
      created_at: new Date().toISOString(),
      title: "예전 글",
      content: "내용",
      user_id: "user-1",
    });
    const { result } = await signedIn();
    const page = result.current?.pages.find((p) => p.id === "old1");
    expect(page?.title).toBe("예전 글");
    expect(page?.targetLength ?? null).toBeNull();
  });

  it("목표를 넘기지 않고 저장하면 기존 목표가 유지된다", async () => {
    const { store, result, a } = await twoPages();
    act(() => void store.savePage(a, { title: "", content: "", targetLength: 5000 }));
    act(() => void store.savePage(a, { title: "새 제목", content: "새 내용" }));
    expect(result.current?.pages.find((p) => p.id === a)?.targetLength).toBe(5000);
  });
});
