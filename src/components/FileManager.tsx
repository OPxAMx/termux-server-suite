import { useState, useRef, useCallback, useEffect } from "react";
import {
  Folder, FileText, ChevronRight, ArrowLeft, Grid, List, LayoutGrid,
  FileIcon, Image, Music, Video, Code, Archive, Plus, FolderPlus,
  Trash2, Pencil, Copy, Scissors, ClipboardPaste, Upload, Download,
  X, Save, Eye, Search, MoreVertical, ChevronDown, Globe, Link2,
  Star, ExternalLink, Code2, Zap, BookOpen,
} from "lucide-react";
import {
  FsNode, loadFs, createNode, deleteNode, renameNode,
  copyNode, moveNode, updateFileContent, uploadFile, getNodeAtPath,
  sortNodes, SortField, SortDir,
} from "@/lib/fileSystemStore";
import {
  ResourceSrc, ResourceType, loadResources, addResource, deleteResource,
  updateResource, toggleFavorite, copyAsHtml,
} from "@/lib/resourceStore";

type ViewMode = "icons" | "list" | "details" | "grid";
type ManagerTab = "files" | "resources";

function getFileIcon(ext?: string, size = "w-4 h-4") {
  switch (ext) {
    case "jpg": case "png": case "gif": case "webp":
      return <Image className={`${size} text-[hsl(var(--terminal-cyan))]`} />;
    case "mp3": case "wav": case "flac":
      return <Music className={`${size} text-primary`} />;
    case "mp4": case "mkv": case "avi":
      return <Video className={`${size} text-[hsl(var(--terminal-red))]`} />;
    case "js": case "ts": case "py": case "sh": case "csv": case "json":
      return <Code className={`${size} text-[hsl(var(--terminal-yellow))]`} />;
    case "gz": case "zip": case "tar":
      return <Archive className={`${size} text-accent`} />;
    default:
      return <FileText className={`${size} text-muted-foreground`} />;
  }
}

function resourceTypeIcon(type: ResourceType, size = "w-4 h-4") {
  switch (type) {
    case "img": return <Image className={`${size} text-[hsl(var(--terminal-cyan))]`} />;
    case "iframe": return <Globe className={`${size} text-primary`} />;
    case "link": return <Link2 className={`${size} text-accent`} />;
  }
}

const VIEW_MODES: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
  { id: "icons", icon: <LayoutGrid className="w-3 h-3" />, label: "Icônes" },
  { id: "grid", icon: <Grid className="w-3 h-3" />, label: "Grille" },
  { id: "list", icon: <List className="w-3 h-3" />, label: "Liste" },
  { id: "details", icon: <FileIcon className="w-3 h-3" />, label: "Détails" },
];

interface Clipboard {
  mode: "copy" | "cut";
  sourcePath: string[];
  name: string;
}

