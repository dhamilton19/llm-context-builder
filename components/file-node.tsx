"use client";

import type React from "react";

import { memo, useEffect, useRef } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileArchive,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FileNodeType {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNodeType[];
}

interface FileNodeProps {
  node: FileNodeType;
  toggleSelect: (path: string) => void;
  selections: Set<string>;
  level?: number;
  expandedDirs: Set<string>;
  setExpandedDirs: React.Dispatch<React.SetStateAction<Set<string>>>;
  searchQuery?: string;
  isRoot?: boolean;
  onClearDirectory?: () => void;
}

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "js":
    case "jsx":
    case "ts":
    case "tsx":
    case "py":
    case "java":
    case "cpp":
    case "c":
    case "go":
    case "rs":
      return <FileCode size={16} className="text-blue-600" />;
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "svg":
    case "webp":
      return <FileImage size={16} className="text-green-600" />;
    case "mp4":
    case "avi":
    case "mov":
    case "webm":
      return <FileVideo size={16} className="text-purple-600" />;
    case "zip":
    case "tar":
    case "gz":
    case "rar":
      return <FileArchive size={16} className="text-orange-600" />;
    default:
      return <FileText size={16} className="text-gray-600" />;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";

  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const FileNode = memo(function FileNode({
  node,
  toggleSelect,
  selections,
  level = 0,
  expandedDirs,
  setExpandedDirs,
  searchQuery = "",
  isRoot = false,
  onClearDirectory,
}: FileNodeProps) {
  const isSelected = selections.has(node.path);
  const isExpanded = expandedDirs.has(node.path);
  const isHighlighted =
    searchQuery && node.name.toLowerCase().includes(searchQuery.toLowerCase());
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Check if directory has partial selection (some children selected, but not all)
  const getSelectionState = () => {
    if (node.type === "file") {
      return { isSelected, isIndeterminate: false };
    }

    if (!node.children || node.children.length === 0) {
      return { isSelected, isIndeterminate: false };
    }

    // Get all descendant paths
    const getAllDescendants = (n: FileNodeType): string[] => {
      if (n.type === "file") return [n.path];
      const descendants = [n.path];
      if (n.children) {
        for (const child of n.children) {
          descendants.push(...getAllDescendants(child));
        }
      }
      return descendants;
    };

    const allDescendants = getAllDescendants(node);
    const selectedDescendants = allDescendants.filter((path) =>
      selections.has(path)
    );

    if (selectedDescendants.length === 0) {
      return { isSelected: false, isIndeterminate: false };
    } else if (selectedDescendants.length === allDescendants.length) {
      return { isSelected: true, isIndeterminate: false };
    } else {
      return { isSelected: false, isIndeterminate: true };
    }
  };

  const { isSelected: actualIsSelected, isIndeterminate } = getSelectionState();

  // Set the indeterminate state on the checkbox
  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const toggleExpanded = () => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(node.path)) {
        next.delete(node.path);
      } else {
        next.add(node.path);
      }
      return next;
    });
  };

  return (
    <li>
      <div
        className={cn(
          "group flex items-center gap-2 rounded-lg py-2 px-3 transition-all duration-150 hover:bg-gray-100",
          (actualIsSelected || isIndeterminate) &&
            "bg-blue-50 hover:bg-blue-100",
          isHighlighted && "ring-2 ring-yellow-200 bg-yellow-50"
        )}
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        {/* Expand/Collapse Button */}
        {node.type === "directory" ? (
          <button
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 transition-colors"
            onClick={toggleExpanded}
            aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight size={14} strokeWidth={2} />
            </motion.div>
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* File/Folder Icon */}
        <div className="flex-shrink-0">
          {node.type === "directory" ? (
            isExpanded ? (
              <FolderOpen size={16} className="text-blue-500" />
            ) : (
              <Folder size={16} className="text-blue-500" />
            )
          ) : (
            getFileIcon(node.name)
          )}
        </div>

        {/* Checkbox */}
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={actualIsSelected}
          onChange={() => toggleSelect(node.path)}
          className="flex-shrink-0 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2"
        />

        {/* File/Folder Name */}
        <span
          className={cn(
            "flex-1 select-none text-sm font-medium truncate",
            actualIsSelected || isIndeterminate
              ? "text-blue-900"
              : "text-gray-900"
          )}
        >
          {node.name}
        </span>

        {/* File Size or Clear Button */}
        {isRoot && onClearDirectory ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClearDirectory();
            }}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100"
            title="Clear directory"
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
        ) : (
          node.type === "file" &&
          node.size && (
            <span className="flex-shrink-0 text-xs text-gray-500 font-mono">
              {formatFileSize(node.size)}
            </span>
          )
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {node.type === "directory" && isExpanded && node.children && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {[...node.children]
              .sort((a, b) => {
                // First, sort by type (directories before files)
                if (a.type !== b.type) {
                  return a.type === "directory" ? -1 : 1;
                }
                // Then, sort alphabetically within the same type
                return a.name.localeCompare(b.name, undefined, {
                  numeric: true,
                  sensitivity: "base",
                });
              })
              .map((child) => (
                <FileNode
                  key={child.path}
                  node={child}
                  toggleSelect={toggleSelect}
                  selections={selections}
                  level={level + 1}
                  expandedDirs={expandedDirs}
                  setExpandedDirs={setExpandedDirs}
                  searchQuery={searchQuery}
                />
              ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </li>
  );
});

export default FileNode;
