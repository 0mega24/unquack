import { bangs } from "./bang";
import "./global.css";
import { ICON_CLIPBOARD, ICON_SUN, ICON_MOON, ICON_SEARCH } from "./icons";
import { initTheme, toggleTheme, isCurrentlyLight } from "./theme";
import { renderCustomPage, getCustomBangs } from "./custom";
import { footerHtml } from "./footer";
import { bangLabelHtml, attachCopyClick, navigateWithExit } from "./utils";

type Bang = (typeof bangs)[number];

const builtinBangsLower = bangs.map((b) => ({
  bang: b,
  tL: b.t.toLowerCase(),
  sL: b.s.toLowerCase(),
  dL: b.d.toLowerCase(),
}));

// -- Search -----------------------------------------------------------------

const BATCH_SIZE = 25;

function matchBangs(query: string): Bang[] {
  const q = query.startsWith("!") ? query.slice(1).toLowerCase() : query.toLowerCase();
  const custom = getCustomBangs().filter(
    (b) =>
      b.t.toLowerCase().includes(q) ||
      b.s.toLowerCase().includes(q) ||
      b.d.toLowerCase().includes(q),
  );
  const builtin = builtinBangsLower
    .filter(({ tL, sL, dL }) => tL.includes(q) || sL.includes(q) || dL.includes(q))
    .map(({ bang }) => bang);
  return [...custom, ...builtin];
}

function renderBangCard(bang: Bang, defaultInput: HTMLInputElement, currentDefault: string): HTMLElement {
  const card = document.createElement("div");
  card.className = "search-result";

  const label = document.createElement("div");
  label.className = "bang-label";
  label.tabIndex = -1;
  label.innerHTML = bangLabelHtml(bang);

  const defaultBtn = document.createElement("button");
  defaultBtn.className = "set-default-button";

  if (bang.t === currentDefault) {
    defaultBtn.textContent = "Default";
    defaultBtn.disabled = true;
  } else {
    defaultBtn.textContent = "Make Default";
    defaultBtn.addEventListener("click", () => {
      localStorage.setItem("default-bang", bang.t);
      defaultInput.value = `Default: !${bang.t} - ${bang.u}`;
      defaultBtn.textContent = "Default";
      defaultBtn.disabled = true;
    });
  }

  const copyBtn = document.createElement("button");
  copyBtn.className = "copy-button accent-icon";
  copyBtn.title = "Copy bang";
  copyBtn.innerHTML = ICON_CLIPBOARD;
  attachCopyClick(copyBtn, () => `!${bang.t}`);

  card.appendChild(label);
  card.appendChild(defaultBtn);
  card.appendChild(copyBtn);
  return card;
}

// -- Infinite scroll --------------------------------------------------------

function initSearch(
  searchInput: HTMLInputElement,
  searchResults: HTMLDivElement,
  defaultInput: HTMLInputElement,
  footer: HTMLElement | null,
) {
  let allResults: Bang[] = [];
  let renderedCount = 0;
  let sentinel: HTMLDivElement | null = null;
  let isOpen = false;

  function updateMaxHeight() {
    const inputRect = searchInput.getBoundingClientRect();
    const footerHeight = footer?.getBoundingClientRect().height ?? 0;
    const gap = 6;
    const buffer = 8;
    const available = window.innerHeight - inputRect.bottom - gap - footerHeight - buffer;
    searchResults.style.maxHeight = `${Math.max(0, available)}px`;
  }

  window.addEventListener("resize", updateMaxHeight);

  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) renderNextBatch();
  });

  function renderNextBatch() {
    observer.disconnect();
    sentinel?.remove();
    sentinel = null;

    const currentDefault = localStorage.getItem("default-bang") ?? "g";
    const batch = allResults.slice(renderedCount, renderedCount + BATCH_SIZE);
    batch.forEach((bang) => searchResults.appendChild(renderBangCard(bang, defaultInput, currentDefault)));
    renderedCount += batch.length;

    if (renderedCount < allResults.length) {
      const newSentinel = document.createElement("div");
      newSentinel.className = "scroll-sentinel";
      sentinel = newSentinel;
      searchResults.appendChild(newSentinel);
      observer.observe(newSentinel);
    }
  }

  searchInput.addEventListener("input", () => {
    updateMaxHeight();
    const query = searchInput.value.trim();
    observer.disconnect();
    searchResults.innerHTML = "";
    sentinel = null;

    if (!query) {
      if (isOpen) {
        searchResults.classList.remove("is-open");
        isOpen = false;
      }
      return;
    }

    allResults = matchBangs(query);
    renderedCount = 0;

    if (allResults.length === 0) {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "No bangs found.";
      searchResults.appendChild(empty);
    } else {
      renderNextBatch();
    }

    if (!isOpen) {
      void searchResults.offsetWidth;
      searchResults.classList.add("is-open");
      isOpen = true;
    }
  });
}

