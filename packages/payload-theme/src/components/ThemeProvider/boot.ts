/**
 * Pre-paint replay of the header customizer's overrides.
 *
 * The customizer applies its overrides from an effect, i.e. only after the
 * page hydrates. On a full load that left the config's own look on screen
 * until then — in `next dev` long enough to read as "my settings reset".
 * Every time it applies, the customizer also stores the exact CSS it produced
 * (plus the webfont URL); this inline script, rendered by the ThemeProvider
 * ahead of the page, re-injects that snapshot while the HTML is still being
 * parsed, so the first paint is already the customized one. Once the
 * customizer mounts, it takes over and drops the boot <style>.
 */

export const BOOT_STORAGE_KEY = 'payload-theme-boot'
export const BOOT_STYLE_ID = 'pt-boot-override'
export const FONT_LINK_ID = 'pt-font-override'

/** What the customizer stores: one CSS string and an optional webfont URL. */
export interface BootSnapshot {
  css: string
  font?: string
}

/**
 * Plain ES5, no dependencies, every failure swallowed: storage may be blocked
 * and the snapshot may be stale or hand-edited — the panel must render anyway.
 */
export const BOOT_SCRIPT = `(function(){try{var b=JSON.parse(localStorage.getItem(${JSON.stringify(
  BOOT_STORAGE_KEY,
)})||'null');if(!b||typeof b.css!=='string')return;var d=document,h=d.head,s=d.createElement('style');s.id=${JSON.stringify(
  BOOT_STYLE_ID,
)};s.textContent=b.css;h.appendChild(s);if(typeof b.font==='string'&&!d.getElementById(${JSON.stringify(
  FONT_LINK_ID,
)})){var l=d.createElement('link');l.id=${JSON.stringify(
  FONT_LINK_ID,
)};l.rel='stylesheet';l.href=b.font;h.appendChild(l)}}catch(e){}})()`
