"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FolderOpen, X, Trash2, Clock } from "lucide-react";
import type { RecentPath } from "@/lib/recent-paths";

interface RecentPathsProps {
  recentPaths: RecentPath[];
  onSelectPath: (path: string) => void;
  onRemovePath: (path: string) => void;
  onClearAll: () => void;
  loading?: boolean;
}

export function RecentPaths({
  recentPaths,
  onSelectPath,
  onRemovePath,
  onClearAll,
  loading = false,
}: RecentPathsProps) {
  if (recentPaths.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <Clock size={24} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Recent Paths
        </h3>
        <p className="text-gray-600 text-sm">
          Previously accessed directories will appear here
        </p>
      </div>
    );
  }

  const formatLastAccessed = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">Recent</h3>
          <span className="text-sm text-gray-500">({recentPaths.length})</span>
        </div>
        {recentPaths.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-gray-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} />
            Clear All
          </Button>
        )}
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {recentPaths.map((recentPath) => (
          <Card
            key={recentPath.path}
            className="p-3 bg-white/80 hover:bg-white/90 border border-gray-200/60 hover:border-gray-300/60 transition-all duration-200 cursor-pointer group"
            onClick={() => onSelectPath(recentPath.path)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <FolderOpen size={16} className="text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">
                      {recentPath.name}
                    </p>
                  </div>
                  <p className="text-sm text-gray-500 truncate font-mono">
                    {recentPath.path}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">
                  {formatLastAccessed(recentPath.lastAccessed)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemovePath(recentPath.path);
                  }}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                >
                  <X size={12} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
