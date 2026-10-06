# Implementation Plan: 글 내용 글자 수 표시

**Branch**: `001-char-count` | **Date**: 2026-10-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-char-count/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

글 상세 화면에서 내용의 글자 수를 **공백 포함·공백 제외** 두 가지로 실시간 표시하고, 글마다 **목표 글자 수**를
정해 두면 두 숫자 각각의 진행 상황과 초과 여부를 보여준다. 글자 단위는 `Intl.Segmenter`(화면에 보이는
한 글자)로 세고, 목표는 기존 `Page`에 `targetLength` 필드를 더해 기존 자동 저장 흐름으로 저장한다.
화면 배치는 사용자 결정에 따라 **목표 입력칸은 제목 아래, 글자 수는 화면 아래에 붙는 바**다.
모든 코드는 헌법 I에 따라 superpowers `test-driven-development`로 테스트를 먼저 쓴다.

## Technical Context

**Language/Version**: TypeScript 7 (strict), React 19, Next.js 16 (App Router, 클라이언트 컴포넌트)

**Primary Dependencies**: 새 의존성 없음. 브라우저 내장 `Intl.Segmenter`, `Number#toLocaleString("ko-KR")`

**Storage**: 기존 localStorage 목업(`lib/store.ts`)의 `Page`에 `targetLength?: number | null` 추가

**Testing**: Vitest 5 + React Testing Library + jsdom (`vitest.config.mts`, `test/setup.ts`)

**Target Platform**: 최신 데스크톱·모바일 브라우저 (Intl.Segmenter 지원: Chrome 87+, Safari 14.1+, Firefox 125+)

**Project Type**: 웹 앱 (Next.js 단일 프로젝트)

**Performance Goals**: 입력 후 체감 즉시(≤0.1초) 숫자 갱신. 10만 자 계산 실측 약 17ms (Node 24)

**Constraints**: 운영 비용 0원, 새 의존성 없음, 외부 통신 없음, 기존 자동 저장 동작 유지(SC-005)

**Scale/Scope**: 1인 사용자, 화면 1개(글 상세) 수정, 새 파일 2개(+테스트 4개)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 원칙 | 판정 | 근거 |
|---|---|---|
| I. 테스트 우선 (TDD) | ✅ | 모든 작업은 `/test-driven-development`로 RED → 실패 확인 → GREEN → 전체 통과 → REFACTOR. tasks.md에서 테스트 작업이 구현 작업보다 앞에 온다 |
| II. 진짜 동작 테스트 | ✅ | 계산은 손으로 센 리터럴 표 테스트, store는 jsdom 실제 localStorage, 모킹은 `next/navigation`만 (테스트 환경에 라우터 없음). 안내 문구 원문은 assert하지 않음 |
| III. 데이터는 store로만 | ✅ | `targetLength`는 `savePage`로만 저장. 화면에서 localStorage 직접 접근 없음. store 테스트가 Supabase 전환 시 계약 테스트 역할 |
| IV. PRD 범위·단순함 | ✅ (메모) | PRD W-1~5에 없는 추가 기능이지만 "첫 버전에 넣지 않는 것"에 해당하지 않고, 사용자가 직접 요청(강의 실습 + "제대로 된 글자 수 세기"). 새 의존성 0, 디바운스·웹 워커 같은 과한 구조 배제 |
| V. 디자인 시스템 | ✅ | `DESIGN.md` 정독 완료. 목표 입력은 ds `Input` 재사용, 색은 토큰(`--text-secondary`, `--red-500`). **새 패턴(아래에 붙는 글자 수 바)은 사용자 승인(2026-10-06)** 받았고 `DESIGN.md`에 추가 기록 예정 |
| 기술 제약 | ✅ | 클라이언트 컴포넌트, `AuthGate` 유지, Next 16 문서 확인(이번 변경은 라우팅·서버 API 사용 없음) |

**Post-design 재확인 (Phase 1 후)**: 위 판정 그대로 유지. 위반 없음 → Complexity Tracking 비움.

## Project Structure

### Documentation (this feature)

```text
specs/001-char-count/
├── plan.md              # 이 파일
├── research.md          # Phase 0: 결정과 근거 (R1~R8)
├── data-model.md        # Phase 1: Page.targetLength, 계산 값, 상태 변화
├── quickstart.md        # Phase 1: 자동 테스트·직접 써 보기 검증 순서
├── contracts/
│   ├── char-count-lib.md   # 계산 함수 입출력 표
│   └── store-and-ui.md     # store 확장, 컴포넌트, 화면 동작 계약
├── checklists/requirements.md
└── tasks.md             # Phase 2 (/speckit-tasks 에서 생성)
```

### Source Code (repository root)

```text
lib/
├── charCount.ts            # 신규: countChars, formatCount, parseTarget, overBy (순수 함수)
├── charCount.test.ts       # 신규: 표 기반 단위 테스트
├── store.ts                # 수정: Page.targetLength, savePage 패치 확장
└── store.test.ts           # 신규: 목표 저장·복원·글별 분리·기존 글 호환

components/
├── CharCounter.tsx         # 신규: 글자 수 두 줄 + 진행/초과 표시
└── CharCounter.test.tsx    # 신규: 렌더 결과 테스트

app/
├── globals.css             # 수정: "1d Detail" 섹션에 글자 수 바 클래스 추가
└── pages/[id]/
    ├── page.tsx            # 수정: 목표 입력칸(ds Input) + CharCounter 배치, 자동 저장에 targetLength 포함
    └── page.test.tsx       # 신규: 화면 통합 테스트

DESIGN.md                   # 수정: 새 패턴(글자 수 바, 초과 표시) 기록
```

**Structure Decision**: 기존 Next.js 단일 프로젝트 구조를 그대로 쓴다. 계산 로직은 화면과 분리한 순수 함수
(`lib/charCount.ts`)로 두어 단위 테스트하기 쉽게 하고, 표시는 재사용 가능한 컴포넌트(`components/CharCounter.tsx`),
저장은 `lib/store.ts` 한 곳에서만 다룬다. 테스트는 대상 파일 옆에 둔다(헌법 기술 제약).

### 화면 구성 요약 (사용자 결정 반영)

```text
┌ 상단바: ← 목록 ............ ● 저장됨  삭제 ┐
│ 수정 날짜                                  │
│ 제목 (textarea)                            │
│ 목표 글자 수 [ 예: 1,000 ]   ← ds Input    │
│   힌트: 비워 두면 글자 수만 보여요 / 오류   │
│ ───────── (.rule)                          │
│ 내용 (textarea)                            │
├ 화면 아래에 붙는 바 (position: sticky) ────┤
│ 공백 포함 1,234 / 1,000자 · 234자 초과     │  ← 초과 줄만 --red-500
│ 공백 제외 1,050 / 1,000자 · 50자 초과      │
└────────────────────────────────────────────┘
```

- 바: 배경 `--bg-page`, 위쪽 윤곽 `box-shadow: inset 0 1px 0 var(--border-subtle)`, 13px `--text-secondary`,
  숫자 `font-variant-numeric: tabular-nums`, 간격 4px 단위.
- 목표 입력: `inputMode="numeric"`, 최대 폭 제한(인라인 `maxWidth`), 힌트는 안내 ↔ 오류 문구 전환.
- 문구(해요체): 라벨 "목표 글자 수", placeholder "예: 1,000", 힌트 "비워 두면 글자 수만 보여요",
  오류 "1 이상의 숫자를 넣어 주세요".

## Complexity Tracking

> 헌법 위반 없음 — 기록할 항목 없음.
