import { bangs } from "./bang";
import { ICON_SUN, ICON_MOON, ICON_PENCIL, ICON_TRASH, ICON_CLIPBOARD, ICON_X } from "./icons";
import { toggleTheme, isCurrentlyLight } from "./theme";
import { footerHtml } from "./footer";
import { bangLabelHtml, attachCopyClick, navigateWithExit } from "./utils";

export type CustomBang = { t: string; s: string; d: string; u: string };

// -- Storage ----------------------------------------------------------------

export function getCustomBangs(): CustomBang[] {
  try { return JSON.parse(localStorage.getItem("custom-bangs") ?? "[]"); }
  catch { return []; }
}

export function saveCustomBangs(items: CustomBang[]): void {
  localStorage.setItem("custom-bangs", JSON.stringify(items));
}

export function validateCustomBang(b: CustomBang): string | null {
  if (!b.t.trim()) return "Bang is required.";
  if (/\s/.test(b.t)) return "Bang must not contain spaces.";
  if (!b.s.trim()) return "Name is required.";
  if (!b.d.trim()) return "Domain is required.";
  if (!b.u.trim()) return "URL template is required.";
  if (!b.u.includes("{{{s}}}")) return "URL template must contain {{{s}}}.";
  return null;
}

// -- Page state (reset each time renderCustomPage is called) ----------------

let editingIndex: number | null = null;
let modalOverlay: HTMLDivElement;
let tInput: HTMLInputElement;
let sInput: HTMLInputElement;
let dInput: HTMLInputElement;
let uInput: HTMLInputElement;
let hintT: HTMLParagraphElement;
let dialogTitle: HTMLHeadingElement;
let dialogError: HTMLParagraphElement;
let listContainer: HTMLDivElement;

// -- Dialog -----------------------------------------------------------------

function openDialog(bang?: CustomBang, idx?: number): void {
  editingIndex = idx ?? null;
  dialogTitle.textContent = bang ? "Edit Bang" : "New Bang";
  tInput.value = bang?.t ?? "";
  sInput.value = bang?.s ?? "";
  dInput.value = bang?.d ?? "";
  uInput.value = bang?.u ?? "";
  tInput.className = "custom-field";
  uInput.className = "custom-field";
  hintT.hidden = true;
  dialogError.hidden = true;
  modalOverlay.hidden = false;
  tInput.focus();
}

function closeDialog(): void {
  if (modalOverlay.classList.contains("is-closing")) return;
  modalOverlay.classList.add("is-closing");
  setTimeout(() => {
    modalOverlay.hidden = true;
    modalOverlay.classList.remove("is-closing");
  }, 200);
}

function saveDialog(): void {
  const t = tInput.value.trim();
  const s = sInput.value.trim();
  const d = dInput.value.trim();
  const u = uInput.value.trim();
  const error = validateCustomBang({ t, s, d, u });
  if (error) {
    dialogError.textContent = error;
    dialogError.hidden = false;
    return;
  }
  const items = getCustomBangs();
  if (editingIndex !== null) {
    items[editingIndex] = { t, s, d, u };
  } else {
    items.push({ t, s, d, u });
  }
  saveCustomBangs(items);
  closeDialog();
  renderList();
}

// -- Validation listeners ---------------------------------------------------

function onBangInput(): void {
  const val = tInput.value;
  tInput.className = "custom-field";
  if (!val) { hintT.hidden = true; return; }
  if (/\s/.test(val)) {
    tInput.classList.add("custom-field--error");
    hintT.className = "field-hint field-hint--error";
    hintT.textContent = "No spaces allowed.";
    hintT.hidden = false;
    return;
  }
  const customConflict = getCustomBangs().find((b, i) => b.t === val && i !== editingIndex);
  const builtinConflict = bangs.find((b) => b.t === val);
  if (customConflict) {
    tInput.classList.add("custom-field--warn");
    hintT.className = "field-hint field-hint--warn";
    hintT.textContent = `Will overwrite your existing custom !${val}.`;
    hintT.hidden = false;
  } else if (builtinConflict) {
    tInput.classList.add("custom-field--warn");
    hintT.className = "field-hint field-hint--warn";
    hintT.textContent = `Shadows built-in !${val}.`;
    hintT.hidden = false;
  } else {
    hintT.hidden = true;
  }
}

function onUrlInput(): void {
  const val = uInput.value;
  uInput.className = "custom-field";
  if (val && !val.includes("{{{s}}}")) {
    uInput.classList.add("custom-field--error");
  }
}

