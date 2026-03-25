import { useState, useEffect, useCallback } from "react";
import {
  Database, Download, Upload, Trash2, X, FileText, Music, Globe,
  Bookmark, Clock, Settings, AlertTriangle, Info, Zap, Shield,
  Archive, RefreshCw, Search, ChevronDown, ChevronRight,
} from "lucide-react";
import {
  loadLogs, clearLogs, addLog, LogEntry, LogLevel,
  exportFullBackup, importFullBackup,
  exportResourcesCSV, importResourcesCSV,
  exportPlaylistCSV, importPlaylistCSV,
  exportBookmarksCSV, importBookmarksCSV,
  exportHistoryCSV,
  downloadFile, uploadFile,
} from "@/lib/dataManager";

type Section = "overview" | "csv" | "backup" | "logs";

const LEVEL_STYLE: Record<LogLevel, { icon: React.ReactNode; color: string }> = {
  info: { icon: <Info className="w-3 h-3" />, color: "text-[hsl(var(--terminal-cyan))]" },
  warn: { icon: <AlertTriangle className="w-3 h-3" />, color: "text-[hsl(var(--terminal-yellow))]" },
  error: { icon: <X className="w-3 h-3" />, color: "text-[hsl(var(--terminal-red))]" },
  action: { icon: <Zap className="w-3 h-3" />, color: "text-primary" },
};