// -- Home page --------------------------------------------------------------

function renderHomePage() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const isLight = isCurrentlyLight();

  const defaultKey = localStorage.getItem("default-bang") ?? "g";
  const defaultBang =
    getCustomBangs().find((b) => b.t === defaultKey) ??
    bangs.find((b) => b.t === defaultKey);
  const defaultBangDisplay = defaultBang
    ? `Default: !${defaultBang.t} - ${defaultBang.u}`
    : "Default: !g - https://google.com/search?q={{{s}}}";

  app.innerHTML = `
    <button class="theme-toggle" title="${isLight ? "Switch to dark mode" : "Switch to light mode"}">${isLight ? ICON_MOON : ICON_SUN}</button>
    <div class="page-center">
      <div class="content-container">
        <h1>Unq<span class="title-star">**</span>ck</h1>
        <p class="page-subtitle">A fork of <a href="https://unduck.link" target="_blank">Und*ck</a></p>
        <p class="page-desc">DuckDuckGo's bang redirects are too slow. Add the URL below as a custom search engine to your browser to use <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs</a> and more, without the redirect lag.</p>
        <div class="url-container">
          <input type="text" class="url-input" value="${window.location.origin}?q=%s" readonly />
          <button class="copy-button accent-icon" title="Copy URL">${ICON_CLIPBOARD}</button>
        </div>
        <div class="url-container">
          <input type="text" class="url-input default-bang" value="${defaultBangDisplay}" readonly />
        </div>
        <p class="page-hint">Tip: append <code>?d=bang</code> to the search URL to override the default bang per link, e.g. <code>...?q=%s&amp;d=g</code> always uses Google if no bang is used in the search term.</p>
        <div class="separator-bar"></div>
        <div class="section-header">
          <h3>Browse bangs</h3>
          <a href="/custom" class="bangs-btn" title="Create your own !bangs with any URL template. Custom bangs take priority over built-in ones.">Custom bangs</a>
        </div>
        <p class="page-desc">Type <code>!bang</code> or a search term to filter. You can copy a specific bang or click Make Default to change your preferred search engine.</p>
        <div class="search-container">
          <span class="search-icon">${ICON_SEARCH}</span>
          <input type="text" class="search-input" placeholder="Search bangs…" />
          <div class="search-results"></div>
        </div>
      </div>
    </div>
    ${footerHtml()}
  `;

  app
    .querySelector<HTMLButtonElement>(".theme-toggle")!
    .addEventListener("click", toggleTheme);

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  attachCopyClick(copyButton, () => urlInput.value);

  const searchInput = app.querySelector<HTMLInputElement>(".search-input")!;
  const searchResults = app.querySelector<HTMLDivElement>(".search-results")!;
  const defaultInput = app.querySelector<HTMLInputElement>(".default-bang")!;
  const footer = app.querySelector<HTMLElement>(".footer");
  initSearch(searchInput, searchResults, defaultInput, footer);

  app.querySelector<HTMLAnchorElement>(".bangs-btn")!.addEventListener("click", (e) => {
    e.preventDefault();
    navigateWithExit(app, (e.currentTarget as HTMLAnchorElement).href);
  });
}

// -- Redirect ---------------------------------------------------------------

function getBangRedirectUrl(): string | null {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  const customDefaultBang = url.searchParams.get("d")?.trim()?.toLowerCase();

  if (!query) {
    renderHomePage();
    return null;
  }

  const customBangs = getCustomBangs();

  const storedDefaultKey = localStorage.getItem("default-bang") ?? "g";
  const selectedDefaultBang =
    customBangs.find((b) => b.t === customDefaultBang) ??
    bangs.find((b) => b.t === customDefaultBang) ??
    customBangs.find((b) => b.t === storedDefaultKey) ??
    bangs.find((b) => b.t === storedDefaultKey);

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang =
    customBangs.find((b) => b.t === bangCandidate) ??
    bangs.find((b) => b.t === bangCandidate) ??
    selectedDefaultBang;

  if (query === `!${selectedBang?.t}`) {
    const redirectUrl = selectedBang?.d;
    if (!redirectUrl) return null;
    return /^https?:\/\//i.test(redirectUrl) ? redirectUrl : `https://${redirectUrl}`;
  }

  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();
  return (
    selectedBang?.u.replace(
      "{{{s}}}",
      encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
    ) ?? null
  );
}

function doRedirect() {
  const searchUrl = getBangRedirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}


initTheme();
if (window.location.pathname === "/custom") {
  renderCustomPage();
} else {
  doRedirect();
}
