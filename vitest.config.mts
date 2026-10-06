import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Next.js 공식 가이드(node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md) 기준 설정.
// `@/*` 경로 별칭은 Vite 내장 tsconfig 경로 해석으로 처리한다.
export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next"],
  },
});
