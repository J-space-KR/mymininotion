// 글자 수 계산 (순수 함수). 화면·저장소에 의존하지 않는다.

const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });
const BLANK = /^\s+$/u;

/** 화면에 보이는 한 글자(grapheme) 단위로 센다. 줄바꿈(\r\n 포함)은 1자, 빈칸 문자는 공백 제외에서 뺀다. */
export function countChars(text: string): { withSpaces: number; withoutSpaces: number } {
  let withSpaces = 0;
  let withoutSpaces = 0;
  for (const { segment } of segmenter.segment(text)) {
    withSpaces++;
    if (!BLANK.test(segment)) withoutSpaces++;
  }
  return { withSpaces, withoutSpaces };
}

/** 1,000 이상이면 세 자리마다 쉼표를 넣는다. */
export function formatCount(n: number): string {
  return n.toLocaleString("ko-KR");
}

/** 목표 글자 수 입력을 해석한다. 빈 값은 목표 없음, 1 이상의 정수만 목표로 인정한다 ("5,000"처럼 쉼표 허용). */
export function parseTarget(input: string): { value: number | null; error: string | null } {
  const cleaned = input.trim().replace(/,/g, "");
  if (cleaned === "") return { value: null, error: null };
  const n = Number(cleaned);
  if (/^\d+$/.test(cleaned) && Number.isSafeInteger(n) && n >= 1) return { value: n, error: null };
  return { value: null, error: "1 이상의 숫자를 넣어 주세요" };
}

/** 목표보다 몇 자 넘었는지. 목표가 없거나 목표 이하면 0 (같으면 초과 아님). */
export function overBy(count: number, target: number | null): number {
  return target === null ? 0 : Math.max(0, count - target);
}
