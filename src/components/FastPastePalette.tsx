import { useState, useEffect, useCallback } from "react";
import {
  Search, X, Star, Image, Globe, Link2, Copy, ExternalLink, Code2,
} from "lucide-react";
import {
  ResourceSrc, loadResources, copyAsHtml,
} from "@/lib/resourceStore";

interface FastPasteProps {
  open: boolean;
  onClose: () => void;
}

const FastPastePalette = ({ open, onClose }: FastPasteProps) => {
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<ResourceSrc[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setResources(loadResources());
      setQuery("");
    }
  }, [open]);

  // Global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "R") {
        e.preventDefault();
        if (open) onClose();
        else {
          setResources(loadResources());
          setQuery("");
        }
      }
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const filtered = resources.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      r.url.toLowerCase().includes(q) ||
      r.tags.some((t) => t.toLowerCase().includes(q)) ||
      r.type.includes(q)
    );
  });

  const favorites = filtered.filter((r) => r.favorite);
  const rest = filtered.filter((r) => !r.favorite);

  const copyUrl = (r: ResourceSrc) => {
    navigator.clipboard.writeText(r.url);
    setCopied(r.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const copyHtml = (r: ResourceSrc) => {
    navigator.clipboard.writeText(copyAsHtml(r));
    setCopied(r.id);
    setTimeout(() => setCopied(null), 1500);
  };

  const openExternal = (r: ResourceSrc) => {
    window.open(r.url, "_blank");
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "img": return <Image className="w-3 h-3 text-[hsl(var(--terminal-cyan))]" />;
      case "iframe": return <Globe className="w-3 h-3 text-primary" />;
      default: return <Link2 className="w-3 h-3 text-accent" />;
    }
  };

  const renderItem = (r: ResourceSrc) => (
    <div
      key={r.id}
      className="flex items-center gap-2 px-3 py-2 hover:bg-secondary/50 rounded transition-all group cursor-pointer"
      onClick={() => copyUrl(r)}
    >
      {typeIcon(r.type)}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-foreground truncate flex items-center gap-1">
          {r.favorite && <Star className="w-2.5 h-2.5 text-accent fill-accent" />}
          {r.name}
        </div>
        <div className="text-[9px] text-muted-foreground truncate">{r.url}</div>
      </div>
      {r.tags.length > 0 && (
        <div className="hidden sm:flex items-center gap-1">
          {r.tags.slice(0, 2).map((t) => (
            <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
          ))}
        </div>
      )}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); copyHtml(r); }}
          className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
          title="Copier HTML"
        >
          <Code2 className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); openExternal(r); }}
          className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary"
          title="Ouvrir"
        >
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      {copied === r.id && (
        <span className="text-[9px] text-primary font-semibold">Copié!</span>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] bg-background/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg border border-border bg-card rounded-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <Search className="w-4 h-4 text-primary" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une ressource... (Ctrl+Shift+R)"
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              {resources.length === 0 ? "Aucune ressource. Ajoutez-en depuis le File Manager." : "Aucun résultat"}
            </div>
          ) : (
            <>
              {favorites.length > 0 && (
                <div className="mb-2">
                  <div className="text-[9px] text-accent font-semibold px-3 py-1 uppercase">★ Favoris</div>
                  {favorites.map(renderItem)}
                </div>
              )}
              {rest.length > 0 && (
                <div>
                  {favorites.length > 0 && <div className="text-[9px] text-muted-foreground font-semibold px-3 py-1 uppercase">Toutes</div>}
                  {rest.map(renderItem)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border text-[9px] text-muted-foreground">
          <span>{filtered.length} ressource{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-3">
            <span>Clic = Copier URL</span>
            <span><Code2 className="w-2.5 h-2.5 inline" /> = Copier HTML</span>
            <span>Esc = Fermer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FastPastePalette;
