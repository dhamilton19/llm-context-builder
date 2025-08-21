'use client';

import type React from 'react';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useFileOperations } from '@/hooks/use-file-operations';
import { shouldIncludeFile } from '@/lib/file-types';
import {
  shouldExcludeFileByGitignore,
  parseGitignorePatterns,
} from '@/lib/exclude-patterns';
import { WorkspaceSidebar } from '@/components/workspace-sidebar';
import { FileBrowser } from '@/components/file-browser';
import { PreviewPanel } from '@/components/preview-panel';

interface FileNodeType {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: FileNodeType[];
}

interface TreeData {
  name: string;
  children: FileNodeType[];
}

export default function Home() {
  const [dirPath, setDirPath] = useState('');
  const [tree, setTree] = useState<TreeData | null>(null);
  const [selections, setSelections] = useState(new Set<string>());
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDirs, setExpandedDirs] = useState(new Set<string>());
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string>('');
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
      setPreviewContent('');
      return;
    }

    if (!isElectron || !window.electronAPI) {
      setPreviewContent('Preview is only available in the desktop app');
      return;
    }

    setLoadingPreview(true);
    try {
      const content = await window.electronAPI.readFiles(
        dirPath,
        Array.from(selections),
      );
      setPreviewContent(content);
    } catch (err) {
      setPreviewContent('Error loading preview');
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
      const pastedText = e.clipboardData.getData('text');

      let cleanPath = pastedText
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/\\/g, '/') // Convert backslashes to forward slashes
        .trim();

      // Handle file:// URLs
      if (cleanPath.startsWith('file://')) {
        cleanPath = decodeURIComponent(cleanPath.substring(7)); // Remove 'file://' and decode URI
      }

      if (cleanPath !== pastedText) {
        e.preventDefault(); // Prevent the default paste
        setDirPath(cleanPath);
      }
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && dirPath.trim() && !loading) {
        setIsManuallyEditing(false); // Reset manual editing flag
        loadDirectory();
      }
    },
    [dirPath, loading, loadDirectory],
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
    [setDirPath, loadDirectory],
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
            <h4 className="text-sm font-medium text-gray-700">
              Project Structure
            </h4>
          </div>
          <pre className="px-4 text-xs font-mono text-blue-800 bg-blue-50 border border-blue-200 rounded-lg mx-4 p-3 overflow-x-auto">
            {fileMapContent}
          </pre>
        </div>,
      );

      // Extract and render files section
      const filesContent = content.replace(
        /<file_map>[\s\S]*?<\/file_map>\s*/,
        '',
      );

      sections.push(
        <div key="files" className="mb-4">
          <div className="flex items-center gap-2 mb-3 px-4">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <h4 className="text-sm font-medium text-gray-700">File Contents</h4>
          </div>
          <pre className="px-4 text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {filesContent}
          </pre>
        </div>,
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


  const expandAll = useCallback(() => {
    if (!tree) return;

    const getAllDirPaths = (nodes: FileNodeType[]): string[] => {
      return nodes.reduce((acc: string[], node) => {
        if (node.type === 'directory') {
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
        targetPath: string,
      ): FileNodeType | null => {
        for (const node of nodes) {
          if (node.path === targetPath) return node;
          if (node.type === 'directory' && node.children) {
            const found = findNode(node.children, targetPath);
            if (found) return found;
          }
        }
        return null;
      };

      const node = findNode(tree.children, path);
      return node?.type === 'file';
    }).length;
  }, [selections, tree]);

  const getButtonText = useCallback(() => {
    if (copySuccess) return 'Copied!';
    return 'Copy';
  }, [copySuccess, loading]);

  const filterNodes = useCallback(
    (
      nodes: FileNodeType[],
      query: string,
      fileTypeFilter: Set<string>,
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
          node.type === 'directory' ||
          fileTypeFilter.size === 0 ||
          shouldIncludeFile(node.name, fileTypeFilter);

        if (node.type === 'directory' && node.children) {
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
                        gitignorePatterns,
                      ),
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
    [gitignorePatterns],
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

        if (node.type === 'file') {
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

  const toggleSelect = useCallback(
    (path: string) => {
      setSelections((prev) => {
        const next = new Set(prev);

        if (!tree || !filteredTree) return next;

        const findNode = (
          nodes: FileNodeType[],
          targetPath: string,
        ): FileNodeType | null => {
          for (const node of nodes) {
            if (node.path === targetPath) return node;
            if (node.type === 'directory' && node.children) {
              const found = findNode(node.children, targetPath);
              if (found) return found;
            }
          }
          return null;
        };

        const getAllDescendants = (node: FileNodeType): string[] => {
          if (node.type === 'file') return [node.path];

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
          const pathParts = targetPath.split('/').filter(Boolean);

          for (let i = 1; i <= pathParts.length; i++) {
            const ancestorPath = pathParts.slice(0, i).join('/');
            if (ancestorPath && ancestorPath !== targetPath) {
              ancestors.push(ancestorPath);
            }
          }
          return ancestors;
        };

        const areAllChildrenSelected = (
          node: FileNodeType,
          selections: Set<string>,
        ): boolean => {
          if (node.type === 'file') return selections.has(node.path);
          if (!node.children) return true;

          return node.children.every((child) => {
            if (child.type === 'file') {
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
          // This is the root directory - use filtered children
          clickedNode = {
            name: dirPath.split('/').pop() || dirPath,
            path: dirPath,
            type: 'directory',
            children: filteredTree.children,
          };
        } else {
          // Find the node in the filtered tree
          clickedNode = findNode(filteredTree.children, path);
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
            // Check ancestors in the filtered tree
            const ancestorNode = findNode(filteredTree.children, ancestorPath);
            if (ancestorNode && areAllChildrenSelected(ancestorNode, next)) {
              next.add(ancestorPath);
            }
          }
        }

        return next;
      });
    },
    [tree, filteredTree, dirPath],
  );

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
            ...(n.type === 'directory' && n.children ? gather(n.children) : []),
          ],
          [],
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
          (path) => !prev.has(path),
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
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '.git/**',
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
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-hidden">
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
            /* No Directory Loaded - Show Workspace Sidebar and Preview Panel */
            <>
              <WorkspaceSidebar
                loading={loading}
                recentPaths={recentPaths}
                onBrowseDirectory={handleBrowseDirectory}
                onSelectRecentPath={handleSelectRecentPath}
                onRemoveRecentPath={removeRecentPath}
              />
              <PreviewPanel
                previewContent=""
                loadingPreview={false}
                selections={new Set()}
                selectedFileCount={0}
                copyToClipboard={copyToClipboard}
                getButtonText={getButtonText}
                copySuccess={copySuccess}
                loading={loading}
                onClearSelections={() => {}}
                renderPreviewContent={renderPreviewContent}
              />
            </>
          ) : (
            /* Directory Loaded - Show File Browser and Preview */
            <>
              <FileBrowser
                filteredTree={filteredTree}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedFileTypes={selectedFileTypes}
                setSelectedFileTypes={setSelectedFileTypes}
                allAvailableFiles={allAvailableFiles}
                expandAll={expandAll}
                collapseAll={collapseAll}
                toggleAll={toggleAll}
                selections={selections}
                toggleSelect={toggleSelect}
                expandedDirs={expandedDirs}
                setExpandedDirs={setExpandedDirs}
                dirPath={dirPath}
                onClearDirectory={() => {
                  clearingDirectory.current = true;
                  setDirPath('');
                  setTree(null);
                  setSelections(new Set());
                  setExpandedDirs(new Set());
                  setPreviewContent('');
                  setError(null);
                  setIsManuallyEditing(false);
                  setSelectedFileTypes(new Set());
                  setSearchQuery('');
                }}
              />
              <PreviewPanel
                previewContent={previewContent}
                loadingPreview={loadingPreview}
                selections={selections}
                selectedFileCount={selectedFileCount}
                copyToClipboard={copyToClipboard}
                getButtonText={getButtonText}
                copySuccess={copySuccess}
                loading={loading}
                onClearSelections={() => {
                  setSelections(new Set());
                  setPreviewContent('');
                }}
                renderPreviewContent={renderPreviewContent}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
