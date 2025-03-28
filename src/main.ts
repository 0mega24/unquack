import { bangs } from "./bang";
import "./global.css";

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh;">
      <div class="content-container">
        <h1>Unq**ck</h1>
        <h3>A CSH fork of Und*ck</h3>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs</a> and more.</p>
        <div class="url-container">
          <input type="text" class="url-input" value="${window.location.origin}?q=%s" readonly />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <div class="separator-bar"></div>
        <h3>Search Existing bangs below:</h3>
        <div class="search-container">
          <input type="text" class="search-input" placeholder="No search term? No problem, keep staring!" />
          <div class="search-results"></div>
        </div>
      </div>
      <footer class="footer">
        CSH Links:
        • Original links:
        <a href="https://t3.chat" target="_blank">t3.chat</a>
        • <a href="https://x.com/theo" target="_blank">theo</a>
        • <a href="https://github.com/t3dotgg/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const searchInput = app.querySelector<HTMLInputElement>(".search-input")!;
  const searchResults = app.querySelector<HTMLDivElement>(".search-results")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    searchResults.innerHTML = "";

    if (query.length === 0) {
      return;
    }

    if (query.includes('!') && query !== '!') {
        var search = query.replace('!', '');
    } else {
        var search = query;
    }

    const filteredBangs = bangs.filter(
      (bang) =>
        bang.d.toLowerCase().includes(search) ||
        bang.s.toLowerCase().includes(search) ||
        bang.t.toLowerCase().includes(search)
    );

    filteredBangs.forEach((bang) => {
      const resultContainer = document.createElement("div");
      resultContainer.className = "search-result";

      const input = document.createElement("input");
      input.type = "text";
      input.value = `!${bang.t} - ${bang.s} (${bang.d})`;
      input.readOnly = true;

      const copyButton = document.createElement("button");
      copyButton.className = "copy-button";
      copyButton.innerHTML = `<img src="/clipboard.svg" alt="Copy" />`;
      copyButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText('!' + bang.t);
        copyButton.innerHTML = `<img src="/clipboard-check.svg" alt="Copied" />`;
        setTimeout(
          () =>
            (copyButton.innerHTML = `<img src="/clipboard.svg" alt="Copy" />`),
          2000
        );
      });

      resultContainer.appendChild(input);
      resultContainer.appendChild(copyButton);
      searchResults.appendChild(resultContainer);
    });
  });
}

const LS_DEFAULT_BANG = localStorage.getItem("default-bang") ?? "g";
const defaultBang = bangs.find((b) => b.t === LS_DEFAULT_BANG);

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";

  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);
  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? defaultBang;

  if (query === `!${selectedBang?.t}`) {
    const redirectUrl = selectedBang?.d;

    if (redirectUrl && !/^https?:\/\//i.test(redirectUrl)) {
      return `https://${redirectUrl}`;
    }

    return redirectUrl;
  }

  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/")
  );

  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
