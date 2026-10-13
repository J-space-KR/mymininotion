// Shared by the server layout (THEME_SCRIPT) and lib/store.ts (useTheme / setTheme),
// so it must not be a "use client" module.

/** dark: 기본 다크 · pc: 90년대 PC통신(이야기·새롬데이터맨) 파란 화면 */
export type Theme = "dark" | "pc";

export const THEME_KEY = "mini-notion:theme";

/** Runs inline in <head> before the first paint, so a PC-mode reload doesn't flash dark.
 *  Dark is the default, so only "pc" needs the attribute. */
export const THEME_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="pc")document.documentElement.dataset.theme="pc"}catch(e){}`;
