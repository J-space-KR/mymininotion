import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, renderHook, screen } from "@testing-library/react";

// 테스트 환경에는 Next.js 라우터가 없어서 next/navigation만 대체한다.
// store·화면·컴포넌트는 모두 진짜를 쓴다.
const nav = vi.hoisted(() => ({ id: "" }));
vi.mock("next/navigation", () => ({
  useParams: () => ({ id: nav.id }),
  useRouter: () => ({
    replace: () => {},
    push: () => {},
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
  }),
}));

/** 로그인 → 빈 글 생성 → (선택) 글 내용 미리 저장 → 글 상세 화면 렌더 */
async function openNewPage(prepare?: (store: typeof import("@/lib/store"), id: string) => void) {
  const store = await import("@/lib/store");
  store.signInWithGoogle();
  const id = store.createPage();
  prepare?.(store, id);
  nav.id = id;
  const { default: DetailPage } = await import("./page");
  const view = render(<DetailPage />);
  return { store, id, view };
}

function storedPage(store: typeof import("@/lib/store"), id: string) {
  const { result } = renderHook(() => store.useStore());
  return result.current?.pages.find((p) => p.id === id);
}

describe("글 상세 화면 — 기존 동작", () => {
  it("제목·내용을 입력하고 화면을 떠나면 그 글에 저장된다", async () => {
    const { store, id, view } = await openNewPage();

    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "회의록" } });
    fireEvent.change(screen.getByLabelText("내용"), { target: { value: "안건 정리" } });
    view.unmount();

    const page = storedPage(store, id);
    expect(page?.title).toBe("회의록");
    expect(page?.content).toBe("안건 정리");
  });
});

describe("글 상세 화면 — 글자 수 표시 (US1)", () => {
  function expectCounts(withSpaces: string, withoutSpaces: string) {
    expect(screen.getByText(`공백 포함 ${withSpaces}자`)).toBeTruthy();
    expect(screen.getByText(`공백 제외 ${withoutSpaces}자`)).toBeTruthy();
  }

  it("빈 글을 열면 0자 두 줄이 보인다", async () => {
    await openNewPage();
    expectCounts("0", "0");
  });

  it("내용을 입력·삭제하면 숫자가 바로 바뀐다", async () => {
    await openNewPage();
    const body = screen.getByLabelText("내용");

    fireEvent.change(body, { target: { value: "안녕 하세요" } });
    expectCounts("6", "5");

    fireEvent.change(body, { target: { value: "안녕 하세" } });
    expectCounts("5", "4");
  });

  it("여러 줄을 한 번에 붙여넣어도 바로 센다", async () => {
    await openNewPage();
    fireEvent.change(screen.getByLabelText("내용"), { target: { value: "가\n나\n다" } });
    expectCounts("5", "3");
  });

  it("제목은 세지 않는다", async () => {
    await openNewPage();
    fireEvent.change(screen.getByLabelText("제목"), { target: { value: "제목입니다" } });
    expectCounts("0", "0");
  });
});

describe("글 상세 화면 — 다시 열 때 (US2)", () => {
  it("저장된 내용이 있으면 입력 없이 글자 수가 보인다", async () => {
    await openNewPage((store, id) => store.savePage(id, { title: "", content: "할 일 정리" }));
    expect(screen.getByText("공백 포함 6자")).toBeTruthy();
    expect(screen.getByText("공백 제외 4자")).toBeTruthy();
  });
});

describe("글 상세 화면 — 목표 글자 수 (US4)", () => {
  const targetInput = () => screen.getByRole("textbox", { name: /목표 글자 수/ }) as HTMLInputElement;
  const hintText = () => targetInput().closest("label")?.textContent;
  const typeTarget = (value: string) => fireEvent.change(targetInput(), { target: { value } });
  const typeBody = (value: string) => fireEvent.change(screen.getByLabelText("내용"), { target: { value } });

  it("쉼표를 넣은 목표도 두 줄의 진행으로 보인다", async () => {
    await openNewPage();
    typeTarget("5,000");
    expect(screen.getByText("공백 포함 0 / 5,000자")).toBeTruthy();
    expect(screen.getByText("공백 제외 0 / 5,000자")).toBeTruthy();
  });

  it("목표를 넘은 줄에만 초과가 보인다", async () => {
    await openNewPage();
    typeTarget("10");
    typeBody("가나다라마 바사아자 ");
    expect(screen.getByText("공백 포함 11 / 10자 · 1자 초과")).toBeTruthy();
    expect(screen.getByText("공백 제외 9 / 10자")).toBeTruthy();
  });

  it("잘못된 목표는 진행 없이 글자 수만 보이고 안내가 바뀐다", async () => {
    await openNewPage();
    const defaultHint = hintText();
    typeTarget("abc");
    expect(screen.getByText("공백 포함 0자")).toBeTruthy();
    expect(screen.queryByText(/ \/ /)).toBeNull();
    expect(hintText()).not.toBe(defaultHint);
  });

  it("목표는 화면을 떠나면 저장되고, 다시 열면 남아 있다", async () => {
    const { store, id, view } = await openNewPage();
    typeTarget("10");
    view.unmount();
    expect(storedPage(store, id)?.targetLength).toBe(10);

    const { default: DetailPage } = await import("./page");
    render(<DetailPage />);
    expect(targetInput().value).toBe("10");
  });

  it("다른 글에는 목표가 보이지 않는다", async () => {
    let other = "";
    const { view } = await openNewPage((store) => {
      other = store.createPage();
    });
    typeTarget("1000");
    view.unmount();

    nav.id = other;
    const { default: DetailPage } = await import("./page");
    render(<DetailPage />);
    expect(targetInput().value).toBe("");
  });

  it("목표를 비우면 진행 표시가 사라지고 '목표 없음'으로 저장된다", async () => {
    const { store, id, view } = await openNewPage((store, id) =>
      store.savePage(id, { title: "", content: "", targetLength: 10 }),
    );
    expect(screen.getByText("공백 포함 0 / 10자")).toBeTruthy();

    typeTarget("");
    expect(screen.getByText("공백 포함 0자")).toBeTruthy();
    view.unmount();
    expect(storedPage(store, id)?.targetLength).toBeNull();
  });
});
