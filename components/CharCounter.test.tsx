import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { CharCounter } from "./CharCounter";

describe("CharCounter — 목표 없음", () => {
  it("빈 내용이면 0자 두 줄을 보여준다", () => {
    render(<CharCounter content="" target={null} />);
    expect(screen.getByText("공백 포함 0자")).toBeTruthy();
    expect(screen.getByText("공백 제외 0자")).toBeTruthy();
  });

  it("공백 포함과 공백 제외를 따로 센다", () => {
    render(<CharCounter content="안녕 하세요" target={null} />);
    expect(screen.getByText("공백 포함 6자")).toBeTruthy();
    expect(screen.getByText("공백 제외 5자")).toBeTruthy();
  });

  it("1,000자 이상이면 쉼표를 넣는다", () => {
    // "가 " × 617 = 공백 포함 1,234자 · 공백 제외 617자
    render(<CharCounter content={"가 ".repeat(617)} target={null} />);
    expect(screen.getByText("공백 포함 1,234자")).toBeTruthy();
    expect(screen.getByText("공백 제외 617자")).toBeTruthy();
  });
});

describe("CharCounter — 목표 있음", () => {
  it("현재 / 목표 형태로 두 줄 모두 진행을 보여준다", () => {
    // 글자 1,050개 + 공백 184개 = 공백 포함 1,234자 · 공백 제외 1,050자
    render(<CharCounter content={"가".repeat(1050) + " ".repeat(184)} target={5000} />);
    expect(screen.getByText("공백 포함 1,234 / 5,000자")).toBeTruthy();
    expect(screen.getByText("공백 제외 1,050 / 5,000자")).toBeTruthy();
  });

  it("목표와 같으면 초과가 아니다", () => {
    render(<CharCounter content="가나다라마 바사아자" target={10} />);
    expect(screen.getByText("공백 포함 10 / 10자")).toBeTruthy();
    expect(screen.getByText("공백 제외 9 / 10자")).toBeTruthy();
  });

  it("공백 하나를 더하면 공백 포함 줄만 초과한다", () => {
    render(<CharCounter content="가나다라마 바사아자 " target={10} />);
    expect(screen.getByText("공백 포함 11 / 10자 · 1자 초과")).toBeTruthy();
    expect(screen.getByText("공백 제외 9 / 10자")).toBeTruthy();
  });

  it("두 줄이 각각 몇 자 넘었는지 따로 보여준다", () => {
    render(<CharCounter content="가나다라마 바사아자차차" target={10} />);
    expect(screen.getByText("공백 포함 12 / 10자 · 2자 초과")).toBeTruthy();
    expect(screen.getByText("공백 제외 11 / 10자 · 1자 초과")).toBeTruthy();
  });
});

describe("CharCounter — 스크린 리더", () => {
  it("'글자 수'라는 이름의 영역 안에 두 줄이 있다", () => {
    render(<CharCounter content="안녕 하세요" target={null} />);
    const group = screen.getByRole("group", { name: "글자 수" });
    expect(within(group).getByText("공백 포함 6자")).toBeTruthy();
    expect(within(group).getByText("공백 제외 5자")).toBeTruthy();
  });

  it("입력할 때마다 소리로 끼어들지 않는다 (aria-live 없음)", () => {
    render(<CharCounter content="안녕" target={10} />);
    const group = screen.getByRole("group", { name: "글자 수" });
    expect(group.getAttribute("aria-live")).toBeNull();
    expect(group.querySelector("[aria-live]")).toBeNull();
  });
});

describe("CharCounter — 초과 상태 색 (FR-013)", () => {
  // jsdom은 CSS 색을 계산하지 않아서, 빨간 글자를 주는 초과 상태 클래스(DESIGN.md §6)로 확인한다.
  const isOver = (text: string) => screen.getByText(text).classList.contains("doc-count__line--over");

  it("넘은 줄만 초과 상태가 된다", () => {
    render(<CharCounter content="가나다라마 바사아자 " target={10} />);
    expect(isOver("공백 포함 11 / 10자 · 1자 초과")).toBe(true);
    expect(isOver("공백 제외 9 / 10자")).toBe(false);
  });

  it("목표와 같으면 초과 상태가 아니다", () => {
    render(<CharCounter content="가나다라마 바사아자" target={10} />);
    expect(isOver("공백 포함 10 / 10자")).toBe(false);
  });
});
