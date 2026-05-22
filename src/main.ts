import { bangs } from "./bang";
import "./global.css";

type Bang = (typeof bangs)[number];

// -- Icons ------------------------------------------------------------------

const SVG_ATTRS =
  `xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ` +
  `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;

const ICON_CLIPBOARD = `<svg ${SVG_ATTRS}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>`;
const ICON_CLIPBOARD_CHECK = `<svg ${SVG_ATTRS}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 14 2 2 4-4"/></svg>`;
const ICON_SUN = `<svg ${SVG_ATTRS}><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
const ICON_MOON = `<svg ${SVG_ATTRS}><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`;

// -- Theme ------------------------------------------------------------------

function initTheme() {
  if (localStorage.getItem("theme") === "light") {
    document.documentElement.dataset.theme = "light";
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const goingLight = html.dataset.theme !== "light";
  if (goingLight) {
    html.dataset.theme = "light";
    localStorage.setItem("theme", "light");
  } else {
    html.removeAttribute("data-theme");
    localStorage.removeItem("theme");
  }
  const btn = document.querySelector<HTMLButtonElement>(".theme-toggle");
  if (btn) {
    btn.innerHTML = goingLight ? ICON_MOON : ICON_SUN;
    btn.title = goingLight ? "Switch to dark mode" : "Switch to light mode";
  }
}

// -- Search -----------------------------------------------------------------

const BATCH_SIZE = 25;

function matchBangs(query: string): Bang[] {
  const q = query.startsWith("!") ? query.slice(1).toLowerCase() : query.toLowerCase();
  return bangs.filter(
    (b) =>
      b.t.toLowerCase().includes(q) ||
      b.s.toLowerCase().includes(q) ||
      b.d.toLowerCase().includes(q),
  );
}

function renderBangCard(bang: Bang, defaultInput: HTMLInputElement): HTMLElement {
  const currentDefault = localStorage.getItem("default-bang") ?? "g";

  const card = document.createElement("div");
  card.className = "search-result";

  const label = document.createElement("input");
  label.type = "text";
  label.value = `!${bang.t} - ${bang.s} (${bang.d})`;
  label.readOnly = true;

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
  copyBtn.className = "copy-button";
  copyBtn.title = "Copy bang";
  copyBtn.innerHTML = ICON_CLIPBOARD;
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(`!${bang.t}`);
    copyBtn.innerHTML = ICON_CLIPBOARD_CHECK;
    setTimeout(() => {
      copyBtn.innerHTML = ICON_CLIPBOARD;
    }, 2000);
  });

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

    const batch = allResults.slice(renderedCount, renderedCount + BATCH_SIZE);
    batch.forEach((bang) => searchResults.appendChild(renderBangCard(bang, defaultInput)));
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

    if (!query) return;

    allResults = matchBangs(query);
    renderedCount = 0;

    if (allResults.length === 0) {
      const empty = document.createElement("p");
      empty.className = "search-empty";
      empty.textContent = "No bangs found.";
      searchResults.appendChild(empty);
      return;
    }

    renderNextBatch();
  });
}

// -- Home page --------------------------------------------------------------

const defaultBang = bangs.find((b) => b.t === (localStorage.getItem("default-bang") ?? "g"));
const defaultBangDisplay = defaultBang
  ? `Default: !${defaultBang.t} - ${defaultBang.u}`
  : "Default: !g - https://google.com/search?q={{{s}}}";

function renderHomePage() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  const isLight = document.documentElement.dataset.theme === "light";

  app.innerHTML = `
    <button class="theme-toggle" title="${isLight ? "Switch to dark mode" : "Switch to light mode"}">${isLight ? ICON_MOON : ICON_SUN}</button>
    <div class="page-center">
      <div class="content-container">
        <h1>Unq**ck</h1>
        <h3>A fork of Und*ck</h3>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs</a> and more.</p>
        <div class="url-container">
          <input type="text" class="url-input" value="${window.location.origin}?q=%s" readonly />
          <button class="copy-button" title="Copy URL">${ICON_CLIPBOARD}</button>
        </div>
        <div class="url-container">
          <input type="text" class="url-input default-bang" value="${defaultBangDisplay}" readonly />
        </div>
        <div class="separator-bar"></div>
        <h3>Browse bangs</h3>
        <p>Type a <code>!bang</code> or search term to filter. Click "Make Default" to change your preferred search engine.</p>
        <div class="search-container">
          <input type="text" class="search-input" placeholder="Search bangs…" />
          <div class="search-results"></div>
        </div>
      </div>
    </div>
    <footer class="footer">
      Unq**ck:
      <a href="https://github.com/0mega24/" target="_blank">omega24</a>
      &bull;&nbsp;<a href="https://github.com/0mega24/unquack" target="_blank">github</a>
      &bull;&nbsp;<a href="https://git.csh.rit.edu/omega24/unquack" target="_blank">gitlab</a>
      &nbsp;|&nbsp;
      <a href="https://unduck.link" target="_blank">Und*ck</a>:
      <a href="https://t3.chat" target="_blank">t3.chat</a>
      &bull;&nbsp;<a href="https://x.com/theo" target="_blank">theo</a>
      &bull;&nbsp;<a href="https://github.com/t3dotgg/unduck" target="_blank">github</a>
    </footer>
  `;

  app
    .querySelector<HTMLButtonElement>(".theme-toggle")!
    .addEventListener("click", toggleTheme);

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyButton.innerHTML = ICON_CLIPBOARD_CHECK;
    setTimeout(() => {
      copyButton.innerHTML = ICON_CLIPBOARD;
    }, 2000);
  });

  const searchInput = app.querySelector<HTMLInputElement>(".search-input")!;
  const searchResults = app.querySelector<HTMLDivElement>(".search-results")!;
  const defaultInput = app.querySelector<HTMLInputElement>(".default-bang")!;
  const footer = app.querySelector<HTMLElement>(".footer");
  initSearch(searchInput, searchResults, defaultInput, footer);
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

  const selectedDefaultBang =
    bangs.find((b) => b.t === customDefaultBang) ??
    bangs.find((b) => b.t === (localStorage.getItem("default-bang") ?? "g"));

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? selectedDefaultBang;

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
doRedirect();
