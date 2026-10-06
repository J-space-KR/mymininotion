# Contract: 저장소 확장과 화면 동작

## 1. 저장소 (`lib/store.ts`) — 헌법 III

### 타입
```ts
export type Page = {
  id: string; title: string; content: string;
  createdAt: number; updatedAt: number;
  targetLength?: number | null; // 신규 — 없으면 "목표 없음"
};
```

### `savePage(id, patch)`
- 패치 타입이 `{ title, content, targetLength? }`로 넓어진다. 기존 호출(`{ title, content }`)은 그대로 동작한다.
- `targetLength`를 넘기면 그 글에만 저장되고 `updatedAt`이 갱신된다.
- `targetLength: null`을 넘기면 "목표 없음"으로 저장된다.

### 검증할 계약 (store 단위 테스트)
| Given | When | Then |
|---|---|---|
| 글 A | `savePage(A, { title, content, targetLength: 5000 })` | 새로 불러온 저장소에서 A의 `targetLength`가 5000 |
| 글 A(목표 5000), 글 B | — | B의 `targetLength`는 비어 있음 (`?? null` → null) |
| 글 A(목표 5000) | `savePage(A, { …, targetLength: null })` | A의 `targetLength`가 null |
| localStorage에 `targetLength` 없는 기존 글 | 저장소 읽기 | 오류 없이 열리고 `targetLength ?? null`이 null |
| 글 A | `savePage(A, { title, content })` (목표 안 넘김) | 기존 목표가 그대로 유지 |

## 2. 글자 수 표시 컴포넌트 (`components/CharCounter.tsx`)

Props: `{ content: string; target: number | null }`

| 상황 | 화면에 보이는 글 (줄 단위) |
|---|---|
| 내용 `""`, 목표 없음 | `공백 포함 0자` / `공백 제외 0자` |
| 내용 `"안녕 하세요"`, 목표 없음 | `공백 포함 6자` / `공백 제외 5자` |
| 공백 포함 1,234 · 제외 1,050, 목표 5000 | `공백 포함 1,234 / 5,000자` / `공백 제외 1,050 / 5,000자` |
| `"가나다라마 바사아자"`, 목표 10 | 두 줄 모두 초과 문구 없음 |
| `"가나다라마 바사아자 "`, 목표 10 | 공백 포함 줄만 `· 1자 초과`, 공백 제외 줄은 없음 |
| `"가나다라마 바사아자차차"`, 목표 10 | `· 2자 초과` / `· 1자 초과` |

- 초과 줄은 빨간 글자(`--red-500`)이고, 문구 `N자 초과`가 함께 있다 (색만으로 구분하지 않음).
- `aria-live`를 쓰지 않는다 (FR-008). 영역 이름 `aria-label="글자 수"`의 그룹으로 읽힌다.

## 3. 글 상세 화면 (`app/pages/[id]/page.tsx`)

| 사용자 행동 | 기대 결과 |
|---|---|
| 내용 입력칸에 입력·삭제·붙여넣기 | 아래 바의 두 숫자가 즉시 갱신 |
| 제목만 입력 | 숫자 변화 없음 |
| 저장된 내용이 있는 글을 염 | 입력 없이 올바른 숫자 표시 |
| "목표 글자 수" 칸에 `5,000` 입력 | 두 줄이 `… / 5,000자` 형태로 바뀜, 자동 저장 |
| 목표 칸에 `abc` 입력 | 힌트에 안내 문구, 목표 없이 표시 |
| 목표 칸 비움 | 진행·초과 표시가 사라짐 |
| 다른 화면 갔다가 다시 염 | 목표가 그대로 남아 있음 |
| 기존 기능 (제목·내용 자동 저장, 삭제) | 변화 없음 (SC-005) |

테스트에서 대체하는 것은 `next/navigation`의 `useParams`·`useRouter`뿐이다 (테스트 환경에 라우터가 없음).
