export interface FsNode {
  name: string;
  type: "file" | "dir";
  size?: string;
  modified?: string;
  ext?: string;
  content?: string;
  children?: FsNode[];
}

const LS_KEY = "termux-fs";

const DEFAULT_FS: FsNode = {
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
            { name: "notes.txt", type: "file", size: "2 KB", modified: "2026-03-17", ext: "txt", content: "Notes personnelles\n---\nTODO: configurer SSH\nTODO: backup hebdomadaire" },
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
    { name: ".bashrc", type: "file", size: "1.2 KB", modified: "2026-03-01", ext: "bashrc", content: "# .bashrc\nexport PS1='\\u@termux:\\w$ '\nalias ll='ls -la'\nalias cls='clear'" },
    { name: ".profile", type: "file", size: "600 B", modified: "2026-02-15", ext: "profile" },
  ],
};

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function getExtension(name: string): string {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function loadFs(): FsNode {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return structuredClone(DEFAULT_FS);
}

export function saveFs(root: FsNode) {
  localStorage.setItem(LS_KEY, JSON.stringify(root));
}

export function getNodeAtPath(root: FsNode, path: string[]): FsNode | null {
  let node = root;
  for (const seg of path) {
    const child = node.children?.find((c) => c.name === seg);
    if (!child) return null;
    if (child.type === "dir") {
      node = child;
    } else {
      return child;
    }
  }
  return node;
}

export function getParentAndTarget(root: FsNode, path: string[]): { parent: FsNode; targetName: string } | null {
  if (path.length === 0) return null;
  const parentPath = path.slice(0, -1);
  const parent = getNodeAtPath(root, parentPath);
  if (!parent || parent.type !== "dir") return null;
  return { parent, targetName: path[path.length - 1] };
}

export function createNode(root: FsNode, dirPath: string[], name: string, type: "file" | "dir", content?: string): FsNode {
  const clone = structuredClone(root);
  const dir = getNodeAtPath(clone, dirPath);
  if (!dir || dir.type !== "dir") return clone;
  if (dir.children?.some((c) => c.name === name)) return clone;
  
  const newNode: FsNode = {
    name,
    type,
    modified: getToday(),
    ext: type === "file" ? getExtension(name) : undefined,
    size: type === "file" ? formatSize(content?.length || 0) : undefined,
    content: type === "file" ? (content || "") : undefined,
    children: type === "dir" ? [] : undefined,
  };
  
  if (!dir.children) dir.children = [];
  dir.children.push(newNode);
  saveFs(clone);
  return clone;
}

export function deleteNode(root: FsNode, dirPath: string[], name: string): FsNode {
  const clone = structuredClone(root);
  const dir = getNodeAtPath(clone, dirPath);
  if (!dir || dir.type !== "dir" || !dir.children) return clone;
  dir.children = dir.children.filter((c) => c.name !== name);
  saveFs(clone);
  return clone;
}

export function renameNode(root: FsNode, dirPath: string[], oldName: string, newName: string): FsNode {
  const clone = structuredClone(root);
  const dir = getNodeAtPath(clone, dirPath);
  if (!dir || dir.type !== "dir" || !dir.children) return clone;
  if (dir.children.some((c) => c.name === newName)) return clone;
  
  const node = dir.children.find((c) => c.name === oldName);
  if (!node) return clone;
  node.name = newName;
  node.modified = getToday();
  if (node.type === "file") node.ext = getExtension(newName);
  saveFs(clone);
  return clone;
}

export function copyNode(root: FsNode, srcDirPath: string[], name: string, destDirPath: string[]): FsNode {
  const clone = structuredClone(root);
  const srcDir = getNodeAtPath(clone, srcDirPath);
  const destDir = getNodeAtPath(clone, destDirPath);
  if (!srcDir || !destDir || destDir.type !== "dir") return clone;
  
  const srcNode = srcDir.children?.find((c) => c.name === name);
  if (!srcNode) return clone;
  
  const copy = structuredClone(srcNode);
  if (destDir.children?.some((c) => c.name === copy.name)) {
    copy.name = `${copy.name.replace(/(\.[^.]+)$/, "")}_copy${copy.ext ? "." + copy.ext : ""}`;
  }
  copy.modified = getToday();
  if (!destDir.children) destDir.children = [];
  destDir.children.push(copy);
  saveFs(clone);
  return clone;
}

export function moveNode(root: FsNode, srcDirPath: string[], name: string, destDirPath: string[]): FsNode {
  const clone = structuredClone(root);
  const srcDir = getNodeAtPath(clone, srcDirPath);
  const destDir = getNodeAtPath(clone, destDirPath);
  if (!srcDir || !destDir || destDir.type !== "dir" || !srcDir.children) return clone;

  const idx = srcDir.children.findIndex((c) => c.name === name);
  if (idx === -1) return clone;
  
  const [node] = srcDir.children.splice(idx, 1);
  node.modified = getToday();
  if (!destDir.children) destDir.children = [];
  destDir.children.push(node);
  saveFs(clone);
  return clone;
}

export function updateFileContent(root: FsNode, filePath: string[], content: string): FsNode {
  const clone = structuredClone(root);
  const parentPath = filePath.slice(0, -1);
  const fileName = filePath[filePath.length - 1];
  const dir = getNodeAtPath(clone, parentPath);
  if (!dir || dir.type !== "dir") return clone;
  
  const file = dir.children?.find((c) => c.name === fileName);
  if (!file || file.type !== "file") return clone;
  file.content = content;
  file.size = formatSize(content.length);
  file.modified = getToday();
  saveFs(clone);
  return clone;
}

export function uploadFile(root: FsNode, dirPath: string[], name: string, content: string, sizeBytes: number): FsNode {
  const clone = structuredClone(root);
  const dir = getNodeAtPath(clone, dirPath);
  if (!dir || dir.type !== "dir") return clone;
  
  let finalName = name;
  let counter = 1;
  while (dir.children?.some((c) => c.name === finalName)) {
    const ext = getExtension(name);
    const base = ext ? name.slice(0, -(ext.length + 1)) : name;
    finalName = `${base}_${counter}${ext ? "." + ext : ""}`;
    counter++;
  }
  
  const newNode: FsNode = {
    name: finalName,
    type: "file",
    modified: getToday(),
    ext: getExtension(finalName),
    size: formatSize(sizeBytes),
    content,
  };
  
  if (!dir.children) dir.children = [];
  dir.children.push(newNode);
  saveFs(clone);
  return clone;
}

export type SortField = "name" | "size" | "modified" | "type";
export type SortDir = "asc" | "desc";

export function sortNodes(nodes: FsNode[], field: SortField, dir: SortDir): FsNode[] {
  const sorted = [...nodes].sort((a, b) => {
    // Dirs always first
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    
    let cmp = 0;
    switch (field) {
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "size":
        cmp = (a.size || "").localeCompare(b.size || "");
        break;
      case "modified":
        cmp = (a.modified || "").localeCompare(b.modified || "");
        break;
      case "type":
        cmp = (a.ext || "").localeCompare(b.ext || "");
        break;
    }
    return dir === "asc" ? cmp : -cmp;
  });
  return sorted;
}
