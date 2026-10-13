// Shared by the server layout (THEME_SCRIPT) and lib/store.ts (useTheme / setTheme),
// so it must not be a "use client" module.

export type Theme = "dark" | "light";

export const THEME_KEY = "mini-notion:theme";

/** Runs inline in <head> before the first paint, so a light-theme reload doesn't flash dark.
 *  Dark is the default, so only "light" needs the attribute. */
export const THEME_SCRIPT = `try{if(localStorage.getItem(${JSON.stringify(THEME_KEY)})==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
