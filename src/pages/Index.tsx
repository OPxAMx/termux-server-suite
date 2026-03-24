import { useState, useEffect } from "react";
import Terminal from "@/components/Terminal";
import AlienCube from "@/components/AlienCube";
import CommandManager from "@/components/CommandManager";
import MediaPlayer from "@/components/MediaPlayer";
import FileManager from "@/components/FileManager";
import CyberBrowser from "@/components/CyberBrowser";
import SettingsPanel from "@/components/SettingsPanel";
import ConfigModal from "@/components/ConfigModal";
import { applyTheme, getStoredTheme, getStoredBrightness } from "@/lib/themeStore";
import {
  Wifi, Cpu, HardDrive, MemoryStick, Box,
  Terminal as TerminalIcon, Database, Play, Folder, Settings,
  Shield, RefreshCw, Github, Code2, Codepen, Globe,
} from "lucide-react";

type TabId = "terminal" | "commands" | "media" | "files" | "browser";

const StatusBar = ({
  onCubeToggle,
  activeTab,
  onTabChange,
  onSettings,
  onServerConfig,
}: {
  onCubeToggle: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onSettings: () => void;
  onServerConfig: (server: "ssh" | "smb" | "ftp") => void;
}) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 text-xs text-muted-foreground">
    <div className="flex items-center gap-3">
      <span className="text-primary font-display font-bold text-sm glow-green">⟩ TERMUX</span>
      <div className="flex items-center gap-1 ml-2">
        {([
          { id: "terminal" as TabId, icon: <TerminalIcon className="w-3 h-3" />, label: "TERM" },
          { id: "commands" as TabId, icon: <Database className="w-3 h-3" />, label: "CMD" },
          { id: "files" as TabId, icon: <Folder className="w-3 h-3" />, label: "FILES" },
          { id: "media" as TabId, icon: <Play className="w-3 h-3" />, label: "MEDIA" },
          { id: "browser" as TabId, icon: <Globe className="w-3 h-3" />, label: "BROWSER" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-display font-semibold transition-all ${
              activeTab === tab.id
                ? "bg-primary/20 text-primary border border-primary/30 glow-box-green"
                : "text-muted-foreground hover:text-foreground border border-transparent"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {/* Server buttons */}
      <button
        onClick={() => onServerConfig("ssh")}
        className="flex items-center gap-1 px-2 py-1 rounded border border-[hsl(var(--terminal-cyan))]/30 bg-[hsl(var(--terminal-cyan))]/10 text-[hsl(var(--terminal-cyan))] hover:bg-[hsl(var(--terminal-cyan))]/20 transition-all text-[10px] font-display font-semibold"
      >
        <TerminalIcon className="w-3 h-3" /> SSH
      </button>
      <button
        onClick={() => onServerConfig("smb")}
        className="flex items-center gap-1 px-2 py-1 rounded border border-[hsl(var(--terminal-yellow))]/30 bg-[hsl(var(--terminal-yellow))]/10 text-[hsl(var(--terminal-yellow))] hover:bg-[hsl(var(--terminal-yellow))]/20 transition-all text-[10px] font-display font-semibold"
      >
        <Shield className="w-3 h-3" /> SMB
      </button>
      <button
        onClick={() => onServerConfig("ftp")}
        className="flex items-center gap-1 px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-display font-semibold"
      >
        <RefreshCw className="w-3 h-3" /> FTP
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      <button
        onClick={onSettings}
        className="flex items-center gap-1 px-2 py-1 rounded border border-accent/30 bg-accent/10 text-accent hover:bg-accent/20 transition-all text-[10px] font-display font-semibold"
      >
        <Settings className="w-3 h-3" />
      </button>
      <button
        onClick={onCubeToggle}
        className="flex items-center gap-1 px-2 py-1 rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all text-[10px] font-display font-semibold glow-box-green"
      >
        <Box className="w-3 h-3" /> CUBE
      </button>

      <div className="w-px h-4 bg-border mx-1" />

      <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> 12%</span>
      <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> 2.1G</span>
      <span className="hidden sm:flex items-center gap-1"><HardDrive className="w-3 h-3" /> 48G</span>
      <span className="flex items-center gap-1 text-primary"><Wifi className="w-3 h-3" /> 192.168.1.42</span>
    </div>
  </div>
);

const Footer = () => (
  <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-card/50 text-[10px] text-muted-foreground">
    <span className="font-display">© 2026 Al Miller — All rights reserved</span>
    <div className="flex items-center gap-3">
      <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
        <Github className="w-3.5 h-3.5" />
      </a>
      <a href="https://codepen.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
        <Codepen className="w-3.5 h-3.5" />
      </a>
      <a href="https://code.visualstudio.com" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
        <Code2 className="w-3.5 h-3.5" />
      </a>
    </div>
  </div>
);

const Index = () => {
  const [cubeMode, setCubeMode] = useState(false);
  const [folding, setFolding] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("terminal");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState<"ssh" | "smb" | "ftp" | null>(null);

  useEffect(() => {
    applyTheme(getStoredTheme(), getStoredBrightness());
  }, []);

  const handleCubeToggle = () => {
    if (!cubeMode) {
      setFolding(true);
      setTimeout(() => {
        setCubeMode(true);
        setFolding(false);
      }, 600);
    }
  };

  const handleExpand = () => {
    setFolding(true);
    setTimeout(() => {
      setCubeMode(false);
      setFolding(false);
    }, 400);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {!cubeMode && (
        <StatusBar
          onCubeToggle={handleCubeToggle}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSettings={() => setSettingsOpen(true)}
          onServerConfig={(s) => setConfigOpen(s)}
        />
      )}

      {!cubeMode && (
        <div
          className={`flex-1 p-4 overflow-hidden transition-all duration-500 ${
            folding ? "scale-50 opacity-0 rotate-12" : "scale-100 opacity-100 rotate-0"
          }`}
          style={{ transformOrigin: "center center", perspective: "1000px" }}
        >
          <div className={`h-full ${activeTab === "terminal" ? "" : "hidden"}`}><Terminal /></div>
          <div className={`h-full ${activeTab === "commands" ? "" : "hidden"}`}><CommandManager /></div>
          <div className={`h-full ${activeTab === "media" ? "" : "hidden"}`}><MediaPlayer /></div>
          <div className={`h-full ${activeTab === "files" ? "" : "hidden"}`}><FileManager /></div>
          <div className={`h-full ${activeTab === "browser" ? "" : "hidden"}`}><CyberBrowser /></div>
        </div>
      )}

      {cubeMode && <AlienCube onExpand={handleExpand} />}

      {!cubeMode && <Footer />}

      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      {configOpen && (
        <ConfigModal serverType={configOpen} isOpen={true} onClose={() => setConfigOpen(null)} />
      )}
    </div>
  );
};

export default Index;