// -- List -------------------------------------------------------------------

function renderList(): void {
  const items = getCustomBangs();
  listContainer.innerHTML = "";
  if (items.length === 0) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = "No custom bangs yet.";
    listContainer.appendChild(empty);
    return;
  }

  const currentDefault = localStorage.getItem("default-bang") ?? "g";

  items.forEach((bang, i) => {
    const row = document.createElement("div");
    row.className = "search-result";

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
        renderList();
      });
    }

    const copyBtn = document.createElement("button");
    copyBtn.className = "copy-button accent-icon";
    copyBtn.title = "Copy bang";
    copyBtn.innerHTML = ICON_CLIPBOARD;
    attachCopyClick(copyBtn, () => `!${bang.t}`);

    const editBtn = document.createElement("button");
    editBtn.className = "copy-button";
    editBtn.title = "Edit";
    editBtn.innerHTML = ICON_PENCIL;
    editBtn.addEventListener("click", () => openDialog(bang, i));

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "copy-button danger-icon";
    deleteBtn.title = "Delete";
    deleteBtn.innerHTML = ICON_TRASH;
    deleteBtn.addEventListener("click", () => {
      const current = getCustomBangs();
      current.splice(i, 1);
      saveCustomBangs(current);
      renderList();
    });

    row.appendChild(label);
    row.appendChild(defaultBtn);
    row.appendChild(copyBtn);
    row.appendChild(editBtn);
    row.appendChild(deleteBtn);
    listContainer.appendChild(row);
  });
}

// -- Import / Export --------------------------------------------------------

