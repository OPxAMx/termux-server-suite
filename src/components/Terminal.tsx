import { useState, useRef, useEffect } from "react";
import { getStoredCommands } from "@/lib/commandStore";

interface TerminalLine {
  type: "input" | "output" | "error" | "info";
  content: string;
}

const HISTORY_KEY = "termux-terminal-history";
const LINES_KEY = "termux-terminal-lines";

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch { return []; }
}
function saveHistory(h: string[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-200)));
}
function loadLines(): TerminalLine[] {
  try {
    const d = localStorage.getItem(LINES_KEY);
    return d ? JSON.parse(d) : null;
  } catch { return null as any; }
}
function saveLines(l: TerminalLine[]) {
  localStorage.setItem(LINES_KEY, JSON.stringify(l.slice(-300)));
}

const BUILT_IN_COMMANDS: Record<string, (args: string[]) => TerminalLine[]> = {
  help: () => [
    { type: "info", content: "Available commands:" },
    { type: "output", content: "  help          - Show this help" },
    { type: "output", content: "  clear         - Clear terminal" },
    { type: "output", content: "  ssh-status    - Check SSH server status" },
    { type: "output", content: "  ftp-status    - Check FTP server status" },
    { type: "output", content: "  smb-status    - Check SMB server status" },
    { type: "output", content: "  ifconfig      - Show network info" },
    { type: "output", content: "  whoami        - Current user" },
    { type: "output", content: "  uname -a      - System info" },
    { type: "output", content: "  pkg install   - Install package (simulated)" },
    { type: "output", content: "  ls            - List files" },
    { type: "output", content: "  neofetch      - System info display" },
  ],
  whoami: () => [{ type: "output", content: "u0_a123" }],
  uname: (args) => {
    if (args.includes("-a")) {
      return [{ type: "output", content: "Linux localhost 5.15.41-android13 #1 SMP aarch64 Android" }];
    }
    return [{ type: "output", content: "Linux" }];
  },
  "ssh-status": () => [
    { type: "info", content: "● sshd.service - OpenSSH Daemon" },
    { type: "output", content: "   Active: active (running) since Wed 2026-03-18 08:12:33 UTC" },
    { type: "output", content: "   PID: 4821" },
    { type: "output", content: "   Port: 8022" },
    { type: "output", content: "   Connections: 2 active" },
  ],
  "ftp-status": () => [
    { type: "info", content: "● ftpd.service - FTP Server" },
    { type: "output", content: "   Active: active (running) since Wed 2026-03-18 07:45:10 UTC" },
    { type: "output", content: "   PID: 3392" },
    { type: "output", content: "   Port: 8021" },
    { type: "output", content: "   Anonymous: disabled" },
  ],
  "smb-status": () => [
    { type: "info", content: "● smbd.service - Samba SMB Daemon" },
    { type: "output", content: "   Active: active (running) since Wed 2026-03-18 06:30:00 UTC" },
    { type: "output", content: "   PID: 2910" },
    { type: "output", content: "   Port: 8445" },
    { type: "output", content: "   Shares: 3 active" },
  ],
  ifconfig: () => [
    { type: "output", content: "wlan0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>" },
    { type: "output", content: "        inet 192.168.1.42  netmask 255.255.255.0" },
    { type: "output", content: "        inet6 fe80::a1b2:c3d4:e5f6:7890" },
    { type: "output", content: "        RX packets 284912  bytes 312847291" },
    { type: "output", content: "        TX packets 194721  bytes 28471023" },
  ],
  ls: () => [
    { type: "output", content: "drwx------  storage/" },
    { type: "output", content: "drwx------  .ssh/" },
    { type: "output", content: "drwx------  .config/" },
    { type: "output", content: "-rw-------  .bashrc" },
    { type: "output", content: "-rw-------  .profile" },
  ],
  pkg: (args) => {
    if (args[0] === "install" && args[1]) {
      return [
        { type: "output", content: `Reading package lists...` },
        { type: "output", content: `Setting up ${args[1]}...` },
        { type: "info", content: `✓ ${args[1]} installed successfully` },
      ];
    }
    return [{ type: "error", content: "Usage: pkg install <package>" }];
  },
  neofetch: () => [
    { type: "info", content: "        ╔═══════════════════╗" },
    { type: "info", content: "        ║   TERMUX v0.118   ║" },
    { type: "info", content: "        ╚═══════════════════╝" },
    { type: "output", content: "  OS:      Android 13 (aarch64)" },
    { type: "output", content: "  Kernel:  5.15.41-android13" },
    { type: "output", content: "  Shell:   bash 5.2.15" },
    { type: "output", content: "  Pkgs:    142 (dpkg)" },
    { type: "output", content: "  Memory:  2.1G / 6.0G" },
    { type: "output", content: "  Uptime:  4d 12h 33m" },
  ],
};

