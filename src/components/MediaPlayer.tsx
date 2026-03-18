import { useState } from "react";
import { Music, Video, Radio, Eye, Play, ExternalLink, Plus, X, Trash2 } from "lucide-react";

type MediaCategory = "Music" | "Video" | "Podcast" | "PRN";

interface MediaItem {
  title: string;
  url: string;
  category: MediaCategory;
}

const CATEGORY_META: Record<MediaCategory, { icon: React.ReactNode; color: string; tagBg: string }> = {
  Music: {
    icon: <Music className="w-3 h-3" />,
    color: "text-primary",
    tagBg: "bg-primary/20 text-primary border-primary/30",
  },
  Video: {
    icon: <Video className="w-3 h-3" />,
    color: "text-[hsl(var(--terminal-cyan))]",
    tagBg: "bg-[hsl(var(--terminal-cyan))]/20 text-[hsl(var(--terminal-cyan))] border-[hsl(var(--terminal-cyan))]/30",
  },
  Podcast: {
    icon: <Radio className="w-3 h-3" />,
    color: "text-[hsl(var(--terminal-yellow))]",
    tagBg: "bg-[hsl(var(--terminal-yellow))]/20 text-[hsl(var(--terminal-yellow))] border-[hsl(var(--terminal-yellow))]/30",
  },
  PRN: {
    icon: <Eye className="w-3 h-3" />,
    color: "text-destructive",
    tagBg: "bg-destructive/20 text-destructive border-destructive/30",
  },
};

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
  const [playlist, setPlaylist] = useState<MediaItem[]>(loadPlaylist);
  const [activeCategory, setActiveCategory] = useState<MediaCategory | "All">("All");
  const [activeUrl, setActiveUrl] = useState(playlist[0]?.url || "");
  const [customUrl, setCustomUrl] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [addCategory, setAddCategory] = useState<MediaCategory>("Music");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = activeCategory === "All" ? playlist : playlist.filter((i) => i.category === activeCategory);

  const handlePlayItem = (item: MediaItem) => {
    if (item.url) setActiveUrl(item.url);
  };

  const handleAdd = () => {
    if (!customUrl.trim()) return;
    let url = customUrl.trim();
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) url = `https://www.youtube.com/embed/${ytMatch[1]}`;
    const title = customTitle.trim() || `Media ${playlist.length + 1}`;
    const newItem: MediaItem = { title, url, category: addCategory };
    const updated = [...playlist, newItem];
    setPlaylist(updated);
    savePlaylist(updated);
    setActiveUrl(url);
    setCustomUrl("");
    setCustomTitle("");
    setShowAdd(false);
  };

  const handleRemove = (index: number) => {
    const updated = playlist.filter((_, i) => i !== index);
    setPlaylist(updated);
    savePlaylist(updated);
  };

  const handleCustomGo = () => {
    if (!customUrl.trim()) return;
    let url = customUrl.trim();
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (ytMatch) url = `https://www.youtube.com/embed/${ytMatch[1]}`;
    setActiveUrl(url);
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold text-primary glow-green">MEDIA PLAYER</span>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          {showAdd ? "CLOSE" : "ADD"}
        </button>
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
              {meta.icon} {cat}
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

      {/* iframe viewer */}
      <div className="relative aspect-video bg-background border-b border-border">
        {activeUrl ? (
          <iframe
            src={activeUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Media Player"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
            Aucun média sélectionné
          </div>
        )}
      </div>

      {/* Quick URL */}
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

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map((item, i) => {
          const meta = CATEGORY_META[item.category];
          const realIndex = playlist.indexOf(item);
          return (
            <div
              key={`${item.url}-${i}`}
              className={`group flex items-center gap-2 px-4 py-2 text-xs hover:bg-secondary/30 transition-colors ${
                activeUrl === item.url ? "bg-secondary/50" : ""
              }`}
            >
              <button onClick={() => handlePlayItem(item)} className="flex items-center gap-2 flex-1 text-left">
                <Play className={`w-3 h-3 ${activeUrl === item.url ? meta.color : "text-muted-foreground"}`} />
                <span className={activeUrl === item.url ? meta.color : "text-foreground"}>
                  {item.title}
                </span>
              </button>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-display font-semibold border ${meta.tagBg}`}>
                {item.category}
              </span>
              <button
                onClick={() => handleRemove(realIndex)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MediaPlayer;
