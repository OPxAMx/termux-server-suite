import { useState, useEffect } from "react";
import Terminal from "@/components/Terminal";
import ServerPanel from "@/components/ServerPanel";
import AlienCube from "@/components/AlienCube";
import CommandManager from "@/components/CommandManager";
import MediaPlayer from "@/components/MediaPlayer";
import FileManager from "@/components/FileManager";
import SettingsPanel from "@/components/SettingsPanel";
import { applyTheme, getStoredTheme, getStoredBrightness } from "@/lib/themeStore";
import { Wifi, Cpu, HardDrive, MemoryStick, Box, Terminal as TerminalIcon, Database, Play, Folder, Settings } from "lucide-react";

type TabId = "terminal" | "commands" | "media" | "files";

const StatusBar = ({
  onCubeToggle,
  activeTab,
  onTabChange,
  onSettings,
}: {
  onCubeToggle: () => void;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onSettings: () => void;
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
    <div className="flex items-center gap-4">
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
      <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> 12%</span>
      <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> 2.1G/6G</span>
      <span className="hidden sm:flex items-center gap-1"><HardDrive className="w-3 h-3" /> 48G free</span>
      <span className="flex items-center gap-1 text-primary"><Wifi className="w-3 h-3" /> 192.168.1.42</span>
    </div>
  </div>
);

const Index = () => {
  const [cubeMode, setCubeMode] = useState(false);
  const [folding, setFolding] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("terminal");
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  const renderMainPanel = () => {
    switch (activeTab) {
      case "commands":
        return <CommandManager />;
      case "media":
        return <MediaPlayer />;
      case "files":
        return <FileManager />;
      default:
        return <Terminal />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {!cubeMode && (
        <StatusBar
          onCubeToggle={handleCubeToggle}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onSettings={() => setSettingsOpen(true)}
        />
      )}

      {!cubeMode && (
        <div
          className={`flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 p-4 overflow-hidden transition-all duration-500 ${
            folding ? "scale-50 opacity-0 rotate-12" : "scale-100 opacity-100 rotate-0"
          }`}
          style={{ transformOrigin: "center center", perspective: "1000px" }}
        >
          {renderMainPanel()}
          <div className="overflow-y-auto">
            <h2 className="font-display font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
              Server Management
            </h2>
            <ServerPanel />
          </div>
        </div>
      )}

      {cubeMode && <AlienCube onExpand={handleExpand} />}
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default Index;
