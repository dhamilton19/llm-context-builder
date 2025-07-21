"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import FileTree from "@/components/file-tree";
import { FolderOpen, Copy, Search, Command, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useFileOperations } from "@/hooks/use-file-operations";
import { useRouter, useSearchParams } from "next/navigation";

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

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dirPath, setDirPath] = useState("");
  const [tree, setTree] = useState<TreeData | null>(null);
  const [selections, setSelections] = useState(new Set<string>());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDirs, setExpandedDirs] = useState(new Set<string>());
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { loadDirectory, loadTestData, copyToClipboard } = useFileOperations({
    dirPath,
    selections,
    setTree,
    setSelections,
    setExpandedDirs,
    setLoading,
    setCopySuccess,
    setError,
  });

  // Load preview content when selections change
  const loadPreviewContent = useCallback(async () => {
    console.log(
      "loadPreviewContent called with selections:",
      Array.from(selections)
    );
    console.log("dirPath:", dirPath);

    if (selections.size === 0) {
      console.log("No selections, clearing preview");
      setPreviewContent("");
      return;
    }

    setLoadingPreview(true);
    try {
      const requestBody = {
        dirPath,
        selections: Array.from(selections),
      };
      console.log("Making API request to /api/get-files with:", requestBody);

      const res = await fetch("/api/get-files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("API response status:", res.status);
      console.log("API response ok:", res.ok);

      if (res.ok) {
        const content = await res.text();
        console.log("API response content length:", content.length);
        console.log("API response content preview:", content.substring(0, 200));
        setPreviewContent(content);
      } else {
        const errorText = await res.text();
        console.log("API error response:", errorText);
        setPreviewContent("Error loading preview");
      }
    } catch (err) {
      console.log("API request error:", err);
      setPreviewContent("Error loading preview");
    } finally {
      setLoadingPreview(false);
    }
  }, [dirPath, selections]);

  // Load preview when selections change
  useEffect(() => {
    loadPreviewContent();
  }, [loadPreviewContent]);

  // Keyboard shortcuts - very Apple
  useKeyboardShortcuts({
    onSelectAll: () => {
      // Only select files if search input is not focused
      if (document.activeElement !== searchInputRef.current) {
        toggleAll();
      }
    },
    onCopy: () => {
      // Only copy if search input is not focused
      if (
        document.activeElement !== searchInputRef.current &&
        selections.size > 0
      ) {
        copyToClipboard();
      }
    },
    onSearch: () => searchInputRef.current?.focus(),
    onEscape: () => {
      if (document.activeElement === searchInputRef.current) {
        // If search is focused, clear it and blur
        setSearchQuery("");
        searchInputRef.current?.blur();
      } else {
        // Otherwise clear selections
        setSelections(new Set());
      }
    },
  });

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      // Get the pasted text from the clipboard
      const pastedText = e.clipboardData.getData("text");

      let cleanPath = pastedText
        .replace(/^["']|["']$/g, "") // Remove surrounding quotes
        .replace(/\\/g, "/") // Convert backslashes to forward slashes
        .trim();

      // Handle file:// URLs
      if (cleanPath.startsWith("file://")) {
        cleanPath = decodeURIComponent(cleanPath.substring(7)); // Remove 'file://' and decode URI
      }

      if (cleanPath !== pastedText) {
        e.preventDefault(); // Prevent the default paste
        setDirPath(cleanPath);
      }
    },
    []
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && dirPath.trim() && !loading) {
        loadDirectory();
      }
    },
    [dirPath, loading, loadDirectory]
  );

  const toggleSelect = useCallback(
    (path: string) => {
      console.log("toggleSelect called with path:", path);
      setSelections((prev) => {
        console.log("Previous selections:", Array.from(prev));
        const next = new Set(prev);

        if (!tree) return next;

        const findNode = (
          nodes: FileNodeType[],
          targetPath: string
        ): FileNodeType | null => {
          for (const node of nodes) {
            if (node.path === targetPath) return node;
            if (node.type === "directory" && node.children) {
              const found = findNode(node.children, targetPath);
              if (found) return found;
            }
          }
          return null;
        };

        const getAllDescendants = (node: FileNodeType): string[] => {
          if (node.type === "file") return [node.path];

          const descendants = [node.path];
          if (node.children) {
            for (const child of node.children) {
              descendants.push(...getAllDescendants(child));
            }
          }
          return descendants;
        };

        const getAllAncestors = (targetPath: string): string[] => {
          const ancestors: string[] = [];
          const pathParts = targetPath.split("/").filter(Boolean);

          for (let i = 1; i <= pathParts.length; i++) {
            const ancestorPath = pathParts.slice(0, i).join("/");
            if (ancestorPath && ancestorPath !== targetPath) {
              ancestors.push(ancestorPath);
            }
          }
          return ancestors;
        };

        const areAllChildrenSelected = (
          node: FileNodeType,
          selections: Set<string>
        ): boolean => {
          if (node.type === "file") return selections.has(node.path);
          if (!node.children) return true;

          return node.children.every((child) => {
            if (child.type === "file") {
              return selections.has(child.path);
            } else {
              return (
                selections.has(child.path) &&
                areAllChildrenSelected(child, selections)
              );
            }
          });
        };

        const clickedNode = findNode(tree.children, path);
        if (!clickedNode) return next;

        if (next.has(path)) {
          const toRemove = getAllDescendants(clickedNode);
          toRemove.forEach((p) => next.delete(p));

          const ancestors = getAllAncestors(path);
          ancestors.forEach((ancestorPath) => next.delete(ancestorPath));
        } else {
          const toAdd = getAllDescendants(clickedNode);
          toAdd.forEach((p) => next.add(p));

          const ancestors = getAllAncestors(path);
          for (const ancestorPath of ancestors) {
            const ancestorNode = findNode(tree.children, ancestorPath);
            if (ancestorNode && areAllChildrenSelected(ancestorNode, next)) {
              next.add(ancestorPath);
            }
          }
        }

        console.log("New selections after toggle:", Array.from(next));
        return next;
      });
    },
    [tree]
  );

  const toggleAll = useCallback(() => {
    if (!tree) return;

    if (selections.size) {
      setSelections(new Set());
    } else {
      const gather = (nodes: FileNodeType[]): string[] =>
        nodes.reduce(
          (acc: string[], n) => [
            ...acc,
            n.path,
            ...(n.type === "directory" && n.children ? gather(n.children) : []),
          ],
          []
        );

      setSelections(new Set(gather(tree.children)));
    }
  }, [tree, selections.size]);

  const expandAll = useCallback(() => {
    if (!tree) return;

    const getAllDirPaths = (nodes: FileNodeType[]): string[] => {
      return nodes.reduce((acc: string[], node) => {
        if (node.type === "directory") {
          acc.push(node.path);
          if (node.children) {
            acc.push(...getAllDirPaths(node.children));
          }
        }
        return acc;
      }, []);
    };

    setExpandedDirs(new Set(getAllDirPaths(tree.children)));
  }, [tree]);

  const collapseAll = useCallback(() => {
    setExpandedDirs(new Set());
  }, []);

  // Get selected file count for display
  const selectedFileCount = useMemo(() => {
    return Array.from(selections).filter((path) => {
      if (!tree) return false;

      const findNode = (
        nodes: FileNodeType[],
        targetPath: string
      ): FileNodeType | null => {
        for (const node of nodes) {
          if (node.path === targetPath) return node;
          if (node.type === "directory" && node.children) {
            const found = findNode(node.children, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const node = findNode(tree.children, path);
      return node?.type === "file";
    }).length;
  }, [selections, tree]);

  const getButtonText = useCallback(() => {
    if (copySuccess) return "Copied!";
    if (loading) return "Preparing...";
    if (selections.size === 0) return "Select files to copy";

    // Count actual files vs folders
    const fileCount = selectedFileCount;
    const folderCount = selections.size - selectedFileCount;

    if (selections.size === 1) {
      return fileCount === 1 ? "Copy 1 file" : "Copy 1 folder";
    }

    if (folderCount === 0) {
      return `Copy ${fileCount} file${fileCount === 1 ? "" : "s"}`;
    } else if (fileCount === 0) {
      return `Copy ${folderCount} folder${folderCount === 1 ? "" : "s"}`;
    } else {
      return `Copy ${fileCount} file${
        fileCount === 1 ? "" : "s"
      } + ${folderCount} folder${folderCount === 1 ? "" : "s"}`;
    }
  }, [copySuccess, loading, selections.size, selectedFileCount]);

  const filterNodes = useCallback(
    (
      nodes: FileNodeType[],
      query: string
    ): { filtered: FileNodeType[]; pathsToExpand: string[] } => {
      if (!query) return { filtered: nodes, pathsToExpand: [] };

      const filtered: FileNodeType[] = [];
      const pathsToExpand: string[] = [];

      for (const node of nodes) {
        const matches = node.name.toLowerCase().includes(query.toLowerCase());

        if (node.type === "directory" && node.children) {
          const result = filterNodes(node.children, query);
          const hasMatchingChildren = result.filtered.length > 0;

          if (matches || hasMatchingChildren) {
            filtered.push({ ...node, children: result.filtered });
            pathsToExpand.push(...result.pathsToExpand);

            // If this directory contains matches, it should be expanded
            if (hasMatchingChildren) {
              pathsToExpand.push(node.path);
            }
          }
        } else if (matches) {
          filtered.push(node);
        }
      }

      return { filtered, pathsToExpand };
    },
    []
  );

  // Memoize the filtered result to prevent infinite re-renders
  const filteredResult = useMemo(() => {
    if (!tree) return { filtered: [], pathsToExpand: [] };
    return filterNodes(tree.children, searchQuery);
  }, [tree, searchQuery, filterNodes]);

  const filteredTree = tree
    ? {
        ...tree,
        children: filteredResult.filtered,
      }
    : null;

  // Auto-expand directories containing search matches
  useEffect(() => {
    if (searchQuery && filteredResult.pathsToExpand.length > 0) {
      setExpandedDirs((prev) => {
        const newPaths = filteredResult.pathsToExpand.filter(
          (path) => !prev.has(path)
        );
        if (newPaths.length > 0) {
          return new Set([...prev, ...newPaths]);
        }
        return prev;
      });
    }
  }, [searchQuery, filteredResult.pathsToExpand]);

  // Load directory from URL on mount
  useEffect(() => {
    const urlDirPath = searchParams.get("dirPath");
    if (urlDirPath && urlDirPath !== dirPath) {
      setDirPath(urlDirPath);
    }
  }, [searchParams, dirPath]);

  // Auto-load directory when dirPath is set from URL
  useEffect(() => {
    const urlDirPath = searchParams.get("dirPath");
    if (urlDirPath && urlDirPath === dirPath && dirPath.trim() && !tree) {
      loadDirectory();
    }
  }, [searchParams, dirPath, tree, loadDirectory]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
            LLM Context Builder
          </h1>
          <p className="text-lg text-gray-600 font-medium">
            Prepare your code for AI conversations
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-red-400 rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Directory Input */}
        <Card className="p-6 bg-white/80 backdrop-blur-xl border-0 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700">
                Project Directory
              </label>
              {/* <Button
                variant="secondary"
                onClick={loadTestData}
                className="text-xs font-medium"
              >
                Load Sample Project
              </Button> */}
            </div>

            <div className="relative flex gap-3 rounded-2xl border-2 border-dashed border-gray-300 hover:border-gray-400 p-6 transition-all duration-20 items-center">
              <input
                type="text"
                placeholder="/Users/you/Projects"
                value={dirPath}
                onChange={(e) => setDirPath(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent text-base font-mono placeholder-gray-400 focus:outline-none"
              />

              <Button
                onClick={loadDirectory}
                disabled={loading || !dirPath.trim()}
                className="shrink-0 font-medium"
                size="sm"
              >
                <FolderOpen size={16} />
                {loading ? "Loading..." : "Load"}
              </Button>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Command size={12} />
              <span>Type or paste full folder path</span>
            </div>
          </div>
        </Card>

        {/* Main Content - Always Two Columns When Tree Exists */}
        {filteredTree && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* File Browser */}
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-0 shadow-xl">
              {/* Controls */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Button
                    variant="secondary"
                    onClick={expandAll}
                    size="sm"
                    className="font-medium"
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={collapseAll}
                    size="sm"
                    className="font-medium"
                  >
                    Collapse All
                  </Button>

                  {/* Search */}
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Filter files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          searchInputRef.current?.focus();
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={toggleAll}
                  size="sm"
                  className="font-medium"
                >
                  {selections.size ? "Clear All" : "Select All"}
                </Button>
              </div>

              {/* File Tree */}
              <div className="max-h-[60vh] min-h-[60vh] overflow-auto rounded-xl border border-gray-100 bg-gray-50/50">
                <FileTree
                  nodes={filteredTree.children}
                  toggleSelect={toggleSelect}
                  selections={selections}
                  expandedDirs={expandedDirs}
                  setExpandedDirs={setExpandedDirs}
                  searchQuery={searchQuery}
                />
              </div>

              {/* Copy Button */}
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={copyToClipboard}
                  disabled={loading || selections.size === 0}
                  className={cn(
                    "font-semibold transition-all duration-200",
                    copySuccess && "bg-green-600 hover:bg-green-700",
                    "min-w-72"
                  )}
                >
                  <Copy size={16} />
                  {getButtonText()}
                </Button>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    ⌘A
                  </kbd>
                  <span>Select All</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    ⌘C
                  </kbd>
                  <span>Copy</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                    ⌘F
                  </kbd>
                  <span>Search</span>
                </div>
              </div>
            </Card>

            {/* Preview Panel - Always Visible */}
            <Card className="p-6 bg-white/80 backdrop-blur-xl border-0 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Context Preview
                </h3>
              </div>

              <div className="mt-8 max-h-[60vh] min-h-[60vh] overflow-auto rounded-xl border border-gray-200 bg-gray-50">
                {loadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-600">
                        Loading preview...
                      </p>
                    </div>
                  </div>
                ) : selections.size === 0 ? (
                  <div className="flex items-center justify-center py-12 text-gray-500">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                        <Eye size={24} className="text-gray-400" />
                      </div>
                      <p className="font-medium text-gray-700">
                        Select files to preview
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Choose files from the tree to see their content here
                      </p>
                    </div>
                  </div>
                ) : (
                  <pre className="p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {previewContent || "No content to preview"}
                  </pre>
                )}
              </div>
              {previewContent && (
                <div className="mt-4 flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-4">
                    <span className="font-medium">
                      {selections.size > 0 && (
                        <>
                          {selectedFileCount} file
                          {selectedFileCount !== 1 ? "s" : ""}
                          {selections.size > selectedFileCount &&
                            ` (+ ${selections.size - selectedFileCount} folder${
                              selections.size - selectedFileCount !== 1
                                ? "s"
                                : ""
                            })`}
                        </>
                      )}
                    </span>
                    <span className="font-medium">
                      {previewContent.split("\n").length} lines
                    </span>
                    <span>
                      {previewContent.length.toLocaleString()} characters
                    </span>
                  </div>
                  <span className="font-medium text-blue-600">
                    ~{Math.ceil(previewContent.length / 4).toLocaleString()}{" "}
                    tokens
                  </span>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
