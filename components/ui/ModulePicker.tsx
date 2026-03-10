"use client";

import { useState, useRef, useEffect } from "react";

export type ModuleId =
  | "full-launch"
  | "research"
  | "branding"
  | "marketing"
  | "landing"
  | "feasibility";

export interface ModuleDefinition {
  id: ModuleId;
  icon: string;
  label: string;
  accent: string;
  description: string;
}

export const MODULES: Record<ModuleId, ModuleDefinition> = {
  "full-launch": { id: "full-launch", icon: "⬡", label: "Full Launch", accent: "#C4975A", description: "All agents together" },
  "research": { id: "research", icon: "◎", label: "Research", accent: "#5A8C6E", description: "Market intelligence" },
  "branding": { id: "branding", icon: "◇", label: "Branding", accent: "#5A6E8C", description: "Brand bible" },
  "marketing": { id: "marketing", icon: "▲", label: "Marketing", accent: "#8C5A7A", description: "GTM strategy" },
  "landing": { id: "landing", icon: "▣", label: "Landing Page", accent: "#8C7A5A", description: "Live deployment" },
  "feasibility": { id: "feasibility", icon: "◈", label: "Feasibility", accent: "#7A5A8C", description: "GO/NO-GO verdict" },
};

export interface ModulePickerProps {
  selectedModule: ModuleId;
  onChange: (module: ModuleId) => void;
}

export function ModulePicker({ selectedModule, onChange }: ModulePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentModule = MODULES[selectedModule] || MODULES["full-launch"];

  return (
    <div ref={containerRef} className="relative inline-block">
      {/* Dropdown panel */}
      {isOpen && (
        <div className="absolute bottom-[calc(100%+8px)] left-0 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 w-[320px] shadow-lg z-50 flex flex-col gap-0.5">
          {Object.values(MODULES).map((mod) => {
            const isSelected = mod.id === selectedModule;
            return (
              <button
                key={mod.id}
                onClick={() => {
                  onChange(mod.id);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border-none cursor-pointer text-left w-full transition-colors ${isSelected ? "bg-[var(--nav-active)]" : "bg-transparent hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: mod.accent }} className="text-sm flex items-center justify-center w-4 text-center">
                    {mod.icon}
                  </span>
                  <span className="text-[13px] font-medium text-[var(--text)]">{mod.label}</span>
                </div>
                <span className="text-[11px] text-[var(--muted)] whitespace-nowrap overflow-hidden text-ellipsis ml-4 text-right">
                  {mod.description}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Pill */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer outline-none transition-opacity hover:opacity-80"
        style={{
          background: `${currentModule.accent}26`, // 15% opacity
          border: `1px solid ${currentModule.accent}4D`, // 30% opacity
          color: currentModule.accent,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "12px",
          fontWeight: 500,
        }}
      >
        <span className="text-[13px] flex items-center justify-center translate-y-[0.5px]">
          {currentModule.icon}
        </span>
        <span>{currentModule.label}</span>
      </button>
    </div>
  );
}