const DataManager = () => {
  const [section, setSection] = useState<Section>("overview");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState("");
  const [logLevel, setLogLevel] = useState<LogLevel | "all">("all");
  const [status, setStatus] = useState("");

  const refreshLogs = useCallback(() => setLogs(loadLogs()), []);

  useEffect(() => { refreshLogs(); }, [section]);

  const flash = (msg: string) => { setStatus(msg); setTimeout(() => setStatus(""), 3000); };

  // ─── CSV handlers ──────────────────────────────────────────
  const handleExportResources = () => {
    const csv = exportResourcesCSV();
    if (!csv) return flash("Aucune ressource à exporter");
    downloadFile("resources.csv", csv);
    addLog("action", "DataManager", "Exported resources CSV");
    flash("Resources CSV exporté ✓");
  };

  const handleImportResources = async () => {
    try {
      const csv = await uploadFile(".csv");
      const count = importResourcesCSV(csv);
      flash(`${count} ressources importées ✓`);
    } catch { flash("Import annulé"); }
  };

  const handleExportPlaylist = () => {
    const csv = exportPlaylistCSV();
    if (!csv) return flash("Aucune playlist à exporter");
    downloadFile("playlist.csv", csv);
    addLog("action", "DataManager", "Exported playlist CSV");
    flash("Playlist CSV exporté ✓");
  };

  const handleImportPlaylist = async () => {
    try {
      const csv = await uploadFile(".csv");
      const count = importPlaylistCSV(csv);
      flash(`${count} éléments playlist importés ✓`);
    } catch { flash("Import annulé"); }
  };

  const handleExportBookmarks = () => {
    const csv = exportBookmarksCSV();
    if (!csv) return flash("Aucun bookmark à exporter");
    downloadFile("bookmarks.csv", csv);
    addLog("action", "DataManager", "Exported bookmarks CSV");
    flash("Bookmarks CSV exporté ✓");
  };

  const handleImportBookmarks = async () => {
    try {
      const csv = await uploadFile(".csv");
      const count = importBookmarksCSV(csv);
      flash(`${count} bookmarks importés ✓`);
    } catch { flash("Import annulé"); }
  };

  const handleExportHistory = () => {
    const csv = exportHistoryCSV();
    if (!csv) return flash("Aucun historique à exporter");
    downloadFile("history.csv", csv);
    addLog("action", "DataManager", "Exported history CSV");
    flash("Historique CSV exporté ✓");
  };

  // ─── Backup handlers ──────────────────────────────────────
  const handleFullBackup = () => {
    const json = exportFullBackup();
    downloadFile(`termux-backup-${new Date().toISOString().slice(0, 10)}.json`, json, "application/json");
    addLog("action", "DataManager", "Full backup exported");
    flash("Backup complet exporté ✓");
  };

  const handleFullRestore = async () => {
    try {
      const json = await uploadFile(".json");
      const result = importFullBackup(json);
      flash(`Backup restauré: ${result.restored} clés ✓ — Rechargez pour appliquer`);
    } catch { flash("Restauration annulée"); }
  };

  // ─── Storage stats ────────────────────────────────────────
  const getStats = () => {
    const stats = [
      { key: "media-playlist", label: "Playlist", icon: <Music className="w-3 h-3" /> },
      { key: "termux-resources", label: "Resources", icon: <FileText className="w-3 h-3" /> },
      { key: "cyber-browser-bookmarks", label: "Bookmarks", icon: <Bookmark className="w-3 h-3" /> },
      { key: "cyber-browser-history", label: "History", icon: <Clock className="w-3 h-3" /> },
      { key: "termux-commands", label: "Commands", icon: <Database className="w-3 h-3" /> },
      { key: "termux-filesystem", label: "Filesystem", icon: <Archive className="w-3 h-3" /> },
      { key: "termux-logs", label: "Logs", icon: <Shield className="w-3 h-3" /> },
      { key: "termux-theme", label: "Theme", icon: <Settings className="w-3 h-3" /> },
    ];
    return stats.map((s) => {
      const raw = localStorage.getItem(s.key);
      const size = raw ? new Blob([raw]).size : 0;
      let count = 0;
      try { const p = JSON.parse(raw || ""); count = Array.isArray(p) ? p.length : 1; } catch {}
      return { ...s, size, count };
    });
  };

  const formatSize = (b: number) => b < 1024 ? `${b}B` : `${(b / 1024).toFixed(1)}KB`;

  const filteredLogs = logs.filter((l) => {
    if (logLevel !== "all" && l.level !== logLevel) return false;
    if (logFilter && !l.message.toLowerCase().includes(logFilter.toLowerCase()) && !l.source.toLowerCase().includes(logFilter.toLowerCase())) return false;
    return true;
  }).reverse();

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "OVERVIEW", icon: <Database className="w-3 h-3" /> },
    { id: "csv", label: "CSV", icon: <FileText className="w-3 h-3" /> },
    { id: "backup", label: "BACKUP", icon: <Archive className="w-3 h-3" /> },
    { id: "logs", label: "LOGS", icon: <Shield className="w-3 h-3" /> },
  ];

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold text-primary glow-green">DATA MANAGER</span>
        </div>
        {status && (
          <span className="text-[10px] text-primary font-display font-semibold animate-pulse">{status}</span>
        )}
      </div>

      {/* Section tabs */}
      <div className="flex border-b border-border">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-display font-semibold transition-all border-b-2 ${
              section === s.id
                ? "text-primary border-primary bg-secondary/30"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* ─── OVERVIEW ─── */}
        {section === "overview" && (
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground font-display uppercase mb-2">Storage Overview</div>
            {getStats().map((s) => (
              <div key={s.key} className="flex items-center gap-2 px-3 py-2 rounded bg-secondary/30 border border-border/50">
                <span className="text-primary">{s.icon}</span>
                <span className="text-xs text-foreground flex-1">{s.label}</span>
                <span className="text-[10px] text-muted-foreground">{s.count} items</span>
                <span className="text-[10px] text-primary font-mono">{formatSize(s.size)}</span>
              </div>
            ))}
            <div className="mt-3 px-3 py-2 rounded bg-primary/5 border border-primary/20 text-[10px] text-primary">
              Total: {formatSize(getStats().reduce((a, s) => a + s.size, 0))}
            </div>
          </div>
        )}

        {/* ─── CSV IMPORT/EXPORT ─── */}
        {section === "csv" && (
          <div className="space-y-3">
            {[
              { label: "Resources", icon: <FileText className="w-4 h-4" />, onExport: handleExportResources, onImport: handleImportResources },
              { label: "Playlist", icon: <Music className="w-4 h-4" />, onExport: handleExportPlaylist, onImport: handleImportPlaylist },
              { label: "Bookmarks", icon: <Bookmark className="w-4 h-4" />, onExport: handleExportBookmarks, onImport: handleImportBookmarks },
              { label: "History", icon: <Clock className="w-4 h-4" />, onExport: handleExportHistory, onImport: undefined },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-3 py-3 rounded bg-secondary/30 border border-border/50">
                <span className="text-primary">{item.icon}</span>
                <span className="text-xs font-display font-semibold text-foreground flex-1">{item.label}</span>
                <button
                  onClick={item.onExport}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
                >
                  <Download className="w-3 h-3" /> EXPORT
                </button>
                {item.onImport && (
                  <button
                    onClick={item.onImport}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-[hsl(var(--terminal-cyan))]/30 bg-[hsl(var(--terminal-cyan))]/10 text-[hsl(var(--terminal-cyan))] hover:bg-[hsl(var(--terminal-cyan))]/20 transition-all font-display font-semibold"
                  >
                    <Upload className="w-3 h-3" /> IMPORT
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ─── BACKUP ─── */}
        {section === "backup" && (
          <div className="space-y-3">
            <div className="text-[10px] text-muted-foreground font-display uppercase mb-2">Full System Backup</div>
            <p className="text-[10px] text-muted-foreground">
              Sauvegarde complète de toutes les données : playlist, ressources, bookmarks, historique, paramètres, thème, commandes et fichiers.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleFullBackup}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold text-xs"
              >
                <Download className="w-4 h-4" /> EXPORT BACKUP (.json)
              </button>
              <button
                onClick={handleFullRestore}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded border border-[hsl(var(--terminal-cyan))]/30 bg-[hsl(var(--terminal-cyan))]/10 text-[hsl(var(--terminal-cyan))] hover:bg-[hsl(var(--terminal-cyan))]/20 transition-all font-display font-semibold text-xs"
              >
                <Upload className="w-4 h-4" /> RESTORE BACKUP (.json)
              </button>
            </div>
            <div className="mt-3 px-3 py-2 rounded bg-[hsl(var(--terminal-yellow))]/10 border border-[hsl(var(--terminal-yellow))]/20 text-[10px] text-[hsl(var(--terminal-yellow))] flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              La restauration écrase les données existantes. Rechargez la page après restauration.
            </div>
          </div>
        )}

        {/* ─── LOGS ─── */}
        {section === "logs" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded bg-secondary/50 border border-border">
                <Search className="w-3 h-3 text-muted-foreground" />
                <input
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  placeholder="Filtrer les logs..."
                  className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
                />
              </div>
              <select
                value={logLevel}
                onChange={(e) => setLogLevel(e.target.value as LogLevel | "all")}
                className="bg-secondary/50 rounded px-2 py-1 text-xs text-foreground border border-border outline-none"
              >
                <option value="all">All</option>
                <option value="info">Info</option>
                <option value="warn">Warn</option>
                <option value="error">Error</option>
                <option value="action">Action</option>
              </select>
              <button
                onClick={() => { clearLogs(); refreshLogs(); }}
                className="p-1 rounded border border-[hsl(var(--terminal-red))]/30 bg-[hsl(var(--terminal-red))]/10 text-[hsl(var(--terminal-red))] hover:bg-[hsl(var(--terminal-red))]/20 transition-all"
                title="Clear logs"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <button
                onClick={refreshLogs}
                className="p-1 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                title="Refresh"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[9px] text-muted-foreground">{filteredLogs.length} entrées</div>
            <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">Aucun log</div>
              ) : (
                filteredLogs.map((log) => {
                  const style = LEVEL_STYLE[log.level];
                  return (
                    <div key={log.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-secondary/30 transition-colors text-[10px] font-mono">
                      <span className={`flex-shrink-0 mt-0.5 ${style.color}`}>{style.icon}</span>
                      <span className="text-muted-foreground flex-shrink-0 w-16">
                        {new Date(log.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                      <span className={`flex-shrink-0 w-16 ${style.color} font-semibold`}>[{log.source}]</span>
                      <span className="text-foreground flex-1 break-all">{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataManager;
