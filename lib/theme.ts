// Shared by the server layout (THEME_SCRIPT) and lib/store.ts (useTheme / setTheme),
// so it must not be a "use client" module.

/** dark: the default · pc: the blue screen of 90s Korean PC-tongsin clients (이야기, 새롬데이터맨) */
export type Theme = "dark" | "pc";

export const THEME_KEY = "mini-notion:theme";

/** Runs inline in <head> before the first paint, so a PC-mode reload doesn't flash dark.
 *  Dark is the default, so only "pc" needs the attribute. */
export const THEME_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="pc")document.documentElement.dataset.theme="pc"}catch(e){}`;
