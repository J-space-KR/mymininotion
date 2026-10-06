<!--
Sync Impact Report
- Version change: (template, unversioned) → 1.0.0
- Modified principles: 템플릿 placeholder → 최초 원칙 5개
  - [PRINCIPLE_1_NAME] → I. 테스트 우선 개발 (TDD, NON-NEGOTIABLE)
  - [PRINCIPLE_2_NAME] → II. 진짜 동작을 검증하는 테스트
  - [PRINCIPLE_3_NAME] → III. 데이터는 lib/store.ts 한 곳으로
  - [PRINCIPLE_4_NAME] → IV. PRD 범위 안에서 단순하게
  - [PRINCIPLE_5_NAME] → V. 디자인 시스템 준수
- Added sections: 기술·테스트 환경 제약, 개발 흐름과 품질 관문, Governance
- Removed sections: 없음
- Templates: 읽기 전용으로 두었음 (이 명령은 헌법 파일만 수정). plan/tasks 템플릿의
  "Constitution Check"는 실행 시 이 파일을 읽어 반영됨.
- Follow-up TODOs: 없음
-->

# 미니 노션 (Mini Notion) Constitution

## Core Principles

### I. 테스트 우선 개발 (TDD, NON-NEGOTIABLE)

모든 기능 추가, 버그 수정, 리팩터링, 동작 변경은 **superpowers의 `test-driven-development`
스킬(`/test-driven-development`)을 호출해 그 절차대로** 진행한다. 이 원칙은 협상 대상이 아니다.

- 철칙: **실패하는 테스트가 먼저 없으면 제품 코드를 쓰지 않는다.**
- 순서는 항상 RED → 실패 확인 → GREEN → 통과 확인 → REFACTOR 이다.
  - RED: 동작 하나만 보여주는 최소 테스트를 쓴다.
  - 실패 확인(필수): `npm test -- <파일>`을 실행해, 오타·import 오류가 아니라
    "기능이 없어서" 기대한 메시지로 실패하는 것을 눈으로 확인한다.
    처음부터 통과하면 테스트가 잘못된 것이므로 테스트를 고친다.
  - GREEN: 테스트를 통과시키는 가장 단순한 코드만 쓴다. 요청 밖 기능·옵션을 더하지 않는다.
  - 통과 확인(필수): 해당 파일과 **전체 스위트(`npm test`)**가 모두 통과하고,
    출력에 오류·경고가 없어야 한다.
  - REFACTOR: 초록 상태를 유지하며 중복 제거·이름 정리만 한다. 동작은 추가하지 않는다.
- 테스트보다 먼저 쓴 제품 코드는 "참고용"으로도 남기지 않고 지운 뒤 테스트부터 다시 시작한다.
- 버그는 먼저 그 버그를 재현하는 실패 테스트로 만든 뒤 고친다.
- 예외(일회성 프로토타입, 생성된 코드, 설정 파일)는 사람(프로젝트 주인)의
  명시적 허락이 있을 때만 인정한다.

근거: 실패하는 모습을 본 적 없는 테스트는 무엇을 잡는지 증명되지 않았다. 1인 프로젝트라
리뷰어가 없으므로, 테스트가 유일한 안전망 역할을 해야 한다.

### II. 진짜 동작을 검증하는 테스트

테스트 작성·수정·모킹은 `test-driven-development` 스킬의 `writing-good-tests.md` 규칙을
그대로 따른다.

