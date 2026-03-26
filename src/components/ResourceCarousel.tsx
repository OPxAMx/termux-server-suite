import { useState } from "react";
import { ChevronUp, ChevronDown, Copy, Code2, ExternalLink, Star, Globe, Image, Link2 } from "lucide-react";
import { ResourceSrc, ResourceType, copyAsHtml } from "@/lib/resourceStore";

function resourceTypeIcon(type: ResourceType, size = "w-4 h-4") {
  switch (type) {
    case "img": return <Image className={`${size} text-[hsl(var(--terminal-cyan))]`} />;
    case "iframe": return <Globe className={`${size} text-primary`} />;
    case "link": return <Link2 className={`${size} text-accent`} />;
  }
}

interface ResourceCarouselProps {
  resources: ResourceSrc[];
  onToggleFav: (id: string) => void;
}

const ResourceCarousel = ({ resources, onToggleFav }: ResourceCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  if (resources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2 bg-card/30 backdrop-blur-sm rounded-lg border border-border/50">
        <Globe className="w-10 h-10 opacity-20" />
        <span>Aucune ressource à prévisualiser</span>
      </div>
    );
  }

  const current = resources[activeIndex % resources.length];
  const safeIndex = activeIndex % resources.length;

  const goUp = () => setActiveIndex((prev) => (prev - 1 + resources.length) % resources.length);
  const goDown = () => setActiveIndex((prev) => (prev + 1) % resources.length);

  return (
    <div className="flex flex-col h-full bg-card/20 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
      {/* Navigation top */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 bg-secondary/30">
        <div className="flex items-center gap-2">
          {resourceTypeIcon(current.type, "w-3.5 h-3.5")}
          <span className="text-[10px] font-display font-bold text-foreground truncate max-w-[200px]">{current.name}</span>
          <span className="text-[8px] text-muted-foreground uppercase bg-secondary/50 px-1.5 py-0.5 rounded">{current.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={goUp} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] text-muted-foreground font-mono">{safeIndex + 1}/{resources.length}</span>
          <button onClick={goDown} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-3 flex items-center justify-center">
        {current.type === "img" && (
          <img src={current.url} alt={current.name} className="max-w-full max-h-full rounded border border-border/50 object-contain" />
        )}
        {current.type === "iframe" && (
          <iframe src={current.url} title={current.name} className="w-full h-full rounded border border-border/50" allowFullScreen />
        )}
        {current.type === "link" && (
          <div className="flex flex-col items-center justify-center gap-3">
            <Link2 className="w-10 h-10 text-accent opacity-50" />
            <a href={current.url} target="_blank" rel="noopener" className="text-primary underline text-xs max-w-full truncate">{current.url}</a>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-t border-border/50 bg-secondary/30">
        <button
          onClick={() => onToggleFav(current.id)}
          className={`flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold transition-all ${current.favorite ? "text-accent bg-accent/10 border border-accent/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}
        >
          <Star className={`w-3 h-3 ${current.favorite ? "fill-accent" : ""}`} /> Favori
        </button>
        <button
          onClick={() => copyToClipboard(current.url, current.id)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent transition-all"
        >
          <Copy className="w-3 h-3" /> URL
        </button>
        <button
          onClick={() => copyToClipboard(copyAsHtml(current), current.id + "-html")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent transition-all"
        >
          <Code2 className="w-3 h-3" /> HTML
        </button>
        <button
          onClick={() => window.open(current.url, "_blank")}
          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 border border-transparent transition-all"
        >
          <ExternalLink className="w-3 h-3" /> Ouvrir
        </button>
        {(copied === current.id || copied === current.id + "-html") && (
          <span className="text-[9px] text-primary font-bold ml-auto">Copié!</span>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="flex flex-col gap-1 px-2 py-2 border-t border-border/50 bg-secondary/20 max-h-[120px] overflow-y-auto">
        {resources.map((r, i) => (
          <button
            key={r.id}
            onClick={() => setActiveIndex(i)}
            className={`flex items-center gap-2 px-2 py-1 rounded text-[9px] text-left transition-all ${
              i === safeIndex
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/30 border border-transparent"
            }`}
          >
            {resourceTypeIcon(r.type, "w-3 h-3")}
            <span className="truncate flex-1">{r.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ResourceCarousel;
