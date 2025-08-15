'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderOpen } from 'lucide-react';
import type { RecentPath } from '@/lib/recent-paths';

interface WorkspaceSidebarProps {
  loading: boolean;
  recentPaths: RecentPath[];
  onBrowseDirectory: () => void;
  onSelectRecentPath: (path: string) => void;
}

export function WorkspaceSidebar({
  loading,
  recentPaths,
  onBrowseDirectory,
  onSelectRecentPath,
}: WorkspaceSidebarProps) {
  return (
    <Card className="col-span-2 bg-white/95 backdrop-blur-xl border-0 shadow-lg rounded-none border-r border-blue-200/60 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Main Content */}
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Workspaces
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Open or drag a folder to create a new workspace.
          </p>

          <div className="flex items-center justify-center gap-2">
            <Button
              onClick={onBrowseDirectory}
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
                  Open Folder
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Separator */}
        {recentPaths.length > 0 && (
          <div className="w-full max-w-xs">
            <div className="h-px bg-gray-200 my-6 mb-6"></div>
          </div>
        )}

        {/* Recent workspaces */}
        <div className="w-full max-w-xs">
          {recentPaths.length > 0 ? (
            <div className="justify-center">
              <h3 className="text-sm font-medium text-gray-700 mb-1 text-center">
                Recent workspaces
              </h3>
              <div className="space-y-1">
                {recentPaths.slice(0, 5).map((recentPath) => (
                  <button
                    key={recentPath.path}
                    onClick={() => onSelectRecentPath(recentPath.path)}
                    disabled={loading}
                    className="w-full text-center text-left px-3 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                  >
                    {recentPath.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}