function getAllCommandNames(): string[] {
  const builtIn = Object.keys(BUILT_IN_COMMANDS);
  const stored = getStoredCommands().flatMap((c) => [c.NomCommande, c.Alias].filter(Boolean));
  return [...new Set([...builtIn, ...stored])];
}

const Terminal = () => {
  const [lines, setLines] = useState<TerminalLine[]>(() => {
    const saved = loadLines();
    return saved || [
      { type: "info", content: "Welcome to Termux v0.118 — Type 'help' for commands" },
      { type: "output", content: "" },
    ];
  });
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>(loadHistory);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestion, setSuggestion] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [lines]);

  useEffect(() => {
    saveLines(lines);
  }, [lines]);

  useEffect(() => {
    if (!input) { setSuggestion(""); return; }
    const all = getAllCommandNames();
    const match = all.find((c) => c.toLowerCase().startsWith(input.toLowerCase()) && c.toLowerCase() !== input.toLowerCase());
    setSuggestion(match || "");
  }, [input]);

  const handleCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    const newLines: TerminalLine[] = [
      ...lines,
      { type: "input", content: `$ ${trimmed}` },
    ];

    if (trimmed === "clear") {
      setLines([]);
      setInput("");
      const newH = [...history, trimmed];
      setHistory(newH);
      saveHistory(newH);
      return;
    }

    const parts = trimmed.split(" ");
    const command = parts[0];
    const args = parts.slice(1);

    const handler = BUILT_IN_COMMANDS[trimmed] || BUILT_IN_COMMANDS[command];
    if (handler) {
      newLines.push(...handler(args));
    } else {
      const storedCommands = getStoredCommands();
      const userCmd = storedCommands.find(
        (c) =>
          c.NomCommande.toLowerCase() === command.toLowerCase() ||
          c.Alias.toLowerCase() === command.toLowerCase()
      );
      if (userCmd) {
        if (args.includes("--help") || args.includes("-h")) {
          newLines.push({ type: "info", content: `${userCmd.NomCommande} — ${userCmd.Utility}` });
          newLines.push({ type: "output", content: `Usage: ${userCmd.HowToUse}` });
          newLines.push({ type: "output", content: userCmd.ContenueHelp });
          newLines.push({ type: "output", content: `Category: ${userCmd.Category}` });
          if (userCmd.Alias) newLines.push({ type: "output", content: `Alias: ${userCmd.Alias}` });
        } else {
          newLines.push({ type: "info", content: `[${userCmd.Category}] ${userCmd.NomCommande}` });
          newLines.push({ type: "output", content: userCmd.Function || userCmd.Utility });
          newLines.push({ type: "output", content: `Type '${userCmd.NomCommande} --help' for details` });
        }
      } else {
        newLines.push({ type: "error", content: `bash: ${command}: command not found` });
      }
    }

    setLines(newLines);
    setInput("");
    setSuggestion("");
    const newH = [...history, trimmed];
    setHistory(newH);
    saveHistory(newH);
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab" && suggestion) {
      e.preventDefault();
      setInput(suggestion);
      setSuggestion("");
    } else if (e.key === "Enter") {
      handleCommand(input);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0) {
        const newIndex = historyIndex < history.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput("");
      }
    }
  };

  const lineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "input": return "text-primary glow-green";
      case "error": return "text-terminal-red";
      case "info": return "text-terminal-cyan";
      default: return "text-foreground";
    }
  };

  return (
    <div
      className="flex flex-col h-full rounded-lg border border-border bg-card glow-box-green overflow-hidden scanline"
      onClick={() => inputRef.current?.focus()}
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/50">
        <div className="w-3 h-3 rounded-full bg-terminal-red" />
        <div className="w-3 h-3 rounded-full bg-terminal-yellow" />
        <div className="w-3 h-3 rounded-full bg-primary" />
        <span className="ml-2 text-xs text-muted-foreground font-display">bash — termux</span>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
        {lines.map((line, i) => (
          <div key={i} className={`${lineColor(line.type)} whitespace-pre-wrap`}>
            {line.content}
          </div>
        ))}
        <div className="flex items-center gap-1 text-primary glow-green relative">
          <span>$</span>
          <div className="flex-1 relative">
            {suggestion && (
              <span className="absolute inset-0 text-sm text-muted-foreground/30 pointer-events-none select-none">
                {suggestion}
              </span>
            )}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent outline-none border-none text-sm text-primary caret-primary relative z-10"
              autoFocus
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terminal;
