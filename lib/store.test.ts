import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

// store는 모듈 안에 메모리 캐시가 있어서 테스트마다 새로 불러온다.
// localStorage는 jsdom의 진짜 구현을 쓴다.
async function freshStore() {
  return import("@/lib/store");
}

function pageOf(store: typeof import("@/lib/store"), id: string) {
  const { result } = renderHook(() => store.useStore());
  return result.current?.pages.find((p) => p.id === id);
}

async function twoPages() {
  const store = await freshStore();
  store.signInWithGoogle();
  const a = store.createPage();
  const b = store.createPage();
  return { store, a, b };
}

describe("store — 목표 글자 수(targetLength)", () => {
  it("저장한 목표는 저장소를 새로 불러와도 남아 있다", async () => {
    const { store, a } = await twoPages();
    store.savePage(a, { title: "지원서", content: "", targetLength: 5000 });

    vi.resetModules();
    const reloaded = await freshStore();
    expect(pageOf(reloaded, a)?.targetLength).toBe(5000);
  });

  it("목표는 글마다 따로다", async () => {
    const { store, a, b } = await twoPages();
    store.savePage(a, { title: "", content: "", targetLength: 5000 });
    expect(pageOf(store, b)?.targetLength ?? null).toBeNull();
  });

  it("null을 저장하면 목표가 없어진다", async () => {
    const { store, a } = await twoPages();
    store.savePage(a, { title: "", content: "", targetLength: 5000 });
    store.savePage(a, { title: "", content: "", targetLength: null });
    expect(pageOf(store, a)?.targetLength).toBeNull();
  });

  it("목표 필드가 없는 기존 글도 오류 없이 '목표 없음'으로 읽힌다", async () => {
    localStorage.setItem(
      "mini-notion:v1",
      JSON.stringify({
        user: { email: "gildong.hong@gmail.com", nickname: "홍길동", avatarUrl: null },
        pages: [{ id: "old1", title: "예전 글", content: "내용", createdAt: 1, updatedAt: 1 }],
      }),
    );
    const store = await freshStore();
    const page = pageOf(store, "old1");
    expect(page?.title).toBe("예전 글");
    expect(page?.targetLength ?? null).toBeNull();
  });

  it("목표를 넘기지 않고 저장하면 기존 목표가 유지된다", async () => {
    const { store, a } = await twoPages();
    store.savePage(a, { title: "", content: "", targetLength: 5000 });
    store.savePage(a, { title: "새 제목", content: "새 내용" });
    expect(pageOf(store, a)?.targetLength).toBe(5000);
  });
});
