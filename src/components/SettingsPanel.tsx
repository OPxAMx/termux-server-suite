import { useState, useEffect } from "react";
import { X, Sun, Moon, Palette, Check } from "lucide-react";
import { THEMES, getStoredTheme, getStoredBrightness, applyTheme } from "@/lib/themeStore";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel = ({ isOpen, onClose }: SettingsPanelProps) => {
  const [activeTheme, setActiveTheme] = useState(getStoredTheme());
  const [brightness, setBrightness] = useState(getStoredBrightness());

  useEffect(() => {
    if (isOpen) {
      setActiveTheme(getStoredTheme());
      setBrightness(getStoredBrightness());
    }
  }, [isOpen]);

  const handleThemeChange = (id: string) => {
    setActiveTheme(id);
    applyTheme(id, brightness);
  };

  const handleBrightness = (v: number) => {
    setBrightness(v);
    applyTheme(activeTheme, v);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm mx-4 rounded-lg border border-border bg-card overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/50">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            <span className="text-xs font-display font-bold text-primary glow-green">SETTINGS</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Theme selection */}
          <div>
            <h3 className="text-xs font-display font-semibold text-foreground mb-3">Thème</h3>
            <div className="grid grid-cols-2 gap-2">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-md border text-xs font-display transition-all ${
                    activeTheme === theme.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                  }`}
                >
                  {/* Color preview dots */}
                  <div className="flex gap-0.5">
                    <div
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ background: `hsl(${theme.colors.primary})` }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ background: `hsl(${theme.colors.background})` }}
                    />
                    <div
                      className="w-3 h-3 rounded-full border border-border"
                      style={{ background: `hsl(${theme.colors.accent})` }}
                    />
                  </div>
                  <span className="flex-1 text-left">{theme.name}</span>
                  {activeTheme === theme.id && <Check className="w-3 h-3 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Brightness */}
          <div>
            <h3 className="text-xs font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <Moon className="w-3 h-3" />
              Luminosité
              <Sun className="w-3 h-3" />
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.4"
                max="1.4"
                step="0.05"
                value={brightness}
                onChange={(e) => handleBrightness(parseFloat(e.target.value))}
                className="flex-1 accent-primary h-1"
              />
              <span className="text-[10px] text-muted-foreground w-10 text-right font-mono">
                {Math.round(brightness * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
