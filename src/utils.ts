import { ICON_CLIPBOARD, ICON_CLIPBOARD_CHECK } from "./icons";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const bangLabelHtml = (bang: { t: string; s: string; d: string }): string =>
  `!${esc(bang.t)}<span class="bang-sep"> - </span>${esc(bang.s)} (${esc(bang.d)})`;

export function attachCopyClick(btn: HTMLButtonElement, getText: () => string): void {
  btn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(getText());
    btn.innerHTML = ICON_CLIPBOARD_CHECK;
    setTimeout(() => { btn.innerHTML = ICON_CLIPBOARD; }, 2000);
  });
}

export function navigateWithExit(app: HTMLElement, href: string): void {
  app.querySelector<HTMLElement>(".content-container")?.classList.add("is-exiting");
  setTimeout(() => { window.location.href = href; }, 200);
}
