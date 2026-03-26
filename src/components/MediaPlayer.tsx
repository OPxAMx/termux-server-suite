import { useState, useEffect, useMemo, useCallback } from "react";
import { Music, Video, Radio, Play, ExternalLink, Plus, X, Trash2, Menu, Download, Upload } from "lucide-react";
import { exportPlaylistCSV, importPlaylistCSV, downloadFile, uploadFile, addLog } from "@/lib/dataManager";

type MediaCategory = "Music" | "Video" | "Podcast" | "Playlist";

interface MediaItem {
  title: string;
  description?: string;
  url: string;
  iframe_url?: string;
  cover_image?: string;
  rating?: number;
  category: MediaCategory;
  tags?: string[];
  duration?: string;
  year?: number;
}

const CATEGORY_META = {
  Music: { icon: Music, color: "text-primary", tagBg: "bg-primary/20 text-primary border-primary/30" },
  Video: { icon: Video, color: "text-[hsl(var(--terminal-cyan))]", tagBg: "bg-[hsl(var(--terminal-cyan))]/20 text-[hsl(var(--terminal-cyan))] border-[hsl(var(--terminal-cyan))]/30" },
  Podcast: { icon: Radio, color: "text-[hsl(var(--terminal-yellow))]", tagBg: "bg-[hsl(var(--terminal-yellow))]/20 text-[hsl(var(--terminal-yellow))] border-[hsl(var(--terminal-yellow))]/30" },
  Playlist: { icon: Music, color: "text-[hsl(var(--terminal-green))]", tagBg: "bg-[hsl(var(--terminal-green))]/20 text-[hsl(var(--terminal-green))] border-[hsl(var(--terminal-green))]/30" },
} as const satisfies Record<MediaCategory, { icon: typeof Music; color: string; tagBg: string }>;

const DEFAULT_ITEMS: MediaItem[] = [
  { title: "Lofi Radio", url: "https://www.youtube.com/embed/jfKfPfyJRdk", category: "Music" },
  { title: "Synthwave Mix", url: "https://www.youtube.com/embed/4xDzrJKXOOY", category: "Music" },
  { title: "NCS 24/7", url: "https://www.youtube.com/embed/7tNtU5XFwrU", category: "Music" },
  { title: "Tech News Live", url: "https://www.youtube.com/embed/dpXhSrhmUXo", category: "Video" },
  { title: "Coding Stream", url: "https://www.youtube.com/embed/rfscVS0vtbw", category: "Video" },
  { title: "Darknet Diaries", url: "https://www.youtube.com/embed/jZB_VFONE2c", category: "Podcast" },
  { title: "Lex Fridman", url: "https://www.youtube.com/embed/DxREm3s1scA", category: "Podcast" },
];

const STORAGE_KEY = "media-playlist";

function loadPlaylist(): MediaItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_ITEMS;
}

