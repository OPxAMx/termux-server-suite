import { useState, useEffect } from "react";
import { Cpu, HardDrive, MemoryStick, Wifi, Terminal, Shield, RefreshCw, Zap, Radio, Scan } from "lucide-react";

const CubeFace = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`absolute w-full h-full backface-hidden border border-primary/30 bg-card/95 overflow-hidden ${className}`}>
    <div className="absolute inset-0 scanline opacity-50" />
    <div className="relative z-10 p-3 h-full flex flex-col">{children}</div>
  </div>
);

const AlienCube = ({ onExpand }: { onExpand: () => void }) => {
  const [rotation, setRotation] = useState({ x: -25, y: 35 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!autoRotate) return;
    const interval = setInterval(() => {
      setRotation((r) => ({ x: r.x, y: r.y + 0.3 }));
    }, 30);
    return () => clearInterval(interval);
  }, [autoRotate]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setAutoRotate(false);
    setDragStart({ x: e.clientX, y: e.clientY });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setRotation((r) => ({ x: r.x - dy * 0.5, y: r.y + dx * 0.5 }));
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setTimeout(() => setAutoRotate(true), 3000);
  };

  const size = 140;
  const half = size / 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      {/* Ambient glow */}
      <div className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse" />
      <div className="absolute w-48 h-48 rounded-full bg-terminal-cyan/8 blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="flex flex-col items-center gap-6">
        <div
          className="cursor-grab active:cursor-grabbing"
          style={{ perspective: "800px", width: size, height: size }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <div
            className="relative w-full h-full transition-transform duration-100"
            style={{
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
            }}
          >
            {/* Front - Terminal */}
            <CubeFace className="glow-box-green" >
              <div style={{ transform: `translateZ(${half}px)`, position: "absolute", inset: 0 }} className="border border-primary/30 bg-card/95 p-3 flex flex-col">
                <div className="absolute inset-0 scanline opacity-50" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-2 h-2 rounded-full bg-terminal-red" />
                    <div className="w-2 h-2 rounded-full bg-terminal-yellow" />
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-[8px] text-muted-foreground ml-1">bash</span>
                  </div>
                  <div className="text-[7px] text-foreground space-y-0.5 flex-1">
                    <div className="text-primary glow-green">$ neofetch</div>
                    <div className="text-terminal-cyan">╔═══════════╗</div>
                    <div className="text-terminal-cyan">║  TERMUX   ║</div>
                    <div className="text-terminal-cyan">╚═══════════╝</div>
                    <div>OS: Android 13</div>
                    <div>Shell: bash 5.2</div>
                  </div>
                  <div className="text-[7px] text-primary glow-green">$ _</div>
                </div>
              </div>
            </CubeFace>

            {/* Back - Network */}
            <div style={{ transform: `rotateY(180deg) translateZ(${half}px)`, position: "absolute", inset: 0 }} className="border border-terminal-cyan/30 bg-card/95 p-3 flex flex-col glow-box-cyan">
              <div className="absolute inset-0 scanline opacity-50" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <Wifi className="w-3 h-3 text-terminal-cyan" />
                  <span className="text-[8px] text-terminal-cyan font-display font-bold">NETWORK</span>
                </div>
                <div className="text-[7px] space-y-1 flex-1">
                  <div className="text-muted-foreground">wlan0</div>
                  <div className="text-foreground">192.168.1.42</div>
                  <div className="text-muted-foreground mt-1">RX</div>
                  <div className="w-full bg-secondary rounded-full h-1"><div className="bg-terminal-cyan h-1 rounded-full" style={{ width: "65%" }} /></div>
                  <div className="text-muted-foreground">TX</div>
                  <div className="w-full bg-secondary rounded-full h-1"><div className="bg-primary h-1 rounded-full" style={{ width: "40%" }} /></div>
                </div>
              </div>
            </div>

            {/* Right - SSH */}
            <div style={{ transform: `rotateY(90deg) translateZ(${half}px)`, position: "absolute", inset: 0 }} className="border border-terminal-cyan/30 bg-card/95 p-3 flex flex-col">
              <div className="absolute inset-0 scanline opacity-50" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <Terminal className="w-3 h-3 text-terminal-cyan" />
                  <span className="text-[8px] text-terminal-cyan font-display font-bold">SSH</span>
                </div>
                <div className="text-[7px] space-y-1">
                  <div className="text-primary glow-green text-[8px]">● ACTIVE</div>
                  <div className="text-muted-foreground">Port: <span className="text-foreground">8022</span></div>
                  <div className="text-muted-foreground">Clients: <span className="text-foreground">2</span></div>
                  <div className="text-muted-foreground">Up: <span className="text-foreground">4d 12h</span></div>
                </div>
              </div>
            </div>

            {/* Left - SMB */}
            <div style={{ transform: `rotateY(-90deg) translateZ(${half}px)`, position: "absolute", inset: 0 }} className="border border-terminal-yellow/30 bg-card/95 p-3 flex flex-col">
              <div className="absolute inset-0 scanline opacity-50" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <Shield className="w-3 h-3 text-terminal-yellow" />
                  <span className="text-[8px] text-terminal-yellow font-display font-bold">SMB</span>
                </div>
                <div className="text-[7px] space-y-1">
                  <div className="text-primary glow-green text-[8px]">● ACTIVE</div>
                  <div className="text-muted-foreground">Port: <span className="text-foreground">8445</span></div>
                  <div className="text-muted-foreground">Shares: <span className="text-foreground">3</span></div>
                  <div className="text-muted-foreground">Up: <span className="text-foreground">3d 8h</span></div>
                </div>
              </div>
            </div>

            {/* Top - System */}
            <div style={{ transform: `rotateX(90deg) translateZ(${half}px)`, position: "absolute", inset: 0 }} className="border border-primary/30 bg-card/95 p-3 flex flex-col">
              <div className="absolute inset-0 scanline opacity-50" />
              <div className="relative z-10 flex flex-col h-full items-center justify-center">
                <Scan className="w-6 h-6 text-primary mb-1 glow-green" />
                <span className="text-[9px] text-primary font-display font-bold glow-green">TERMUX</span>
                <span className="text-[7px] text-muted-foreground">v0.118</span>
                <div className="flex gap-2 mt-2">
                  <div className="flex items-center gap-0.5 text-[6px] text-muted-foreground"><Cpu className="w-2 h-2" /> 12%</div>
                  <div className="flex items-center gap-0.5 text-[6px] text-muted-foreground"><MemoryStick className="w-2 h-2" /> 2.1G</div>
                </div>
              </div>
            </div>

            {/* Bottom - FTP */}
            <div style={{ transform: `rotateX(-90deg) translateZ(${half}px)`, position: "absolute", inset: 0 }} className="border border-primary/30 bg-card/95 p-3 flex flex-col">
              <div className="absolute inset-0 scanline opacity-50" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-1.5 mb-2">
                  <HardDrive className="w-3 h-3 text-primary" />
                  <span className="text-[8px] text-primary font-display font-bold">FTP</span>
                </div>
                <div className="text-[7px] space-y-1">
                  <div className="text-terminal-red text-[8px]">● STOPPED</div>
                  <div className="text-muted-foreground">Port: <span className="text-foreground">8021</span></div>
                  <div className="text-muted-foreground">Anon: <span className="text-foreground">off</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Label */}
        <div className="text-center">
          <div className="text-xs text-primary glow-green font-display font-bold tracking-widest mb-1">⟩ ALIEN GADGET</div>
          <div className="text-[10px] text-muted-foreground">Drag to rotate • Click below to expand</div>
        </div>

        {/* Expand button */}
        <button
          onClick={onExpand}
          className="px-6 py-2 text-xs font-display font-semibold rounded-md border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all glow-box-green"
        >
          <Zap className="w-3 h-3 inline mr-1.5" />
          EXPAND SYSTEM
        </button>
      </div>
    </div>
  );
};

export default AlienCube;