- 테스트 본문을 쓰기 전에 "어떤 제품 코드 변경이 이 테스트를 실패시키는가"를 말할 수 있어야 한다.
- 기대값은 손으로 정한 리터럴/픽스처로 쓴다. 테스트 대상 코드나 그 헬퍼로 기대값을 계산하지 않는다.
- 상수 값·문구·내부 구조만 확인하는 "변경 감지기" 테스트, 소스 텍스트를 grep하는 테스트를 쓰지 않는다.
- 프레임워크(Next.js, React) 자체 동작이 아니라 **우리 코드의 경계 계약**을 테스트한다.
- 모킹 규칙:
  - 기본은 **진짜 코드**다. 모킹은 느리거나 외부에 있는 것만, 피할 수 없을 때만 한다.
  - localStorage는 jsdom의 실제 구현을 쓰고 모킹하지 않는다.
  - 모킹하기 전에 진짜 메서드의 부수 효과를 파악하고, 테스트가 의존하는 부분은 진짜로 둔다.
    (예: 화면 테스트에서 `next/navigation`의 `useRouter`처럼 테스트 환경에 없는 경계만 대체)
  - 목(mock) 자체의 존재를 assert하지 않는다. 목 응답은 실제 데이터 구조를 빠짐없이 따라 한다.
  - 테스트에서만 쓰는 정리·헬퍼 코드는 `test/` 폴더의 테스트 유틸리티에 두고,
    제품 코드(`lib/`, `components/`, `app/`)에 넣지 않는다.
- 마무리 전 "돌연변이 점검"을 한다: 상수·분기·부수 효과·빈 반환·입력 검증을 하나씩 틀리게
  바꿨다고 가정했을 때 최소 한 테스트가 실패해야 한다.

근거: 목의 동작을 확인하는 테스트는 통과해도 실제 기능이 깨져 있을 수 있다.

### III. 데이터는 `lib/store.ts` 한 곳으로

- 화면 코드는 데이터를 반드시 `lib/store.ts`의 함수로만 읽고 쓴다. localStorage를 직접 쓰지 않는다.
- 저장소 동작(로그인 세션, 글 생성·수정·삭제 등)은 `lib/store.ts` 단위 테스트로 먼저 고정한다.
- 나중에 Supabase로 교체할 때(PRD §7.3) 같은 테스트가 계약 테스트 역할을 하도록,
  테스트는 저장 방식이 아니라 store 함수의 입력과 결과를 검증한다.

근거: 저장 방식을 한 곳에 모아 두어야 백엔드 교체 시 화면 코드와 테스트가 함께 살아남는다.

### IV. PRD 범위 안에서 단순하게

- 기능을 추가·변경하기 전에 `02-prd.md`에서 기능 ID(L-/M-/W-)와 완료 기준을 확인하고,
  완료 기준을 테스트로 옮긴다.
- PRD의 "첫 버전에 넣지 않는 것"(공유·협업, 구글 외 로그인, 모바일 앱, 파일 첨부 등)은
  요청이 없으면 만들지 않는다.
- 운영 비용은 월 0원이 목표다. 유료 서비스나 새 의존성이 필요하면 먼저 물어본다.
- 지금 필요한 것만 만든다(YAGNI). 테스트가 요구하지 않는 옵션·추상화는 넣지 않는다.

근거: 만드는 사람과 쓰는 사람이 같은 1인 도구라, 범위가 커지면 유지보수가 감당되지 않는다.

### V. 디자인 시스템 준수

- 디자인 작업(화면·컴포넌트, `app/globals.css`, `components/ds/*`, UI 요소, 화면 문구) 전에는
  `DESIGN.md`를 처음부터 끝까지 다시 읽는다.
- 값은 토큰으로 쓰고, 시맨틱 별칭(`--surface-card` 등)을 원시 색보다 우선한다.
- `components/ds/`의 Button, Input, Badge, Icon을 먼저 재사용한다. 새 컴포넌트는 `vt-` 접두사와
  BEM 규칙(`DESIGN.md` §5-7)을 따른다.
- 문구는 `DESIGN.md` §7 톤(해요체, 짧게, 기술 용어 없이, 다음 행동 안내)을 따른다.
- `DESIGN.md`에 없는 새 패턴은 임의로 만들지 않고 먼저 물어본다. 끝나면 §9 체크리스트로 점검한다.
- 컴포넌트 테스트는 스타일 값이 아니라 사용자가 보는 역할·이름·상호작용
  (`getByRole`, 접근 가능한 이름)을 검증한다.

