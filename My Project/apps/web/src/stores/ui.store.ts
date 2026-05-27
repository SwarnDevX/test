import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  theme: "dark" | "light";
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  nodeLibraryOpen: boolean;
  inspectorOpen: boolean;
  executionLogsOpen: boolean;
  minimapVisible: boolean;
  activeWorkspaceId: string | null;

  setTheme: (theme: "dark" | "light") => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (v: boolean) => void;
  toggleCommandPalette: () => void;
  setNodeLibraryOpen: (v: boolean) => void;
  setInspectorOpen: (v: boolean) => void;
  setExecutionLogsOpen: (v: boolean) => void;
  toggleExecutionLogs: () => void;
  setMinimapVisible: (v: boolean) => void;
  setActiveWorkspaceId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "dark",
      sidebarCollapsed: false,
      commandPaletteOpen: false,
      nodeLibraryOpen: true,
      inspectorOpen: true,
      executionLogsOpen: false,
      minimapVisible: true,
      activeWorkspaceId: null,

      setTheme: (theme) => set({ theme }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setCommandPaletteOpen: (commandPaletteOpen) => set({ commandPaletteOpen }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
      setNodeLibraryOpen: (nodeLibraryOpen) => set({ nodeLibraryOpen }),
      setInspectorOpen: (inspectorOpen) => set({ inspectorOpen }),
      setExecutionLogsOpen: (executionLogsOpen) => set({ executionLogsOpen }),
      toggleExecutionLogs: () => set((s) => ({ executionLogsOpen: !s.executionLogsOpen })),
      setMinimapVisible: (minimapVisible) => set({ minimapVisible }),
      setActiveWorkspaceId: (activeWorkspaceId) => {
        set({ activeWorkspaceId });
        if (activeWorkspaceId && typeof localStorage !== "undefined") {
          localStorage.setItem("ff-workspace-id", activeWorkspaceId);
        }
      },
    }),
    {
      name: "ff-ui",
      partialize: (s) => ({
        theme: s.theme,
        sidebarCollapsed: s.sidebarCollapsed,
        nodeLibraryOpen: s.nodeLibraryOpen,
        inspectorOpen: s.inspectorOpen,
        minimapVisible: s.minimapVisible,
        activeWorkspaceId: s.activeWorkspaceId,
      }),
    },
  ),
);
