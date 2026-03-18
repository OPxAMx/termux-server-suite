import Terminal from "@/components/Terminal";
import ServerPanel from "@/components/ServerPanel";
import { Wifi, Cpu, HardDrive, MemoryStick } from "lucide-react";

const StatusBar = () => (
  <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50 text-xs text-muted-foreground">
    <div className="flex items-center gap-4">
      <span className="text-primary font-display font-bold text-sm glow-green">⟩ TERMUX</span>
      <span className="hidden sm:inline">v0.118</span>
    </div>
    <div className="flex items-center gap-4">
      <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> 12%</span>
      <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" /> 2.1G/6G</span>
      <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> 48G free</span>
      <span className="flex items-center gap-1 text-primary"><Wifi className="w-3 h-3" /> 192.168.1.42</span>
    </div>
  </div>
);

const Index = () => {
  return (
    <div className="flex flex-col h-screen bg-background">
      <StatusBar />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 p-4 overflow-hidden">
        <Terminal />
        <div className="overflow-y-auto">
          <h2 className="font-display font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
            Server Management
          </h2>
          <ServerPanel />
        </div>
      </div>
    </div>
  );
};

export default Index;