근거: 일관된 화면은 디자인 문서 하나를 기준으로 할 때만 유지된다.

## 기술·테스트 환경 제약

- 스택: Next.js 16 (App Router) + React 19 + TypeScript(strict). 경로 별칭 `@/*` → 루트.
  Next.js 코드를 쓰기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 확인한다.
- 모든 화면은 클라이언트 컴포넌트(`"use client"`)이고, 로그인이 필요한 화면은
  `components/AuthGate.tsx`로 감싼다.
- 테스트 프레임워크: **Vitest + React Testing Library + jsdom**
  (Next.js 공식 Vitest 가이드 기준).
  - 설정: `vitest.config.mts` (jsdom 환경, `@/*` 별칭은 `resolve.tsconfigPaths`로 처리)
  - 공통 초기화: `test/setup.ts` — 매 테스트 뒤 렌더링 정리, `localStorage.clear()`,
    `vi.resetModules()`, `vi.restoreAllMocks()`
  - `lib/store.ts`는 모듈 안에 메모리 캐시가 있으므로, 테스트마다 깨끗한 상태가 필요하면
    `await import("@/lib/store")`로 새로 불러온다.
  - 테스트 파일 이름: `*.test.ts` / `*.test.tsx`. 대상 파일 옆에 두거나 `__tests__/`에 둔다.
    테스트 전용 유틸리티는 `test/`에 둔다.
- 명령어: `npm test`(전체 1회 실행), `npm test -- <경로>`(파일 하나),
  `npm run test:watch`(감시 모드), `npm run build`(빌드).
- async 서버 컴포넌트는 Vitest가 지원하지 않는다. 필요해지면 E2E 도구 도입을 먼저 물어본다.

## 개발 흐름과 품질 관문

1. PRD에서 기능 ID와 완료 기준 확인 (디자인 작업이면 `DESIGN.md` 정독)
2. `/test-driven-development` 스킬 호출
3. 완료 기준 하나당 RED → 실패 확인 → GREEN → 통과 확인 → REFACTOR 반복
4. 완료 선언 전 관문 (모두 통과해야 "끝"):
   - `npm test` 전체 통과, 오류·경고 없는 출력
   - `npx tsc --noEmit` 타입 오류 없음
   - 새 함수·동작마다 먼저 실패하는 것을 본 테스트가 있음
   - 돌연변이 점검 통과
   - 디자인 작업이면 `DESIGN.md` §9 체크리스트 점검 결과 보고
5. 보고할 때는 실제 실행 결과를 근거로 말한다. 실패하거나 건너뛴 것이 있으면 그대로 알린다.

## Governance

- 이 헌법은 다른 작업 습관보다 우선한다. `CLAUDE.md`·`DESIGN.md`·`02-prd.md`와 충돌하면
  헌법을 기준으로 하되, 충돌 사실을 알리고 문서를 맞추는 개정을 제안한다.
- 개정 절차: `/speckit-constitution`으로 개정안을 만들고, 프로젝트 주인이 승인한 뒤 반영한다.
  개정 시 Sync Impact Report로 변경 내용을 남긴다.
- 버전 규칙(유의적 버전):
  - MAJOR: 원칙 삭제나 뜻을 뒤집는 재정의 (예: TDD 의무 완화)
  - MINOR: 원칙·섹션 추가 또는 지침의 실질적 확장
  - PATCH: 문구 다듬기, 오타, 의미 변화 없는 정리
- 준수 점검: `/speckit-plan`의 Constitution Check와 `/speckit-analyze` 단계에서 이 원칙을
  확인하고, 원칙을 어기는 복잡도는 이유를 적어 정당화해야 한다.
- 실행 중 세부 지침은 `CLAUDE.md`(프로젝트 규칙)와 `DESIGN.md`(디자인)를 따른다.

**Version**: 1.0.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-06
