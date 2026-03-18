import { useState } from "react";
import {
  Folder,
  FileText,
  ChevronRight,
  ArrowLeft,
  Grid,
  List,
  LayoutGrid,
  FileIcon,
  Image,
  Music,
  Video,
  Code,
  Archive,
} from "lucide-react";

type ViewMode = "icons" | "list" | "details" | "grid";

interface FsNode {
  name: string;
  type: "file" | "dir";
  size?: string;
  modified?: string;
  ext?: string;
  children?: FsNode[];
}

const MOCK_FS: FsNode = {
  name: "/",
  type: "dir",
  children: [
    {
      name: "storage",
      type: "dir",
      children: [
        {
          name: "shared",
          type: "dir",
          children: [
            { name: "photo_001.jpg", type: "file", size: "2.4 MB", modified: "2026-03-15", ext: "jpg" },
            { name: "photo_002.png", type: "file", size: "1.8 MB", modified: "2026-03-16", ext: "png" },
            { name: "video_clip.mp4", type: "file", size: "48 MB", modified: "2026-03-10", ext: "mp4" },
            { name: "music.mp3", type: "file", size: "5.2 MB", modified: "2026-03-12", ext: "mp3" },
          ],
        },
        {
          name: "downloads",
          type: "dir",
          children: [
            { name: "commands.csv", type: "file", size: "12 KB", modified: "2026-03-18", ext: "csv" },
            { name: "backup.tar.gz", type: "file", size: "124 MB", modified: "2026-03-01", ext: "gz" },
            { name: "notes.txt", type: "file", size: "2 KB", modified: "2026-03-17", ext: "txt" },
          ],
        },
      ],
    },
    {
      name: ".ssh",
      type: "dir",
      children: [
        { name: "id_rsa", type: "file", size: "1.6 KB", modified: "2026-01-10", ext: "" },
        { name: "id_rsa.pub", type: "file", size: "400 B", modified: "2026-01-10", ext: "pub" },
        { name: "known_hosts", type: "file", size: "3 KB", modified: "2026-03-18", ext: "" },
      ],
    },
    {
      name: ".config",
      type: "dir",
      children: [
        { name: "termux.properties", type: "file", size: "800 B", modified: "2026-02-20", ext: "properties" },
      ],
    },
    { name: ".bashrc", type: "file", size: "1.2 KB", modified: "2026-03-01", ext: "bashrc" },
    { name: ".profile", type: "file", size: "600 B", modified: "2026-02-15", ext: "profile" },
  ],
};

function getFileIcon(ext?: string) {
  switch (ext) {
    case "jpg":
    case "png":
    case "gif":
    case "webp":
      return <Image className="w-4 h-4 text-terminal-cyan" />;
    case "mp3":
    case "wav":
    case "flac":
      return <Music className="w-4 h-4 text-primary" />;
    case "mp4":
    case "mkv":
    case "avi":
      return <Video className="w-4 h-4 text-terminal-red" />;
    case "js":
    case "ts":
    case "py":
    case "sh":
    case "csv":
    case "json":
      return <Code className="w-4 h-4 text-terminal-yellow" />;
    case "gz":
    case "zip":
    case "tar":
      return <Archive className="w-4 h-4 text-accent" />;
    default:
      return <FileText className="w-4 h-4 text-muted-foreground" />;
  }
}

const VIEW_MODES: { id: ViewMode; icon: React.ReactNode; label: string }[] = [
  { id: "icons", icon: <LayoutGrid className="w-3 h-3" />, label: "Icons" },
  { id: "grid", icon: <Grid className="w-3 h-3" />, label: "Grid" },
  { id: "list", icon: <List className="w-3 h-3" />, label: "List" },
  { id: "details", icon: <FileIcon className="w-3 h-3" />, label: "Details" },
];

