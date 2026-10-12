import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CoverImage } from "./CoverImage";

describe("커버 이미지", () => {
  it("고양이 API로 요청하고, 받는 동안 스켈레톤을 보여 준다", () => {
    const { container } = render(<CoverImage />);
    const img = screen.getByAltText("고양이 커버 사진") as HTMLImageElement;
    expect(img.src).toMatch(/^https:\/\/cataas\.com\/cat\/cute\?t=\d+$/);
    expect(container.querySelector(".cover--loading")).toBeTruthy();
  });

  it("사진을 다 받으면 스켈레톤이 사라진다", () => {
    const { container } = render(<CoverImage />);
    fireEvent.load(screen.getByAltText("고양이 커버 사진"));
    expect(container.querySelector(".cover--loaded")).toBeTruthy();
    expect(container.querySelector(".cover--loading")).toBeNull();
  });

  it("실패하면 안내와 다시 불러오기 버튼을 보여 주고, 누르면 다시 요청한다", () => {
    const { container } = render(<CoverImage />);
    fireEvent.error(screen.getByAltText("고양이 커버 사진"));
    expect(screen.getByText("고양이 사진을 불러오지 못했어요")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
    expect(container.querySelector(".cover--loading")).toBeTruthy();
    expect(screen.getByAltText("고양이 커버 사진")).toBeTruthy();
  });
});
