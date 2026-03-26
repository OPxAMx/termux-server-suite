// ─── Centralized Data Manager ────────────────────────────────
// Handles CSV import/export, backup/restore, and logging for all app data stores.

// ─── Log System ──────────────────────────────────────────────
export type LogLevel = "info" | "warn" | "error" | "action";

export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  source: string;
  message: string;
}

const LOG_KEY = "termux-logs";
const MAX_LOGS = 1000;

export function loadLogs(): LogEntry[] {
  try { return JSON.parse(localStorage.getItem(LOG_KEY) || "[]"); } catch { return []; }
}

function saveLogs(logs: LogEntry[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
}

export function addLog(level: LogLevel, source: string, message: string) {
  const logs = loadLogs();
  logs.push({ id: crypto.randomUUID?.() || Date.now().toString(36), timestamp: Date.now(), level, source, message });
  saveLogs(logs);
}

export function clearLogs() {
  localStorage.removeItem(LOG_KEY);
}

// ─── CSV Utilities ───────────────────────────────────────────
export function arrayToCSV<T extends Record<string, unknown>>(data: T[], columns?: string[]): string {
  if (data.length === 0) return "";
  const cols = columns || Object.keys(data[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.join(",");
  const rows = data.map((row) => cols.map((c) => escape(row[c])).join(","));
  return [header, ...rows].join("\n");
}

export function csvToArray(csv: string): Record<string, string>[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const vals = parseCsvLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ""; });
    return obj;
  });
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ",") { result.push(current.trim()); current = ""; }
      else { current += ch; }
    }
  }
  result.push(current.trim());
  return result;
}

// ─── Download / Upload helpers ───────────────────────────────
export function downloadFile(filename: string, content: string, type = "text/csv") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export function uploadFile(accept: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file"; input.accept = accept;
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file"));
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    };
    input.click();
  });
}

// ─── Data Store Keys ─────────────────────────────────────────
const ALL_KEYS = [
  "media-playlist",
  "termux-resources",
  "cyber-browser-history",
  "cyber-browser-bookmarks",
  "cyber-browser-settings",
  "termux-theme",
  "termux-brightness",
  "termux-commands",
  "termux-filesystem",
  "termux-logs",
];

// ─── Full Backup / Restore ──────────────────────────────────
export function exportFullBackup(): string {
  const data: Record<string, string | null> = {};
  ALL_KEYS.forEach((key) => { data[key] = localStorage.getItem(key); });
  return JSON.stringify(data, null, 2);
}

export function importFullBackup(json: string): { restored: number; keys: string[] } {
  const data = JSON.parse(json) as Record<string, string | null>;
  const keys: string[] = [];
  Object.entries(data).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      localStorage.setItem(key, value);
      keys.push(key);
    }
  });
  addLog("action", "DataManager", `Restored backup: ${keys.length} keys`);
  return { restored: keys.length, keys };
}

// ─── Resource CSV ────────────────────────────────────────────
export function exportResourcesCSV(): string {
  const raw = localStorage.getItem("termux-resources");
  if (!raw) return "";
  const resources = JSON.parse(raw) as Record<string, unknown>[];
  return arrayToCSV(resources.map((r) => ({
    ...r,
    tags: Array.isArray(r.tags) ? (r.tags as string[]).join(";") : "",
  })), ["id", "name", "url", "type", "tags", "favorite", "createdAt", "updatedAt"]);
}

export function importResourcesCSV(csv: string): number {
  const rows = csvToArray(csv);
  const now = Date.now();
  const resources = rows.map((r) => ({
    id: r.id || (crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2)),
    name: r.name || "Untitled",
    url: r.url || "",
    type: r.type || "link",
    tags: r.tags ? r.tags.split(";").map((t: string) => t.trim()).filter(Boolean) : [],
    favorite: r.favorite === "true",
    createdAt: parseInt(r.createdAt) || now,
    updatedAt: parseInt(r.updatedAt) || now,
  }));
  const existing = JSON.parse(localStorage.getItem("termux-resources") || "[]");
  const merged = [...existing, ...resources];
  localStorage.setItem("termux-resources", JSON.stringify(merged));
  addLog("action", "Resources", `Imported ${resources.length} resources from CSV`);
  return resources.length;
}

// ─── Playlist CSV ────────────────────────────────────────────
const PLAYLIST_COLUMNS = ["title", "description", "iframe_url", "cover_image", "rating", "category", "tags", "duration", "year"];

export function exportPlaylistCSV(): string {
  const raw = localStorage.getItem("media-playlist");
  if (!raw) return "";
  const items = JSON.parse(raw) as Record<string, unknown>[];
  return arrayToCSV(items.map((item) => ({
    title: item.title || "",
    description: item.description || "",
    iframe_url: item.iframe_url || item.url || "",
    cover_image: item.cover_image || "",
    rating: item.rating ?? "",
    category: item.category || "",
    tags: Array.isArray(item.tags) ? (item.tags as string[]).join(";") : (item.tags || ""),
    duration: item.duration || "",
    year: item.year ?? "",
  })), PLAYLIST_COLUMNS);
}

export function importPlaylistCSV(csv: string): number {
  try {
    const rows = csvToArray(csv);
    if (rows.length === 0) return 0;
    const items = rows.map((r) => ({
      title: r.title || "Untitled",
      description: r.description || "",
      url: r.iframe_url || r.url || "",
      iframe_url: r.iframe_url || r.url || "",
      cover_image: r.cover_image || "",
      rating: r.rating ? parseFloat(r.rating) : 0,
      category: r.category || "Playlist",
      tags: r.tags ? r.tags.split(";").map((t: string) => t.trim()).filter(Boolean) : [],
      duration: r.duration || "",
      year: r.year ? parseInt(r.year) : 0,
    })).filter((r) => r.iframe_url || r.url);
    const existing = JSON.parse(localStorage.getItem("media-playlist") || "[]");
    const merged = [...existing, ...items];
    localStorage.setItem("media-playlist", JSON.stringify(merged));
    addLog("action", "MediaPlayer", `Imported ${items.length} playlist items from CSV`);
    return items.length;
  } catch (err) {
    addLog("error", "MediaPlayer", `CSV import failed: ${err instanceof Error ? err.message : String(err)}`);
    return 0;
  }
}

// ─── Bookmarks CSV ───────────────────────────────────────────
export function exportBookmarksCSV(): string {
  const raw = localStorage.getItem("cyber-browser-bookmarks");
  if (!raw) return "";
  return arrayToCSV(JSON.parse(raw), ["title", "url", "folder"]);
}

export function importBookmarksCSV(csv: string): number {
  const rows = csvToArray(csv);
  const bookmarks = rows.map((r) => ({
    title: r.title || "Untitled",
    url: r.url || "",
    folder: r.folder || "Imported",
  })).filter((r) => r.url);
  const existing = JSON.parse(localStorage.getItem("cyber-browser-bookmarks") || "[]");
  const merged = [...existing, ...bookmarks];
  localStorage.setItem("cyber-browser-bookmarks", JSON.stringify(merged));
  addLog("action", "Browser", `Imported ${bookmarks.length} bookmarks from CSV`);
  return bookmarks.length;
}

// ─── History CSV ─────────────────────────────────────────────
export function exportHistoryCSV(): string {
  const raw = localStorage.getItem("cyber-browser-history");
  if (!raw) return "";
  return arrayToCSV(JSON.parse(raw), ["title", "url", "timestamp"]);
}
