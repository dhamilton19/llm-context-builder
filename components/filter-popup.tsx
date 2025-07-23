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
        <Button
          variant="outline"
          size="sm"
          className={`relative font-medium border transition-all duration-200 ${
            hasActiveFilters 
              ? "border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100" 
              : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          <Filter size={14} className="mr-2" />
          Filter
          {hasActiveFilters && (
            <div className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-white bg-blue-600 rounded-full">
              {totalActiveFilters}
            </div>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[440px] border-r border-gray-200">
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