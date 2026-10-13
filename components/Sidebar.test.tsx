import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Sidebar } from "./Sidebar";
import type { Page } from "@/lib/store";

vi.mock("next/navigation", () => ({ usePathname: () => "/workspace" }));

const pages: Page[] = [
  { id: "a", title: "회의록", content: "", createdAt: 1, updatedAt: 2 },
  { id: "b", title: "", content: "", createdAt: 1, updatedAt: 1 },
];

describe("사이드바 접기/펼치기", () => {
  it("버튼을 누를 때마다 접히고 펼쳐지며, 접은 상태를 기억한다", () => {
    const view = render(<Sidebar pages={pages} />);
    expect(screen.getByText("회의록")).toBeTruthy();
    expect(screen.getByText("제목 없음")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "사이드바 접기" }));
    expect(screen.queryByText("회의록")).toBeNull();
    // 접혀도 화면 이동은 아이콘으로 남는다
    expect(screen.getByRole("link", { name: "내 업무" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "사이드바 펼치기" }).getAttribute("aria-expanded")).toBe("false");

    // 다시 열어도 접힌 채로
    view.unmount();
    render(<Sidebar pages={pages} />);
    expect(screen.queryByText("회의록")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "사이드바 펼치기" }));
    expect(screen.getByText("회의록")).toBeTruthy();
  });
});
