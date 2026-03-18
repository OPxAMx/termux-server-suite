import { useState } from "react";
import { X, Copy, Check, Link, FolderPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ServerConfig {
  port: number;
  username: string;
  password: string;
  rootDir: string;
  allowAnonymous: boolean;
  maxConnections: number;
}

interface SMBShare {
  name: string;
  path: string;
  readOnly: boolean;
}

interface ConfigModalProps {
  serverType: "ssh" | "smb" | "ftp";
  isOpen: boolean;
  onClose: () => void;
}

const defaultConfigs: Record<string, ServerConfig> = {
  ssh: { port: 8022, username: "u0_a123", password: "", rootDir: "/data/data/com.termux/files/home", allowAnonymous: false, maxConnections: 10 },
  smb: { port: 8445, username: "termux", password: "termux", rootDir: "/storage/emulated/0", allowAnonymous: false, maxConnections: 5 },
  ftp: { port: 8021, username: "termux", password: "termux", rootDir: "/storage/emulated/0", allowAnonymous: true, maxConnections: 10 },
};

const ConfigModal = ({ serverType, isOpen, onClose }: ConfigModalProps) => {
  const [config, setConfig] = useState<ServerConfig>(defaultConfigs[serverType]);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<SMBShare[]>([
    { name: "Public", path: "/storage/emulated/0/Download", readOnly: false },
    { name: "Photos", path: "/storage/emulated/0/DCIM", readOnly: true },
  ]);
  const [newShareName, setNewShareName] = useState("");
  const [newSharePath, setNewSharePath] = useState("");

  if (!isOpen) return null;

  const ip = "192.168.1.42";
  const label = serverType.toUpperCase();

  const getShareUrl = () => {
    switch (serverType) {
      case "ssh": return `ssh://${config.username}@${ip}:${config.port}`;
      case "smb": return `smb://${config.username}@${ip}:${config.port}`;
      case "ftp": return `ftp://${config.username}@${ip}:${config.port}`;
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(getShareUrl());
    setCopied(true);
    toast.success("URL copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const addShare = () => {
    if (newShareName && newSharePath) {
      setShares([...shares, { name: newShareName, path: newSharePath, readOnly: false }]);
      setNewShareName("");
      setNewSharePath("");
      toast.success(`Share "${newShareName}" added`);
    }
  };

  const removeShare = (index: number) => {
    setShares(shares.filter((_, i) => i !== index));
    toast.info("Share removed");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg mx-4 rounded-lg border border-border bg-card glow-box-green overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-secondary/30">
          <h2 className="font-display font-bold text-foreground">{label} Server Config</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-5">
          {/* Share URL */}
          <div className="bg-secondary/50 rounded-md p-3">
            <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
              <Link className="w-3 h-3" /> Share URL
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm text-primary glow-green bg-background/50 px-3 py-2 rounded-md overflow-x-auto">
                {getShareUrl()}
              </code>
              <button
                onClick={copyUrl}
                className="p-2 rounded-md border border-primary/30 hover:bg-primary/10 text-primary transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Basic Settings */}
          <div className="space-y-3">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-display">Connection</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Port</span>
                <input
                  type="number"
                  value={config.port}
                  onChange={(e) => setConfig({ ...config, port: parseInt(e.target.value) || 0 })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Max Connections</span>
                <input
                  type="number"
                  value={config.maxConnections}
                  onChange={(e) => setConfig({ ...config, maxConnections: parseInt(e.target.value) || 1 })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
          </div>

          {/* Auth */}
          <div className="space-y-3">
            <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-display">Authentication</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Username</span>
                <input
                  value={config.username}
                  onChange={(e) => setConfig({ ...config, username: e.target.value })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-muted-foreground">Password</span>
                <input
                  type="password"
                  value={config.password}
                  placeholder="••••••"
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
              </label>
            </div>
            {(serverType === "ftp" || serverType === "smb") && (
              <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.allowAnonymous}
                  onChange={(e) => setConfig({ ...config, allowAnonymous: e.target.checked })}
                  className="accent-primary"
                />
                Allow anonymous access
              </label>
            )}
          </div>

          {/* Root Directory */}
          <label className="block space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-display">Root Directory</span>
            <input
              value={config.rootDir}
              onChange={(e) => setConfig({ ...config, rootDir: e.target.value })}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
            />
          </label>

          {/* SMB Shares */}
          {serverType === "smb" && (
            <div className="space-y-3">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-display">SMB Shares</h3>
              {shares.map((share, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-md p-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{share.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{share.path}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${share.readOnly ? "bg-terminal-yellow/10 text-terminal-yellow" : "bg-primary/10 text-primary"}`}>
                    {share.readOnly ? "R/O" : "R/W"}
                  </span>
                  <button onClick={() => {
                    const url = `smb://${config.username}@${ip}:${config.port}/${share.name}`;
                    navigator.clipboard.writeText(url);
                    toast.success(`Copied: ${url}`);
                  }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeShare(i)} className="p-1.5 rounded hover:bg-terminal-red/10 text-muted-foreground hover:text-terminal-red">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newShareName}
                  onChange={(e) => setNewShareName(e.target.value)}
                  placeholder="Share name"
                  className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={newSharePath}
                  onChange={(e) => setNewSharePath(e.target.value)}
                  placeholder="/path/to/share"
                  className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={addShare} className="p-2 rounded-md border border-primary/30 hover:bg-primary/10 text-primary">
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* FTP Shares */}
          {serverType === "ftp" && (
            <div className="space-y-3">
              <h3 className="text-xs text-muted-foreground uppercase tracking-wider font-display">FTP Virtual Dirs</h3>
              {shares.map((share, i) => (
                <div key={i} className="flex items-center gap-2 bg-secondary/50 rounded-md p-3">
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">/{share.name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{share.path}</div>
                  </div>
                  <button onClick={() => {
                    const url = `ftp://${config.username}@${ip}:${config.port}/${share.name}`;
                    navigator.clipboard.writeText(url);
                    toast.success(`Copied: ${url}`);
                  }} className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                    <Copy className="w-3 h-3" />
                  </button>
                  <button onClick={() => removeShare(i)} className="p-1.5 rounded hover:bg-terminal-red/10 text-muted-foreground hover:text-terminal-red">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newShareName}
                  onChange={(e) => setNewShareName(e.target.value)}
                  placeholder="Dir name"
                  className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary"
                />
                <input
                  value={newSharePath}
                  onChange={(e) => setNewSharePath(e.target.value)}
                  placeholder="/path/to/dir"
                  className="flex-1 bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground font-mono outline-none focus:ring-1 focus:ring-primary"
                />
                <button onClick={addShare} className="p-2 rounded-md border border-primary/30 hover:bg-primary/10 text-primary">
                  <FolderPlus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border bg-secondary/30">
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-md border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
            Cancel
          </button>
          <button
            onClick={() => { toast.success(`${label} config saved`); onClose(); }}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-semibold transition-colors"
          >
            Save Config
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
