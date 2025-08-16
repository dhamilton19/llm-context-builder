"use client";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, Settings, X } from "lucide-react";
import { FileTypeFilter } from "./file-type-filter";
import { useState } from "react";

interface FilterPopupProps {
  selectedFileTypes: Set<string>;
  onFileTypesChange: (types: Set<string>) => void;
  availableFiles: string[];
}

export function FilterPopup({
  selectedFileTypes,
  onFileTypesChange,
  availableFiles
}: FilterPopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const totalActiveFilters = selectedFileTypes.size;
  const hasActiveFilters = totalActiveFilters > 0;

  const handleClearAll = () => {
    onFileTypesChange(new Set());
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className="relative font-medium text-sm transition-all duration-150 flex items-center"
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: hasActiveFilters 
              ? 'linear-gradient(145deg, #dbeafe 0%, #bfdbfe 100%)'
              : 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)',
            border: '1px solid',
            borderColor: hasActiveFilters ? '#3b82f6' : '#cbd5e1',
            color: hasActiveFilters ? '#1d4ed8' : '#374151',
            boxShadow: hasActiveFilters
              ? `
                0 1px 2px rgba(59, 130, 246, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `
              : `
                0 1px 2px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `,
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            if (hasActiveFilters) {
              e.target.style.background = 'linear-gradient(145deg, #bfdbfe 0%, #93c5fd 100%)';
            } else {
              e.target.style.background = 'linear-gradient(145deg, #f1f5f9 0%, #cbd5e1 100%)';
            }
            e.target.style.transform = 'translateY(-0.5px)';
            e.target.style.boxShadow = hasActiveFilters
              ? `
                0 2px 4px rgba(59, 130, 246, 0.3),
                inset 0 1px 0 rgba(255, 255, 255, 0.7),
                inset 0 -1px 0 rgba(0, 0, 0, 0.06)
              `
              : `
                0 2px 4px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                inset 0 -1px 0 rgba(0, 0, 0, 0.06)
              `;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = hasActiveFilters 
              ? 'linear-gradient(145deg, #dbeafe 0%, #bfdbfe 100%)'
              : 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 100%)';
            e.target.style.transform = 'translateY(0px)';
            e.target.style.boxShadow = hasActiveFilters
              ? `
                0 1px 2px rgba(59, 130, 246, 0.2),
                inset 0 1px 0 rgba(255, 255, 255, 0.6),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `
              : `
                0 1px 2px rgba(0, 0, 0, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `;
          }}
          onMouseDown={(e) => {
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
          <Filter size={14} className="mr-2" />
          Filter
          {hasActiveFilters && (
            <div className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
              {totalActiveFilters}
            </div>
          )}
        </button>
      </SheetTrigger>
      
      <SheetContent 
        side="left" 
        className="w-[440px] border-r border-gray-200"
        style={{
          background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: `
            2px 0 8px rgba(0, 0, 0, 0.1),
            2px 0 4px rgba(0, 0, 0, 0.06),
            inset -1px 0 0 rgba(255, 255, 255, 0.8)
          `
        }}
      >
        <SheetHeader className="border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Filter size={16} className="text-gray-600" />
            </div>
            <div className="text-left">
              <SheetTitle className="text-lg font-semibold text-gray-900">File Types</SheetTitle>
              <p className="text-sm text-gray-500 mt-1">Filter files by extension</p>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6">
          <FileTypeFilter
            selectedExtensions={selectedFileTypes}
            onExtensionsChange={onFileTypesChange}
            availableFiles={availableFiles}
          />
        </div>

      </SheetContent>
    </Sheet>
  );
}