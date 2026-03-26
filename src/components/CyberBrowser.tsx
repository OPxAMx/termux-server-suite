import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Globe, ArrowLeft, ArrowRight, RotateCw, Chrome as Home, Star, Shield, X, Plus, Maximize2, Minimize2, Minus, Search, Lock, Clock as Unlock, Bookmark, Clock, Download, Settings, Wifi, WifiOff, Zap, Monitor, ChevronDown, ExternalLink, Copy, Trash2, Eye, EyeOff } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isSecure: boolean;
}

interface HistoryEntry {
  url: string;
  title: string;
  timestamp: number;
}

interface BookmarkEntry {
  url: string;
  title: string;
  folder: string;
}

type WindowMode = "normal" | "maximized" | "snap-left" | "snap-right" | "minimized";
type ViewPanel = "none" | "history" | "bookmarks" | "settings" | "devtools";

// ─── Storage helpers ─────────────────────────────────────────
const HISTORY_KEY = "cyber-browser-history";
const BOOKMARKS_KEY = "cyber-browser-bookmarks";
const SETTINGS_KEY = "cyber-browser-settings";

function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); } catch { return []; }
}
function saveHistory(h: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-500)));
}
function loadBookmarks(): BookmarkEntry[] {
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || "[]"); } catch { return []; }
}
function saveBookmarks(b: BookmarkEntry[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(b));
}

interface BrowserSettings {
  proxyEnabled: boolean;
  crtEffect: boolean;
  glitchEffect: boolean;
  hackerMode: boolean;
  homepage: string;
  searchEngine: string;
}