function handleExport(): void {
  const blob = new Blob([JSON.stringify(getCustomBangs(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "custom-bangs.json";
  a.click();
  URL.revokeObjectURL(url);
}

function handleImport(app: HTMLDivElement, file: File): void {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result as string) as unknown;
      if (!Array.isArray(parsed)) throw new Error("Expected a JSON array.");
      const incoming = parsed.filter(
        (item): item is CustomBang =>
          typeof item === "object" && item !== null &&
          typeof (item as CustomBang).t === "string" &&
          typeof (item as CustomBang).s === "string" &&
          typeof (item as CustomBang).d === "string" &&
          typeof (item as CustomBang).u === "string" &&
          (item as CustomBang).u.includes("{{{s}}}"),
      );
      const mode = app.querySelector<HTMLInputElement>('input[name="import-mode"]:checked')!.value;
      if (mode === "replace") {
        saveCustomBangs(incoming);
      } else {
        const existing = getCustomBangs();
        const merged = [...existing];
        incoming.forEach((b) => {
          const idx = merged.findIndex((e) => e.t === b.t);
          if (idx >= 0) merged[idx] = b; else merged.push(b);
        });
        saveCustomBangs(merged);
      }
      renderList();
    } catch (err) {
      dialogError.textContent = `Import failed: ${(err as Error).message}`;
      dialogError.hidden = false;
    }
  };
  reader.readAsText(file);
}

// -- Page -------------------------------------------------------------------

export function renderCustomPage(): void {
  editingIndex = null;

  const app = document.querySelector<HTMLDivElement>("#app")!;
  const isLight = isCurrentlyLight();

  app.innerHTML = `
    <button class="theme-toggle" title="${isLight ? "Switch to dark mode" : "Switch to light mode"}">${isLight ? ICON_MOON : ICON_SUN}</button>
    <div class="page-center">
      <div class="content-container">
        <div class="custom-page-header">
          <a href="/" class="back-link">Back</a>
          <h1>Custom B<span class="title-star">*</span>ngs</h1>
        </div>
        <div class="custom-desc-row">
          <p class="page-hint">Note: Bangs are saved in your browser. Clearing site data or browser storage will remove them.</p>
          <button type="button" class="custom-btn-primary" id="btn-new">New Bang</button>
        </div>
        <div class="separator-bar"></div>
        <div class="custom-list" id="custom-list"></div>
        <div class="separator-bar"></div>
        <div class="custom-io-row">
          <button type="button" class="custom-btn-secondary" id="btn-export">Export JSON</button>
          <div class="import-controls">
            <div class="import-mode-toggle">
              <label class="toggle-opt">
                <input type="radio" name="import-mode" value="merge" checked />
                Merge
              </label>
              <label class="toggle-opt">
                <input type="radio" name="import-mode" value="replace" />
                Replace
              </label>
            </div>
            <button type="button" class="custom-btn-secondary" id="btn-import">Import JSON</button>
            <input type="file" id="import-file" accept=".json,application/json" hidden />
          </div>
        </div>
      </div>
    </div>
    ${footerHtml()}
    <div class="modal-overlay" id="modal-overlay" hidden>
      <div class="modal-box">
        <div class="modal-header-row">
          <h3 id="dialog-title">New Bang</h3>
          <button type="button" class="modal-close" id="modal-close-x" aria-label="Close">${ICON_X}</button>
        </div>
        <div class="dialog-fields">
          <div class="field-group">
            <label class="field-label" for="cf-t">Bang</label>
            <input id="cf-t" class="custom-field" type="text" placeholder="e.g. mygit" autocomplete="off" spellcheck="false" />
            <p id="hint-t" class="field-hint field-hint--warn" hidden></p>
          </div>
          <div class="field-group">
            <label class="field-label" for="cf-s">Name</label>
            <input id="cf-s" class="custom-field" type="text" placeholder="e.g. My GitLab" />
          </div>
          <div class="field-group">
            <label class="field-label" for="cf-d">Domain</label>
            <input id="cf-d" class="custom-field" type="text" placeholder="e.g. git.example.com" autocomplete="off" />
          </div>
          <div class="field-group">
            <label class="field-label" for="cf-u">URL Template</label>
            <input id="cf-u" class="custom-field" type="text" placeholder="https://example.com/search?q={{{s}}}" autocomplete="off" spellcheck="false" />
            <p class="field-hint field-hint--subtle">Must contain <code>{{{s}}}</code> as the search term placeholder.</p>
          </div>
        </div>
        <p id="dialog-error" class="form-error" hidden></p>
        <div class="dialog-actions">
          <button type="button" id="dialog-cancel" class="custom-btn-secondary">Cancel</button>
          <button type="button" id="dialog-save" class="custom-btn-save">Save bang</button>
        </div>
      </div>
    </div>
  `;

  modalOverlay = app.querySelector<HTMLDivElement>("#modal-overlay")!;
  tInput = app.querySelector<HTMLInputElement>("#cf-t")!;
  sInput = app.querySelector<HTMLInputElement>("#cf-s")!;
  dInput = app.querySelector<HTMLInputElement>("#cf-d")!;
  uInput = app.querySelector<HTMLInputElement>("#cf-u")!;
  hintT = app.querySelector<HTMLParagraphElement>("#hint-t")!;
  dialogTitle = app.querySelector<HTMLHeadingElement>("#dialog-title")!;
  dialogError = app.querySelector<HTMLParagraphElement>("#dialog-error")!;
  listContainer = app.querySelector<HTMLDivElement>("#custom-list")!;

  app.querySelector<HTMLButtonElement>(".theme-toggle")!.addEventListener("click", toggleTheme);
  app.querySelector<HTMLAnchorElement>(".back-link")!.addEventListener("click", (e) => {
    e.preventDefault();
    navigateWithExit(app, (e.currentTarget as HTMLAnchorElement).href);
  });
  app.querySelector<HTMLButtonElement>("#btn-new")!.addEventListener("click", () => openDialog());
  app.querySelector<HTMLButtonElement>("#dialog-save")!.addEventListener("click", saveDialog);
  app.querySelector<HTMLButtonElement>("#dialog-cancel")!.addEventListener("click", closeDialog);
  app.querySelector<HTMLButtonElement>("#modal-close-x")!.addEventListener("click", closeDialog);
  modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) closeDialog(); });
  document.addEventListener("keydown", (e) => {
    if (!modalOverlay.hidden) {
      if (e.key === "Escape") closeDialog();
      if (e.key === "Enter") saveDialog();
    }
    if (e.key === "Enter") {
      const label = (document.activeElement as Element | null)?.closest<HTMLElement>(".toggle-opt");
      if (label) label.click();
    }
  });
  tInput.addEventListener("input", onBangInput);
  uInput.addEventListener("input", onUrlInput);

  app.querySelector<HTMLButtonElement>("#btn-export")!.addEventListener("click", handleExport);

  const importFileInput = app.querySelector<HTMLInputElement>("#import-file")!;
  app.querySelector<HTMLButtonElement>("#btn-import")!.addEventListener("click", () => {
    importFileInput.click();
  });
  importFileInput.addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    handleImport(app, file);
    (e.target as HTMLInputElement).value = "";
  });

  renderList();
}
