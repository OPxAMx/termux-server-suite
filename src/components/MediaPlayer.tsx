import { useState } from "react";
import { Music, Video, Radio, Eye, Play, ExternalLink } from "lucide-react";

type MediaCategory = "Music" | "Video" | "Podcast" | "PRN";

interface MediaItem {
  title: string;
  url: string;
  thumbnail?: string;
}

const MEDIA_SECTIONS: Record<MediaCategory, { icon: React.ReactNode; color: string; items: MediaItem[] }> = {
  Music: {
    icon: <Music className="w-3 h-3" />,
    color: "text-primary",
    items: [
      { title: "Lofi Radio", url: "https://www.youtube.com/embed/jfKfPfyJRdk" },
      { title: "Synthwave Mix", url: "https://www.youtube.com/embed/4xDzrJKXOOY" },
      { title: "NCS 24/7", url: "https://www.youtube.com/embed/7tNtU5XFwrU" },
    ],
  },
  Video: {
    icon: <Video className="w-3 h-3" />,
    color: "text-terminal-cyan",
    items: [
      { title: "Tech News Live", url: "https://www.youtube.com/embed/dpXhSrhmUXo" },
      { title: "Coding Stream", url: "https://www.youtube.com/embed/rfscVS0vtbw" },
    ],
  },
  Podcast: {
    icon: <Radio className="w-3 h-3" />,
    color: "text-terminal-yellow",
    items: [
      { title: "Darknet Diaries", url: "https://www.youtube.com/embed/jZB_VFONE2c" },
      { title: "Lex Fridman", url: "https://www.youtube.com/embed/DxREm3s1scA" },
    ],
  },
  PRN: {
    icon: <Eye className="w-3 h-3" />,
    color: "text-terminal-red",
    items: [
      { title: "Custom URL 1", url: "" },
      { title: "Custom URL 2", url: "" },
    ],
  },
};

const MediaPlayer = () => {
  const [activeCategory, setActiveCategory] = useState<MediaCategory>("Music");
  const [activeUrl, setActiveUrl] = useState(MEDIA_SECTIONS.Music.items[0]?.url || "");
  const [customUrl, setCustomUrl] = useState("");

  const section = MEDIA_SECTIONS[activeCategory];

  const handlePlayItem = (item: MediaItem) => {
    if (item.url) {
      setActiveUrl(item.url);
    }
  };

  const handleCustomUrl = () => {
    if (customUrl.trim()) {
      let url = customUrl.trim();
      // Auto-convert youtube watch URLs to embed
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (ytMatch) {
        url = `https://www.youtube.com/embed/${ytMatch[1]}`;
      }
      setActiveUrl(url);
    }
  };

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          <span className="text-xs font-display font-bold text-primary glow-green">MEDIA PLAYER</span>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-border">
        {(Object.keys(MEDIA_SECTIONS) as MediaCategory[]).map((cat) => {
          const sec = MEDIA_SECTIONS[cat];
          return (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                const firstItem = sec.items.find((i) => i.url);
                if (firstItem) setActiveUrl(firstItem.url);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-display font-semibold transition-all border-b-2 ${
                activeCategory === cat
                  ? `${sec.color} border-current bg-secondary/30`
                  : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {sec.icon} {cat}
            </button>
          );
        })}
      </div>

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

      {/* Custom URL input */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <ExternalLink className="w-3 h-3 text-muted-foreground" />
        <input
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustomUrl()}
          placeholder="Coller une URL YouTube ou média..."
          className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
        />
        <button
          onClick={handleCustomUrl}
          className="px-2 py-0.5 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
        >
          GO
        </button>
      </div>

      {/* Playlist */}
      <div className="flex-1 overflow-y-auto">
        {section.items.map((item, i) => (
          <button
            key={i}
            onClick={() => handlePlayItem(item)}
            className={`w-full flex items-center gap-2 px-4 py-2 text-xs hover:bg-secondary/30 transition-colors text-left ${
              activeUrl === item.url ? "bg-secondary/50" : ""
            }`}
          >
            <Play className={`w-3 h-3 ${activeUrl === item.url ? section.color : "text-muted-foreground"}`} />
            <span className={activeUrl === item.url ? section.color : "text-foreground"}>
              {item.title}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default MediaPlayer;
