'use client';

import type React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FolderOpen, X } from 'lucide-react';
import type { RecentPath } from '@/lib/recent-paths';

interface WorkspaceSidebarProps {
  loading: boolean;
  recentPaths: RecentPath[];
  onBrowseDirectory: () => void;
  onSelectRecentPath: (path: string) => void;
  onRemoveRecentPath?: (path: string) => void;
}

export function WorkspaceSidebar({
  loading,
  recentPaths,
  onBrowseDirectory,
  onSelectRecentPath,
  onRemoveRecentPath,
}: WorkspaceSidebarProps) {
  return (
    <Card className="col-span-2 bg-white/98 backdrop-blur-xl border-0 shadow-sm rounded-none border-r border-gray-200 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* Main Content */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">
            Project Context
          </h2>
          <p className="text-base text-gray-500 leading-relaxed max-w-xs mx-auto">
            Open a folder to start building your context.
          </p>

          <div
            className="flex items-center justify-center"
            style={{ marginTop: '8px' }}
          >
            <button
              onClick={onBrowseDirectory}
              disabled={loading}
              className="font-medium text-base text-gray-700 flex items-center gap-3 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
                border: '1px solid #cbd5e1',
                boxShadow: `
                  0 2px 4px rgba(0, 0, 0, 0.08),
                  0 1px 2px rgba(0, 0, 0, 0.06),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                `,
                transform: 'translateY(0px)',
              }}
              onMouseEnter={(e) => {
                e.target.style.background =
                  'linear-gradient(145deg, #f1f5f9 0%, #cbd5e1 100%)';
                e.target.style.boxShadow = `
                  0 3px 6px rgba(0, 0, 0, 0.12),
                  0 2px 4px rgba(0, 0, 0, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.7),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.06)
                `;
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.target.style.background =
                    'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)';
                  e.target.style.boxShadow = `
                    0 2px 4px rgba(0, 0, 0, 0.08),
                    0 1px 2px rgba(0, 0, 0, 0.06),
                    inset 0 1px 0 rgba(255, 255, 255, 0.6),
                    inset 0 -1px 0 rgba(0, 0, 0, 0.05)
                  `;
                  e.target.style.transform = 'translateY(0px)';
                }
              }}
              onMouseDown={(e) => {
                e.target.style.background =
                  'linear-gradient(145deg, #e2e8f0 0%, #cbd5e1 100%)';
                e.target.style.boxShadow = `
                  0 1px 2px rgba(0, 0, 0, 0.12),
                  inset 0 2px 4px rgba(0, 0, 0, 0.1),
                  inset 0 1px 0 rgba(0, 0, 0, 0.05)
                `;
                e.target.style.transform = 'translateY(1px)';
              }}
              onMouseUp={(e) => {
                if (!loading) {
                  e.target.style.transform = 'translateY(-1px)';
                }
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  <FolderOpen size={16} />
                  Open Folder
                </>
              )}
            </button>
          </div>
        </div>

        {/* Separator */}
        {recentPaths.length > 0 && (
          <div
            className="w-full max-w-sm mx-auto"
            style={{ marginBottom: '24px', marginTop: '24px' }}
          >
            <div className="h-px bg-gray-200"></div>
          </div>
        )}

        {/* Recent workspaces */}
        {recentPaths.length > 0 && (
          <div className="w-full max-w-sm" style={{ marginTop: '' }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <h3 className="text-base font-medium text-gray-700 text-center tracking-tight">
                Recent Projects
              </h3>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                {recentPaths.slice(0, 5).map((recentPath) => (
                  <div
                    key={recentPath.path}
                    className="flex items-center gap-3 group"
                  >
                    <button
                      onClick={() => onSelectRecentPath(recentPath.path)}
                      disabled={loading}
                      className="flex-1 text-left text-sm font-medium text-gray-700 rounded-lg transition-all duration-150"
                      style={{
                        padding: '12px 16px',
                        background: '#ffffff',
                        border: '1px solid transparent',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.target.style.background = '#f8fafc';
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.color = '#1f2937';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.target.style.background = '#ffffff';
                          e.target.style.borderColor = 'transparent';
                          e.target.style.color = '#374151';
                        }
                      }}
                    >
                      {recentPath.name}
                    </button>
                    {onRemoveRecentPath && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveRecentPath(recentPath.path);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                        title="Remove from recent projects"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
