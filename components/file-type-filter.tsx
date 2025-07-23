"use client";

import { Button } from "@/components/ui/button";
import { analyzeFileTypes } from "@/lib/file-types";
import { useMemo } from "react";
import { CheckIcon } from "lucide-react";

interface FileTypeFilterProps {
  selectedExtensions: Set<string>;
  onExtensionsChange: (extensions: Set<string>) => void;
  availableFiles: string[];
  className?: string;
}

export function FileTypeFilter({
  selectedExtensions,
  onExtensionsChange,
  availableFiles,
  className = ""
}: FileTypeFilterProps) {
  // Analyze available file types
  const analysis = useMemo(() => {
    return analyzeFileTypes(availableFiles);
  }, [availableFiles]);

  // Get extensions that actually exist in the project, sorted
  const availableExtensions = useMemo(() => {
    return Array.from(analysis.extensions.keys()).sort();
  }, [analysis.extensions]);

  const handleExtensionToggle = (extension: string) => {
    const newExtensions = new Set(selectedExtensions);
    
    if (newExtensions.has(extension)) {
      newExtensions.delete(extension);
    } else {
      newExtensions.add(extension);
    }
    
    onExtensionsChange(newExtensions);
  };

  const handleSelectAll = () => {
    onExtensionsChange(new Set(availableExtensions));
  };

  const handleClearAll = () => {
    onExtensionsChange(new Set());
  };

  if (availableExtensions.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-center">
        <div>
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
            <CheckIcon size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-700">No files found</p>
          <p className="text-xs text-gray-500 mt-1">Load a directory to see available file types</p>
        </div>
      </div>
    );
  }

  const allSelected = selectedExtensions.size === availableExtensions.length;
  const someSelected = selectedExtensions.size > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant={allSelected ? "default" : "outline"}
          size="sm"
          onClick={handleSelectAll}
          disabled={allSelected}
          className="flex-1 h-9 text-sm font-medium transition-all duration-200"
        >
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          disabled={!someSelected}
          className="flex-1 h-9 text-sm font-medium transition-all duration-200"
        >
          Clear All
        </Button>
      </div>

      {/* File Type Grid */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Available Extensions</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {availableExtensions.map((ext) => {
            const count = analysis.extensions.get(ext) || 0;
            const isSelected = selectedExtensions.has(ext);

            return (
              <div
                key={ext}
                onClick={() => handleExtensionToggle(ext)}
                className={`
                  group relative flex items-center justify-between p-3 rounded-lg border cursor-pointer
                  transition-all duration-200 hover:shadow-sm
                  ${isSelected 
                    ? 'border-blue-200 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`
                    w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-500' 
                      : 'border-gray-300 group-hover:border-gray-400'
                    }
                  `}>
                    {isSelected && (
                      <CheckIcon size={12} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        .{ext}
                      </span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                        isSelected 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selection Summary */}
      {someSelected && (
        <div className="pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              {selectedExtensions.size} of {availableExtensions.length} selected
            </span>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(selectedExtensions.size / availableExtensions.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}