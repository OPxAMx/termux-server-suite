import { useState } from "react";
import Terminal from "@/components/Terminal";
import ServerPanel from "@/components/ServerPanel";
import AlienCube from "@/components/AlienCube";
import { Wifi, Cpu, HardDrive, MemoryStick, Box } from "lucide-react";

const StatusBar = ({ onCubeToggle }: { onCubeToggle: () => void }) => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 text-xs text-muted-foreground">
    <div className="flex items-center gap-4">
      <span className="text-primary font-display font-bold text-sm glow-green">⟩ TERMUX</span>
      <span className="hidden sm:inline">v0.118</span>
    </div>
    <div className="flex items-center gap-4">
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
      {!cubeMode && <StatusBar onCubeToggle={handleCubeToggle} />}

      {/* Main content with fold animation */}
      {!cubeMode && (
        <div
          className={`flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 p-4 overflow-hidden transition-all duration-500 ${
            folding ? "scale-50 opacity-0 rotate-12" : "scale-100 opacity-100 rotate-0"
          }`}
          style={{ transformOrigin: "center center", perspective: "1000px" }}
        >
          <Terminal />
          <div className="overflow-y-auto">
            <h2 className="font-display font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
              Server Management
            </h2>
            <ServerPanel />
          </div>
        </div>
      )}

      {/* 3D Cube mode */}
      {cubeMode && <AlienCube onExpand={handleExpand} />}
    </div>
  );
};

export default Index;