function loadSettings(): BrowserSettings {
  try {
    return {
      proxyEnabled: true, crtEffect: false, glitchEffect: false,
      hackerMode: false, homepage: "about:home", searchEngine: "https://duckduckgo.com/?q=",
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}"),
    };
  } catch {
    return { proxyEnabled: true, crtEffect: false, glitchEffect: false, hackerMode: false, homepage: "about:home", searchEngine: "https://duckduckgo.com/?q=" };
  }
}
function saveSettings(s: BrowserSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

// ─── Proxy URL builder ──────────────────────────────────────
// Uses allorigins.win as a CORS proxy to bypass iframe restrictions
const PROXY_BASE = "https://api.allorigins.win/raw?url=";
function proxyUrl(url: string, useProxy: boolean): string {
  if (!useProxy) return url;
  if (url.startsWith("about:") || url.startsWith("data:")) return "";
  return `${PROXY_BASE}${encodeURIComponent(url)}`;
}

// ─── URL helpers ─────────────────────────────────────────────
function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("about:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed)) return `https://${trimmed}`;
  return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
}

function extractDomain(url: string): string {
  try {
    if (url.startsWith("about:")) return url;
    return new URL(url).hostname;
  } catch { return url; }
}

// ─── Suggestions ─────────────────────────────────────────────
const QUICK_LINKS = [
  { title: "DuckDuckGo", url: "https://duckduckgo.com", icon: "🦆" },
  { title: "Wikipedia", url: "https://wikipedia.org", icon: "📚" },
  { title: "GitHub", url: "https://github.com", icon: "🐙" },
  { title: "Reddit", url: "https://reddit.com", icon: "🤖" },
  { title: "HackerNews", url: "https://news.ycombinator.com", icon: "📰" },
  { title: "Stack Overflow", url: "https://stackoverflow.com", icon: "📋" },
  { title: "MDN Web Docs", url: "https://developer.mozilla.org", icon: "🌐" },
  { title: "YouTube", url: "https://youtube.com", icon: "▶️" },
];

// ─── Auto-complete data ─────────────────────────────────────
function getAutoCompletions(input: string, history: HistoryEntry[], bookmarks: BookmarkEntry[]): string[] {
  if (!input || input.length < 2) return [];
  const lower = input.toLowerCase();
  const fromHistory = history
    .filter(h => h.url.toLowerCase().includes(lower) || h.title.toLowerCase().includes(lower))
    .map(h => h.url);
  const fromBookmarks = bookmarks
    .filter(b => b.url.toLowerCase().includes(lower) || b.title.toLowerCase().includes(lower))
    .map(b => b.url);
  const fromQuick = QUICK_LINKS
    .filter(q => q.url.toLowerCase().includes(lower) || q.title.toLowerCase().includes(lower))
    .map(q => q.url);
  return [...new Set([...fromBookmarks, ...fromHistory, ...fromQuick])].slice(0, 8);
}

// ─── Unique ID ───────────────────────────────────────────────
let _tabId = 0;
const newTabId = () => `tab-${Date.now()}-${_tabId++}`;

// ─── Homepage ────────────────────────────────────────────────
const HomePage = ({ onNavigate, bookmarks }: { onNavigate: (url: string) => void; bookmarks: BookmarkEntry[] }) => (
  <div className="flex flex-col items-center justify-center h-full bg-background p-8 overflow-y-auto">
    <div className="text-6xl mb-4">🌐</div>
    <h1 className="text-2xl font-display font-bold text-primary glow-green mb-2">CYBER BROWSER</h1>
    <p className="text-muted-foreground text-xs mb-8">Navigateur cyberpunk intégré</p>

    <div className="grid grid-cols-4 gap-3 max-w-md mb-8">
      {QUICK_LINKS.map(link => (
        <button
          key={link.url}
          onClick={() => onNavigate(link.url)}
          className="flex flex-col items-center gap-1 p-3 rounded-lg border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all group"
        >
          <span className="text-2xl group-hover:scale-110 transition-transform">{link.icon}</span>
          <span className="text-[10px] text-muted-foreground group-hover:text-foreground truncate w-full text-center">{link.title}</span>
        </button>
      ))}
    </div>

    {bookmarks.length > 0 && (
      <div className="w-full max-w-md">
        <h3 className="text-xs font-display font-semibold text-muted-foreground mb-2 flex items-center gap-1">
          <Bookmark className="w-3 h-3" /> SIGNETS
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {bookmarks.slice(0, 6).map((b, i) => (
            <button
              key={i}
              onClick={() => onNavigate(b.url)}
              className="text-left p-2 rounded border border-border bg-card hover:bg-secondary/50 transition-all text-xs truncate"
            >
              <span className="text-primary">●</span> {b.title || extractDomain(b.url)}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

// ─── Dev Tools panel ─────────────────────────────────────────
const DevToolsPanel = ({ tab }: { tab: BrowserTab }) => {
  const [logs] = useState(() => [
    { type: "info", msg: `[NET] GET ${tab.url} → 200 OK (${Math.floor(Math.random() * 500 + 50)}ms)` },
    { type: "info", msg: `[DNS] Resolved ${extractDomain(tab.url)} → ${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` },
    { type: "warn", msg: `[SEC] Mixed content warning on ${extractDomain(tab.url)}` },
    { type: "info", msg: `[TLS] TLS 1.3 handshake complete (ECDHE-RSA-AES256-GCM)` },
    { type: "info", msg: `[CACHE] Cache-Control: max-age=3600` },
    { type: "log", msg: `[PROXY] Request routed via allorigins.win proxy` },
    { type: "info", msg: `[HEADERS] Content-Type: text/html; charset=utf-8` },
    { type: "info", msg: `[PERF] DOMContentLoaded: ${Math.floor(Math.random() * 800 + 200)}ms` },
  ]);

  return (
    <div className="border-t border-border bg-card/80 p-2 h-48 overflow-y-auto text-[10px] font-mono">
      <div className="flex items-center gap-2 mb-2 text-muted-foreground border-b border-border pb-1">
        <span className="text-primary font-semibold">CONSOLE</span>
        <span className="text-muted-foreground">NETWORK</span>
        <span className="text-muted-foreground">ELEMENTS</span>
      </div>
      {logs.map((l, i) => (
        <div key={i} className={`py-0.5 ${l.type === "warn" ? "text-[hsl(var(--terminal-yellow))]" : l.type === "error" ? "text-destructive" : "text-muted-foreground"}`}>
          {l.msg}
        </div>
      ))}
    </div>
  );
};

// ═════════════════════════════════════════════════════════════
// Main Browser Component
// ═════════════════════════════════════════════════════════════
const CyberBrowser = () => {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: newTabId(), title: "Accueil", url: "about:home", loading: false, canGoBack: false, canGoForward: false, isSecure: true },
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [addressInput, setAddressInput] = useState("");
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>(loadBookmarks);
  const [settings, setSettingsState] = useState<BrowserSettings>(loadSettings);
  const [windowMode, setWindowMode] = useState<WindowMode>("normal");
  const [sidePanel, setSidePanel] = useState<ViewPanel>("none");
  const addressRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  // Sync address bar
  useEffect(() => {
    if (activeTab) {
      setAddressInput(activeTab.url === "about:home" ? "" : activeTab.url);
    }
  }, [activeTabId, activeTab?.url]);

  const suggestions = useMemo(() => {
    if (addressInput.length >= 2) {
      return getAutoCompletions(addressInput, history, bookmarks);
    }
    return [];
  }, [addressInput, history, bookmarks]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const updateTab = useCallback((id: string, patch: Partial<BrowserTab>) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  const navigate = useCallback((url: string, tabId?: string) => {
    const tid = tabId || activeTabId;
    const normalized = normalizeUrl(url);
    updateTab(tid, {
      url: normalized,
      title: extractDomain(normalized),
      loading: true,
      isSecure: normalized.startsWith("https://"),
    });

    if (!normalized.startsWith("about:")) {
      setHistory(prev => {
        const entry: HistoryEntry = { url: normalized, title: extractDomain(normalized), timestamp: Date.now() };
        const newH = [...prev.filter(h => h.url !== normalized), entry];
        saveHistory(newH);
        return newH;
      });
    }

    setAddressInput(normalized === "about:home" ? "" : normalized);
    setShowSuggestions(false);
    setTimeout(() => updateTab(tid, { loading: false }), 1500);
  }, [activeTabId, updateTab]);

  const addTab = useCallback(() => {
    const id = newTabId();
    const tab: BrowserTab = { id, title: "Nouvel onglet", url: "about:home", loading: false, canGoBack: false, canGoForward: false, isSecure: true };
    setTabs(prev => [...prev, tab]);
    setActiveTabId(id);
  }, []);

  const closeTab = useCallback((id: string) => {
    setTabs(prev => {
      const filtered = prev.filter(t => t.id !== id);
      if (filtered.length === 0) {
        const newTab: BrowserTab = { id: newTabId(), title: "Accueil", url: "about:home", loading: false, canGoBack: false, canGoForward: false, isSecure: true };
        setActiveTabId(newTab.id);
        return [newTab];
      }
      if (activeTabId === id) {
        setActiveTabId(filtered[filtered.length - 1].id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const isBookmarked = useMemo(() => bookmarks.some(b => b.url === activeTab.url), [bookmarks, activeTab.url]);

  const toggleBookmark = useCallback(() => {
    if (activeTab.url.startsWith("about:")) return;
    setBookmarks(prev => {
      const existing = prev.findIndex(b => b.url === activeTab.url);
      const newB = existing >= 0
        ? prev.filter((_, i) => i !== existing)
        : [...prev, { url: activeTab.url, title: activeTab.title, folder: "default" }];
      saveBookmarks(newB);
      return newB;
    });
  }, [activeTab.url, activeTab.title]);

  const updateSettings = (patch: Partial<BrowserSettings>) => {
    const newS = { ...settings, ...patch };
    setSettingsState(newS);
    saveSettings(newS);
  };

  const handleAddressKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      navigate(addressInput);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    } else if (e.key === "ArrowDown" && suggestions.length > 0) {
      e.preventDefault();
      // Simple: pick first suggestion
      setAddressInput(suggestions[0]);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  const windowModeClass = () => {
    switch (windowMode) {
      case "snap-left": return "w-1/2 mr-auto";
      case "snap-right": return "w-1/2 ml-auto";
      case "minimized": return "h-12 overflow-hidden";
      default: return "w-full";
    }
  };

  const renderContent = () => {
    if (activeTab.url === "about:home") {
      return <HomePage onNavigate={navigate} bookmarks={bookmarks} />;
    }

    const src = settings.proxyEnabled ? proxyUrl(activeTab.url, true) : activeTab.url;

    return (
      <div className="relative w-full h-full">
        {activeTab.loading && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/20 z-10">
            <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }} />
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={src}
          className="w-full h-full border-none bg-background"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          title={activeTab.title}
          onLoad={() => updateTab(activeTab.id, { loading: false })}
        />
        {/* CRT overlay */}
        {settings.crtEffect && (
          <div className="absolute inset-0 pointer-events-none z-20 scanline opacity-40" />
        )}
        {/* Glitch overlay */}
        {settings.glitchEffect && (
          <div className="absolute inset-0 pointer-events-none z-20 animate-pulse mix-blend-screen"
            style={{ background: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, hsl(var(--primary) / 0.03) 3px, hsl(var(--primary) / 0.03) 6px)" }}
          />
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden transition-all ${windowModeClass()} ${settings.hackerMode ? "glow-box-green" : ""}`}>
      {/* ── Title bar / Window controls ── */}
      <div className="flex items-center gap-1 px-2 py-1 bg-secondary/60 border-b border-border select-none">
        <div className="flex items-center gap-1.5 mr-2">
          <button onClick={() => setWindowMode("minimized")} className="w-3 h-3 rounded-full bg-[hsl(var(--terminal-yellow))] hover:brightness-110 transition-all flex items-center justify-center group">
            <Minus className="w-2 h-2 text-background opacity-0 group-hover:opacity-100" />
          </button>
          <button
            onClick={() => setWindowMode(windowMode === "maximized" ? "normal" : "maximized")}
            className="w-3 h-3 rounded-full bg-primary hover:brightness-110 transition-all flex items-center justify-center group"
          >
            {windowMode === "maximized"
              ? <Minimize2 className="w-2 h-2 text-background opacity-0 group-hover:opacity-100" />
              : <Maximize2 className="w-2 h-2 text-background opacity-0 group-hover:opacity-100" />}
          </button>
          <button className="w-3 h-3 rounded-full bg-destructive hover:brightness-110 transition-all flex items-center justify-center group">
            <X className="w-2 h-2 text-background opacity-0 group-hover:opacity-100" />
          </button>
        </div>

        {/* Snap buttons */}
        <div className="flex items-center gap-0.5 mr-2 border-r border-border pr-2">
          <button onClick={() => setWindowMode("snap-left")} title="Snap gauche"
            className="p-0.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-3 h-3 border border-current rounded-sm flex"><div className="w-1/2 bg-current rounded-l-sm" /></div>
          </button>
          <button onClick={() => setWindowMode("normal")} title="Normal"
            className="p-0.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-foreground transition-colors">
            <Monitor className="w-3 h-3" />
          </button>
          <button onClick={() => setWindowMode("snap-right")} title="Snap droite"
            className="p-0.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-foreground transition-colors">
            <div className="w-3 h-3 border border-current rounded-sm flex"><div className="w-1/2" /><div className="w-1/2 bg-current rounded-r-sm" /></div>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-1 flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-t text-[10px] cursor-pointer max-w-[140px] group transition-all ${
                tab.id === activeTabId
                  ? "bg-card border-t border-x border-border text-foreground"
                  : "text-muted-foreground hover:bg-secondary/50"
              }`}
            >
              {tab.loading ? (
                <RotateCw className="w-2.5 h-2.5 animate-spin text-primary" />
              ) : (
                <Globe className="w-2.5 h-2.5 shrink-0" />
              )}
              <span className="truncate">{tab.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all shrink-0"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
          <button onClick={addTab} className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-all">
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setSidePanel(sidePanel === "devtools" ? "none" : "devtools")}
            className={`p-1 rounded text-[10px] font-display transition-all ${sidePanel === "devtools" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
            title="DevTools">
            <Zap className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── Navigation bar ── */}
      {windowMode !== "minimized" && (
        <div className="flex items-center gap-1 px-2 py-1.5 bg-card/80 border-b border-border">
          {/* Nav buttons */}
          <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary/50 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <button className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary/50 transition-colors">
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => navigate(activeTab.url)} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary/50 transition-colors">
            <RotateCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => navigate("about:home")} className="p-1 text-muted-foreground hover:text-foreground rounded hover:bg-secondary/50 transition-colors">
            <Home className="w-3.5 h-3.5" />
          </button>

          {/* Address bar */}
          <div className="flex-1 relative">
            <div className="flex items-center gap-1 bg-secondary/50 rounded border border-border focus-within:border-primary/50 px-2 py-1 transition-colors">
              {activeTab.isSecure ? (
                <Lock className="w-3 h-3 text-primary shrink-0" />
              ) : (
                <Unlock className="w-3 h-3 text-[hsl(var(--terminal-yellow))] shrink-0" />
              )}
              <input
                ref={addressRef}
                value={addressInput}
                onChange={e => { setAddressInput(e.target.value); setShowSuggestions(true); }}
                onKeyDown={handleAddressKeyDown}
                onFocus={() => { addressRef.current?.select(); setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Rechercher ou entrer une URL…"
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                spellCheck={false}
              />
              {settings.proxyEnabled && (
                <span className="text-[9px] text-primary font-display px-1 py-0.5 rounded bg-primary/10 border border-primary/20">PROXY</span>
              )}
              <Search className="w-3 h-3 text-muted-foreground shrink-0" />
            </div>

            {/* Auto-complete dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => navigate(s)}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary/50 flex items-center gap-2 transition-colors"
                  >
                    <Globe className="w-3 h-3 text-muted-foreground shrink-0" />
                    <span className="truncate text-foreground">{s}</span>
                    <span className="text-muted-foreground text-[10px] ml-auto shrink-0">{extractDomain(s)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <button onClick={toggleBookmark}
            className={`p-1 rounded transition-colors ${isBookmarked ? "text-[hsl(var(--terminal-yellow))]" : "text-muted-foreground hover:text-foreground"}`}>
            <Star className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
          <button onClick={() => setSidePanel(sidePanel === "history" ? "none" : "history")}
            className={`p-1 rounded transition-colors ${sidePanel === "history" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Clock className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setSidePanel(sidePanel === "bookmarks" ? "none" : "bookmarks")}
            className={`p-1 rounded transition-colors ${sidePanel === "bookmarks" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Bookmark className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setSidePanel(sidePanel === "settings" ? "none" : "settings")}
            className={`p-1 rounded transition-colors ${sidePanel === "settings" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Main content area ── */}
      {windowMode !== "minimized" && (
        <div className="flex-1 flex overflow-hidden">
          {/* Page content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderContent()}
            {sidePanel === "devtools" && <DevToolsPanel tab={activeTab} />}
          </div>

          {/* Side panel */}
          {(sidePanel === "history" || sidePanel === "bookmarks" || sidePanel === "settings") && (
            <div className="w-64 border-l border-border bg-card/80 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs font-display font-semibold text-primary">
                  {sidePanel === "history" ? "📜 HISTORIQUE" : sidePanel === "bookmarks" ? "⭐ SIGNETS" : "⚙️ PARAMÈTRES"}
                </span>
                <button onClick={() => setSidePanel("none")} className="text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {sidePanel === "history" && (
                  <>
                    <button onClick={clearHistory} className="w-full text-[10px] text-destructive hover:bg-destructive/10 rounded px-2 py-1 mb-2 text-left flex items-center gap-1">
                      <Trash2 className="w-3 h-3" /> Effacer l'historique
                    </button>
                    {history.slice().reverse().map((h, i) => (
                      <button
                        key={i}
                        onClick={() => navigate(h.url)}
                        className="w-full text-left px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors mb-0.5"
                      >
                        <div className="text-[11px] text-foreground truncate">{h.title}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{h.url}</div>
                        <div className="text-[8px] text-muted-foreground/50">{new Date(h.timestamp).toLocaleString()}</div>
                      </button>
                    ))}
                    {history.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucun historique</p>}
                  </>
                )}
                {sidePanel === "bookmarks" && (
                  <>
                    {bookmarks.map((b, i) => (
                      <div key={i} className="flex items-center gap-1 mb-0.5">
                        <button
                          onClick={() => navigate(b.url)}
                          className="flex-1 text-left px-2 py-1.5 rounded hover:bg-secondary/50 transition-colors"
                        >
                          <div className="text-[11px] text-foreground truncate">{b.title || extractDomain(b.url)}</div>
                          <div className="text-[9px] text-muted-foreground truncate">{b.url}</div>
                        </button>
                        <button
                          onClick={() => {
                            const newB = bookmarks.filter((_, j) => j !== i);
                            setBookmarks(newB);
                            saveBookmarks(newB);
                          }}
                          className="p-1 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {bookmarks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Aucun signet</p>}
                  </>
                )}
                {sidePanel === "settings" && (
                  <div className="space-y-3">
                    {([
                      { key: "proxyEnabled" as const, label: "🛡️ Proxy CORS", desc: "Contourner les restrictions iframe" },
                      { key: "crtEffect" as const, label: "📺 Effet CRT", desc: "Lignes de balayage rétro" },
                      { key: "glitchEffect" as const, label: "🧬 Effet Glitch", desc: "Distorsion visuelle" },
                      { key: "hackerMode" as const, label: "🕶️ Mode Hacker", desc: "Lueur néon + console réseau" },
                    ]).map(opt => (
                      <label key={opt.key} className="flex items-center gap-2 p-2 rounded border border-border hover:bg-secondary/30 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={settings[opt.key]}
                          onChange={e => updateSettings({ [opt.key]: e.target.checked })}
                          className="accent-[hsl(var(--primary))]"
                        />
                        <div>
                          <div className="text-[11px] font-semibold text-foreground">{opt.label}</div>
                          <div className="text-[9px] text-muted-foreground">{opt.desc}</div>
                        </div>
                      </label>
                    ))}
                    <div className="pt-2 border-t border-border">
                      <label className="text-[10px] text-muted-foreground block mb-1">Moteur de recherche</label>
                      <select
                        value={settings.searchEngine}
                        onChange={e => updateSettings({ searchEngine: e.target.value })}
                        className="w-full bg-secondary/50 border border-border rounded px-2 py-1 text-xs text-foreground outline-none"
                      >
                        <option value="https://duckduckgo.com/?q=">DuckDuckGo</option>
                        <option value="https://www.google.com/search?q=">Google</option>
                        <option value="https://search.brave.com/search?q=">Brave</option>
                        <option value="https://www.bing.com/search?q=">Bing</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Status bar ── */}
      {windowMode !== "minimized" && (
        <div className="flex items-center justify-between px-3 py-1 border-t border-border bg-secondary/30 text-[9px] text-muted-foreground">
          <div className="flex items-center gap-2">
            {settings.proxyEnabled ? (
              <span className="flex items-center gap-0.5 text-primary"><Shield className="w-2.5 h-2.5" /> PROXY ON</span>
            ) : (
              <span className="flex items-center gap-0.5"><WifiOff className="w-2.5 h-2.5" /> DIRECT</span>
            )}
            <span className="flex items-center gap-0.5"><Wifi className="w-2.5 h-2.5" /> {extractDomain(activeTab.url)}</span>
          </div>
          <div className="flex items-center gap-2">
            {settings.crtEffect && <span className="text-[hsl(var(--terminal-cyan))]">CRT</span>}
            {settings.glitchEffect && <span className="text-[hsl(var(--terminal-yellow))]">GLITCH</span>}
            {settings.hackerMode && <span className="text-primary">HACK</span>}
            <span>{tabs.length} onglet{tabs.length > 1 ? "s" : ""}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CyberBrowser;
