# 미니 노션 디자인 가이드 (DESIGN.md)

> 새 화면이나 기능을 추가할 때 이 문서만 보고도 지금과 같은 톤앤매너로 만들기 위한 기준입니다.
> 모든 수치는 실제 코드에서 가져왔고, 괄호 안에 출처 파일을 적었습니다.

---

## 1. 디자인 원칙 (톤앤매너)

### 한 문장 정의
**"혼자 쓰는, 필요한 기능만 담은, 빠르게 적고 찾는 도구"** (02-prd.md, layout.tsx의 description "필요한 기능만 담은 나만의 무료 업무 도구")

### 시각 키워드 5가지

| 키워드 | 코드에서 어디서 나오나 |
|---|---|
| **다크 기본** | 페이지 배경 `--bg-page: var(--ink-50)` (#0F1113), 로그인은 `--bg-stage`(#000). 상단바 토글로 PC통신 모드로 바꿀 수 있음 (globals.css, §2-4-1) |
| **라임 한 가지 강조색** | `--volt-300` (#D1FE17) 하나만 강조에 사용 — 주요 버튼, 포커스, 캐럿, `/` 명령어, 선택 영역 (globals.css) |
| **굵고 좁은 헤드라인** | 로그인 타이틀 `font-weight:900`, 자간 `-0.045em`, 대문자 / 페이지 제목 `800`, `-0.03em` (globals.css) |
| **눌리는 입체 버튼** | 버튼 아래 단색 그림자 `0 4px 0 0`, 누르면 `translateY(3px)`로 내려감 (globals.css) |
| **모노스페이스 명령어** | `/page` 입력창과 `.mono-accent`에 `--font-mono` + 라임색 (globals.css) |

### 하지 않는 것 (코드로 확인된 것만)
- **시스템 설정을 따르지 않음** — `prefers-color-scheme`은 쓰지 않고, 처음엔 항상 다크. PC통신 모드는 사용자가 토글로 고를 때만 (lib/theme.ts)
- **강조색 여러 개 섞지 않음** — 시맨틱 색(pink/orange/blue)은 정의만 있고, 화면에서는 red(삭제 아이콘)·green(저장됨 점)만 상태 표시에 씀 (globals.css, pages/[id]/page.tsx)
- **그라데이션 없음** — `linear-gradient` / `radial-gradient` 사용 없음. **예외:** 커버 스켈레톤의 시머 띠(`.cover--loading::after`)만 투명 → `--border-default` → 투명 그라데이션을 씀 (globals.css)
- **테두리(border) 대신 inset 그림자** — 입력창·카드·다이얼로그의 윤곽은 `box-shadow: inset 0 0 0 1px`로 그림 (globals.css)
- **빨간 삭제 버튼 없음** — 삭제 확정 버튼도 `white` 변형을 쓰고, 위험은 빨간 아이콘 박스로만 알림 (pages/[id]/page.tsx)

---

## 2. 디자인 토큰

모두 `app/globals.css`의 `:root`에 정의되어 있습니다.

### 2-1. Volt (라임 강조색)

| 토큰 | 값 | 언제 쓰나 |
|---|---|---|
| `--volt-50` | `#F8FFD6` | (현재 미사용) |
| `--volt-100` | `#EEFFA3` | (현재 미사용) |
| `--volt-200` | `#E2FF5C` | 강조색 hover (`--accent-hover`) |
| `--volt-300` | `#D1FE17` | **대표 강조색** — 주요 버튼, 포커스, 캐럿, 아바타 기본 배경 |
| `--volt-400` | `#BDE80E` | (현재 미사용) |
| `--volt-500` | `#9FC40A` | (현재 미사용) |
| `--volt-600` | `#829B19` | primary 버튼 아래 그림자, 강조 테두리 |
| `--volt-700` | `#5E7010` | soft 배지 테두리 |
| `--volt-800` | `#2A3305` | 옅은 강조 배경 — soft 버튼/배지, 선택된 명령어 항목 |
| `--volt-900` | `#171C03` | (현재 미사용) |

### 2-2. Ink (무채색)

| 토큰 | 값 | 언제 쓰나 |
|---|---|---|
| `--ink-0` | `#000000` | 가장 깊은 배경 (로그인 무대) |
| `--ink-50` | `#0F1113` | 기본 페이지 배경 |
| `--ink-100` | `#16181B` | 명령어 입력창 배경 |
| `--ink-200` | `#1F2124` | 카드, 입력창, 다이얼로그, 프로필 필, 목록 hover |
| `--ink-300` | `#2A2D31` | secondary 버튼, 카드 hover, neutral 배지 |
| `--ink-400` | `#3A3E43` | (현재 미사용) |
| `--ink-500` | `#5C6168` | 가장 흐린 글자 — placeholder, 시간, 캡션 |
| `--ink-600` | `#8A8F96` | 보조 글자 — 설명, 스니펫, muted |
| `--ink-700` | `#B4B8BD` | 라벨, 로그인 부제 |
| `--ink-800` | `#DADCDF` | 글 상세 본문 |
| `--ink-900` | `#F2F3F4` | (현재 미사용) |
| `--white` | `#FFFFFF` | 기본 글자, white 버튼 |

### 2-3. 시맨틱 색

| 토큰 | 값 | 언제 쓰나 |
|---|---|---|
| `--pink-500` | `#FF2E8A` | `hot` 배지 |
| `--pink-600` | `#E0136E` | (현재 미사용) |
| `--orange-500` | `#FF7A1A` | (현재 미사용) |
| `--red-500` | `#FF4545` | 위험(삭제) 아이콘, 목표 글자 수 초과 글자 (다크) |
| `--blue-500` | `#3D8BFF` | (현재 미사용) |
| `--green-500` | `#2BD67B` | "저장됨" 상태 점 |

### 2-4. 시맨틱 별칭 ⭐

> **규칙: 새 코드에서는 원시 색(`--ink-300`)보다 시맨틱 별칭(`--surface-card-hover`)을 우선 사용합니다.**
> 역할 이름으로 쓰면 나중에 색을 바꿀 때 한 곳만 고치면 됩니다.

| 분류 | 토큰 | 값 | 의미 |
|---|---|---|---|
| 배경 | `--bg-page` | `var(--ink-50)` | 페이지 기본 배경 |
| | `--bg-stage` | `var(--ink-0)` | 가장 어두운 무대 배경 (로그인) |
| 표면 | `--surface-card` | `var(--ink-200)` | 카드·입력창·다이얼로그 |
| | `--surface-card-hover` | `var(--ink-300)` | 카드 hover |
| | `--surface-chip` | `var(--ink-200)` | 칩·필 |
| | `--surface-input` | `var(--ink-100)` | 명령어 입력창 |
| | `--surface-secondary` | `var(--ink-300)` | secondary 버튼, neutral 배지 |
| | `--surface-ghost-hover` | `rgba(255,255,255,0.06)` | ghost 버튼 hover |
| | `--surface-inverse` | `var(--white)` | 반전 표면 (white 버튼) |
| | `--surface-accent` | `var(--volt-300)` | 강조 표면 (primary 버튼) |
| | `--surface-accent-soft` | `var(--volt-800)` | 옅은 강조 표면 |
| 글자 | `--text-primary` | `var(--white)` | 기본 글자 |
| | `--text-body` | `var(--ink-800)` | 글 상세 본문, neutral 배지 글자 |
| | `--text-label` | `var(--ink-700)` | 입력창 라벨, 로그인 부제 |
| | `--text-secondary` | `var(--ink-600)` | 보조 글자 |
| | `--text-tertiary` | `var(--ink-500)` | 가장 흐린 글자 |
| | `--text-on-accent` | `var(--ink-0)` | 라임 위의 글자 |
| | `--text-accent` | `var(--volt-300)` | 강조 글자 |
| | `--text-inverse` | `var(--ink-0)` | 흰 표면 위 글자 |
| | `--text-danger` | `var(--red-500)` | 위험 아이콘, 목표 글자 수 초과 |
| 테두리 | `--border-subtle` | `rgba(255,255,255,0.06)` | 구분선, 빈 상태 윤곽 |
| | `--border-default` | `rgba(255,255,255,0.10)` | 입력창·카드 윤곽 |
| | `--border-strong` | `rgba(255,255,255,0.18)` | 강한 윤곽 |
| | `--border-accent` | `var(--volt-600)` | 강조 윤곽 |
| 강조 | `--accent` | `var(--volt-300)` | 강조색 |
| | `--accent-edge` | `var(--volt-600)` | 강조 버튼 아래 그림자 |
| | `--accent-hover` | `var(--volt-200)` | 강조 hover |
| | `--focus-ring` | `var(--volt-300)` | 포커스 아웃라인, 입력창 포커스 테두리 |
| 입체 그림자 | `--edge-default` | `var(--ink-0)` | secondary 버튼·프로필 카드 아래 그림자 |
| | `--edge-inverse` | `#9A9EA3` | white 버튼 아래 그림자 |
| 오버레이 | `--overlay-scrim` | `rgba(0,0,0,0.6)` | 다이얼로그 뒤 어두운 막 |

### 2-4-1. PC통신 모드

90년대 PC통신(하이텔·천리안·나우누리)을 "이야기"·"새롬데이터맨" 같은 접속 프로그램으로 쓰던 **파란 바탕 + 흰 글자** 화면을 재현한 테마입니다. `<html data-theme="pc">`일 때 `:root[data-theme="pc"]`가 시맨틱 별칭과 글꼴·모서리 토큰을 다시 정의합니다. 원시 색(`--ink-*`, `--volt-*`)은 그대로라서, **테마를 따르려면 반드시 시맨틱 별칭을 써야 합니다.** 원시 색을 직접 쓰면 PC통신 모드에서도 다크 색이 그대로 남습니다.

**DOS/CGA 팔레트** (`:root[data-theme="pc"]` 안에서만 정의)

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--dos-blue` | `#0000AA` | 페이지 배경 (그 시절 파란 화면) |
| `--dos-navy` | `#000080` | 카드·입력창·다이얼로그 |
| `--dos-bright-blue` | `#0000FF` | hover, secondary 버튼, 선택된 명령어 |
| `--dos-gray` | `#AAAAAA` | white 버튼(→ 회색 메뉴 막대), 현재 모드 표시 |
| `--dos-silver` / `--dos-light` | `#C0C0C0` / `#E0E0E0` | 보조 글자 / 본문 |
| `--dos-cyan` | `#55FFFF` | 라벨, 로그인 부제 |
| `--dos-yellow` | `#FFFF55` | 강조색 — primary 버튼, 강조 글자, 포커스, 캐럿 (라임 대신) |
| `--dos-olive` | `#AAAA00` | primary 버튼 아래 그림자 |
| `--dos-lilac` | `#9999EE` | 가장 흐린 글자 |
| `--dos-red` | `#FF7777` | 위험 |

**바뀌는 것**

| 항목 | 값 |
|---|---|
| 글꼴 | `--font-sans`, `--font-mono` → **둥근모꼴(DungGeunMo)** 픽셀 글꼴, 없으면 `--font-mono-fallback`. jsDelivr(projectnoonnu)에서 `@font-face`로 불러오고, PC통신 모드일 때만 내려받음 |
| 모서리 | 전부 0 (`--radius-*: 0` + 모든 요소 `border-radius: 0 !important`) — 아바타도 네모 |
| 자간·굵기 | 자간 0, `font-synthesis: none` (픽셀 글꼴을 억지로 굵게/좁게 하면 뭉개짐) |
| 테두리 | `rgba(255,255,255, .25 / .40 / .60)` — 다크보다 훨씬 또렷한 선 |
| 떠 있는 그림자 | `--shadow-pop: 8px 8px 0 #000` — 흐림 없는 DOS식 그림자 |
| 막 | `--overlay-scrim: rgba(0,0,0,0.5)` |
| 버튼 | primary = 노랑+검정 글자, white = 회색+검정 글자, secondary = 밝은 파랑+흰 글자 |

- 테마 선택은 localStorage(`mini-notion:theme` = `"pc"`)에 저장되고, `app/layout.tsx`의 인라인 스크립트(`lib/theme.ts`의 `THEME_SCRIPT`)가 첫 화면이 그려지기 전에 적용해 깜빡임이 없습니다. 화면 코드에서는 `lib/store.ts`의 `useTheme()` / `setTheme()`만 씁니다.
- 테마 전환은 즉시 바뀝니다 (전환 애니메이션 없음).
- **예외 규칙:** PC통신 모드의 `!important` 모서리·자간 덮어쓰기는 이 테마 전용입니다. 다른 곳에서 `!important`를 쓰지 않습니다.

### 2-5. 타이포그래피 토큰

| 토큰 | 값 | 언제 쓰나 |
|---|---|---|
| `--font-sans` | `"Pretendard Variable", "Pretendard", -apple-system, …, sans-serif` | 모든 글자 기본 |
| `--font-mono` | `ui-monospace, Menlo, Consolas, monospace` | 명령어(`/page`) 전용 |
| `--ls-display` | `-0.045em` | 초대형 타이틀 |
| `--ls-heading` | `-0.02em` | 제목 (다이얼로그 h3 수치와 같음) |
| `--ls-body` | `-0.01em` | 본문 (body 기본값) |

폰트는 `app/layout.tsx`에서 Pretendard Variable(v1.3.9, dynamic subset)을 jsDelivr CDN으로 불러옵니다.

### 2-6. 모서리 · 그림자 · 모션

| 토큰 | 값 | 언제 쓰나 |
|---|---|---|
| `--radius-button` | `8px` | 버튼, 입력창 |
| `--radius-card` | `12px` | 카드, 명령어 입력창, 빈 상태 |
| `--shadow-pop` | `0 12px 32px rgba(0,0,0,0.5)` | 떠 있는 요소 (명령어 메뉴, 다이얼로그) |
| `--ease-out` | `cubic-bezier(0.22,1,0.36,1)` | 나타나는 애니메이션 (fade, pop) |
| `--ease-press` | `cubic-bezier(0.3,0,0.5,1)` | 버튼 누름 |
| `--dur-fast` | `120ms` | 버튼 누름 (transform, 그림자) |
| `--dur-base` | `200ms` | 배경·테두리 변화, 등장 애니메이션 |

---

## 3. 타이포그래피 스케일

| 역할 | 크기 | 굵기 | 자간 | 행간 | 예시 · 출처 |
|---|---|---|---|---|---|
| 디스플레이 | `clamp(64px, 12vw, 120px)` | 900 | `-0.045em` | 1 | 로그인 "MINI NOTION", 대문자 (globals.css `.login__title`) |
| 글 제목 | 44px (모바일 32px) | 800 | `-0.03em` | 1.2 | 글 상세 제목 (globals.css `.doc__title`) |
| 페이지 제목 (h2) | 32px | 800 | `-0.03em` | — | "내 업무", "마이 페이지" (globals.css `.page-head h2`) |
| 다이얼로그 제목 (h3) | 20px | 800 | `-0.02em` | — | "정말 삭제할까요?" (globals.css `.dialog h3`) |
| 로그인 부제 | 18px | 400 | 기본 | 1.5 | (page.tsx) |
| 워드마크 | 17px (로그인 18px) | 900 | `-0.04em` | — | "MINI NOTION" (globals.css `.wordmark`) |
| 글 상세 본문 | 17px | 400 | 기본 | **1.8** | (globals.css `.doc__body`) |
| 목록 제목 | 16px | 600 | 기본 | — | (globals.css `.row__title`) |
| 입력 글자 | 15px (명령어 16px mono) | 400 | `-0.01em` | — | (globals.css `.vt-input input`, `.cmd__input`) |
| 설명 문장 | 14px | 400 | 기본 | 1.6~1.7 | 다이얼로그 본문, 빈 상태 (globals.css) |
| 보조 텍스트 | 13px | 400~600 | 기본 | — | `.muted`, 스니펫, 시간, 저장 상태 (globals.css) |
| 라벨 | 13px | 600 | 기본 | — | 입력창 라벨 (globals.css `.vt-field__label`) |
| 캡션 · 힌트 | 12px | 400 | 기본 | — | 입력 힌트, 로그인 푸터 (globals.css) |
| kbd · 메뉴 라벨 | 11px | 600 | 메뉴 라벨만 `.04em` | — | `⌘K`, "명령어" (globals.css `.kbd`, `.cmd__menu-label`) |

**규칙**
- 한글을 길게 읽는 영역(글 상세 본문)은 행간을 **1.8**로 넉넉하게, 짧은 안내 문장은 **1.6~1.7**로 씁니다.
- 제목일수록 굵고(800~900) 자간을 좁게(음수) 씁니다.

---

## 4. 레이아웃 & 간격

### 반복되는 값

| 항목 | 값 | 출처 |
|---|---|---|
| 콘텐츠 최대 폭 | 업무 792px / 글 상세 752px / 마이 552px | workspace, pages/[id], me의 인라인 `maxWidth` |
| 좌우 여백 (`.container`) | 16px | globals.css |
| 상단바 패딩 | `14px 28px` (`.topbar--tight`는 `12px 20px`) | globals.css |
| 상단바 아래 구분선 | `1px solid var(--border-subtle)` | globals.css |
| 본문 위 여백 | 56px (업무) / 72px (글 상세, 마이) | workspace, globals.css `.doc`, me |
| 본문 아래 여백 | 80px (업무, 마이) / 120px (글 상세) | 같은 파일들 |
| 섹션 간격 | 28px (업무) / 32px (마이) / 20px (글 상세) | 같은 파일들 |

### 모바일 (`max-width: 640px`) 에서 바뀌는 것 (globals.css)

| 대상 | 변경 |
|---|---|
| `.topbar` | 패딩 `12px 16px` |
| `.login__bar`, `.login__foot` | 패딩 `16px` |
| `.doc` | 위 여백 72px → 40px |
| `.doc__title` | 44px → 32px |
| `.profile-card` | 가로 → 세로 배치, 왼쪽 정렬 |
| `.sidebar` | 접힌 56px 띠만 자리를 차지(`.shell` 왼쪽 여백 56px)하고, 펼치면 본문 위에 떠요(`position: fixed`, `--shadow-pop`) |

### 권장 간격 단위
코드에서 쓰인 값을 모으면 **4px 단위**가 기본입니다.

| 단계 | 값 | 주로 쓰는 곳 |
|---|---|---|
| XS | 4, 6px | 목록 행 사이, 라벨↔입력창 |
| S | 8, 10, 12px | 버튼 사이, 아이콘↔글자, 카드 안 요소 |
| M | 16, 20, 24px | 카드·행 안쪽 여백, 다이얼로그 요소 사이 |
| L | 28, 32px | 페이지 섹션 사이 |
| XL | 48, 56, 72, 80px | 빈 상태 안쪽, 본문 위·아래 여백 |

> 14px(`.row` gap, `.vt-input` 좌우 패딩)과 18px 같은 값도 일부 있지만, 새 코드에서는 위 표의 값 중에서 고르세요.

---

## 5. 컴포넌트 가이드

### 5-1. Button (`components/ds/Button.tsx`)

**용도:** 모든 클릭 행동. `href`를 주면 Next.js `<Link>`로 렌더링됩니다.

| 변형 | 모양 | 언제 쓰나 | 실제 사용 예 |
|---|---|---|---|
| `primary` | 라임 배경 + 검정 글자 + 라임 그림자 | **화면의 핵심 행동 1개** | 마이 페이지 "저장" |
| `white` | 흰 배경 + 검정 글자 + 회색 그림자 | 가장 중요한 진입·확정 행동 | "구글로 로그인", "삭제하기" |
| `secondary` | 회색(`ink-300`) 배경 + 검정 그림자 | 보조 행동 | "삭제", "이미지 변경", "내 업무로" |
| `ghost` | 투명, 회색 글자 | 뒤로 가기, 취소, 덜 중요한 행동 | "목록", "취소", "로그아웃", "기본으로" |
| `soft` | 진한 라임 배경 + 라임 글자 | 옅은 강조 (현재 화면 사용 없음) | — |

| 크기 | 높이 | 좌우 패딩 | 글자 | 아이콘 |
|---|---|---|---|---|
| `sm` | 32px | 12px | 14px | 14px |
| `md` (기본) | 44px | 18px | 16px | 18px |
| `lg` | 52px | 26px | 17px | 18px |

**눌리는 효과 (globals.css)**
- 평소: 아래 그림자 `primary`/`white` 4px, `secondary` 3px
- `:active`: `translateY(3px)` + 그림자가 1px(secondary는 0)로 줄어 "눌린" 느낌
- `sm` 크기의 `primary`/`white`는 그림자 없음
- hover: `brightness(1.06)` (ghost는 배경 `rgba(255,255,255,.06)` + 흰 글자)
- disabled: `opacity: .4`, `cursor: not-allowed`

**사용 규칙**
- 한 화면에 `primary`는 1개만.
- 상단바 안 버튼은 `sm`.
- 다이얼로그 버튼 순서: 왼쪽 `ghost`(취소) → 오른쪽 확정 버튼. 확정 버튼에 자동 포커스.

```tsx
<Button variant="primary" type="submit" disabled={!canSave}>저장</Button>
<Button variant="ghost" size="sm" icon="arrow-left" href="/workspace">목록</Button>
<Button variant="white" size="lg" block>구글로 로그인</Button>
```

### 5-2. Input (`components/ds/Input.tsx`)

**용도:** 라벨 + 입력창 + 힌트가 한 묶음인 폼 필드.

- 구조: `.vt-field` > `.vt-field__label` / `.vt-input`(아이콘 + input) / `.vt-field__hint`
- 높이 44px, 배경 `ink-200`, 모서리 8px
- 포커스: `inset 0 0 0 1.5px var(--volt-300)` 라임 테두리
- 힌트 영역은 `min-height: 18px`로 **항상 자리를 차지** → 힌트 문구가 바뀌어도 레이아웃이 흔들리지 않음
- 힌트로 상태 안내: 기본 "처음엔 구글 이름을 써요" → "저장 중…" → "저장했어요" / 실패 시 "저장하지 못했어요. 잠시 후 다시 눌러 주세요" (me/page.tsx)

```tsx
<Input label="별명" value={nickname} maxLength={20} hint={hint} onChange={...} />
```

### 5-3. Badge (`components/ds/Badge.tsx`)

| tone | 모양 | 의미 |
|---|---|---|
| `new` (기본) | 라임 배경 + 검정 글자 | 새것 |
| `hot` | 핑크 배경 + 흰 글자 | 인기 · 주목 |
| `soft` | 진한 라임 배경 + 라임 글자 + 라임 테두리 | 소개 문구 (로그인 "나만의 무료 업무 도구") |
| `neutral` | 회색 배경 + 밝은 회색 글자 | 일반 정보 |
| `dark` | 반투명 검정 + 흰 글자 | 이미지 위에 얹을 때 |

- 기본 크기: 높이 18px, 모서리 4px, 11px
- `pill` 또는 `soft`: 높이 26px, 완전 둥근 모서리, 13px

```tsx
<Badge tone="soft" pill>나만의 무료 업무 도구</Badge>
```

### 5-4. Icon (`components/ds/Icon.tsx`)

- [Lucide](https://lucide.dev/icons) 아이콘 이름을 그대로 씁니다 (lucide-static@0.460.0, unpkg CDN).
- CSS mask 방식이라 **글자색(`currentColor`)을 따라갑니다.** 색을 바꾸려면 `color` prop.
- 항상 `aria-hidden="true"` (장식용).
- 기본 크기 16px. 목록 아이콘 18px, 버튼 안은 14px(sm) / 18px.

```tsx
<Icon name="file-text" size={18} color="var(--ink-600)" />
```

현재 쓰는 아이콘: `arrow-left`, `trash-2`, `file-plus`, `file-text`, `image`, `log-out`, `panel-left-close`, `panel-left-open`, `layout-list`, `user`

### 5-5. Avatar (`components/Avatar.tsx`)

- 원형, 이미지가 없으면 **라임 배경 + 별명 첫 글자**(굵기 800, 크기의 42%)
- 처음 로그인하면 구글 프로필 사진을 쓰고, 마이 페이지에서 바꿀 수 있음 (lib/store.ts)
- 크기: 상단바 30px, 마이 페이지 96px

```tsx
<Avatar user={user} size={30} />
```

### 5-5-1. ThemeToggle (`components/ThemeToggle.tsx`)

- 화면 모드 전환. **"다크 모드" / "PC통신 모드" 두 버튼을 글자로 나란히** 보여 주는 묶음(`.theme-switch`)입니다.
- 지금 모드는 `Button` `white`, 다른 모드는 `ghost`. 둘 다 `sm`이지만 묶음 안에서는 높이 28px · 좌우 10px · 13px로 조금 작게.
- 묶음: 패딩 4px, 버튼 사이 4px, `inset 0 0 0 1px var(--border-default)` 윤곽.
- 접근성: 묶음 `role="group"` + `aria-label="화면 모드"`, 각 버튼 `aria-pressed`.
- 640px 이하에서는 " 모드"를 숨겨 "다크" / "PC통신"만 보임 (`.theme-switch__suffix`).
- 위치: 로그인 뒤 모든 화면 상단바 오른쪽 — 업무(프로필 필 왼쪽, 간격 8px), 글 상세(저장 상태와 삭제 버튼 사이), 마이 페이지(오른쪽 끝). 로그인 화면엔 없음(저장된 테마는 따라감).

```tsx
<ThemeToggle />
```

### 5-6. 공통 패턴 (globals.css)

| 패턴 | 클래스 | 핵심 스타일 |
|---|---|---|
| 상단바 | `.topbar` / `.topbar--tight` | 양 끝 정렬, 아래 `border-subtle` 1px. 왼쪽 워드마크 또는 뒤로 버튼, 오른쪽 프로필/행동 |
| 프로필 필 | `.profile-pill` | 완전 둥근 모서리, `ink-200` → hover `ink-300`, 이름(13px/600) + 아바타 30px |
| 명령어 입력창 | `.cmd`, `.cmd__box` | 높이 56px, 모서리 12px, 배경 `ink-100`, 왼쪽 라임 mono `/`, 오른쪽 `⌘K` |
| 명령어 메뉴 | `.cmd__menu`, `.cmd__item` | 입력창 아래 64px에 떠 있음, 최대 360px, 선택 항목 배경 `volt-800` |
| 목록 행 | `.row` | 아이콘 20px / 제목+스니펫 / 시간 3칸 그리드, 패딩 16px, 모서리 10px, hover `ink-200` |
| 빈 상태 | `.empty` | 가운데 정렬, 패딩 `48px 16px`, `border-subtle` 윤곽, 다음 행동 안내 포함 |
| 다이얼로그 | `.scrim` + `.dialog` | 막 `rgba(0,0,0,.6)` + fade / 폭 420px, 패딩 28px, 모서리 16px + pop |
| 위험 아이콘 | `.danger-icon` | 40px, 모서리 10px, 빨강 14% 배경 + 빨강 아이콘 |
| 카드 | `.profile-card` | 패딩 24px, 모서리 12px, `ink-200`, 아래 `0 3px 0 #000` (버튼처럼 입체감) |
| 구분선 | `.rule` | 높이 1px, `border-default` |
| 글자 수 바 | `.doc-count`, `.doc-count__line` | 글 상세 내용 아래, 화면 아래에 붙음(`position: sticky; bottom: 0`). 배경 `--bg-page`, 위쪽 윤곽 `inset 0 1px 0 var(--border-subtle)`, 13px `--text-secondary`, `tabular-nums`, 패딩 12px 0, 줄 간격 4px. `role="group"` + `aria-label="글자 수"`, `aria-live` 없음 (components/CharCounter.tsx) |
| 커버 이미지 | `.cover`, `.cover__img`, `.cover__backdrop`, `.cover__error` | 글 상세 제목 위. 높이 320px(모바일 200px), 모서리 `--radius-card`, 배경 `--surface-card`. **사진은 자르지 않음**: `.cover__img`는 `object-fit: contain`으로 통째로, 남는 양옆은 같은 사진을 `.cover__backdrop`(`object-fit: cover`, `blur(28px) brightness(.55)`, `scale(1.2)`, `aria-hidden`)으로 흐리게 깔아 채움. 상태 변형 `--loading`(스켈레톤 + 시머) / `--loaded`(사진이 `--dur-base` 동안 서서히 보임) / `--error`(`border-subtle` 윤곽 + 안내 + secondary sm "다시 불러오기"). 고양이 API `https://cataas.com/cat/cute`에서 열 때마다 새로 받고 저장하지 않음 (components/CoverImage.tsx) |
| 사이드바 | `.shell`, `.sidebar`, `.sidebar__toggle`, `.sidebar__nav`, `.sidebar__item`, `.sidebar__label` | 업무·글 상세 왼쪽. `.shell`(가로 flex)이 `.sidebar` + `.app`을 감쌈. 폭 240px ↔ 접으면 56px(아이콘 띠), `width`를 `--dur-base`/`--ease-out`으로 바꿈(`prefers-reduced-motion`이면 즉시). 화면 높이에 붙음(`sticky`, `100vh`), 배경 `--bg-page`, 오른쪽 윤곽 `inset -1px 0 0 var(--border-subtle)`. 맨 위 ghost sm 아이콘 버튼(32px 정사각)으로 접기/펼치기. 항목 높이 32px, 14px `--text-secondary` → hover·현재 화면(`aria-current="page"`) `--surface-card` 배경 + `--text-primary`. 펼쳤을 때만 "내 글" 라벨 + 글 목록(최근 수정 순). 접은 상태는 `lib/store.ts`의 `useSidebarCollapsed`/`setSidebarCollapsed`로 이 브라우저에 기억 (components/Sidebar.tsx) |
| 가운데 메시지 | `.center-msg` | 최소 높이 60vh, 가운데 정렬 (글 없음 등) |

### 5-7. 새 컴포넌트를 만들 때 규칙

| 규칙 | 현재 관례 |
|---|---|
| 디자인 시스템 컴포넌트 | `components/ds/`에 두고, 클래스는 **`vt-` 접두사** (`vt-btn`, `vt-input`) |
| 클래스 이름 | **BEM 스타일** — 블록 `cmd`, 요소 `cmd__box`, 변형 `vt-btn--primary`, `list--dim` |
| 화면 전용 패턴 | `globals.css`에 접두사 없이 (`.row`, `.empty`, `.dialog`), 화면 주석 섹션(`/* ── 1b/1c Workspace ── */`) 아래에 추가 |
| 클래스 vs 인라인 스타일 | 반복되거나 hover/focus가 있으면 **클래스**. 한 번만 쓰는 배치(flex 방향, gap, maxWidth)는 인라인 `style` |
| 변형 설계 | `variant`, `size`, `tone` 같은 prop을 받아 클래스 이름으로 조합 (Button 참고) |

---

## 6. 인터랙션 & 상태

### 기본 상태

| 상태 | 처리 방식 (globals.css) |
|---|---|
| hover | 배경을 한 단계 밝게 (`ink-200` → `ink-300`) 또는 버튼 `brightness(1.06)` |
| focus | 전역 `:focus-visible { outline: 2px solid var(--volt-300); outline-offset: 2px }` |
| 입력창 포커스 | `:focus-within`에 `inset 0 0 0 1.5px var(--volt-300)` 라임 테두리 |
| 캐럿 | 명령어·글 제목·본문에 `caret-color: var(--volt-300)` |
| active | 버튼이 3px 아래로 내려가며 그림자가 줄어듦 |
| disabled | `opacity: .4`, 필터 없음 |
| 선택 영역 | `::selection` 라임 배경 + 검정 글자 |

### 애니메이션

| 이름 | 효과 | 쓰는 곳 | 시간 / 곡선 |
|---|---|---|---|
| `fade` | 투명 → 보임 | 다이얼로그 뒤 막(`.scrim`) | `--dur-base` / `--ease-out` |
| `pop` | 8px 아래 + 98% 크기 → 제자리 | 다이얼로그 본체 | `--dur-base` / `--ease-out` |
| `shimmer` | 옅은 빛 띠가 왼쪽 → 오른쪽으로 지나감 (`translateX(-100% → 100%)`) | 커버 스켈레톤(`.cover--loading`). 로딩 표시는 스피너 대신 이걸 씀. `prefers-reduced-motion`이면 멈춤 | 1.4s 반복 / `--ease-press` |
| 버튼 누름 | transform, 그림자 | 모든 버튼 | `--dur-fast` / `--ease-press` |
| 배경·테두리 변화 | background, box-shadow | hover, 포커스 | `--dur-base` |

### 상태 표현

| 상태 | 표현 | 출처 |
|---|---|---|
| 저장 중 / 저장됨 | `.save-state` — 6px 점(회색 `ink-500` / 초록 `green-500`) + "저장 중…" / "저장됨", `aria-live="polite"` | pages/[id]/page.tsx |
| 자동 저장 | 입력 멈추고 1초 뒤 저장, 페이지 떠날 때 남은 내용 저장 | pages/[id]/page.tsx |
| 빈 목록 | `.empty` 상자 + 다음 행동 안내 | workspace/page.tsx |
| 명령어 메뉴 열림 | 아래 목록을 `.list--dim` (투명도 .35)으로 흐리게 | workspace/page.tsx |
| 삭제 확인 | 다이얼로그 + 빨간 위험 아이콘 + "되살릴 수 없어요" 안내 | pages/[id]/page.tsx |
| 사진 불러오는 중 | 같은 크기의 스켈레톤 + 시머 (스피너 쓰지 않음, 자리 크기가 고정돼 레이아웃이 흔들리지 않음), `aria-busy` | components/CoverImage.tsx |
| 사진 불러오기 실패 | 커버 자리에 안내 문구 + "다시 불러오기" 버튼 | components/CoverImage.tsx |
| 글 없음 | `.center-msg` + 돌아갈 버튼 | pages/[id]/page.tsx |
| 폼 결과 | 입력 힌트 문구를 바꿔서 알림 ("저장했어요") | me/page.tsx |
| 사이드바 접힘 | 아이콘만 남고 글 목록은 숨김. 아이콘 링크엔 `aria-label`·`title`로 이름을 붙임. 새로고침·화면 이동 후에도 유지 | components/Sidebar.tsx |
| 목표 글자 수 초과 | 그 줄만 `.doc-count__line--over` 빨간 글자(`--red-500`) + 문구 `· N자 초과` (색만으로 구분하지 않음). 목표와 같으면 초과 아님 | components/CharCounter.tsx |

### 키보드 조작

| 키 | 동작 | 출처 |
|---|---|---|
| `⌘K` / `Ctrl+K` | 명령어 입력창으로 포커스 | workspace/page.tsx |
| `Enter` | 명령어 실행 / 글 제목 → 본문으로 이동 | workspace, pages/[id] |
| `Esc` | 명령어 입력 지우기 / 다이얼로그 닫기 | workspace, pages/[id] |

- 한글 입력 중(`isComposing`)에는 Enter를 처리하지 않습니다.
- 키 표기는 `.kbd` 클래스 (11px, 600, 모서리 4px, `border-default` inset 윤곽). 강조할 때는 라임 글자 + `volt-600` 윤곽.

```tsx
<span className="kbd">⌘K</span>
```

---

## 7. 문구 (UX Writing) 톤

### 실제 화면 문구

| 위치 | 문구 |
|---|---|
| 로그인 부제 | 필요한 기능만 담았어요. 적고, 찾고, 지우기. |
| 로그인 안내 | 한 번 로그인하면 다음부터 바로 열려요 |
| 로그인 오류 | 로그인하지 못했어요. 잠시 후 다시 눌러 주세요 (로그인 안내 자리에 바꿔 보여 줌, `role="status"`) |
| 로그인 푸터 | 1인 전용 · 공유 기능 없음 |
| 명령어 placeholder | page 입력 후 Enter — 새 글 만들기 |
| 명령어 설명 | 빈 글을 만들고 바로 열어요 |
| 명령어 없음 | 일치하는 명령어가 없어요 |
| 빈 목록 | 아직 글이 없어요. /page 를 입력하고 Enter를 눌러 첫 글을 만들어 보세요. |
| 삭제 확인 | 정말 삭제할까요? / ‘제목’를 지우면 되살릴 수 없어요. |
| 글 없음 | 글을 찾을 수 없어요. 이미 삭제됐을 수 있어요. |
| 별명 힌트 | 처음엔 구글 이름을 써요 → 저장 중… → 저장했어요 / 실패하면 "저장하지 못했어요. 잠시 후 다시 눌러 주세요" (저장 중엔 "저장" 버튼 disabled) |
| 이미지 오류 | 이미지를 읽지 못했어요. 다른 파일을 골라 주세요 |
| 로그아웃 안내 | 이 기기에서 로그인 상태를 끝내요 |
| 글자 수 | 공백 포함 N자 · 공백 제외 N자 / 목표가 있으면 공백 포함 1,234 / 5,000자 · 234자 초과 |
| 목표 글자 수 | 라벨 "목표 글자 수" · placeholder "예: 1,000" · 힌트 "비워 두면 글자 수만 보여요" → 오류 "1 이상의 숫자를 넣어 주세요" |
| 커버 오류 | 고양이 사진을 불러오지 못했어요 / 버튼 "다시 불러오기" |
| 화면 모드 전환 | 다크 모드 · PC통신 모드 (모바일: 다크 · PC통신) |
| 사이드바 | 버튼 이름 "사이드바 접기" / "사이드바 펼치기" · 메뉴 "내 업무", "마이 페이지" · 라벨 "내 글" · 빈 목록 "아직 글이 없어요. 내 업무에서 새 글을 만들어 보세요." |
| 시간 | 방금 · N분 전 · N시간 전 · 어제 · N일 전 · N월 N일 (lib/store.ts) |

### 말투 규칙
1. **해요체**로 끝냅니다. (~어요, ~해요, ~할까요?)
2. **짧게.** 한 문장에 한 가지만. 버튼은 2~4글자 명사/동사 ("저장", "삭제하기", "내 업무로").
3. **기술 용어를 쓰지 않습니다.** "세션", "데이터", "에러" 대신 "로그인 상태", "글", "읽지 못했어요".
4. **다음 행동을 알려줍니다.** 빈 상태·오류에는 무엇을 하면 되는지 붙입니다.
5. **결과를 솔직하게.** 되돌릴 수 없는 일은 분명히 말합니다 ("되살릴 수 없어요").
6. 목록·짧은 정보는 가운뎃점 `·`으로 나눕니다 ("글 3개 · 최근 수정 순").

### 좋은 예 / 피해야 할 예

| 상황 | ✅ 좋은 예 | ❌ 피해야 할 예 |
|---|---|---|
| 빈 목록 | 아직 글이 없어요. /page 를 입력해 첫 글을 만들어 보세요. | 데이터가 존재하지 않습니다. |
| 오류 | 이미지를 읽지 못했어요. 다른 파일을 골라 주세요 | Error: 파일 파싱 실패 (code 400) |
| 삭제 확인 | 정말 삭제할까요? 지우면 되살릴 수 없어요. | 이 작업은 되돌릴 수 없습니다. 계속하시겠습니까? |
| 저장 완료 | 저장했어요 | 성공적으로 저장되었습니다! |
| 버튼 | 내 업무로 | 워크스페이스 페이지로 이동하기 |

---

## 8. 접근성

### 색 대비 (WCAG 기준: 본문 4.5:1, 큰 글자 3:1)

| 글자 색 | `ink-50` 배경 위 | `ink-200` 카드 위 | 판정 |
|---|---|---|---|
| `white` | 18.9 : 1 | 16.1 : 1 | ✅ 모든 글자 |
| `ink-800` | 13.8 : 1 | 11.7 : 1 | ✅ 본문 |
| `ink-700` | 9.5 : 1 | 8.1 : 1 | ✅ 라벨 |
| `ink-600` | 5.8 : 1 | 5.0 : 1 | ✅ 보조 글자 |
| `ink-500` | 3.0 : 1 | **2.6 : 1** | ⚠️ 본문 기준 미달 — placeholder·시간 등 **부가 정보에만** |
| `volt-300` | 16.1 : 1 | 13.8 : 1 | ✅ 강조 글자 |
| 검정 on `volt-300` | 17.9 : 1 | | ✅ primary 버튼 |
| 흰색 on `pink-500` | 3.5 : 1 | | ⚠️ 큰·굵은 글자만 (hot 배지) |

(대비값은 토큰 색으로 계산)

**PC통신 모드** (`dos-blue` 페이지 / `dos-navy` 카드 위)

| 토큰 | 페이지 | 카드 | 판정 |
|---|---|---|---|
| `--text-primary` (흰색) | 13.3 | 16.0 | ✅ |
| `--text-body` (`dos-light`) | 10.1 | 12.1 | ✅ |
| `--text-label` (`dos-cyan`) | 10.8 | 13.1 | ✅ |
| `--text-secondary` (`dos-silver`) | 7.3 | 8.8 | ✅ |
| `--text-tertiary` (`dos-lilac`) | 5.2 | 6.2 | ✅ |
| `--text-accent`, `--focus-ring` (`dos-yellow`) | 12.5 | 15.0 | ✅ (선택 항목 `dos-bright-blue` 위 8.1) |
| `--text-danger` (`dos-red`) | 5.2 | 6.2 | ✅ |
| 검정 on `dos-yellow` / `dos-gray` | 19.7 / 9.0 | | ✅ 버튼 |

### 관례
- **포커스 표시:** 모든 요소에 라임 `:focus-visible` 아웃라인. 입력창은 라임 inset 테두리. 포커스 표시를 지우지 않습니다.
- **아이콘:** `Icon`은 항상 `aria-hidden="true"`. 아이콘만 있는 버튼을 만들 땐 `aria-label`을 붙입니다.
- **aria 사용 예 (코드에 있는 것)**
  - 프로필 필 링크 `aria-label="마이 페이지"`, 명령어 입력 `aria-label="명령어 입력"`, 제목/내용 textarea `aria-label`
  - 명령어 메뉴 `role="listbox"` + 항목 `role="option"` + `aria-selected`
  - 글 목록 `<nav aria-label="글 목록">`
  - 사이드바 접기 버튼 `aria-expanded` + `aria-controls="sidebar"`, 내비 `<nav aria-label="화면 이동">` / `<nav aria-label="사이드바 글 목록">`, 현재 화면 `aria-current="page"`
  - 저장 상태 `aria-live="polite"`
  - 삭제 다이얼로그 `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`
- **언어:** `<html lang="ko">` (layout.tsx)
- **아바타 이미지:** 옆에 이름이 함께 보이므로 `alt=""`

---

## 9. 새 화면을 만들 때 체크리스트

- [ ] 배경은 `--bg-page`이고, 색은 **시맨틱 별칭만** 써서 다크·PC통신 두 테마에서 모두 확인했다
- [ ] 라임 강조(`primary` 버튼 등)는 화면당 **핵심 행동 1개**에만 썼다
- [ ] 색·모서리·그림자·시간 값을 직접 쓰지 않고 **토큰(시맨틱 별칭 우선)**을 썼다
- [ ] 버튼·입력창·배지·아이콘은 `components/ds/`의 것을 재사용했다
- [ ] 제목은 굵게(800) + 음수 자간, 긴 한글 본문은 행간 1.6 이상
- [ ] 간격은 4px 단위 권장 값(4·8·12·16·20·24·28·32…)에서 골랐다
- [ ] 윤곽은 `border` 대신 `box-shadow: inset 0 0 0 1px var(--border-*)`로 그렸다
- [ ] 640px 이하에서 패딩·제목 크기·가로 배치를 확인했다
- [ ] hover / 포커스(라임) / disabled / 빈 상태 / 오류 상태를 모두 만들었다
- [ ] 되돌릴 수 없는 행동에는 확인 다이얼로그(ghost 취소 + 확정 버튼)를 붙였다
- [ ] 문구는 해요체, 짧게, 기술 용어 없이, 다음 행동 안내를 포함했다
- [ ] 아이콘 전용 버튼에 `aria-label`, 흐린 글자(`ink-500`)는 부가 정보에만 썼다

---

## 정리가 필요한 부분

> 코드는 수정하지 않았습니다. 나중에 정리할 때 참고하세요.

| # | 내용 | 위치 |
|---|---|---|
| 1 | ~~시맨틱 별칭이 대부분 쓰이지 않음~~ → 화면 모드 작업에서 globals.css와 각 화면의 색을 모두 시맨틱 별칭으로 바꿈. **남은 것:** Badge `soft` 테두리 `--volt-700` | Badge.tsx |
| 2 | ~~하드코딩된 `#000` / `#fff`~~ → 토큰으로 바꿈. **남은 것:** Badge `hot`·`dark`의 `#fff` (분홍·사진 위라 두 테마 모두 같아야 해서 그대로 둠) | Badge.tsx |
| 3 | **토큰 없는 색 값.** 위험 아이콘 배경 `rgba(255,69,69,.14)`, dark 배지 `rgba(0,0,0,.55)` (white 버튼 그림자·ghost hover는 `--edge-inverse`·`--surface-ghost-hover`로 토큰화함) | globals.css, Badge.tsx |
| 4 | **`--radius-card` 토큰이 쓰이지 않음.** 12px을 직접 씀. 또 토큰에 없는 모서리 값 4px(kbd), 10px(row, danger-icon), 16px(dialog), 999px(pill)이 섞여 있음 | globals.css |
| 5 | **`--ls-heading`(-0.02em) 토큰이 쓰이지 않음.** 제목 자간이 `-0.03em`(h2, 글 제목), `-0.02em`(다이얼로그), `-0.04em`(워드마크)으로 제각각 | globals.css |
| 6 | **같은 페이지 제목 스타일이 두 번 정의됨.** 업무 페이지는 `.page-head h2` 클래스, 마이 페이지는 같은 값을 인라인 스타일로 반복 | globals.css, me/page.tsx |
| 7 | **구분선이 두 가지.** `.rule`은 `--border-default`, 마이 페이지 구분선은 인라인 `--border-subtle` | globals.css, me/page.tsx |
| 8 | **콘텐츠 최대 폭이 인라인 숫자.** 792 / 752 / 552px이 각 화면에 흩어져 있고 토큰이나 클래스가 없음 | workspace, pages/[id], me |
| 9 | ~~상단바 가운데 정렬용 빈 칸 `width: 90`~~ → 양쪽 칸을 `flex: 1`로 바꿔 해결 | me/page.tsx |
| 10 | **Badge만 인라인 스타일 방식.** Button·Input은 `vt-` 클래스인데 Badge는 스타일 객체로 만들어져 hover 등 확장이 어려움 | Badge.tsx |
| 11 | **`.muted`와 인라인 보조 글자 중복.** 같은 역할(13px, 회색)인데 `.muted`(`ink-600`)와 인라인 `ink-500`이 섞여 있음 | page.tsx, pages/[id]/page.tsx |
| 12 | **아이콘을 외부 CDN(unpkg)에서 불러옴.** 네트워크가 끊기면 아이콘이 안 보임 | Icon.tsx |
| 13 | **시머 속도 1.4s가 토큰 없음.** `--dur-*`에 긴 반복 애니메이션용 값이 없어 직접 씀 | globals.css `.cover--loading::after` |
| 14 | **커버 흐린 배경 값이 토큰 없음.** `blur(28px)`, `brightness(.55)`, `scale(1.2)`를 직접 씀 | globals.css `.cover__backdrop` |
