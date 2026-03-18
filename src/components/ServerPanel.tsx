import { Power, RefreshCw, Settings, Shield, Terminal } from "lucide-react";
import { useState } from "react";

interface ServerCardProps {
  name: string;
  icon: React.ReactNode;
  port: number;
  status: "running" | "stopped";
  connections: number;
  uptime: string;
  glowClass: string;
  onToggle: () => void;
}

const ServerCard = ({
  name,
  icon,
  port,
  status,
  connections,
  uptime,
  glowClass,
  onToggle,
}: ServerCardProps) => {
  const isRunning = status === "running";

  return (
    <div className={`rounded-lg border border-border bg-card p-5 ${glowClass} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${isRunning ? "bg-primary/10" : "bg-secondary"}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-display font-semibold text-foreground">{name}</h3>
            <span className={`text-xs ${isRunning ? "text-primary glow-green" : "text-terminal-red"}`}>
              ● {isRunning ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          className={`p-2 rounded-md border transition-colors ${
            isRunning
              ? "border-terminal-red/30 hover:bg-terminal-red/10 text-terminal-red"
              : "border-primary/30 hover:bg-primary/10 text-primary"
          }`}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="bg-secondary/50 rounded-md p-2.5">
          <div className="text-muted-foreground mb-1">Port</div>
          <div className="text-foreground font-semibold">{port}</div>
        </div>
        <div className="bg-secondary/50 rounded-md p-2.5">
          <div className="text-muted-foreground mb-1">Clients</div>
          <div className="text-foreground font-semibold">{isRunning ? connections : "—"}</div>
        </div>
        <div className="bg-secondary/50 rounded-md p-2.5">
          <div className="text-muted-foreground mb-1">Uptime</div>
          <div className="text-foreground font-semibold">{isRunning ? uptime : "—"}</div>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md border border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <Settings className="w-3 h-3" /> Config
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md border border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw className="w-3 h-3" /> Restart
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-md border border-border hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors">
          <Shield className="w-3 h-3" /> Logs
        </button>
      </div>
    </div>
  );
};

export interface ServerState {
  status: "running" | "stopped";
  connections: number;
  uptime: string;
}

const ServerPanel = () => {
  const [servers, setServers] = useState<Record<string, ServerState>>({
    ssh: { status: "running", connections: 2, uptime: "4d 12h" },
    smb: { status: "running", connections: 1, uptime: "3d 8h" },
    ftp: { status: "stopped", connections: 0, uptime: "—" },
  });

  const toggle = (key: string) => {
    setServers((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: prev[key].status === "running" ? "stopped" : "running",
        connections: prev[key].status === "running" ? 0 : Math.floor(Math.random() * 5),
        uptime: prev[key].status === "running" ? "—" : "0h 0m",
      },
    }));
  };

  return (
    <div className="grid gap-4">
      <ServerCard
        name="SSH Server"
        icon={<Terminal className="w-4 h-4 text-terminal-cyan" />}
        port={8022}
        {...servers.ssh}
        glowClass={servers.ssh.status === "running" ? "glow-box-cyan" : ""}
        onToggle={() => toggle("ssh")}
      />
      <ServerCard
        name="SMB Server"
        icon={<Shield className="w-4 h-4 text-terminal-yellow" />}
        port={8445}
        {...servers.smb}
        glowClass={servers.smb.status === "running" ? "glow-box-yellow" : ""}
        onToggle={() => toggle("smb")}
      />
      <ServerCard
        name="FTP Server"
        icon={<RefreshCw className="w-4 h-4 text-primary" />}
        port={8021}
        {...servers.ftp}
        glowClass={servers.ftp.status === "running" ? "glow-box-green" : ""}
        onToggle={() => toggle("ftp")}
      />
    </div>
  );
};

export default ServerPanel;
