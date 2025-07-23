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
import { RecentPaths } from "@/components/recent-paths";
import { FilterPopup } from "@/components/filter-popup";
import { shouldIncludeFile } from "@/lib/file-types";
import {
  shouldExcludeFileByGitignore,
  parseGitignorePatterns,
} from "@/lib/exclude-patterns";

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
  const clearingDirectory = useRef(false);
  const [isManuallyEditing, setIsManuallyEditing] = useState(false);
  const [selectedFileTypes, setSelectedFileTypes] = useState(new Set<string>());
  const [gitignorePatterns, setGitignorePatterns] = useState<string[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const {
    loadDirectory,
    loadTestData,
    copyToClipboard,
    showDirectoryPicker,
    isElectron,
    recentPaths,
    removeRecentPath,
    clearRecentPaths,
  } = useFileOperations({
    dirPath,
    selections,
    setTree,
    setSelections,
    setExpandedDirs,
    setLoading,
    setCopySuccess,
    setError,
    setDirPath,
  });

  // Load preview content when selections change (Electron only)
  const loadPreviewContent = useCallback(async () => {
    if (selections.size === 0) {
      setPreviewContent("");
      return;
    }

    if (!isElectron || !window.electronAPI) {
      setPreviewContent("Preview is only available in the desktop app");
      return;
    }

    setLoadingPreview(true);
    try {
      const content = await window.electronAPI.readFiles(
        dirPath,
        Array.from(selections)
      );
      setPreviewContent(content);
    } catch (err) {
      setPreviewContent("Error loading preview");
    } finally {
      setLoadingPreview(false);
    }
  }, [dirPath, selections, isElectron]);

  // Load preview when selections change
  useEffect(() => {
    loadPreviewContent();
  }, [loadPreviewContent]);

  // Keyboard shortcuts - only search
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
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
        setIsManuallyEditing(false); // Reset manual editing flag
        loadDirectory();
      }
    },
    [dirPath, loading, loadDirectory]
  );

  const handleBrowseDirectory = useCallback(async () => {
    const selectedPath = await showDirectoryPicker();
    if (selectedPath) {
      setDirPath(selectedPath);
      setIsManuallyEditing(false); // Reset manual editing flag
      await loadDirectory(selectedPath);
    }
  }, [showDirectoryPicker, setDirPath, loadDirectory]);

  const handleSelectRecentPath = useCallback(
    async (path: string) => {
      setDirPath(path);
      setIsManuallyEditing(false); // Reset manual editing flag
      await loadDirectory(path);
    },
    [setDirPath, loadDirectory]
  );

  const renderPreviewContent = useCallback((content: string) => {
    if (!content) {
      return (
        <pre className="p-4 text-xs font-mono text-gray-800">
          No content to preview
        </pre>
      );
    }

    // Check if content has file_map section
    const fileMapMatch = content.match(/<file_map>([\s\S]*?)<\/file_map>/);

    if (fileMapMatch) {
      const sections = [];

      // Extract and render file map
      const fileMapContent = fileMapMatch[1].trim();
      sections.push(
        <div key="file-map" className="mb-6">
          <div className="flex items-center gap-2 mb-3 px-4 pt-4">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <h4 className="text-sm font-semibold text-gray-700">
              Project Structure
            </h4>
          </div>
          <pre className="px-4 text-xs font-mono text-blue-800 bg-blue-50 border border-blue-200 rounded-lg mx-4 p-3 overflow-x-auto">
            {fileMapContent}
          </pre>
        </div>
      );

      // Extract and render files section
      const filesContent = content.replace(
        /<file_map>[\s\S]*?<\/file_map>\s*/,
        ""
      );

      sections.push(
        <div key="files" className="mb-4">
          <div className="flex items-center gap-2 mb-3 px-4">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <h4 className="text-sm font-semibold text-gray-700">
              File Contents
            </h4>
          </div>
          <pre className="px-4 text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {filesContent}
          </pre>
        </div>
      );

      return <div className="py-2">{sections}</div>;
    }

    // Fallback to original rendering
    return (
      <pre className="p-4 text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
        {content}
      </pre>
    );
  }, []);

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

        // Check if this is the root directory
        let clickedNode: FileNodeType | null = null;
        if (path === dirPath) {
          // This is the root directory
          clickedNode = {
            name: dirPath.split("/").pop() || dirPath,
            path: dirPath,
            type: "directory",
            children: tree.children,
          };
        } else {
          clickedNode = findNode(tree.children, path);
        }

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

    // Include the root directory along with all children directories
    const allDirPaths = [dirPath, ...getAllDirPaths(tree.children)];
    setExpandedDirs(new Set(allDirPaths));
  }, [tree, dirPath]);

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
    return "Copy";
  }, [copySuccess, loading]);

  const filterNodes = useCallback(
    (
      nodes: FileNodeType[],
      query: string,
      fileTypeFilter: Set<string>
    ): { filtered: FileNodeType[]; pathsToExpand: string[] } => {
      const filtered: FileNodeType[] = [];
      const pathsToExpand: string[] = [];

      for (const node of nodes) {
        // Skip files/directories that match gitignore patterns
        if (shouldExcludeFileByGitignore(node.path, gitignorePatterns)) {
          continue;
        }

        const nameMatches =
          !query || node.name.toLowerCase().includes(query.toLowerCase());
        const typeMatches =
          node.type === "directory" ||
          fileTypeFilter.size === 0 ||
          shouldIncludeFile(node.name, fileTypeFilter);

        if (node.type === "directory" && node.children) {
          const result = filterNodes(node.children, query, fileTypeFilter);
          const hasMatchingChildren = result.filtered.length > 0;

          // Include directory if it has matching children
          if ((nameMatches && hasMatchingChildren) || hasMatchingChildren) {
            const childrenToShow =
              nameMatches && !query && fileTypeFilter.size === 0
                ? node.children.filter(
                    (child) =>
                      !shouldExcludeFileByGitignore(
                        child.path,
                        gitignorePatterns
                      )
                  )
                : result.filtered;
            filtered.push({ ...node, children: childrenToShow });
            pathsToExpand.push(...result.pathsToExpand);

            if (nameMatches || hasMatchingChildren) {
              pathsToExpand.push(node.path);
            }
          }
        } else if (nameMatches && typeMatches) {
          filtered.push(node);
        }
      }

      return { filtered, pathsToExpand };
    },
    [gitignorePatterns]
  );

  // Get all available files for file type analysis (excluding gitignored files)
  const allAvailableFiles = useMemo(() => {
    if (!tree) return [];

    const collectFiles = (nodes: FileNodeType[]): string[] => {
      const files: string[] = [];
      for (const node of nodes) {
        // Skip files that match gitignore patterns
        if (shouldExcludeFileByGitignore(node.path, gitignorePatterns)) {
          continue;
        }

        if (node.type === "file") {
          files.push(node.path);
        } else if (node.children) {
          files.push(...collectFiles(node.children));
        }
      }
      return files;
    };

    return collectFiles(tree.children);
  }, [tree, gitignorePatterns]);

  // Memoize the filtered result to prevent infinite re-renders
  const filteredResult = useMemo(() => {
    if (!tree) return { filtered: [], pathsToExpand: [] };
    return filterNodes(tree.children, searchQuery, selectedFileTypes);
  }, [tree, searchQuery, selectedFileTypes, filterNodes]);

  const filteredTree = tree
    ? {
        ...tree,
        children: filteredResult.filtered,
      }
    : null;

  const toggleAll = useCallback(() => {
    if (!filteredTree) return;

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

      // Include the root directory path along with all visible children
      const allPaths = [dirPath, ...gather(filteredTree.children)];
      setSelections(new Set(allPaths));
    }
  }, [filteredTree, selections.size, dirPath]);

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

  // Set default gitignore patterns (Electron will handle actual gitignore reading)
  useEffect(() => {
    if (!tree) return;

    // Use common default patterns since Electron handles actual gitignore parsing
    setGitignorePatterns([
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "coverage/**",
      ".git/**",
    ]);
  }, [tree]);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 border-b border-blue-600/30 shadow-lg flex-shrink-0">
        <div className="px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <img
                src="/logo.png"
                alt="LLM Context Builder"
                className="w-8 h-8 rounded-lg"
              />
              <h1 className="text-xl font-semibold tracking-tight text-gray-800">
                LLM Context Builder
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Error Banner */}
        {error && (
          <div className="mx-4 sm:mx-6 mb-4 mt-4 rounded-xl bg-red-50 border border-red-200 p-4 flex-shrink-0">
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

        {/* Main Content */}
        <div className="grid grid-cols-5 flex-1 min-h-0">
          {!filteredTree ? (
            /* No Directory Loaded - Show Directory Input and Recent Paths on Left */
            <>
              {/* Left Panel - Directory Input and Recent Paths */}
              <Card className="col-span-2 p-6 bg-white/95 backdrop-blur-xl border-0 shadow-lg rounded-none border-r border-blue-200/60 flex flex-col space-y-8">
                {/* Directory Input Section */}
                <div className="space-y-6 mb-6">
                  <div className="relative flex flex-col gap-3 rounded-2xl border-2 border-dashed border-blue-300 hover:border-blue-400 p-6 transition-all duration-200">
                    {isElectron && !dirPath.trim() ? (
                      /* Electron: Show only Browse button until path is selected */
                      <div className="text-center">
                        <Button
                          onClick={handleBrowseDirectory}
                          disabled={loading}
                          variant="outline"
                          className="font-medium"
                        >
                          {loading ? (
                            <>
                              <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <FolderOpen size={16} />
                              Browse for Project Directory...
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      /* Web or Electron with selected path: Show input and buttons */
                      <>
                        <input
                          type="text"
                          placeholder="/Users/you/Projects"
                          value={dirPath}
                          onChange={(e) => {
                            setDirPath(e.target.value);
                            setIsManuallyEditing(true);
                          }}
                          onPaste={handlePaste}
                          onKeyDown={handleKeyDown}
                          className="bg-transparent text-base font-mono placeholder-gray-400 focus:outline-none text-center"
                        />

                        <div className="flex gap-2">
                          {isElectron && (
                            <Button
                              onClick={handleBrowseDirectory}
                              disabled={loading}
                              variant="outline"
                              className="flex-1 font-medium"
                            >
                              {loading ? (
                                <>
                                  <div className="w-4 h-4 mr-2 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                                  Loading...
                                </>
                              ) : (
                                <>
                                  <FolderOpen size={16} />
                                  Browse...
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            onClick={() => {
                              setIsManuallyEditing(false); // Reset manual editing flag
                              loadDirectory();
                            }}
                            disabled={loading || !dirPath.trim()}
                            className={`font-medium ${
                              isElectron ? "flex-1" : "w-full"
                            }`}
                          >
                            {loading ? (
                              <>
                                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Loading...
                              </>
                            ) : (
                              <>
                                <FolderOpen size={16} />
                                Load Directory
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Recent Paths Section */}
                <div className="flex-1 min-h-0">
                  {recentPaths.length > 0 ? (
                    <RecentPaths
                      recentPaths={recentPaths}
                      onSelectPath={handleSelectRecentPath}
                      onRemovePath={removeRecentPath}
                      onClearAll={clearRecentPaths}
                      loading={loading}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                          <FolderOpen size={16} className="text-gray-400" />
                        </div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          No Recent Projects
                        </h4>
                        <p className="text-xs text-gray-500">
                          Load a directory to see it here
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              {/* Right Panel - Welcome Message */}
              <Card className="col-span-3 p-6 bg-white border-0 shadow-lg rounded-none">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Search size={24} className="text-gray-400" />
                    </div>
                    <p className="text-gray-600">
                      Select or enter a project directory to begin browsing and
                      preparing your code context for AI conversations
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            /* Directory Loaded - Show File Browser and Preview */
            <>
              {/* File Browser */}
              <div className="col-span-2 flex flex-col min-h-0">
                <Card className="flex-1 p-6 bg-white/95 backdrop-blur-xl border-0 shadow-lg rounded-none border-r border-blue-200/60 flex flex-col min-h-0">
                  {/* Search */}
                  <div className="relative mb-2">
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
                      className="w-full pl-10 pr-10 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  {/* Tree Controls */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FilterPopup
                        selectedFileTypes={selectedFileTypes}
                        onFileTypesChange={setSelectedFileTypes}
                        availableFiles={allAvailableFiles}
                      />
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
                  <div className="flex-1 overflow-auto rounded-lg border border-blue-200/50 bg-white/60 backdrop-blur-sm min-h-0">
                    <FileTree
                      nodes={filteredTree.children}
                      toggleSelect={toggleSelect}
                      selections={selections}
                      expandedDirs={expandedDirs}
                      setExpandedDirs={setExpandedDirs}
                      searchQuery={searchQuery}
                      rootPath={dirPath}
                      onClearDirectory={() => {
                        clearingDirectory.current = true;
                        setDirPath("");
                        setTree(null);
                        setSelections(new Set());
                        setExpandedDirs(new Set());
                        setPreviewContent("");
                        setError(null);
                        setIsManuallyEditing(false); // Reset manual editing flag
                        setSelectedFileTypes(new Set()); // Clear file type filter
                      }}
                    />
                  </div>
                </Card>
              </div>

              {/* Preview Panel - Always Visible */}
              <div className="col-span-3 flex flex-col min-h-0">
                <Card className="flex-1 p-6 bg-white border-0 shadow-lg rounded-none flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-2 h-12">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Context Preview
                    </h3>
                    {previewContent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelections(new Set());
                          setPreviewContent("");
                        }}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 overflow-auto rounded-lg border border-blue-200/60 bg-blue-50/80 backdrop-blur-sm">
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
                      <div className="flex items-center justify-center h-full text-gray-500">
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
                      <div className="h-full overflow-auto">
                        {renderPreviewContent(previewContent)}
                      </div>
                    )}
                  </div>

                  {/* Copy Button and Stats */}
                  <div className="mt-6 flex items-center justify-between">
                    <Button
                      onClick={copyToClipboard}
                      disabled={loading || selections.size === 0}
                      className={cn(
                        "font-semibold transition-all duration-200",
                        copySuccess && "bg-blue-600 hover:bg-blue-700",
                        "min-w-64"
                      )}
                    >
                      <Copy size={16} /> {getButtonText()}
                    </Button>

                    {previewContent && (
                      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50/80 backdrop-blur-sm rounded-xl border border-gray-200/60">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                          <span className="text-sm font-medium text-gray-700">
                            {selectedFileCount} file
                            {selectedFileCount !== 1 ? "s" : ""}
                            {selections.size > selectedFileCount &&
                              ` (+ ${
                                selections.size - selectedFileCount
                              } folder${
                                selections.size - selectedFileCount !== 1
                                  ? "s"
                                  : ""
                              })`}
                          </span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                          <span className="text-sm font-medium text-gray-600">
                            {previewContent.split("\n").length.toLocaleString()}{" "}
                            lines
                          </span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm font-medium text-gray-600">
                            ~
                            {Math.ceil(
                              previewContent.length / 4
                            ).toLocaleString()}{" "}
                            tokens
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
