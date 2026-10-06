# Research: 글 내용 글자 수 표시

**Feature**: [spec.md](./spec.md) | **Date**: 2026-10-06

## R1. "한 글자"를 어떻게 셀 것인가 (FR-004)

- **Decision**: 브라우저 내장 `Intl.Segmenter`(granularity `"grapheme"`)로 "화면에 보이는 한 글자"
  단위로 나눠서 센다.
- **Rationale**: 자바스크립트의 `string.length`는 UTF-16 코드 단위를 세서 👍 = 2, 👨‍👩‍👧 = 8로 나온다.
  `Intl.Segmenter`는 유니코드 표준(UAX #29) 기준으로 이모지·결합 문자·한글 자모 조합을 1자로 묶는다.
  새 의존성 없이 최신 브라우저와 Node 24(테스트 환경)에 모두 들어 있다 → 월 0원·의존성 추가 없음.
- **Alternatives considered**:
  - `[...text].length` (코드 포인트 단위): 👍은 1이지만 👨‍👩‍👧(ZWJ 결합)은 5로 나와 FR-004 위반.
  - `grapheme-splitter` 같은 외부 라이브러리: 같은 결과지만 의존성 추가 → 헌법 IV에 따라 불필요.

## R2. 줄바꿈 처리 (FR-003, Clarification Q2)

- **Decision**: 별도 치환 없이 grapheme 단위로 센다. `\n` 1자, `\r\n`도 1자.
- **Rationale**: 유니코드 grapheme 규칙(GB3)에서 CR+LF는 한 덩어리라서 `Intl.Segmenter`가 자동으로
  1자로 센다. 또 브라우저 `<textarea>`는 값에서 줄바꿈을 `\n`으로 정규화한다. 두 경로 모두 1자가 된다.
- **Alternatives considered**: `text.replace(/\r\n/g, "\n")` 선처리 — 결과가 같아 불필요한 코드.

## R3. "공백"의 정의 (FR-003 공백 제외)

- **Decision**: 한 글자(grapheme)가 정규식 `/^\s+$/u`에 맞으면 공백으로 보고 "공백 제외"에서 뺀다.
  띄어쓰기, 탭, 줄바꿈(`\n`, `\r\n`), 줄바꿈 없는 공백(NBSP), 전각 공백(U+3000)이 포함된다.
- **Rationale**: 일반 글자 수 세기 도구의 "스페이스와 줄바꿈을 뺀 값"과 같고, 한국어 문서에 섞이는 전각
  공백도 자연스럽게 처리된다.
- **Alternatives considered**: 띄어쓰기(U+0020)와 `\n`만 빼기 — 탭·NBSP가 글자로 세어져 사용자 기대와 다름.

## R4. 10만 자에서 입력이 느려지지 않게 (SC-001, SC-003)

- **Decision**: 글자 수 계산은 순수 함수 하나로 두고, 화면에서는 `useMemo`(내용이 바뀔 때만 계산)와
  `useDeferredValue`(입력 반영을 먼저, 숫자 갱신은 그 다음)로 감싼다.
- **Rationale**: `Intl.Segmenter`로 10만 자를 나누는 데 수 ms~수십 ms가 걸릴 수 있다.
  `useDeferredValue`를 쓰면 React가 입력칸 갱신을 먼저 처리하고, 숫자는 바로 뒤따라 바뀐다 → 입력 끊김 없음.
- **Alternatives considered**: 디바운스(예: 200ms 뒤 계산) — 숫자가 늦게 따라와 SC-001(체감 즉시) 위반.
  웹 워커 — 이 규모에선 과한 구조(YAGNI).

## R5. 목표 글자 수 저장 위치 (FR-016, FR-017, 헌법 III)

- **Decision**: 기존 `Page`에 선택 필드 `targetLength?: number | null`을 추가하고, `lib/store.ts`의
  `savePage` 패치에 포함해 기존 자동 저장(1초 디바운스) 흐름으로 함께 저장한다.
- **Rationale**: 헌법 III — 데이터는 `lib/store.ts`로만. 같은 자동 저장을 타면 "저장 중… / 저장됨"
  표시도 그대로 맞는다. 필드가 없던 기존 글(localStorage에 이미 있는 데이터)은 `undefined` → "목표 없음"으로
  읽어서 따로 데이터 변환이 필요 없다. 나중에 Supabase로 옮기면 `pages.target_length int null` 칸 하나.
- **Alternatives considered**: 별도 localStorage 키 — 헌법 III 위반이고 글 삭제 시 찌꺼기가 남는다.
  별도 함수 `setTarget()` 즉시 저장 — 자동 저장 흐름이 두 갈래가 되어 "저장됨" 표시와 어긋난다.

## R6. 목표 입력값 검사 (Edge Cases, FR-011)

- **Decision**: 입력 문자열에서 앞뒤 공백과 쉼표를 빼고, `^\d+$`에 맞고 1 이상이면 정수 목표로 인정한다.
  빈 값 → 목표 없음(오류 아님). 0, 음수, 소수, 문자 → 목표 없음 + 안내 문구.
  `Number.MAX_SAFE_INTEGER`를 넘으면 숫자로 다룰 수 없으므로 같은 안내를 띄운다(사실상 상한 없음).
- **Rationale**: "1,000"처럼 쉼표를 넣어 적는 습관을 받아준다. 최대값을 막지 않는다는 Q3 답과 맞는다.

## R7. 화면 배치와 디자인 (FR-007, FR-009, FR-013, 사용자 결정)

- **Decision** (2026-10-06 사용자 선택: "목표는 위, 글자 수는 아래"):
  - 목표 글자 수 입력칸: 글 제목 아래, 구분선 위. 기존 `components/ds/Input` 재사용
    (라벨 "목표 글자 수", 힌트 영역에 안내·오류 문구).
  - 글자 수 표시: 화면 아래에 붙는 바(스크롤해도 따라옴). 두 줄 — "공백 포함 …", "공백 제외 …".
    보조 텍스트 13px, `--text-secondary`. 숫자는 고정폭 숫자(`tabular-nums`)로 흔들림 방지.
  - 초과: `--red-500` 글자 + "· N자 초과" 문구(색만으로 구분하지 않음). 대비 5.6:1 (ink-50 배경)로 본문 기준 통과.
  - 스크린 리더: 글자 수 영역은 일반 텍스트로 읽히게 두고 `aria-live`는 쓰지 않는다 (FR-008: 매 글자 낭독 금지).
- **Rationale**: 사용자가 고른 배치. 새 패턴(아래에 붙는 바)은 `DESIGN.md`에 추가로 기록한다.
- **Alternatives considered**: 내용 끝에 고정, 화면 아래 바에 목표 칸까지 함께 — 사용자가 선택하지 않음.

## R8. 테스트 전략 (헌법 I·II)

- **Decision**:
  - `lib/charCount.test.ts`: 손으로 센 리터럴 기대값의 표(table-driven) 테스트. 모킹 없음.
  - `lib/store.test.ts`: 실제 jsdom localStorage로 `targetLength` 저장·복원·글별 분리·기존 글 호환 검증.
  - `components/CharCounter.test.tsx`: 역할·텍스트 기준 렌더 테스트. 모킹 없음.
  - `app/pages/[id]/page.test.tsx`: 화면 통합 테스트. 테스트 환경에 없는 `next/navigation`
    (`useParams`, `useRouter`)만 대체하고, store·컴포넌트는 진짜를 쓴다.
  - 사용자 입력은 `@testing-library/react`의 `fireEvent`로 충분 → 새 의존성 없음.
- **Rationale**: 헌법 II — 진짜 동작 검증, 모킹은 피할 수 없는 경계만.
