import { useState, useRef, useEffect } from "react";
import { Upload, Trash2, Search, Download, Database, FileDown } from "lucide-react";
import { toast } from "sonner";
import {
  CommandEntry,
  getStoredCommands,
  addCommands,
  deleteCommand,
  parseCSV,
} from "@/lib/commandStore";

const CATEGORIES = ["All", "System", "Network", "Files", "Security", "Utils", "Custom"];

const CommandManager = () => {
  const [commands, setCommands] = useState<CommandEntry[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [selected, setSelected] = useState<CommandEntry | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCommands(getStoredCommands());
  }, []);

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("Aucune commande valide trouvée dans le CSV");
        return;
      }
      const updated = addCommands(parsed);
      setCommands(updated);
      toast.success(`${parsed.length} commande(s) importée(s)`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleDelete = (name: string) => {
    const updated = deleteCommand(name);
    setCommands(updated);
    if (selected?.NomCommande === name) setSelected(null);
    toast.info(`Commande "${name}" supprimée`);
  };

  const exportCSV = () => {
    const headers = "NomCommande,HowToUse,ContenueHelp,Alias,Function,Utility,Category";
    const rows = commands.map(
      (c) =>
        `"${c.NomCommande}","${c.HowToUse}","${c.ContenueHelp}","${c.Alias}","${c.Function}","${c.Utility}","${c.Category}"`
    );
    const blob = new Blob([headers + "\n" + rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "termux-commands.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = commands.filter((c) => {
    const matchSearch =
      !search ||
      c.NomCommande.toLowerCase().includes(search.toLowerCase()) ||
      c.Alias.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || c.Category.toLowerCase() === category.toLowerCase();
    return matchSearch && matchCat;
  });

  return (
    <div className="flex flex-col h-full rounded-lg border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/50">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-terminal-cyan" />
          <span className="text-xs font-display font-bold text-terminal-cyan">
            COMMAND DB
          </span>
          <span className="text-[10px] text-muted-foreground">
            ({commands.length} entrées)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-display font-semibold"
          >
            <Upload className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2 py-1 text-[10px] rounded border border-terminal-cyan/30 bg-terminal-cyan/10 text-terminal-cyan hover:bg-terminal-cyan/20 transition-all font-display font-semibold"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleCSVUpload}
          />
        </div>
      </div>

      {/* Search + Categories */}
      <div className="px-4 py-2 border-b border-border space-y-2">
        <div className="flex items-center gap-2 bg-secondary/50 rounded px-2 py-1">
          <Search className="w-3 h-3 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-xs outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-2 py-0.5 text-[10px] rounded font-display font-semibold transition-all ${
                category === cat
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-secondary/50 text-muted-foreground border border-transparent hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Command list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-xs p-4">
            <Database className="w-8 h-8 mb-2 opacity-30" />
            <p>Aucune commande trouvée</p>
            <p className="text-[10px] mt-1">Importez un fichier CSV pour commencer</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((cmd) => (
              <div
                key={cmd.NomCommande}
                onClick={() => setSelected(selected?.NomCommande === cmd.NomCommande ? null : cmd)}
                className={`px-4 py-2 cursor-pointer hover:bg-secondary/30 transition-colors ${
                  selected?.NomCommande === cmd.NomCommande ? "bg-secondary/50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-semibold glow-green">
                      {cmd.NomCommande}
                    </span>
                    {cmd.Alias && (
                      <span className="text-[9px] text-terminal-cyan px-1 rounded bg-terminal-cyan/10">
                        {cmd.Alias}
                      </span>
                    )}
                    <span className="text-[9px] text-muted-foreground px-1 rounded bg-secondary/50">
                      {cmd.Category}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(cmd.NomCommande);
                    }}
                    className="text-terminal-red/50 hover:text-terminal-red transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 truncate">
                  {cmd.Utility}
                </div>

                {/* Expanded detail */}
                {selected?.NomCommande === cmd.NomCommande && (
                  <div className="mt-2 space-y-1 text-[10px] border-t border-border pt-2">
                    <div>
                      <span className="text-terminal-cyan">Usage:</span>{" "}
                      <span className="text-foreground">{cmd.HowToUse}</span>
                    </div>
                    <div>
                      <span className="text-terminal-cyan">Help:</span>{" "}
                      <span className="text-foreground">{cmd.ContenueHelp}</span>
                    </div>
                    <div>
                      <span className="text-terminal-cyan">Function:</span>{" "}
                      <span className="text-foreground font-mono">{cmd.Function}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommandManager;
