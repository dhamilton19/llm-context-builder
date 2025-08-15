'use client';

import type React from 'react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import FileTree from '@/components/file-tree';
import { Search } from 'lucide-react';
import { FilterPopup } from '@/components/filter-popup';

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

interface FileBrowserProps {
  filteredTree: TreeData;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedFileTypes: Set<string>;
  setSelectedFileTypes: (types: Set<string>) => void;
  allAvailableFiles: string[];
  expandAll: () => void;
  collapseAll: () => void;
  toggleAll: () => void;
  selections: Set<string>;
  toggleSelect: (path: string) => void;
  expandedDirs: Set<string>;
  setExpandedDirs: (dirs: Set<string>) => void;
  dirPath: string;
  onClearDirectory: () => void;
}

export function FileBrowser({
  filteredTree,
  searchQuery,
  setSearchQuery,
  selectedFileTypes,
  setSelectedFileTypes,
  allAvailableFiles,
  expandAll,
  collapseAll,
  toggleAll,
  selections,
  toggleSelect,
  expandedDirs,
  setExpandedDirs,
  dirPath,
  onClearDirectory,
}: FileBrowserProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
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
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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
            {selections.size ? 'Clear All' : 'Select All'}
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
            onClearDirectory={onClearDirectory}
          />
        </div>
      </Card>
    </div>
  );
}