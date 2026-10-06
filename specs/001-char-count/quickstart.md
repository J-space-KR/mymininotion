# Quickstart: 글자 수 표시 검증하기

## 준비
```bash
npm install
```

## 1. 자동 테스트
```bash
npm test                                   # 전체 스위트 (헌법 품질 관문)
npm test -- lib/charCount.test.ts          # 계산 규칙만
npm test -- lib/store.test.ts              # 목표 저장
npm test -- components/CharCounter.test.tsx
npm test -- "app/pages/[id]/page.test.tsx" # 화면 통합
npx tsc --noEmit                           # 타입 검사
```
기대 결과: 모든 테스트 통과, 오류·경고 없는 출력. 규칙 목록은 [contracts/char-count-lib.md](./contracts/char-count-lib.md).

## 2. 직접 써 보기
```bash
npm run dev
```
1. `http://localhost:3000` → 구글로 로그인 → 아무 글이나 연다.
2. 화면 아래 바에 `공백 포함 N자` / `공백 제외 N자`가 보인다 (SC-004: 3초 안에 발견).
3. 내용에 `안녕 하세요` → `공백 포함 6자` / `공백 제외 5자`.
4. 제목을 바꿔도 숫자는 그대로다.
5. 제목 아래 "목표 글자 수"에 `10` → 내용을 `가나다라마 바사아자`로 → 초과 없음.
   끝에 공백 하나 → 공백 포함 줄만 빨갛게 `1자 초과`.
6. 목록으로 나갔다가 다시 열면 목표 `10`이 남아 있다. 다른 글에는 목표가 없다.
7. 목표 칸에 `abc` → 안내 문구가 보이고 진행 표시가 사라진다.
8. 긴 글(10만 자 정도)을 붙여넣고 타이핑해도 입력이 끊기지 않는다 (SC-003).
9. 글이 길어 스크롤해도 아래 바가 화면 아래에 붙어 있다.
10. 640px 이하 폭에서도 두 줄이 잘리지 않는다.
