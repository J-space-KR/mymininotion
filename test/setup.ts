import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// 테스트끼리 상태가 새지 않게, 매 테스트 뒤에 실제 환경을 초기화한다.
// localStorage는 jsdom이 제공하는 진짜 구현을 그대로 쓴다 (모킹하지 않음).
afterEach(() => {
  cleanup(); // 렌더링한 컴포넌트 제거
  localStorage.clear(); // lib/store.ts가 쓰는 저장소 비우기
  vi.resetModules(); // 다음 `await import("@/lib/store")`가 메모리 캐시 없이 새로 시작
  vi.restoreAllMocks(); // spy가 있었다면 원래대로
});