const FileManager = () => {
  // --- Tab state ---
  const [managerTab, setManagerTab] = useState<ManagerTab>("files");

  // --- FS state ---
  const [fs, setFs] = useState<FsNode>(loadFs);
  const [path, setPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [clipboard, setClipboard] = useState<Clipboard | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [creating, setCreating] = useState<"file" | "dir" | null>(null);
  const [createName, setCreateName] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item?: FsNode } | null>(null);
  const [previewFile, setPreviewFile] = useState<FsNode | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editing, setEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // --- Resource state ---
  const [resources, setResources] = useState<ResourceSrc[]>(loadResources);
  const [resSearch, setResSearch] = useState("");
  const [resFilter, setResFilter] = useState<ResourceType | "all">("all");
  const [showAddResource, setShowAddResource] = useState(false);
  const [newRes, setNewRes] = useState({ name: "", url: "", type: "link" as ResourceType, tags: "" });
  const [editingRes, setEditingRes] = useState<ResourceSrc | null>(null);
  const [resContextMenu, setResContextMenu] = useState<{ x: number; y: number; item: ResourceSrc } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [previewRes, setPreviewRes] = useState<ResourceSrc | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { renameInputRef.current?.focus(); }, [renaming]);
  useEffect(() => { createInputRef.current?.focus(); }, [creating]);

  // Reload resources when switching to tab
  useEffect(() => {
    if (managerTab === "resources") setResources(loadResources());
  }, [managerTab]);

  // --- FS logic (unchanged) ---
  const currentNode = getNodeAtPath(fs, path);
  const rawItems = currentNode?.children || [];
  const sortedItems = sortNodes(rawItems, sortField, sortDir);
  const items = searchQuery
    ? sortedItems.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedItems;

  const navigate = (name: string) => { setPath([...path, name]); setSelected(new Set()); setContextMenu(null); };
  const goBack = () => { setPath(path.slice(0, -1)); setSelected(new Set()); };

  const handleSelect = (name: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => { const next = new Set(prev); next.has(name) ? next.delete(name) : next.add(name); return next; });
    } else {
      setSelected(new Set([name]));
    }
  };

  const handleDoubleClick = (item: FsNode) => {
    if (item.type === "dir") { navigate(item.name); } else { setPreviewFile(item); setEditContent(item.content || ""); setEditing(false); }
  };

  const handleContextMenu = (e: React.MouseEvent, item?: FsNode) => {
    e.preventDefault();
    if (item) setSelected(new Set([item.name]));
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleCreate = () => {
    if (!creating || !createName.trim()) return;
    setFs(createNode(fs, path, createName.trim(), creating));
    setCreating(null); setCreateName("");
  };
  const handleRename = () => {
    if (!renaming || !renameValue.trim()) return;
    setFs(renameNode(fs, path, renaming, renameValue.trim()));
    setRenaming(null); setRenameValue("");
  };
  const handleDelete = (names: string[]) => {
    let updated = fs;
    for (const name of names) updated = deleteNode(updated, path, name);
    setFs(updated); setSelected(new Set());
  };
  const handleCopy = (name: string) => { setClipboard({ mode: "copy", sourcePath: [...path], name }); setContextMenu(null); };
  const handleCut = (name: string) => { setClipboard({ mode: "cut", sourcePath: [...path], name }); setContextMenu(null); };
  const handlePaste = () => {
    if (!clipboard) return;
    if (clipboard.mode === "copy") setFs(copyNode(fs, clipboard.sourcePath, clipboard.name, path));
    else { setFs(moveNode(fs, clipboard.sourcePath, clipboard.name, path)); setClipboard(null); }
    setContextMenu(null);
  };
  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const content = typeof reader.result === "string" ? reader.result : "";
        setFs((prev) => uploadFile(prev, path, file.name, content, file.size));
      };
      reader.readAsText(file);
    });
    e.target.value = "";
  }, [path]);
  const handleDownload = (item: FsNode) => {
    const blob = new Blob([item.content || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = item.name; a.click();
    URL.revokeObjectURL(url);
  };
  const handleSaveEdit = () => {
    if (!previewFile) return;
    setFs(updateFileContent(fs, [...path, previewFile.name], editContent));
    setPreviewFile({ ...previewFile, content: editContent }); setEditing(false);
  };
  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  // --- Resource logic ---
  const handleAddResource = () => {
    if (!newRes.name.trim() || !newRes.url.trim()) return;
    const r = addResource({
      name: newRes.name.trim(),
      url: newRes.url.trim(),
      type: newRes.type,
      tags: newRes.tags.split(",").map((t) => t.trim()).filter(Boolean),
      favorite: false,
    });
    setResources((prev) => [...prev, r]);
    setNewRes({ name: "", url: "", type: "link", tags: "" });
    setShowAddResource(false);
  };

  const handleUpdateResource = () => {
    if (!editingRes) return;
    updateResource(editingRes.id, {
      name: editingRes.name,
      url: editingRes.url,
      type: editingRes.type,
      tags: editingRes.tags,
      favorite: editingRes.favorite,
    });
    setResources(loadResources());
    setEditingRes(null);
  };

  const handleDeleteResource = (id: string) => {
    deleteResource(id);
    setResources((prev) => prev.filter((r) => r.id !== id));
    setResContextMenu(null);
  };

  const handleToggleFav = (id: string) => {
    toggleFavorite(id);
    setResources(loadResources());
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  const filteredResources = resources.filter((r) => {
    const q = resSearch.toLowerCase();
    const matchesSearch = !q || r.name.toLowerCase().includes(q) || r.url.toLowerCase().includes(q) || r.tags.some((t) => t.toLowerCase().includes(q));
    const matchesType = resFilter === "all" || r.type === resFilter;
    return matchesSearch && matchesType;
  });

  // Context menu close
  useEffect(() => {
    const handler = () => { setContextMenu(null); setResContextMenu(null); };
    if (contextMenu || resContextMenu) window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu, resContextMenu]);

  const breadcrumb = ["~", ...path];
  const isSelected = (name: string) => selected.has(name);
  const selClass = (name: string) => isSelected(name) ? "bg-primary/15 border-primary/30" : "";
  const cutClass = (name: string) => clipboard?.mode === "cut" && clipboard.name === name && clipboard.sourcePath.join("/") === path.join("/") ? "opacity-40" : "";

  const renderItemActions = (item: FsNode) => (
    <button onClick={(e) => { e.stopPropagation(); handleContextMenu(e, item); }} className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all">
      <MoreVertical className="w-3 h-3" />
    </button>
  );

  const nameOrRename = (item: FsNode) =>
    renaming === item.name ? (
      <form onSubmit={(e) => { e.preventDefault(); handleRename(); }} className="flex-1 min-w-0">
        <input ref={renameInputRef} value={renameValue} onChange={(e) => setRenameValue(e.target.value)} onBlur={handleRename}
          className="w-full bg-secondary border border-primary/30 rounded px-1 py-0.5 text-xs text-foreground outline-none" />
      </form>
    ) : <span className="text-foreground truncate">{item.name}</span>;

  // --- Render helpers for files ---
  const renderIcons = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-3">
      {items.map((item) => (
        <button key={item.name} onClick={(e) => handleSelect(item.name, e)} onDoubleClick={() => handleDoubleClick(item)} onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent hover:bg-secondary/50 transition-all ${selClass(item.name)} ${cutClass(item.name)}`}>
          {item.type === "dir" ? <Folder className="w-8 h-8 text-[hsl(var(--terminal-yellow))]" /> : <div className="w-8 h-8 flex items-center justify-center">{getFileIcon(item.ext, "w-6 h-6")}</div>}
          <span className="text-[9px] text-foreground truncate w-full text-center">{item.name}</span>
        </button>
      ))}
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
      {items.map((item) => (
        <button key={item.name} onClick={(e) => handleSelect(item.name, e)} onDoubleClick={() => handleDoubleClick(item)} onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group flex items-center gap-2 p-2 rounded-md border border-border hover:bg-secondary/30 transition-all text-left ${selClass(item.name)} ${cutClass(item.name)}`}>
          {item.type === "dir" ? <Folder className="w-4 h-4 text-[hsl(var(--terminal-yellow))] shrink-0" /> : getFileIcon(item.ext)}
          <span className="text-[10px] text-foreground truncate flex-1">{item.name}</span>
          {renderItemActions(item)}
        </button>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <button key={item.name} onClick={(e) => handleSelect(item.name, e)} onDoubleClick={() => handleDoubleClick(item)} onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary/30 transition-all text-left ${selClass(item.name)} ${cutClass(item.name)}`}>
          {item.type === "dir" ? <Folder className="w-4 h-4 text-[hsl(var(--terminal-yellow))] shrink-0" /> : getFileIcon(item.ext)}
          <span className="text-xs flex-1 min-w-0">{nameOrRename(item)}</span>
          {item.type === "dir" && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          {item.size && <span className="text-[10px] text-muted-foreground">{item.size}</span>}
          {renderItemActions(item)}
        </button>
      ))}
    </div>
  );

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button onClick={() => toggleSort(field)} className="flex items-center gap-1 hover:text-foreground transition-colors">
      {label}
      {sortField === field && <ChevronDown className={`w-2 h-2 transition-transform ${sortDir === "desc" ? "rotate-180" : ""}`} />}
    </button>
  );

  const renderDetails = () => (
    <div className="text-[10px]">
      <div className="grid grid-cols-[1fr_80px_100px_24px] gap-2 px-4 py-1.5 border-b border-border text-muted-foreground font-semibold">
        <SortHeader field="name" label="Nom" />
        <SortHeader field="size" label="Taille" />
        <SortHeader field="modified" label="Modifié" />
        <span />
      </div>
      {items.map((item) => (
        <button key={item.name} onClick={(e) => handleSelect(item.name, e)} onDoubleClick={() => handleDoubleClick(item)} onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group w-full grid grid-cols-[1fr_80px_100px_24px] gap-2 px-4 py-1.5 hover:bg-secondary/30 transition-all text-left items-center ${selClass(item.name)} ${cutClass(item.name)}`}>
          <span className="flex items-center gap-2 truncate min-w-0">
            {item.type === "dir" ? <Folder className="w-3 h-3 text-[hsl(var(--terminal-yellow))] shrink-0" /> : <span className="shrink-0">{getFileIcon(item.ext, "w-3 h-3")}</span>}
            {nameOrRename(item)}
          </span>
          <span className="text-muted-foreground">{item.size || "—"}</span>
          <span className="text-muted-foreground">{item.modified || "—"}</span>
          {renderItemActions(item)}
        </button>
      ))}
    </div>
  );

  // --- Resource views ---
  const renderResources = () => (
    <div className="flex flex-col h-full">
      {/* Resource toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-1 flex-1">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input value={resSearch} onChange={(e) => setResSearch(e.target.value)} placeholder="Filtrer..."
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1">
          {(["all", "img", "iframe", "link"] as const).map((t) => (
            <button key={t} onClick={() => setResFilter(t)}
              className={`px-2 py-0.5 rounded text-[9px] font-semibold transition-all ${resFilter === t ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
              {t === "all" ? "Tous" : t.toUpperCase()}
            </button>
          ))}
        </div>
        <button onClick={() => setShowAddResource(true)}
          className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-primary/20 text-primary hover:bg-primary/30 border border-primary/30 transition-all font-semibold">
          <Plus className="w-3 h-3" /> Resource
        </button>
      </div>

      {/* Resource list */}
      <div className="flex-1 overflow-y-auto">
        {filteredResources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
            <BookOpen className="w-8 h-8 opacity-30" />
            {resources.length === 0 ? "Aucune ressource. Cliquez + Resource pour commencer." : "Aucun résultat"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredResources.map((r) => (
              <div key={r.id}
                className="group flex items-center gap-3 px-4 py-2 hover:bg-secondary/30 transition-all cursor-pointer"
                onClick={() => setPreviewRes(r)}
                onContextMenu={(e) => { e.preventDefault(); setResContextMenu({ x: e.clientX, y: e.clientY, item: r }); }}
              >
                {resourceTypeIcon(r.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-foreground truncate flex items-center gap-1">
                    {r.favorite && <Star className="w-2.5 h-2.5 text-accent fill-accent shrink-0" />}
                    {r.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground truncate">{r.url}</div>
                </div>
                {r.tags.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1 shrink-0">
                    {r.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{t}</span>
                    ))}
                  </div>
                )}
                <span className="text-[9px] text-muted-foreground uppercase">{r.type}</span>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); handleToggleFav(r.id); }}
                    className={`p-1 rounded hover:bg-accent/20 ${r.favorite ? "text-accent" : "text-muted-foreground"}`} title="Favori">
                    <Star className={`w-3 h-3 ${r.favorite ? "fill-accent" : ""}`} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(r.url, r.id); }}
                    className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary" title="Copier URL">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); copyToClipboard(copyAsHtml(r), r.id + "-html"); }}
                    className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary" title="Copier HTML">
                    <Code2 className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); window.open(r.url, "_blank"); }}
                    className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-primary" title="Ouvrir externe">
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
                {(copied === r.id || copied === r.id + "-html") && (
                  <span className="text-[9px] text-primary font-semibold shrink-0">Copié!</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border text-[9px] text-muted-foreground bg-secondary/30">
        <span>{filteredResources.length} ressource{filteredResources.length !== 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Fast Paste: Ctrl+Shift+R</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden" onClick={() => { setSelected(new Set()); setContextMenu(null); setResContextMenu(null); }}>
      {/* Header with tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[hsl(var(--terminal-yellow))]" />
          <div className="flex items-center gap-1">
            <button onClick={() => setManagerTab("files")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${managerTab === "files" ? "bg-primary/20 text-[hsl(var(--terminal-yellow))] border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
              FICHIERS
            </button>
            <button onClick={() => setManagerTab("resources")}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${managerTab === "resources" ? "bg-primary/20 text-[hsl(var(--terminal-cyan))] border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`}>
              <BookOpen className="w-3 h-3" /> RESOURCES
            </button>
          </div>
        </div>
        {managerTab === "files" && (
          <div className="flex items-center gap-1">
            <button onClick={() => { setCreating("file"); setCreateName("nouveau.txt"); }} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all" title="Nouveau fichier">
              <Plus className="w-3 h-3" />
            </button>
            <button onClick={() => { setCreating("dir"); setCreateName("nouveau_dossier"); }} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all" title="Nouveau dossier">
              <FolderPlus className="w-3 h-3" />
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all" title="Uploader">
              <Upload className="w-3 h-3" />
            </button>
            <button onClick={() => setShowSearch(!showSearch)} className={`p-1.5 rounded transition-all ${showSearch ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`} title="Rechercher">
              <Search className="w-3 h-3" />
            </button>
            <div className="w-px h-4 bg-border mx-1" />
            {VIEW_MODES.map((vm) => (
              <button key={vm.id} onClick={() => setViewMode(vm.id)}
                className={`p-1.5 rounded text-[10px] transition-all ${viewMode === vm.id ? "bg-primary/20 text-primary border border-primary/30" : "text-muted-foreground hover:text-foreground border border-transparent"}`} title={vm.label}>
                {vm.icon}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* FILES TAB */}
      {managerTab === "files" && (
        <>
          {showSearch && (
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-secondary/30" onClick={(e) => e.stopPropagation()}>
              <Search className="w-3 h-3 text-muted-foreground" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Rechercher..."
                className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground" autoFocus />
              {searchQuery && <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>}
            </div>
          )}

          <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border text-[10px]" onClick={(e) => e.stopPropagation()}>
            {path.length > 0 && <button onClick={goBack} className="text-muted-foreground hover:text-foreground mr-1"><ArrowLeft className="w-3 h-3" /></button>}
            {breadcrumb.map((seg, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-2 h-2 text-muted-foreground" />}
                <button onClick={() => setPath(path.slice(0, i))} className={`hover:text-primary transition-colors ${i === breadcrumb.length - 1 ? "text-primary font-semibold" : "text-muted-foreground"}`}>{seg}</button>
              </span>
            ))}
            <span className="flex-1" />
            {clipboard && (
              <span className="text-muted-foreground flex items-center gap-1">
                {clipboard.mode === "copy" ? <Copy className="w-2.5 h-2.5" /> : <Scissors className="w-2.5 h-2.5" />}
                {clipboard.name}
                <button onClick={() => setClipboard(null)} className="hover:text-foreground"><X className="w-2.5 h-2.5" /></button>
              </span>
            )}
            {selected.size > 0 && <span className="text-primary font-semibold">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>}
          </div>

          {creating && (
            <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-primary/5" onClick={(e) => e.stopPropagation()}>
              {creating === "dir" ? <Folder className="w-3 h-3 text-[hsl(var(--terminal-yellow))]" /> : <FileText className="w-3 h-3 text-muted-foreground" />}
              <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="flex-1">
                <input ref={createInputRef} value={createName} onChange={(e) => setCreateName(e.target.value)}
                  onBlur={() => { if (createName.trim()) handleCreate(); else setCreating(null); }}
                  className="w-full bg-secondary border border-primary/30 rounded px-2 py-0.5 text-xs text-foreground outline-none" />
              </form>
              <button onClick={() => setCreating(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto" onContextMenu={(e) => handleContextMenu(e)} onClick={(e) => e.stopPropagation()}>
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
                <Folder className="w-8 h-8 opacity-30" />
                {searchQuery ? "Aucun résultat" : "Dossier vide"}
              </div>
            ) : viewMode === "icons" ? renderIcons() : viewMode === "grid" ? renderGrid() : viewMode === "details" ? renderDetails() : renderList()}
          </div>

          <div className="flex items-center justify-between px-4 py-1 border-t border-border text-[9px] text-muted-foreground bg-secondary/30" onClick={(e) => e.stopPropagation()}>
            <span>{items.length} élément{items.length !== 1 ? "s" : ""}</span>
            <span>{path.length === 0 ? "~" : `~/${path.join("/")}`}</span>
          </div>

          {selected.size > 0 && (
            <div className="flex items-center gap-2 px-4 py-1.5 border-t border-primary/30 bg-primary/5" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => { handleCopy([...selected][0]); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all"><Copy className="w-3 h-3" /> Copier</button>
              <button onClick={() => { handleCut([...selected][0]); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all"><Scissors className="w-3 h-3" /> Couper</button>
              {clipboard && <button onClick={handlePaste} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all"><ClipboardPaste className="w-3 h-3" /> Coller</button>}
              <button onClick={() => { const name = [...selected][0]; setRenaming(name); setRenameValue(name); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all" disabled={selected.size !== 1}><Pencil className="w-3 h-3" /> Renommer</button>
              <span className="flex-1" />
              <button onClick={() => handleDelete([...selected])} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all"><Trash2 className="w-3 h-3" /> Supprimer</button>
            </div>
          )}
        </>
      )}

      {/* RESOURCES TAB */}
      {managerTab === "resources" && renderResources()}

      {/* Context Menu - Files */}
      {contextMenu && (
        <div className="fixed z-50 min-w-[180px] border border-border bg-card rounded-lg shadow-lg py-1 text-xs" style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.item ? (
            <>
              <button onClick={() => { handleDoubleClick(contextMenu.item!); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Eye className="w-3 h-3" /> Ouvrir</button>
              <button onClick={() => { setRenaming(contextMenu.item!.name); setRenameValue(contextMenu.item!.name); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Pencil className="w-3 h-3" /> Renommer</button>
              <button onClick={() => handleCopy(contextMenu.item!.name)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Copy className="w-3 h-3" /> Copier</button>
              <button onClick={() => handleCut(contextMenu.item!.name)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Scissors className="w-3 h-3" /> Couper</button>
              {contextMenu.item.type === "file" && (
                <button onClick={() => { handleDownload(contextMenu.item!); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Download className="w-3 h-3" /> Télécharger</button>
              )}
              <div className="border-t border-border my-1" />
              <button onClick={() => { handleDelete([contextMenu.item!.name]); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/20 text-destructive text-left"><Trash2 className="w-3 h-3" /> Supprimer</button>
            </>
          ) : (
            <>
              <button onClick={() => { setCreating("file"); setCreateName("nouveau.txt"); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Plus className="w-3 h-3" /> Nouveau fichier</button>
              <button onClick={() => { setCreating("dir"); setCreateName("nouveau_dossier"); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><FolderPlus className="w-3 h-3" /> Nouveau dossier</button>
              {clipboard && <button onClick={handlePaste} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><ClipboardPaste className="w-3 h-3" /> Coller</button>}
              <button onClick={() => { fileInputRef.current?.click(); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Upload className="w-3 h-3" /> Uploader un fichier</button>
            </>
          )}
        </div>
      )}

      {/* Context Menu - Resources */}
      {resContextMenu && (
        <div className="fixed z-50 min-w-[180px] border border-border bg-card rounded-lg shadow-lg py-1 text-xs" style={{ left: resContextMenu.x, top: resContextMenu.y }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { copyToClipboard(resContextMenu.item.url, resContextMenu.item.id); setResContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Copy className="w-3 h-3" /> Copier URL</button>
          <button onClick={() => { copyToClipboard(copyAsHtml(resContextMenu.item), resContextMenu.item.id); setResContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Code2 className="w-3 h-3" /> Copier HTML</button>
          <button onClick={() => { window.open(resContextMenu.item.url, "_blank"); setResContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><ExternalLink className="w-3 h-3" /> Ouvrir externe</button>
          <button onClick={() => { handleToggleFav(resContextMenu.item.id); setResContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Star className="w-3 h-3" /> {resContextMenu.item.favorite ? "Retirer favori" : "Favori"}</button>
          <button onClick={() => { setEditingRes({ ...resContextMenu.item }); setResContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left"><Pencil className="w-3 h-3" /> Modifier</button>
          <div className="border-t border-border my-1" />
          <button onClick={() => handleDeleteResource(resContextMenu.item.id)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/20 text-destructive text-left"><Trash2 className="w-3 h-3" /> Supprimer</button>
        </div>
      )}

      {/* File preview/edit modal */}
      {previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={() => setPreviewFile(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                {getFileIcon(previewFile.ext, "w-4 h-4")}
                <span className="text-xs font-semibold text-foreground">{previewFile.name}</span>
                {previewFile.size && <span className="text-[10px] text-muted-foreground">({previewFile.size})</span>}
              </div>
              <div className="flex items-center gap-1">
                {!editing ? (
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50"><Pencil className="w-3 h-3" /></button>
                ) : (
                  <button onClick={handleSaveEdit} className="p-1.5 rounded text-primary hover:bg-primary/20"><Save className="w-3 h-3" /></button>
                )}
                <button onClick={() => handleDownload(previewFile)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50"><Download className="w-3 h-3" /></button>
                <button onClick={() => setPreviewFile(null)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50"><X className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {editing ? (
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[300px] bg-background border border-border rounded p-3 text-xs text-foreground font-mono resize-none outline-none focus:border-primary/50" />
              ) : (
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                  {previewFile.content || <span className="text-muted-foreground italic">Fichier binaire — aperçu non disponible</span>}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resource preview modal */}
      {previewRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={() => setPreviewRes(null)}>
          <div className="w-full max-w-3xl max-h-[80vh] bg-card border border-border rounded-lg flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
              <div className="flex items-center gap-2">
                {resourceTypeIcon(previewRes.type, "w-4 h-4")}
                <span className="text-xs font-semibold text-foreground">{previewRes.name}</span>
                <span className="text-[10px] text-muted-foreground uppercase bg-secondary px-1.5 py-0.5 rounded">{previewRes.type}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => copyToClipboard(previewRes.url, previewRes.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50" title="Copier URL"><Copy className="w-3 h-3" /></button>
                <button onClick={() => copyToClipboard(copyAsHtml(previewRes), previewRes.id)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50" title="Copier HTML"><Code2 className="w-3 h-3" /></button>
                <button onClick={() => window.open(previewRes.url, "_blank")} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50" title="Ouvrir externe"><ExternalLink className="w-3 h-3" /></button>
                <button onClick={() => setPreviewRes(null)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50"><X className="w-3 h-3" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {previewRes.type === "img" && (
                <img src={previewRes.url} alt={previewRes.name} className="max-w-full max-h-[60vh] mx-auto rounded border border-border" />
              )}
              {previewRes.type === "iframe" && (
                <iframe src={previewRes.url} title={previewRes.name} className="w-full h-[60vh] rounded border border-border" allowFullScreen />
              )}
              {previewRes.type === "link" && (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                  <Link2 className="w-12 h-12 text-accent" />
                  <a href={previewRes.url} target="_blank" rel="noopener" className="text-primary underline text-sm">{previewRes.url}</a>
                  <div className="flex items-center gap-2 mt-2">
                    {previewRes.tags.map((t) => <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Resource modal */}
      {showAddResource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={() => setShowAddResource(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-foreground flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Nouvelle Ressource</span>
              <button onClick={() => setShowAddResource(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Nom</label>
                <input value={newRes.name} onChange={(e) => setNewRes({ ...newRes, name: e.target.value })} placeholder="Ma ressource"
                  className="w-full mt-1 bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">URL</label>
                <input value={newRes.url} onChange={(e) => setNewRes({ ...newRes, url: e.target.value })} placeholder="https://..."
                  className="w-full mt-1 bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Type</label>
                <div className="flex items-center gap-2 mt-1">
                  {(["img", "iframe", "link"] as const).map((t) => (
                    <button key={t} onClick={() => setNewRes({ ...newRes, type: t })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${newRes.type === t ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground border border-border hover:text-foreground"}`}>
                      {resourceTypeIcon(t, "w-3 h-3")} {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Tags (séparés par des virgules)</label>
                <input value={newRes.tags} onChange={(e) => setNewRes({ ...newRes, tags: e.target.value })} placeholder="video, music, tool..."
                  className="w-full mt-1 bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50" />
              </div>
              <button onClick={handleAddResource} disabled={!newRes.name.trim() || !newRes.url.trim()}
                className="w-full py-2 rounded text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Resource modal */}
      {editingRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80" onClick={() => setEditingRes(null)}>
          <div className="w-full max-w-md bg-card border border-border rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-bold text-foreground flex items-center gap-2"><Pencil className="w-4 h-4 text-primary" /> Modifier Ressource</span>
              <button onClick={() => setEditingRes(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Nom</label>
                <input value={editingRes.name} onChange={(e) => setEditingRes({ ...editingRes, name: e.target.value })}
                  className="w-full mt-1 bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">URL</label>
                <input value={editingRes.url} onChange={(e) => setEditingRes({ ...editingRes, url: e.target.value })}
                  className="w-full mt-1 bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Type</label>
                <div className="flex items-center gap-2 mt-1">
                  {(["img", "iframe", "link"] as const).map((t) => (
                    <button key={t} onClick={() => setEditingRes({ ...editingRes, type: t })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all ${editingRes.type === t ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary text-muted-foreground border border-border hover:text-foreground"}`}>
                      {resourceTypeIcon(t, "w-3 h-3")} {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground uppercase font-semibold">Tags</label>
                <input value={editingRes.tags.join(", ")} onChange={(e) => setEditingRes({ ...editingRes, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  className="w-full mt-1 bg-secondary border border-border rounded px-3 py-2 text-xs text-foreground outline-none focus:border-primary/50" />
              </div>
              <button onClick={handleUpdateResource}
                className="w-full py-2 rounded text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all">
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
    </div>
  );
};

export default FileManager;
