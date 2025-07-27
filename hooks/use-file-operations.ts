"use client";

import { useCallback, useState, useEffect } from "react";
import { getRecentPaths, addRecentPath, removeRecentPath, clearRecentPaths, type RecentPath } from "@/lib/recent-paths";
import { countTokens } from "@/lib/token-counter";

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
      streamDirectoryContents: (dirPath: string) => void;
      onDirectoryEntry: (callback: (entry: any) => void) => void;
      onDirectoryStreamEnd: (callback: () => void) => void;
      onDirectoryStreamError: (callback: (error: string) => void) => void;
      cleanupDirectoryListeners: () => void;
      readFiles: (dirPath: string, selections: string[]) => Promise<string>;
      onDirectorySelected: (callback: (event: any, path:string) => void) => void;
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

  // Handle directory selection from menu or drag-and-drop
  useEffect(() => {
    if (!isElectron || !window.electronAPI) return;

    const handleDirectorySelected = (event: any, selectedPath: string) => {
      if (selectedPath) {
        setDirPath(selectedPath);
        loadDirectory(selectedPath);
      }
    };

    window.electronAPI.onDirectorySelected(handleDirectorySelected);

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeDirectorySelectedListener(handleDirectorySelected);
      }
    };
  }, [isElectron, setDirPath, loadDirectory]);

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

  const loadDirectory = useCallback((pathToLoad?: string) => {
    const targetPath = pathToLoad || dirPath;
    if (!targetPath.trim() || !isElectron || !window.electronAPI) {
      setError(!isElectron ? "Directory loading is only available in the desktop app" : "Please enter a directory path");
      return;
    }

    setLoading(true);
    setError(null);
    setTree(null);
    setSelections(new Set());
    setExpandedDirs(new Set());

    const newTree: TreeData = { name: targetPath, children: [] };
    const nodeMap: { [key: string]: FileNodeType } = { '': { name: targetPath, path: '', type: 'directory', children: newTree.children } };

    // Cleanup previous listeners
    window.electronAPI.cleanupDirectoryListeners();

    // Handle incoming file/directory entries
    window.electronAPI.onDirectoryEntry((entry) => {
      const parentNode = entry.parent ? nodeMap[entry.parent] : nodeMap[''];
      if (parentNode && parentNode.children) {
        const newNode: FileNodeType = { ...entry, children: entry.type === 'directory' ? [] : undefined };
        parentNode.children.push(newNode);
        if (entry.type === 'directory') {
          nodeMap[entry.path] = newNode;
        }
      }
    });

    // Handle stream end
    window.electronAPI.onDirectoryStreamEnd(() => {
      // Sort the tree
      const sortChildren = (node: FileNodeType) => {
        if (!node.children) return;
        node.children.sort((a, b) => {
          if (a.type === 'directory' && b.type !== 'directory') return -1;
          if (a.type !== 'directory' && b.type === 'directory') return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortChildren);
      };
      
      sortChildren(nodeMap['']);

      setTree(newTree);
      setExpandedDirs(new Set([targetPath]));
      addRecentPath(targetPath);
      setRecentPaths(getRecentPaths());
      setLoading(false);

      // Final cleanup
      window.electronAPI!.cleanupDirectoryListeners();
    });

    // Handle stream error
    window.electronAPI.onDirectoryStreamError((error) => {
      setError(`Error reading directory: ${error}`);
      setLoading(false);
      window.electronAPI!.cleanupDirectoryListeners();
    });

    // Start the stream
    window.electronAPI.streamDirectoryContents(targetPath);

  }, [dirPath, isElectron, setTree, setSelections, setExpandedDirs, setLoading, setError]);

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
      const text = await window.electronAPI.readFiles(dirPath, Array.from(selections));

      // Check token count before copying
      const tokenCount = countTokens(text);
      const TOKEN_LIMIT = 100000;

      if (tokenCount > TOKEN_LIMIT) {
        setError(`Copy limit exceeded: ${tokenCount} tokens is over the ${TOKEN_LIMIT} token limit.`);
        setLoading(false);
        return;
      }

      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);

    } catch (err) {
      setError("Failed to copy files. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dirPath, selections, isElectron, setLoading, setCopySuccess, setError]);

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
