export interface CommandEntry {
  NomCommande: string;
  HowToUse: string;
  ContenueHelp: string;
  Alias: string;
  Function: string;
  Utility: string;
  Category: string;
}

const STORAGE_KEY = "termux-commands";

export function getStoredCommands(): CommandEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveCommands(commands: CommandEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(commands));
}

export function addCommands(newCommands: CommandEntry[]) {
  const existing = getStoredCommands();
  const merged = [...existing];
  for (const cmd of newCommands) {
    const idx = merged.findIndex(
      (c) => c.NomCommande.toLowerCase() === cmd.NomCommande.toLowerCase()
    );
    if (idx >= 0) {
      merged[idx] = cmd;
    } else {
      merged.push(cmd);
    }
  }
  saveCommands(merged);
  return merged;
}

export function deleteCommand(name: string) {
  const commands = getStoredCommands().filter(
    (c) => c.NomCommande.toLowerCase() !== name.toLowerCase()
  );
  saveCommands(commands);
  return commands;
}

export function parseCSV(csvText: string): CommandEntry[] {
  const lines = csvText.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const expectedHeaders = [
    "NomCommande",
    "HowToUse",
    "ContenueHelp",
    "Alias",
    "Function",
    "Utility",
    "Category",
  ];

  // Map CSV headers to expected fields
  const headerMap: Record<string, string> = {};
  for (const eh of expectedHeaders) {
    const found = headers.find(
      (h) => h.toLowerCase() === eh.toLowerCase()
    );
    if (found) headerMap[eh] = found;
  }

  const entries: CommandEntry[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0) continue;

    const entry: Record<string, string> = {};
    for (const eh of expectedHeaders) {
      const idx = headers.findIndex(
        (h) => h.toLowerCase() === (headerMap[eh] || eh).toLowerCase()
      );
      entry[eh] = idx >= 0 && idx < values.length ? values[idx].trim() : "";
    }
    if (entry.NomCommande) {
      entries.push(entry as unknown as CommandEntry);
    }
  }
  return entries;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
