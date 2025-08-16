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
      <Card className="flex-1 p-6 bg-white/98 backdrop-blur-xl border-0 shadow-sm rounded-none border-r border-gray-200 flex flex-col min-h-0">
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
            className="w-full pl-10 pr-10 py-3 text-sm rounded-xl focus:outline-none transition-all duration-200"
            style={{
              background: 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
              border: '1px solid #d1d5db',
              boxShadow: `
                inset 0 2px 4px rgba(0, 0, 0, 0.06),
                inset 0 1px 2px rgba(0, 0, 0, 0.04),
                0 1px 0 rgba(255, 255, 255, 0.8)
              `,
              color: '#374151'
            }}
            onFocus={(e) => {
              e.target.style.boxShadow = `
                inset 0 2px 4px rgba(59, 130, 246, 0.1),
                inset 0 1px 2px rgba(59, 130, 246, 0.08),
                0 0 0 3px rgba(59, 130, 246, 0.1),
                0 1px 0 rgba(255, 255, 255, 0.8)
              `;
              e.target.style.borderColor = '#3b82f6';
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = `
                inset 0 2px 4px rgba(0, 0, 0, 0.06),
                inset 0 1px 2px rgba(0, 0, 0, 0.04),
                0 1px 0 rgba(255, 255, 255, 0.8)
              `;
              e.target.style.borderColor = '#d1d5db';
            }}
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
            <button
              onClick={expandAll}
              className="font-medium text-sm transition-all duration-150"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '1px solid #cbd5e1',
                color: '#374151',
                boxShadow: `
                  0 1px 2px rgba(0, 0, 0, 0.05),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(145deg, #f1f5f9 0%, #cbd5e1 100%)';
                e.target.style.transform = 'translateY(-0.5px)';
                e.target.style.boxShadow = `
                  0 2px 4px rgba(0, 0, 0, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.06)
                `;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = `
                  0 1px 2px rgba(0, 0, 0, 0.05),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `;
              }}
              onMouseDown={(e) => {
                e.target.style.background = 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)';
                e.target.style.transform = 'translateY(0.5px)';
                e.target.style.boxShadow = `
                  inset 0 1px 2px rgba(0, 0, 0, 0.1),
                  0 1px 1px rgba(0, 0, 0, 0.05)
                `;
              }}
              onMouseUp={(e) => {
                e.target.style.transform = 'translateY(-0.5px)';
              }}
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="font-medium text-sm transition-all duration-150"
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '1px solid #cbd5e1',
                color: '#374151',
                boxShadow: `
                  0 1px 2px rgba(0, 0, 0, 0.05),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'linear-gradient(145deg, #f1f5f9 0%, #cbd5e1 100%)';
                e.target.style.transform = 'translateY(-0.5px)';
                e.target.style.boxShadow = `
                  0 2px 4px rgba(0, 0, 0, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.06)
                `;
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)';
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = `
                  0 1px 2px rgba(0, 0, 0, 0.05),
                  inset 0 1px 0 rgba(255, 255, 255, 0.5),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `;
              }}
              onMouseDown={(e) => {
                e.target.style.background = 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)';
                e.target.style.transform = 'translateY(0.5px)';
                e.target.style.boxShadow = `
                  inset 0 1px 2px rgba(0, 0, 0, 0.1),
                  0 1px 1px rgba(0, 0, 0, 0.05)
                `;
              }}
              onMouseUp={(e) => {
                e.target.style.transform = 'translateY(-0.5px)';
              }}
            >
              Collapse All
            </button>
          </div>

          <button
            onClick={toggleAll}
            className="font-medium text-sm transition-all duration-150"
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
              border: '1px solid #cbd5e1',
              color: '#374151',
              boxShadow: `
                0 1px 2px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'linear-gradient(145deg, #f1f5f9 0%, #cbd5e1 100%)';
              e.target.style.transform = 'translateY(-0.5px)';
              e.target.style.boxShadow = `
                0 2px 4px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                inset 0 -1px 0 rgba(0, 0, 0, 0.06)
              `;
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)';
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = `
                0 1px 2px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `;
            }}
            onMouseDown={(e) => {
              e.target.style.background = 'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)';
              e.target.style.transform = 'translateY(0.5px)';
              e.target.style.boxShadow = `
                inset 0 1px 2px rgba(0, 0, 0, 0.1),
                0 1px 1px rgba(0, 0, 0, 0.05)
              `;
            }}
            onMouseUp={(e) => {
              e.target.style.transform = 'translateY(-0.5px)';
            }}
          >
            {selections.size ? 'Clear All' : 'Select All'}
          </button>
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