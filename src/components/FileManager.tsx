import { useState, useRef, useCallback, useEffect } from "react";
import {
  Folder, FileText, ChevronRight, ArrowLeft, Grid, List, LayoutGrid,
  FileIcon, Image, Music, Video, Code, Archive, Plus, FolderPlus,
  Trash2, Pencil, Copy, Scissors, ClipboardPaste, Upload, Download,
  ArrowUpDown, X, Save, Eye, Search, MoreVertical, ChevronDown,
} from "lucide-react";
import {
  FsNode, loadFs, saveFs, createNode, deleteNode, renameNode,
  copyNode, moveNode, updateFileContent, uploadFile, getNodeAtPath,
  sortNodes, SortField, SortDir,
} from "@/lib/fileSystemStore";

type ViewMode = "icons" | "list" | "details" | "grid";

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const createInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { renameInputRef.current?.focus(); }, [renaming]);
  useEffect(() => { createInputRef.current?.focus(); }, [creating]);

  const currentNode = getNodeAtPath(fs, path);
  const rawItems = currentNode?.children || [];
  const sortedItems = sortNodes(rawItems, sortField, sortDir);
  const items = searchQuery
    ? sortedItems.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedItems;

  const navigate = (name: string) => {
    setPath([...path, name]);
    setSelected(new Set());
    setContextMenu(null);
  };
  const goBack = () => {
    setPath(path.slice(0, -1));
    setSelected(new Set());
  };

  const handleSelect = (name: string, e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      setSelected((prev) => {
        const next = new Set(prev);
        next.has(name) ? next.delete(name) : next.add(name);
        return next;
      });
    } else {
      setSelected(new Set([name]));
    }
  };

  const handleDoubleClick = (item: FsNode) => {
    if (item.type === "dir") {
      navigate(item.name);
    } else {
      setPreviewFile(item);
      setEditContent(item.content || "");
      setEditing(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, item?: FsNode) => {
    e.preventDefault();
    if (item) setSelected(new Set([item.name]));
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  };

  const handleCreate = () => {
    if (!creating || !createName.trim()) return;
    setFs(createNode(fs, path, createName.trim(), creating));
    setCreating(null);
    setCreateName("");
  };

  const handleRename = () => {
    if (!renaming || !renameValue.trim()) return;
    setFs(renameNode(fs, path, renaming, renameValue.trim()));
    setRenaming(null);
    setRenameValue("");
  };

  const handleDelete = (names: string[]) => {
    let updated = fs;
    for (const name of names) {
      updated = deleteNode(updated, path, name);
    }
    setFs(updated);
    setSelected(new Set());
  };

  const handleCopy = (name: string) => {
    setClipboard({ mode: "copy", sourcePath: [...path], name });
    setContextMenu(null);
  };

  const handleCut = (name: string) => {
    setClipboard({ mode: "cut", sourcePath: [...path], name });
    setContextMenu(null);
  };

  const handlePaste = () => {
    if (!clipboard) return;
    if (clipboard.mode === "copy") {
      setFs(copyNode(fs, clipboard.sourcePath, clipboard.name, path));
    } else {
      setFs(moveNode(fs, clipboard.sourcePath, clipboard.name, path));
      setClipboard(null);
    }
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
    const a = document.createElement("a");
    a.href = url;
    a.download = item.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveEdit = () => {
    if (!previewFile) return;
    const filePath = [...path, previewFile.name];
    setFs(updateFileContent(fs, filePath, editContent));
    setPreviewFile({ ...previewFile, content: editContent });
    setEditing(false);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const breadcrumb = ["~", ...path];

  // Close context menu on click outside
  useEffect(() => {
    const handler = () => setContextMenu(null);
    if (contextMenu) window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [contextMenu]);

  const isSelected = (name: string) => selected.has(name);
  const selClass = (name: string) => isSelected(name) ? "bg-primary/15 border-primary/30" : "";
  const cutClass = (name: string) => clipboard?.mode === "cut" && clipboard.name === name && clipboard.sourcePath.join("/") === path.join("/") ? "opacity-40" : "";

  const renderItemActions = (item: FsNode) => (
    <button
      onClick={(e) => { e.stopPropagation(); handleContextMenu(e, item); }}
      className="p-1 rounded hover:bg-secondary/50 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all"
    >
      <MoreVertical className="w-3 h-3" />
    </button>
  );

  const nameOrRename = (item: FsNode) =>
    renaming === item.name ? (
      <form onSubmit={(e) => { e.preventDefault(); handleRename(); }} className="flex-1 min-w-0">
        <input
          ref={renameInputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRename}
          className="w-full bg-secondary border border-primary/30 rounded px-1 py-0.5 text-xs text-foreground outline-none"
        />
      </form>
    ) : (
      <span className="text-foreground truncate">{item.name}</span>
    );

  const renderIcons = () => (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 p-3">
      {items.map((item) => (
        <button
          key={item.name}
          onClick={(e) => handleSelect(item.name, e)}
          onDoubleClick={() => handleDoubleClick(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group flex flex-col items-center gap-1.5 p-2 rounded-md border border-transparent hover:bg-secondary/50 transition-all ${selClass(item.name)} ${cutClass(item.name)}`}
        >
          {item.type === "dir" ? (
            <Folder className="w-8 h-8 text-[hsl(var(--terminal-yellow))]" />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">{getFileIcon(item.ext, "w-6 h-6")}</div>
          )}
          <span className="text-[9px] text-foreground truncate w-full text-center">{item.name}</span>
        </button>
      ))}
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
      {items.map((item) => (
        <button
          key={item.name}
          onClick={(e) => handleSelect(item.name, e)}
          onDoubleClick={() => handleDoubleClick(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group flex items-center gap-2 p-2 rounded-md border border-border hover:bg-secondary/30 transition-all text-left ${selClass(item.name)} ${cutClass(item.name)}`}
        >
          {item.type === "dir" ? (
            <Folder className="w-4 h-4 text-[hsl(var(--terminal-yellow))] shrink-0" />
          ) : getFileIcon(item.ext)}
          <span className="text-[10px] text-foreground truncate flex-1">{item.name}</span>
          {renderItemActions(item)}
        </button>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <button
          key={item.name}
          onClick={(e) => handleSelect(item.name, e)}
          onDoubleClick={() => handleDoubleClick(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary/30 transition-all text-left ${selClass(item.name)} ${cutClass(item.name)}`}
        >
          {item.type === "dir" ? (
            <Folder className="w-4 h-4 text-[hsl(var(--terminal-yellow))] shrink-0" />
          ) : getFileIcon(item.ext)}
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
        <button
          key={item.name}
          onClick={(e) => handleSelect(item.name, e)}
          onDoubleClick={() => handleDoubleClick(item)}
          onContextMenu={(e) => handleContextMenu(e, item)}
          className={`group w-full grid grid-cols-[1fr_80px_100px_24px] gap-2 px-4 py-1.5 hover:bg-secondary/30 transition-all text-left items-center ${selClass(item.name)} ${cutClass(item.name)}`}
        >
          <span className="flex items-center gap-2 truncate min-w-0">
            {item.type === "dir" ? (
              <Folder className="w-3 h-3 text-[hsl(var(--terminal-yellow))] shrink-0" />
            ) : (
              <span className="shrink-0">{getFileIcon(item.ext, "w-3 h-3")}</span>
            )}
            {nameOrRename(item)}
          </span>
          <span className="text-muted-foreground">{item.size || "—"}</span>
          <span className="text-muted-foreground">{item.modified || "—"}</span>
          {renderItemActions(item)}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden" onClick={() => { setSelected(new Set()); setContextMenu(null); }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-[hsl(var(--terminal-yellow))]" />
          <span className="text-xs font-bold text-[hsl(var(--terminal-yellow))]">FILE MANAGER</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Actions */}
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
            <button
              key={vm.id}
              onClick={() => setViewMode(vm.id)}
              className={`p-1.5 rounded text-[10px] transition-all ${
                viewMode === vm.id
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "text-muted-foreground hover:text-foreground border border-transparent"
              }`}
              title={vm.label}
            >
              {vm.icon}
            </button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-secondary/30" onClick={(e) => e.stopPropagation()}>
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground"
            autoFocus
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Breadcrumb + clipboard status */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border text-[10px]" onClick={(e) => e.stopPropagation()}>
        {path.length > 0 && (
          <button onClick={goBack} className="text-muted-foreground hover:text-foreground mr-1">
            <ArrowLeft className="w-3 h-3" />
          </button>
        )}
        {breadcrumb.map((seg, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-2 h-2 text-muted-foreground" />}
            <button
              onClick={() => setPath(path.slice(0, i))}
              className={`hover:text-primary transition-colors ${
                i === breadcrumb.length - 1 ? "text-primary font-semibold" : "text-muted-foreground"
              }`}
            >
              {seg}
            </button>
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
        {selected.size > 0 && (
          <span className="text-primary font-semibold">{selected.size} sélectionné{selected.size > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Create inline */}
      {creating && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-b border-border bg-primary/5" onClick={(e) => e.stopPropagation()}>
          {creating === "dir" ? <Folder className="w-3 h-3 text-[hsl(var(--terminal-yellow))]" /> : <FileText className="w-3 h-3 text-muted-foreground" />}
          <form onSubmit={(e) => { e.preventDefault(); handleCreate(); }} className="flex-1">
            <input
              ref={createInputRef}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onBlur={() => { if (createName.trim()) handleCreate(); else setCreating(null); }}
              className="w-full bg-secondary border border-primary/30 rounded px-2 py-0.5 text-xs text-foreground outline-none"
            />
          </form>
          <button onClick={() => setCreating(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto" onContextMenu={(e) => handleContextMenu(e)} onClick={(e) => e.stopPropagation()}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs gap-2">
            <Folder className="w-8 h-8 opacity-30" />
            {searchQuery ? "Aucun résultat" : "Dossier vide"}
          </div>
        ) : viewMode === "icons" ? renderIcons()
          : viewMode === "grid" ? renderGrid()
          : viewMode === "details" ? renderDetails()
          : renderList()}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-border text-[9px] text-muted-foreground bg-secondary/30" onClick={(e) => e.stopPropagation()}>
        <span>{items.length} élément{items.length !== 1 ? "s" : ""}</span>
        <span>{path.length === 0 ? "~" : `~/${path.join("/")}`}</span>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] border border-border bg-card rounded-lg shadow-lg py-1 text-xs"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.item ? (
            <>
              <button onClick={() => { handleDoubleClick(contextMenu.item!); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                <Eye className="w-3 h-3" /> Ouvrir
              </button>
              <button onClick={() => { setRenaming(contextMenu.item!.name); setRenameValue(contextMenu.item!.name); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                <Pencil className="w-3 h-3" /> Renommer
              </button>
              <button onClick={() => handleCopy(contextMenu.item!.name)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                <Copy className="w-3 h-3" /> Copier
              </button>
              <button onClick={() => handleCut(contextMenu.item!.name)} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                <Scissors className="w-3 h-3" /> Couper
              </button>
              {contextMenu.item.type === "file" && (
                <button onClick={() => { handleDownload(contextMenu.item!); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                  <Download className="w-3 h-3" /> Télécharger
                </button>
              )}
              <div className="border-t border-border my-1" />
              <button onClick={() => { handleDelete([contextMenu.item!.name]); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-destructive/20 text-destructive text-left">
                <Trash2 className="w-3 h-3" /> Supprimer
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { setCreating("file"); setCreateName("nouveau.txt"); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                <Plus className="w-3 h-3" /> Nouveau fichier
              </button>
              <button onClick={() => { setCreating("dir"); setCreateName("nouveau_dossier"); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                <FolderPlus className="w-3 h-3" /> Nouveau dossier
              </button>
              {clipboard && (
                <button onClick={handlePaste} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                  <ClipboardPaste className="w-3 h-3" /> Coller
                </button>
              )}
              <button onClick={() => { fileInputRef.current?.click(); setContextMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-secondary/50 text-left">
                <Upload className="w-3 h-3" /> Uploader un fichier
              </button>
            </>
          )}
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
                  <button onClick={() => setEditing(true)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                    <Pencil className="w-3 h-3" />
                  </button>
                ) : (
                  <button onClick={handleSaveEdit} className="p-1.5 rounded text-primary hover:bg-primary/20">
                    <Save className="w-3 h-3" />
                  </button>
                )}
                <button onClick={() => handleDownload(previewFile)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <Download className="w-3 h-3" />
                </button>
                <button onClick={() => setPreviewFile(null)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary/50">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {editing ? (
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full min-h-[300px] bg-background border border-border rounded p-3 text-xs text-foreground font-mono resize-none outline-none focus:border-primary/50"
                />
              ) : (
                <pre className="text-xs text-foreground whitespace-pre-wrap font-mono">
                  {previewFile.content || <span className="text-muted-foreground italic">Fichier binaire — aperçu non disponible</span>}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar for selected items */}
      {selected.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 border-t border-primary/30 bg-primary/5" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { const name = [...selected][0]; handleCopy(name); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all">
            <Copy className="w-3 h-3" /> Copier
          </button>
          <button onClick={() => { const name = [...selected][0]; handleCut(name); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all">
            <Scissors className="w-3 h-3" /> Couper
          </button>
          {clipboard && (
            <button onClick={handlePaste} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all">
              <ClipboardPaste className="w-3 h-3" /> Coller
            </button>
          )}
          <button onClick={() => { const name = [...selected][0]; setRenaming(name); setRenameValue(name); }} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-secondary/50 hover:bg-secondary text-foreground transition-all" disabled={selected.size !== 1}>
            <Pencil className="w-3 h-3" /> Renommer
          </button>
          <span className="flex-1" />
          <button onClick={() => handleDelete([...selected])} className="flex items-center gap-1 px-2 py-1 rounded text-[10px] bg-destructive/20 hover:bg-destructive/30 text-destructive transition-all">
            <Trash2 className="w-3 h-3" /> Supprimer
          </button>
        </div>
      )}

      <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
    </div>
  );
};

export default FileManager;
