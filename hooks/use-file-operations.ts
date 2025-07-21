"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";

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
}: UseFileOperationsProps) {
  // Router for updating the URL query string
  const router = useRouter();

  const loadDirectory = useCallback(async () => {
    if (!dirPath.trim()) {
      setError("Please enter a directory path");
      return;
    }

    // Update the URL so ?dirPath=... reflects the chosen directory
    router.push(`/?dirPath=${encodeURIComponent(dirPath.trim())}`);

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/list-directory?dirPath=${encodeURIComponent(dirPath)}`
      );
      const data = await res.json();

      if (res.ok) {
        setTree({ name: dirPath, children: data });
        setSelections(new Set());
        setExpandedDirs(new Set());
      } else {
        setError(data.error || "Unable to read directory");
      }
    } catch (err) {
      setError(
        "Failed to load directory. Please check the path and try again."
      );
    } finally {
      setLoading(false);
    }
  }, [
    dirPath,
    router,
    setTree,
    setSelections,
    setExpandedDirs,
    setLoading,
    setError,
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

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/get-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dirPath,
          selections: Array.from(selections),
        }),
      });

      const text = await res.text();
      if (!res.ok) throw new Error(text);

      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError("Failed to copy files. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [dirPath, selections, setLoading, setCopySuccess, setError]);

  return {
    loadDirectory,
    loadTestData,
    copyToClipboard,
  };
}
