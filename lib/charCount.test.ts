import { describe, expect, it } from "vitest";
import { countChars, formatCount, overBy, parseTarget } from "./charCount";

// 기대값은 모두 손으로 센 값이다 (specs/001-char-count/contracts/char-count-lib.md).
describe("countChars", () => {
  const cases: [label: string, text: string, withSpaces: number, withoutSpaces: number][] = [
    ["빈 내용", "", 0, 0],
    ["한글 기본", "안녕하세요", 5, 5],
    ["띄어쓰기", "안녕 하세요", 6, 5],
    ["공백 여러 개", "할 일 정리", 6, 4],
    ["줄바꿈 1자", "가\n나", 3, 2],
    ["CR+LF도 1자", "가\r\n나", 3, 2],
    ["공백·줄바꿈만", "  \n", 3, 0],
    ["탭은 공백", "\t가", 2, 1],
    ["전각 공백·NBSP는 공백", "　가 ", 3, 1],
    ["이모지 1자", "👍", 1, 1],
    ["ZWJ 결합 이모지 1자", "👨‍👩‍👧", 1, 1],
    ["결합 문자 1자", "é", 1, 1],
    ["조합 중 자모", "ㅎ", 1, 1],
  ];

  it.each(cases)("%s", (_label, text, withSpaces, withoutSpaces) => {
    expect(countChars(text)).toEqual({ withSpaces, withoutSpaces });
  });
});

describe("formatCount", () => {
  it.each([
    [0, "0"],
    [999, "999"],
    [1000, "1,000"],
    [1234567, "1,234,567"],
  ])("%i → %s", (n, want) => {
    expect(formatCount(n)).toBe(want);
  });
});

describe("parseTarget", () => {
  it.each([
    ["", null],
    ["   ", null],
  ])("빈 값 %j → 목표 없음, 안내 없음", (input, want) => {
    expect(parseTarget(input)).toEqual({ value: want, error: null });
  });

  it.each([
    ["5000", 5000],
    ["5,000", 5000],
    [" 1000 ", 1000],
    ["1", 1],
    ["1000000", 1000000],
  ])("%j → %i", (input, want) => {
    expect(parseTarget(input)).toEqual({ value: want, error: null });
  });

  // 안내 문구 원문은 확인하지 않는다 (문구는 바뀔 수 있음). 안내가 있는지만 본다.
  it.each(["0", "-5", "1.5", "abc", "99999999999999999999"])("%j → 목표 없음 + 안내", (input) => {
    const result = parseTarget(input);
    expect(result.value).toBeNull();
    expect(result.error).not.toBeNull();
  });
});

describe("overBy", () => {
  it.each([
    [5, null, 0],
    [9, 10, 0],
    [10, 10, 0], // 같으면 초과 아님
    [11, 10, 1],
    [12, 10, 2],
  ])("count %i, target %s → %i자 초과", (count, target, want) => {
    expect(overBy(count, target)).toBe(want);
  });
});
