import { ICON_MOON, ICON_SUN } from "./icons";

const BG_DARK = "#191c1c";
const BG_LIGHT = "#f4f9f8";

function setFavicon(light: boolean) {
  const link = document.getElementById("favicon") as HTMLLinkElement | null;
  if (link) link.href = light ? "/search-light.svg" : "/search.svg";
}

function applyTheme(light: boolean) {
  const html = document.documentElement;
  html.dataset.theme = light ? "light" : "dark";
  html.style.background = light ? BG_LIGHT : BG_DARK;
  html.style.colorScheme = light ? "light" : "dark";
  setFavicon(light);
}

export function isCurrentlyLight(): boolean {
  return document.documentElement.dataset.theme === "light";
}

export function initTheme() {
  const stored = localStorage.getItem("theme");
  const mq = window.matchMedia("(prefers-color-scheme: light)");
  applyTheme(stored ? stored === "light" : mq.matches);
  mq.addEventListener("change", (e) => {
    if (!localStorage.getItem("theme")) applyTheme(e.matches);
  });
}

export function toggleTheme() {
  const goingLight = !isCurrentlyLight();
  localStorage.setItem("theme", goingLight ? "light" : "dark");
  applyTheme(goingLight);
  const btn = document.querySelector<HTMLButtonElement>(".theme-toggle");
  if (btn) {
    btn.innerHTML = goingLight ? ICON_MOON : ICON_SUN;
    btn.title = goingLight ? "Switch to dark mode" : "Switch to light mode";
  }
}
