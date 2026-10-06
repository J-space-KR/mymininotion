---

description: "글 내용 글자 수 표시 — TDD 작업 목록"
---

# Tasks: 글 내용 글자 수 표시

**Input**: Design documents from `/specs/001-char-count/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: **필수.** 헌법 원칙 I(TDD, NON-NEGOTIABLE)과 사용자 요청에 따라 superpowers의
`test-driven-development` 스킬로 진행한다. 모든 테스트 작업(🔴 RED)은 짝이 되는 구현 작업(🟢 GREEN)보다
먼저 오고, **반드시 실패하는 것을 눈으로 확인한 뒤** 구현한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4 — spec.md 기준)
- 🔴 = RED(실패하는 테스트 작성 + 실패 확인), 🟢 = GREEN(통과시키는 최소 코드 + 전체 통과 확인), 🔧 = 테스트 대상이 아닌 작업(CSS·문서·검증)

## TDD 실행 규칙 (모든 작업 공통)

1. 구현 단계 시작 전에 `/test-driven-development` 스킬을 호출하고, 테스트를 쓰거나 고칠 때는
   스킬의 `writing-good-tests.md` 규칙을 따른다.
2. 🔴 작업: 테스트를 쓰기 전에 "어떤 제품 코드 변경이 이 테스트를 실패시키는가"를 정한다.
   기대값은 `contracts/`의 **손으로 센 리터럴**을 그대로 쓴다. 작성 후 `npm test -- <파일>`로
   **기능이 없어서** 실패하는 것(오타·import 오류가 아님)을 확인한다. 처음부터 통과하면 테스트를 고친다.
3. 🟢 작업: 그 테스트를 통과시키는 **가장 단순한 코드만** 쓴다. 다음 작업의 기능을 미리 넣지 않는다.
   `npm test -- <파일>` 통과 후 **전체 `npm test`**도 통과하고 출력에 오류·경고가 없어야 한다.
4. 초록 상태에서만 리팩터링한다. 동작은 추가하지 않는다.
5. 모킹은 `next/navigation`(`useParams`, `useRouter`)만 한다. localStorage·store·컴포넌트는 진짜를 쓴다.
6. `lib/store.ts`는 모듈 안에 메모리 캐시가 있다. store를 쓰는 테스트는 테스트마다
   `vi.resetModules()` 후 `await import("@/lib/store")`(화면 테스트는 화면 모듈도)로 새로 불러온다.
   (`test/setup.ts`가 매 테스트 뒤 `localStorage.clear()`·`vi.resetModules()`를 이미 한다.)
7. 안내 문구 원문은 assert하지 않는다(변경 감지기 금지). 숫자 표시 문구(`공백 포함 6자` 등)는 계약이므로 assert한다.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 시작 상태 확인과 디자인 기준 숙지

- [X] T001 🔧 시작 상태 확인: 루트에서 `npx tsc --noEmit`이 오류 없이 끝나는지 확인하고, 아직 테스트 파일이 없어 `npm test`가 "No test files found"로 끝나는 것을 기록한다 (코드 변경 없음, 대상: `package.json`, `vitest.config.mts`, `test/setup.ts`)
- [X] T002 🔧 헌법 V에 따라 UI 작업 전 `DESIGN.md`를 처음부터 끝까지 읽고, 사용할 토큰(`--text-secondary`, `--red-500`, `--bg-page`, `--border-subtle`)과 ds `Input`(`components/ds/Input.tsx`) 사용법을 확인한다

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 기존 글 상세 화면의 동작을 테스트로 고정해 SC-005(기존 기능 유지)의 안전망을 만든다

**⚠️ CRITICAL**: 이후 모든 화면 작업은 이 테스트가 계속 통과해야 한다

- [X] T003 🔧 기존 동작 특성화 테스트를 `app/pages/[id]/page.test.tsx`에 만든다: 파일 맨 위에서 `vi.mock("next/navigation", …)`으로 `useParams`(테스트가 정한 글 id 반환)와 `useRouter`(`replace`·`push` 등 빈 함수)만 대체한다. 각 테스트는 `await import("@/lib/store")`로 `signInWithGoogle()` → `createPage()`로 글을 만들고 화면 모듈을 dynamic import해 렌더한다. 검증: (1) 제목·내용 textarea(`aria-label` "제목"/"내용")에 입력하면 화면을 언마운트했을 때 store의 그 글에 제목·내용이 저장된다. 이 테스트는 기존 코드에 대한 특성화 테스트라 **처음부터 통과하는 것이 정상**이며, 통과하지 않으면 테스트 쪽을 고친다

**Checkpoint**: 화면 테스트 틀과 기존 동작 안전망 준비 완료

---

## Phase 3: User Story 1 - 내용을 쓰면서 글자 수 확인하기 (Priority: P1) 🎯 MVP

**Goal**: 내용 입력칸 아래(화면 아래에 붙는 바)에 `공백 포함 N자` / `공백 제외 N자`가 실시간 표시된다

**Independent Test**: 글 상세에서 내용을 입력·삭제·붙여넣기 하며 두 숫자가 손으로 센 값과 같은지, 제목 입력에는 변하지 않는지 확인

### Tests & Implementation for User Story 1 (TDD 순서대로)

- [X] T004 [P] [US1] 🔴 `lib/charCount.test.ts`에 `countChars` 표 기반 테스트 작성 — `contracts/char-count-lib.md`의 13행을 리터럴 그대로(`""`→0/0, `"안녕하세요"`→5/5, `"안녕 하세요"`→6/5, `"할 일 정리"`→6/4, `"가\n나"`→3/2, `"가\r\n나"`→3/2, `"  \n"`→3/0, `"\t가"`→2/1, `"　가 "`→3/1, `"👍"`→1/1, `"👨‍👩‍👧"`→1/1, `"é"`→1/1, `"ㅎ"`→1/1). 실행해 "모듈/함수 없음"으로 실패 확인
- [X] T005 [US1] 🟢 `lib/charCount.ts`에 `countChars(text): { withSpaces; withoutSpaces }` 구현 — `Intl.Segmenter("ko", { granularity: "grapheme" })`로 나누고, `/^\s+$/u`에 맞는 글자는 `withoutSpaces`에서 뺀다 (research R1~R3). T004 통과 + 전체 `npm test` 통과
- [X] T006 [US1] 🔴 `lib/charCount.test.ts`에 `formatCount` 표 테스트 추가 (0→`"0"`, 999→`"999"`, 1000→`"1,000"`, 1234567→`"1,234,567"`). 실패 확인
- [X] T007 [US1] 🟢 `lib/charCount.ts`에 `formatCount(n)` 구현 (`n.toLocaleString("ko-KR")`). 통과 + 전체 통과
- [X] T008 [P] [US1] 🔴 `components/CharCounter.test.tsx` 작성 (목표 없는 경우만): `<CharCounter content="" target={null} />` → `공백 포함 0자`, `공백 제외 0자` 텍스트가 보임 / `content="안녕 하세요"` → `공백 포함 6자`, `공백 제외 5자` / 공백 포함 1,234자가 되는 내용 → `공백 포함 1,234자`. 실패 확인
- [X] T009 [US1] 🟢 `components/CharCounter.tsx` 구현: props `{ content: string; target: number | null }`, `countChars`·`formatCount`로 두 줄(`공백 포함 N자`, `공백 제외 N자`)을 렌더. 클래스는 `doc-count`, 줄은 `doc-count__line` (BEM, DESIGN §5-7). 목표 표시는 아직 넣지 않는다. 통과 + 전체 통과
- [X] T010 [US1] 🔴 `app/pages/[id]/page.test.tsx`에 화면 테스트 추가: (1) 빈 글을 열면 `공백 포함 0자`/`공백 제외 0자` (2) 내용에 `"안녕 하세요"` 입력(`fireEvent.change`) → `공백 포함 6자`/`공백 제외 5자` (3) 이어서 `"안녕 하세"`로 바꾸면 `공백 포함 5자`/`공백 제외 4자` (4) 여러 줄 `"가\n나\n다"`를 한 번에 넣으면 `공백 포함 5자`/`공백 제외 3자` (5) 제목만 `"제목입니다"`로 입력하면 `공백 포함 0자` 그대로. 실패 확인
- [X] T011 [US1] 🟢 `app/pages/[id]/page.tsx`의 `Editor`에서 `<main>` 안 내용 textarea 바로 뒤에 `<CharCounter content={…} target={null} />`를 배치. 계산 대상 내용은 `useDeferredValue(content)`로 넘기고 `CharCounter` 안 계산은 `useMemo`로 감싼다 (research R4). T003·T010 통과 + 전체 통과
- [X] T012 [US1] 🔧 `app/globals.css`의 글 상세 섹션(`.doc` 규칙 근처)에 `.doc-count` 추가: `position: sticky; bottom: 0`, 배경 `var(--bg-page)`, 위쪽 윤곽 `box-shadow: inset 0 1px 0 var(--border-subtle)`(border 대신 inset, DESIGN §1), 글자 13px `var(--text-secondary)`, `font-variant-numeric: tabular-nums`, 위·아래 패딩 12px, 줄 간격 4px. 원시 색·임의 숫자 대신 토큰과 4px 단위 값만 사용

**Checkpoint**: US1만으로 글자 수 세기가 완전히 동작 (MVP)

---

## Phase 4: User Story 2 - 다시 열었을 때 바로 글자 수 보기 (Priority: P2)

**Goal**: 저장된 내용이 있는 글을 열면 입력 없이 글자 수가 보인다

**Independent Test**: 내용이 저장된 글을 열자마자 올바른 숫자가 보이는지 확인

- [X] T013 [US2] 🔴 `app/pages/[id]/page.test.tsx`에 테스트 추가: store에서 `savePage(id, { title: "", content: "할 일 정리" })`로 저장한 글을 렌더하면 아무 입력 없이 `공백 포함 6자`/`공백 제외 4자`가 보인다. ⚠️ US1 구현이 이미 초기 내용으로 계산하므로 **처음부터 통과할 수 있다** — 그 경우 테스트가 진짜로 이 동작을 잡는지 확인하기 위해 `CharCounter`에 빈 문자열을 넘기도록 잠깐 바꿔 실패하는 것을 본 뒤 되돌리고(돌연변이 확인), 결과를 기록한다 → **결과**: 처음부터 통과. `CharCounter`에 `""`를 넘기는 돌연변이로 실패 확인 후 되돌림
- [X] T014 [US2] 🟢 T013이 실패했다면 초기 내용으로 표시되도록 `app/pages/[id]/page.tsx`를 최소 수정. 이미 통과했다면 제품 코드 변경 없음을 기록. 전체 통과 → **결과**: T013이 통과했으므로 제품 코드 변경 없음

**Checkpoint**: US1 + US2 동작

---

## Phase 5: User Story 4 - 목표 글자 수에 맞춰 쓰기 (Priority: P2)

**Goal**: 글마다 목표 글자 수를 정해 저장하고, 공백 포함·공백 제외 각각의 진행(`현재 / 목표자`)과 초과(`· N자 초과`, 빨간 글자)를 본다

**Independent Test**: 목표를 정하고 내용을 목표 아래·같음·위로 바꿔 가며 두 줄의 진행·초과가 맞는지, 다시 열어도 목표가 남는지, 다른 글에는 없는지 확인

### 계산 함수

- [X] T015 [P] [US4] 🔴 `lib/charCount.test.ts`에 `parseTarget` 표 테스트 추가 (`contracts/char-count-lib.md`): `""`·`"   "` → value null, error null / `"5000"`·`"5,000"` → 5000 / `" 1000 "` → 1000 / `"1"` → 1 / `"1000000"` → 1000000 / `"0"`·`"-5"`·`"1.5"`·`"abc"`·`"99999999999999999999"` → value null, **error가 null이 아님**(문구 원문은 assert 금지). 실패 확인
- [X] T016 [US4] 🟢 `lib/charCount.ts`에 `parseTarget(input)` 구현: 앞뒤 공백·쉼표 제거 → 빈 값이면 `{ value: null, error: null }` → `^\d+$`이고 `Number.isSafeInteger`이며 1 이상이면 그 값 → 아니면 `{ value: null, error: "1 이상의 숫자를 넣어 주세요" }` (research R6). 통과 + 전체 통과
- [X] T017 [US4] 🔴 `lib/charCount.test.ts`에 `overBy` 표 테스트 추가: (5, null)→0, (9, 10)→0, (10, 10)→0, (11, 10)→1, (12, 10)→2. 실패 확인
- [X] T018 [US4] 🟢 `lib/charCount.ts`에 `overBy(count, target)` 구현 (`target === null ? 0 : Math.max(0, count - target)`). 통과 + 전체 통과

### 저장소 (헌법 III)

- [X] T019 [P] [US4] 🔴 `lib/store.test.ts` 작성 (`contracts/store-and-ui.md` §1의 5행): 테스트마다 `await import("@/lib/store")`. (1) `savePage(A, { title, content, targetLength: 5000 })` 후 `vi.resetModules()`로 store를 새로 불러와 A의 `targetLength`가 5000 (2) A에 목표를 저장해도 B의 `targetLength ?? null`은 null (3) `targetLength: null` 저장 시 null (4) localStorage(`"mini-notion:v1"`)에 `targetLength` 없는 기존 글 데이터를 넣고 읽으면 오류 없이 `?? null`이 null (5) `savePage(A, { title, content })`(목표 미전달) 후 기존 목표 유지. 실패 확인 → **결과**: 기존 `savePage`가 패치를 통째로 펼쳐 넣어 실행 테스트는 처음부터 통과, RED는 `tsc` 타입 오류로 확인. `targetLength`를 버리는 돌연변이로 3개 실패 확인 후 되돌림
- [X] T020 [US4] 🟢 `lib/store.ts` 수정: `Page`에 `targetLength?: number | null` 추가 — 제약 "1 이상의 안전한 정수 또는 null, 없으면(undefined) 목표 없음으로 읽음"(data-model.md). `savePage(id, patch)`의 패치 타입을 `Pick<Page, "title" | "content"> & { targetLength?: number | null }`로 넓힌다 (기존 호출은 그대로 동작). `updatedAt` 갱신 동작 유지. 통과 + 전체 통과

### 표시 컴포넌트

- [X] T021 [US4] 🔴 `components/CharCounter.test.tsx`에 목표 있는 경우 추가: 공백 포함 1,234자·공백 제외 1,050자가 되는 내용 + `target={5000}` → `공백 포함 1,234 / 5,000자`, `공백 제외 1,050 / 5,000자` / `"가나다라마 바사아자"` + 10 → 두 줄 모두 `초과` 문구 없음 / `"가나다라마 바사아자 "` + 10 → 공백 포함 줄에만 `1자 초과`, 공백 제외 줄에는 없음 / `"가나다라마 바사아자차차"` + 10 → `2자 초과`와 `1자 초과`가 각 줄에. 줄 구분은 각 줄 요소의 텍스트로 확인. 실패 확인
- [X] T022 [US4] 🟢 `components/CharCounter.tsx`에 목표 표시 추가: 목표가 있으면 `공백 포함 {현재} / {목표}자`, 초과 시 같은 줄 끝에 ` · {N}자 초과`, 그 줄에 `doc-count__line--over` 클래스. `overBy`·`formatCount` 사용. 통과 + 전체 통과
- [X] T023 [US4] 🔧 `app/globals.css`에 `.doc-count__line--over { color: var(--red-500) }` 추가 (색만이 아니라 `N자 초과` 문구와 함께 쓰임, 대비 5.6:1)

### 화면 통합

- [X] T024 [US4] 🔴 `app/pages/[id]/page.test.tsx`에 테스트 추가: (1) 라벨 "목표 글자 수" 입력칸(`getByLabelText`)에 `"5,000"` 입력 → `/ 5,000자`가 두 줄에 보임 (2) 목표 10 + 내용 `"가나다라마 바사아자 "` → 공백 포함 줄에만 `1자 초과` (3) 목표 `"abc"` → 진행 표시(`/ `)가 사라지고 입력칸 힌트 문구가 기본 문구와 달라짐 (4) 목표 `"10"` 입력 후 언마운트 → store의 그 글 `targetLength`가 10, 다시 렌더하면 입력칸 값이 `10` (5) 글 A에 목표 저장 후 글 B를 열면 목표 입력칸이 비어 있음 (6) 목표를 비우고 언마운트하면 `targetLength`가 null이고 진행 표시가 사라짐. 실패 확인
- [X] T025 [US4] 🟢 `app/pages/[id]/page.tsx` 수정: 제목 textarea와 `.rule` 사이에 ds `Input`을 배치 — `label="목표 글자 수"`, `inputMode="numeric"`, `placeholder="예: 1,000"`, `hint`는 오류가 있으면 `parseTarget`의 error, 없으면 `"비워 두면 글자 수만 보여요"`, 폭은 인라인 `style={{ maxWidth: 240 }}`. 입력 문자열 상태(초기값: `page.targetLength`가 있으면 그 숫자 문자열, 없으면 `""`)를 두고 `parseTarget(...).value`를 `CharCounter`의 `target`과 자동 저장 패치 `targetLength`에 넣는다. 입력이 바뀌면 `setDirty(true)`. 디바운스 저장과 언마운트 시 저장(`latest` ref) 모두 `targetLength`를 포함한다. T003·T010·T013·T024 통과 + 전체 통과

**Checkpoint**: 목표 글자 수까지 포함한 "제대로 된 글자 수 세기" 완성

---

## Phase 6: User Story 3 - 화면을 보지 않고도 글자 수 알기 (Priority: P3)

**Goal**: 스크린 리더가 글자 수 영역을 "글자 수"라는 이름과 함께 읽고, 입력할 때마다 끼어들지 않는다

**Independent Test**: 접근성 트리에서 이름 "글자 수"인 그룹 안에 두 줄이 있고, live region 속성이 없는지 확인

- [X] T026 [US3] 🔴 `components/CharCounter.test.tsx`에 테스트 추가: `getByRole("group", { name: "글자 수" })` 안에 `공백 포함`·`공백 제외` 두 줄이 있다 / 그 그룹과 하위 요소 어디에도 `aria-live` 속성이 없다(`getAttribute("aria-live") === null`, `querySelector("[aria-live]") === null`). 실패 확인
- [X] T027 [US3] 🟢 `components/CharCounter.tsx` 바깥 요소에 `role="group"`과 `aria-label="글자 수"` 추가 (`aria-live` 금지, FR-008). 통과 + 전체 통과

**Checkpoint**: 모든 사용자 이야기 완료

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 문서 갱신, 품질 관문, 커밋

- [X] T028 [P] 🔧 `DESIGN.md` 갱신 (헌법 V, CLAUDE.md): §5-6 공통 패턴 표에 "글자 수 바 `.doc-count`"(화면 아래 sticky, 13px `--text-secondary`, inset 윗윤곽, tabular-nums) 추가 / §6 상태 표현 표에 "목표 초과: `.doc-count__line--over` 빨간 글자 + `· N자 초과`" 추가 / §7 실제 화면 문구 표에 "목표 글자 수" 라벨·placeholder·힌트·오류 문구 추가 / §2-3 `--red-500` 용도에 "목표 초과 글자" 추가
- [X] T029 🔧 돌연변이 점검 (헌법 II): `lib/charCount.ts`, `lib/store.ts`, `components/CharCounter.tsx`, `app/pages/[id]/page.tsx`에서 공백 판정 정규식, grapheme→코드 단위 계산, `>`→`>=`(같으면 초과로), 목표 저장 누락, 제목을 세는 실수를 각각 잠깐 넣어 보고 최소 한 테스트가 실패하는지 확인 후 되돌린다. 못 잡는 돌연변이가 있으면 테스트를 추가한다 → **결과**: 14개 돌연변이 중 13개를 기존 테스트가 잡음. "목표와 같아도 초과 클래스" 1개를 못 잡아 `CharCounter.test.tsx`에 초과 상태 클래스 테스트 2개 추가 후 잡는 것 확인
- [X] T030 🔧 품질 관문: `npm test`(전체, 출력에 오류·경고 없음), `npx tsc --noEmit`, `npm run build`를 실행하고 결과를 그대로 기록한다 → **결과**: `npm test` 4파일 62개 통과·경고 0, `tsc --noEmit` 오류 0, `npm run build` 성공
- [X] T031 🔧 `DESIGN.md` §9 체크리스트로 글 상세 화면 변경분을 점검하고 결과를 짧게 보고한다 (640px 이하 폭 포함) → **결과**: 다크 배경·토큰(시맨틱 별칭)·ds Input 재사용·4px 단위·inset 윤곽·해요체·ink-500 미사용 모두 통과. primary 버튼 추가 없음. 360px 폭에서 가로 스크롤 없음, 두 줄 잘림 없음
- [X] T032 🔧 `specs/001-char-count/quickstart.md`의 "직접 써 보기" 1~10번을 `npm run dev`로 확인한다 → **결과**: 2·3·5·6·7·9·10 브라우저 확인, 4는 자동 테스트로 확인. 8: 10만 자 숫자 정확(100,000 / 75,000), 글자 수 계산 약 19ms. 단 한 글자 입력 처리 전체는 약 191ms로, 대부분(약 137ms)이 기존 `useAutosize`(입력칸 높이 조절) 비용 — 범위 밖이라 보고만 함. 탭이 백그라운드여서 측정값은 참고용
- [X] T033 🔧 커밋: 전체 테스트를 다시 실행해 통과하면 커밋한다. 이 폴더는 아직 git 저장소가 아니므로, 커밋 전에 사용자에게 `git init` 여부를 확인한다 → **결과**: 62개 통과 확인 후 `git init`(브랜치 `001-char-count`), 작성자 J-space-KR(학원용)로 커밋

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 바로 시작
- **Foundational (Phase 2)**: Setup 후. 화면 작업(T010 이후)을 막는다
- **US1 (Phase 3)**: Foundational 후. MVP
- **US2 (Phase 4)**: US1의 화면 배치(T011)에 의존
- **US4 (Phase 5)**: 계산 함수(T015~T018)와 store(T019~T020)는 US1과 병렬 가능. 컴포넌트·화면 작업(T021~T025)은 US1의 T009·T011 이후
- **US3 (Phase 6)**: T009 이후 언제든 (같은 파일 `CharCounter.tsx`를 고치므로 T022와 동시에 하지 않는다)
- **Polish (Phase 7)**: 모든 이야기 완료 후

### Within Each User Story

- 🔴 테스트 작업이 반드시 🟢 구현 작업보다 먼저, 실패 확인 후에 구현
- 계산 함수 → 저장소 → 컴포넌트 → 화면 순서
- 각 🟢 작업 끝에 전체 `npm test`

### Parallel Opportunities

- T004(`lib/charCount.test.ts`), T008(`components/CharCounter.test.tsx`)는 서로 다른 파일이라 동시에 RED 작성 가능
- T019(`lib/store.test.ts`)는 US1 진행 중에도 병렬 가능
- T028(`DESIGN.md`)은 코드와 독립
- 같은 파일을 고치는 작업(`page.tsx`, `CharCounter.tsx`, `charCount.ts`)은 순서대로

---

## Parallel Example: User Story 1 & 4

```bash
# 서로 다른 파일의 RED 테스트를 동시에 작성:
Task: "T004 countChars 표 테스트 in lib/charCount.test.ts"
Task: "T008 CharCounter 목표 없음 렌더 테스트 in components/CharCounter.test.tsx"
Task: "T019 targetLength 저장 계약 테스트 in lib/store.test.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2 (기존 동작 안전망)
2. Phase 3 (US1) 완료 → **멈추고 확인**: 글자 수 두 줄이 실시간으로 맞게 나오는지
3. 여기까지만 해도 "글자 수 세기"는 쓸 수 있다

### Incremental Delivery

1. US1 → 글자 수 표시 (MVP)
2. US2 → 다시 열 때 바로 표시 (대부분 US1로 이미 충족, 테스트로 고정)
3. US4 → 목표 글자 수 (계산 → 저장 → 표시 → 화면)
4. US3 → 스크린 리더 지원
5. Polish → DESIGN.md 갱신, 돌연변이 점검, 품질 관문, 커밋

---

## Notes

- 총 33개 작업. 🔴 RED 11개, 🟢 GREEN 11개, 🔧 기타 11개
- 각 🔴 작업은 실패 확인이 끝나야 완료로 체크한다
- 기존 코드(`page.tsx`)를 고칠 때 T003 특성화 테스트가 항상 초록이어야 한다 (SC-005)
- 구현 직전에는 `/clear`로 컨텍스트를 비운다 (강의 권장). 필요한 정보는 모두 이 파일과 `specs/001-char-count/`에 있다