function savePlaylist(items: MediaItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

const MediaPlayer = () => {
  const [playlist, setPlaylist] = useState<MediaItem[]>(() => loadPlaylist());
  const [activeCategory, setActiveCategory] = useState<MediaCategory | "All">("All");
  const [activeUrl, setActiveUrl] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [addCategory, setAddCategory] = useState<MediaCategory>("Playlist");
  const [showAdd, setShowAdd] = useState(false);
  // ✅ NOUVEAU : État pour contrôler l'affichage du side panel
  const [showPlaylist, setShowPlaylist] = useState(true);

  useEffect(() => {
    if (playlist.length > 0 && !activeUrl) {
      setActiveUrl(playlist[0].url);
    }
  }, []);

  const filtered = useMemo(
    () => (activeCategory === "All" ? playlist : playlist.filter((i) => i.category === activeCategory)),
    [playlist, activeCategory]
  );

  const extractYoutubeId = useCallback((url: string): string => {
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return ytMatch ? `https://www.youtube.com/embed/${ytMatch[1]}` : url;
  }, []);

  const handlePlayItem = useCallback((item: MediaItem) => {
    if (item.url) setActiveUrl(item.url);
  }, []);

  const handleAdd = useCallback(() => {
    const trimmedUrl = customUrl.trim();
    if (!trimmedUrl) return;
    const url = extractYoutubeId(trimmedUrl);
    const title = customTitle.trim() || `Media ${playlist.length + 1}`;
    const newItem: MediaItem = { title, url, category: addCategory };
    const updated = [...playlist, newItem];
    setPlaylist(updated);
    savePlaylist(updated);
    setActiveUrl(url);
    setCustomUrl("");
    setCustomTitle("");
    setShowAdd(false);
  }, [customUrl, customTitle, playlist, addCategory, extractYoutubeId]);

  const handleRemove = useCallback((index: number) => {
    setPlaylist((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      savePlaylist(updated);
      if (activeUrl === prev[index].url && updated.length > 0) {
        setActiveUrl(updated[0].url);
      }
      return updated;
    });
  }, [activeUrl]);

  const handleCustomGo = useCallback(() => {
    const trimmedUrl = customUrl.trim();
    if (!trimmedUrl) return;
    setActiveUrl(extractYoutubeId(trimmedUrl));
  }, [customUrl, extractYoutubeId]);

  return (
    // ✅ MODIFICATION 1 : Conteneur principal avec position relative (pour position absolute du side panel)
    <div className="relative flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold text-primary glow-green">MEDIA PLAYER</span>
        </div>
        <div className="flex items-center gap-2">
          {/* ✅ NOUVEAU : Bouton pour toggle le side panel */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
          >
            <Menu className="w-3 h-3" />
            {showPlaylist ? "HIDE" : "SHOW"}
          </button>
          <button
            onClick={() => {
              const csv = exportPlaylistCSV();
              if (csv) { downloadFile("playlist.csv", csv); addLog("action", "MediaPlayer", "Playlist CSV exported"); }
            }}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-[hsl(var(--terminal-cyan))]/30 bg-[hsl(var(--terminal-cyan))]/10 text-[hsl(var(--terminal-cyan))] hover:bg-[hsl(var(--terminal-cyan))]/20 transition-all font-display font-semibold"
            title="Export CSV"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={async () => {
              try {
                const csv = await uploadFile(".csv");
                const count = importPlaylistCSV(csv);
                setPlaylist(loadPlaylist());
                addLog("action", "MediaPlayer", `Imported ${count} items`);
              } catch {}
            }}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-[hsl(var(--terminal-cyan))]/30 bg-[hsl(var(--terminal-cyan))]/10 text-[hsl(var(--terminal-cyan))] hover:bg-[hsl(var(--terminal-cyan))]/20 transition-all font-display font-semibold"
            title="Import CSV"
          >
            <Upload className="w-3 h-3" />
          </button>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
          >
            {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {showAdd ? "CLOSE" : "ADD"}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveCategory("All")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-display font-semibold transition-all border-b-2 ${
            activeCategory === "All"
              ? "text-foreground border-foreground bg-secondary/30"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          ALL
        </button>
        {(Object.keys(CATEGORY_META) as MediaCategory[]).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-display font-semibold transition-all border-b-2 ${
                activeCategory === cat
                  ? `${meta.color} border-current bg-secondary/30`
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              <Icon className="w-3 h-3" /> {cat}
            </button>
          );
        })}
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="px-3 py-2 border-b border-border bg-secondary/20 space-y-2">
          <input
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="Titre..."
            className="w-full bg-background rounded px-2 py-1 text-xs outline-none text-foreground border border-border placeholder:text-muted-foreground"
          />
          <input
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="URL YouTube ou média..."
            className="w-full bg-background rounded px-2 py-1 text-xs outline-none text-foreground border border-border placeholder:text-muted-foreground"
          />
          <div className="flex items-center gap-2">
            <select
              value={addCategory}
              onChange={(e) => setAddCategory(e.target.value as MediaCategory)}
              className="bg-background rounded px-2 py-1 text-xs outline-none text-foreground border border-border"
            >
              {(Object.keys(CATEGORY_META) as MediaCategory[]).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button
              onClick={handleAdd}
              className="ml-auto px-3 py-1 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
            >
              ADD TO PLAYLIST
            </button>
          </div>
        </div>
      )}

      {/* ✅ MODIFICATION 2 : Quick URL section */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <ExternalLink className="w-3 h-3 text-muted-foreground" />
        <input
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustomGo()}
          placeholder="Coller une URL pour lecture rapide..."
          className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleCustomGo}
          className="px-2 py-0.5 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
        >
          GO
        </button>
      </div>

      {/* ✅ MODIFICATION 3 : iframe viewer prend toute la place restante */}
      <div className="relative flex-1 bg-background border-b border-border">
        {activeUrl ? (
          <iframe
            src={activeUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Media Player"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            Aucun média sélectionné
          </div>
        )}
      </div>

      {/* ✅ MODIFICATION 4 : Side panel PLAYLIST en position absolute */}
      {showPlaylist && (
        <div className="absolute top-0 right-0 w-64 h-full bg-card border-l border-border shadow-lg flex flex-col z-50 rounded-l-lg overflow-hidden">
          {/* Header du side panel */}
          <div className="px-3 py-2 border-b border-border bg-secondary/50 flex items-center justify-between">
            <span className="text-xs font-display font-bold text-primary">PLAYLIST</span>
            <button
              onClick={() => setShowPlaylist(false)}
              className="p-0.5 hover:bg-secondary rounded transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          {/* Contenu de la playlist */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map((item, i) => {
                const meta = CATEGORY_META[item.category];
                const realIndex = playlist.indexOf(item);
                return (
                  <div
                    key={`${item.url}-${i}`}
                    className={`group flex items-center gap-2 px-3 py-2 text-xs hover:bg-secondary/30 transition-colors border-b border-border/50 ${
                      activeUrl === item.url ? "bg-secondary/50" : ""
                    }`}
                  >
                    <button 
                      onClick={() => handlePlayItem(item)} 
                      className="flex items-center gap-2 flex-1 text-left min-w-0"
                    >
                      <Play className={`w-3 h-3 flex-shrink-0 ${activeUrl === item.url ? meta.color : "text-muted-foreground"}`} />
                      <span className={`truncate ${activeUrl === item.url ? meta.color : "text-foreground"}`}>
                        {item.title}
                      </span>
                    </button>
                    <button
                      onClick={() => handleRemove(realIndex)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-xs px-3 text-center">
                Aucun élément dans la playlist actuelle
              </div>
            )}
          </div>

          {/* Footer du side panel avec catégories */}
          <div className="border-t border-border bg-secondary/50 p-2 space-y-1">
            {(Object.keys(CATEGORY_META) as MediaCategory[]).map((cat) => {
              const meta = CATEGORY_META[cat];
              const Icon = meta.icon;
              const count = useMemo(() => playlist.filter((item) => item.category === cat).length, [playlist, cat]);
              return (
                <div key={cat} className="flex items-center justify-between text-[9px] px-2 py-1">
                  <span className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    <span>{cat}</span>
                  </span>
                  <span className="text-muted-foreground">({count})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPlayer;