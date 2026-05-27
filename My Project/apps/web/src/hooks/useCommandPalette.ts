"use client";

import { useEffect } from "react";
import { useUIStore } from "@/stores/ui.store";

export function useCommandPalette() {
  const { commandPaletteOpen, toggleCommandPalette, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggleCommandPalette();
      }
      if (e.key === "Escape" && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, toggleCommandPalette, setCommandPaletteOpen]);

  return { open: commandPaletteOpen, setOpen: setCommandPaletteOpen };
}
