"use client";

import { useCallback, useState, useEffect } from "react";
import { getRecentPaths, addRecentPath, removeRecentPath, clearRecentPaths, type RecentPath } from "@/lib/recent-paths";

interface FileNodeType {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNodeType[];
}

interface TreeData {
  name: string;
  children: FileNodeType[];
}

interface UseFileOperationsProps {
  dirPath: string;
  selections: Set<string>;
  setTree: (tree: TreeData | null) => void;
  setSelections: (selections: Set<string>) => void;
  setExpandedDirs: (dirs: Set<string>) => void;
  setLoading: (loading: boolean) => void;
  setCopySuccess: (success: boolean) => void;
  setError: (error: string | null) => void;
  setDirPath: (path: string) => void;
}

// Declare global electronAPI type
declare global {
  interface Window {
    electronAPI?: {
      showDirectoryPicker: () => Promise<string | null>;
      getDirectoryContents: (dirPath: string) => Promise<any>;
      readFiles: (dirPath: string, selections: string[]) => Promise<string>;
      onDirectorySelected: (callback: (event: any, path: string) => void) => void;
      removeDirectorySelectedListener: (callback: (event: any, path: string) => void) => void;
      isElectron: boolean;
    };
  }
}

export function useFileOperations({
  dirPath,
  selections,
  setTree,
  setSelections,
  setExpandedDirs,
  setLoading,
  setCopySuccess,
  setError,
  setDirPath,
}: UseFileOperationsProps) {

  // Check if we're running in Electron
  const isElectron = typeof window !== 'undefined' && window.electronAPI?.isElectron;

  // Recent paths state
  const [recentPaths, setRecentPaths] = useState<RecentPath[]>([]);

  // Load recent paths on mount
  useEffect(() => {
    const paths = getRecentPaths();
    setRecentPaths(paths);
  }, []);

  // Handle directory selection from menu
  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    const handleMenuDirectorySelected = async (event: any, selectedPath: string) => {
      if (selectedPath) {
        setDirPath(selectedPath);
        setLoading(true);
        setError(null);
        
        try {
          const data = await window.electronAPI!.getDirectoryContents(selectedPath);
          setTree({ name: selectedPath, children: data });
          setSelections(new Set());
          setExpandedDirs(new Set([selectedPath]));
          
          // Save to recent paths
          addRecentPath(selectedPath);
          setRecentPaths(getRecentPaths());
        } catch (err) {
          setError("Failed to load directory from menu selection");
        } finally {
          setLoading(false);
        }
      }
    };

    window.electronAPI.onDirectorySelected(handleMenuDirectorySelected);

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeDirectorySelectedListener(handleMenuDirectorySelected);
      }
    };
  }, [isElectron, setTree, setSelections, setExpandedDirs, setLoading, setError, setDirPath]);

  const showDirectoryPicker = useCallback(async () => {
    if (!isElectron || !window.electronAPI) {
      setError("Directory picker is only available in the desktop app");
      return;
    }

    try {
      const selectedPath = await window.electronAPI.showDirectoryPicker();
      if (selectedPath) {
        return selectedPath;
      }
    } catch (err) {
      setError("Failed to open directory picker");
    }
    return null;
  }, [isElectron, setError]);

  const loadDirectory = useCallback(async (pathToLoad?: string) => {
    const targetPath = pathToLoad || dirPath;
    
    if (!targetPath.trim()) {
      setError("Please enter a directory path");
      return;
    }

    if (!isElectron || !window.electronAPI) {
      setError("Directory loading is only available in the desktop app");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use native Electron API
      const data = await window.electronAPI.getDirectoryContents(targetPath);
      setTree({ name: targetPath, children: data });
      setSelections(new Set());
      setExpandedDirs(new Set([targetPath]));
      
      // Save to recent paths
      addRecentPath(targetPath);
      setRecentPaths(getRecentPaths());
    } catch (err) {
      setError(
        "Failed to load directory. Please check the path and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    dirPath,
    setTree,
    setSelections,
    setExpandedDirs,
    setLoading,
    setError,
    isElectron,
  ]);

  const loadTestData = useCallback(() => {
    const testTree: TreeData = {
      name: "/sample/project",
      children: [
        {
          name: "src",
          path: "src",
          type: "directory",
          children: [
            {
              name: "components",
              path: "src/components",
              type: "directory",
              children: [
                {
                  name: "Button.tsx",
                  path: "src/components/Button.tsx",
                  type: "file",
                  size: 1024,
                },
                {
                  name: "Card.tsx",
                  path: "src/components/Card.tsx",
                  type: "file",
                  size: 856,
                },
                {
                  name: "Modal.tsx",
                  path: "src/components/Modal.tsx",
                  type: "file",
                  size: 1200,
                },
                {
                  name: "ui",
                  path: "src/components/ui",
                  type: "directory",
                  children: [
                    {
                      name: "Input.tsx",
                      path: "src/components/ui/Input.tsx",
                      type: "file",
                      size: 640,
                    },
                    {
                      name: "Select.tsx",
                      path: "src/components/ui/Select.tsx",
                      type: "file",
                      size: 720,
                    },
                  ],
                },
              ],
            },
            {
              name: "utils",
              path: "src/utils",
              type: "directory",
              children: [
                {
                  name: "helpers.ts",
                  path: "src/utils/helpers.ts",
                  type: "file",
                  size: 890,
                },
                {
                  name: "constants.ts",
                  path: "src/utils/constants.ts",
                  type: "file",
                  size: 456,
                },
                {
                  name: "api.ts",
                  path: "src/utils/api.ts",
                  type: "file",
                  size: 1100,
                },
              ],
            },
            { name: "App.tsx", path: "src/App.tsx", type: "file", size: 2048 },
            {
              name: "index.tsx",
              path: "src/index.tsx",
              type: "file",
              size: 512,
            },
          ],
        },
        {
          name: "docs",
          path: "docs",
          type: "directory",
          children: [
            {
              name: "README.md",
              path: "docs/README.md",
              type: "file",
              size: 3200,
            },
            {
              name: "CONTRIBUTING.md",
              path: "docs/CONTRIBUTING.md",
              type: "file",
              size: 1800,
            },
          ],
        },
        {
          name: "package.json",
          path: "package.json",
          type: "file",
          size: 1024,
        },
        {
          name: "tsconfig.json",
          path: "tsconfig.json",
          type: "file",
          size: 680,
        },
      ],
    };

    setTree(testTree);
    setSelections(new Set());
    setExpandedDirs(new Set());
    setError(null);
  }, [setTree, setSelections, setExpandedDirs, setError]);

  const copyToClipboard = useCallback(async () => {
    if (!selections.size) return;

    if (!isElectron || !window.electronAPI) {
      setError("File copying is only available in the desktop app");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use native Electron API
      const text = await window.electronAPI.readFiles(dirPath, Array.from(selections));
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError("Failed to copy files. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dirPath, selections, setLoading, setCopySuccess, setError, isElectron]);

  const handleRemoveRecentPath = useCallback((path: string) => {
    removeRecentPath(path);
    setRecentPaths(getRecentPaths());
  }, []);

  const handleClearRecentPaths = useCallback(() => {
    clearRecentPaths();
    setRecentPaths([]);
  }, []);

  return {
    loadDirectory,
    loadTestData,
    copyToClipboard,
    showDirectoryPicker,
    isElectron,
    recentPaths,
    removeRecentPath: handleRemoveRecentPath,
    clearRecentPaths: handleClearRecentPaths,
  };
}
