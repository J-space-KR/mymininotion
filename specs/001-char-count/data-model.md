# Data Model: 글 내용 글자 수 표시

**Feature**: [spec.md](./spec.md) | **Research**: [research.md](./research.md)

## 저장되는 데이터

### Page (기존 엔티티 확장) — `lib/store.ts`

| 필드 | 타입 | 상태 | 설명 |
|---|---|---|---|
| `id` | string | 기존 | 글 식별자 |
| `title` | string | 기존 | 제목 (글자 수에 세지 않음) |
| `content` | string | 기존 | 내용 (글자 수 계산 대상) |
| `createdAt` | number | 기존 | 만든 시각 |
| `updatedAt` | number | 기존 | 마지막 수정 시각 (목표 변경도 수정으로 본다) |
| `targetLength` | `number \| null` (선택 필드) | **신규** | 목표 글자 수. 1 이상의 정수 또는 `null`(목표 없음) |

**검증 규칙**
- `targetLength`는 `null`이거나 1 이상의 안전한 정수(`Number.isSafeInteger`)만 저장한다.
- 필드가 없는 기존 글(`undefined`)은 `null`과 같게 "목표 없음"으로 읽는다. 저장 데이터 변환은 하지 않는다.
- 글마다 독립적이다. 한 글의 목표가 다른 글에 영향을 주지 않는다.
- 글을 지우면 목표도 함께 사라진다 (같은 객체 안에 있으므로 자동).

**나중에 Supabase로 옮길 때 (PRD §7.3)**: `pages` 표에 `target_length integer null check (target_length >= 1)` 칸 추가.

## 저장하지 않는 값 (화면에서 계산)

### CharCount

| 필드 | 타입 | 설명 |
|---|---|---|
| `withSpaces` | number | 공백 포함 글자 수 (grapheme 단위, 줄바꿈 1자) |
| `withoutSpaces` | number | 공백 제외 글자 수 (`/^\s+$/u`인 글자를 뺀 수) |

불변식: `0 ≤ withoutSpaces ≤ withSpaces`.

### TargetInput (목표 입력칸의 해석 결과)

| 입력 | 결과 `value` | 결과 `error` |
|---|---|---|
| `""`, `"  "` | `null` | 없음 |
| `"5000"`, `"5,000"`, `" 5000 "` | `5000` | 없음 |
| `"0"`, `"-1"`, `"1.5"`, `"abc"`, `"5천"` | `null` | 안내 문구 있음 |

### 초과 계산

`overBy(count, target)` = `target`이 `null`이면 0, 아니면 `max(0, count - target)`.
`count === target`이면 0 → 초과 아님 (FR-013).

## 상태 변화 (목표 글자 수)

```text
[목표 없음] --유효한 숫자 입력--> [목표 N]
[목표 N]    --다른 유효 숫자-->   [목표 M]
[목표 N]    --칸 비움-->          [목표 없음]
[목표 N]    --잘못된 값 입력-->   [목표 없음 + 안내 문구]   (저장도 null)
```

각 변화는 기존 자동 저장(입력 멈춘 뒤 1초, 화면을 떠날 때 즉시)으로 저장된다.