const FileManager = () => {
  const [path, setPath] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const getCurrentNode = (): FsNode => {
    let node = MOCK_FS;
    for (const segment of path) {
      const child = node.children?.find((c) => c.name === segment);
      if (child && child.type === "dir") node = child;
      else break;
    }
    return node;
  };

  const currentNode = getCurrentNode();
  const items = currentNode.children || [];

  const navigate = (name: string) => setPath([...path, name]);
  const goBack = () => setPath(path.slice(0, -1));

  const breadcrumb = ["~", ...path];

  const renderIcons = () => (
    <div className="grid grid-cols-4 gap-3 p-3">
      {items.map((item) => (
        <button
          key={item.name}
          onClick={() => item.type === "dir" && navigate(item.name)}
          className="flex flex-col items-center gap-1.5 p-2 rounded-md hover:bg-secondary/50 transition-colors"
        >
          {item.type === "dir" ? (
            <Folder className="w-8 h-8 text-terminal-yellow" />
          ) : (
            <div className="w-8 h-8 flex items-center justify-center">{getFileIcon(item.ext)}</div>
          )}
          <span className="text-[9px] text-foreground truncate w-full text-center">{item.name}</span>
        </button>
      ))}
    </div>
  );

  const renderGrid = () => (
    <div className="grid grid-cols-3 gap-2 p-3">
      {items.map((item) => (
        <button
          key={item.name}
          onClick={() => item.type === "dir" && navigate(item.name)}
          className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-secondary/30 transition-colors text-left"
        >
          {item.type === "dir" ? (
            <Folder className="w-4 h-4 text-terminal-yellow shrink-0" />
          ) : (
            getFileIcon(item.ext)
          )}
          <span className="text-[10px] text-foreground truncate">{item.name}</span>
        </button>
      ))}
    </div>
  );

  const renderList = () => (
    <div className="divide-y divide-border">
      {items.map((item) => (
        <button
          key={item.name}
          onClick={() => item.type === "dir" && navigate(item.name)}
          className="w-full flex items-center gap-3 px-4 py-2 hover:bg-secondary/30 transition-colors text-left"
        >
          {item.type === "dir" ? (
            <Folder className="w-4 h-4 text-terminal-yellow shrink-0" />
          ) : (
            getFileIcon(item.ext)
          )}
          <span className="text-xs text-foreground flex-1 truncate">{item.name}</span>
          {item.type === "dir" && <ChevronRight className="w-3 h-3 text-muted-foreground" />}
          {item.size && <span className="text-[10px] text-muted-foreground">{item.size}</span>}
        </button>
      ))}
    </div>
  );

  const renderDetails = () => (
    <div className="text-[10px]">
      <div className="grid grid-cols-[1fr_80px_100px] gap-2 px-4 py-1.5 border-b border-border text-muted-foreground font-display font-semibold">
        <span>Nom</span>
        <span>Taille</span>
        <span>Modifié</span>
      </div>
      {items.map((item) => (
        <button
          key={item.name}
          onClick={() => item.type === "dir" && navigate(item.name)}
          className="w-full grid grid-cols-[1fr_80px_100px] gap-2 px-4 py-1.5 hover:bg-secondary/30 transition-colors text-left items-center"
        >
          <span className="flex items-center gap-2 truncate">
            {item.type === "dir" ? (
              <Folder className="w-3 h-3 text-terminal-yellow shrink-0" />
            ) : (
              <span className="shrink-0">{getFileIcon(item.ext)}</span>
            )}
            <span className="text-foreground truncate">{item.name}</span>
          </span>
          <span className="text-muted-foreground">{item.size || "—"}</span>
          <span className="text-muted-foreground">{item.modified || "—"}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-terminal-yellow" />
          <span className="text-xs font-display font-bold text-terminal-yellow">FILE MANAGER</span>
        </div>
        <div className="flex items-center gap-1">
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

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border text-[10px]">
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
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            Dossier vide
          </div>
        ) : viewMode === "icons" ? (
          renderIcons()
        ) : viewMode === "grid" ? (
          renderGrid()
        ) : viewMode === "details" ? (
          renderDetails()
        ) : (
          renderList()
        )}
      </div>
    </div>
  );
};

export default FileManager;
