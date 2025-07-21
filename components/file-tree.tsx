"use client"

import type React from "react"

import dynamic from "next/dynamic"

const FileNode = dynamic(() => import("./file-node"), { ssr: false })

interface FileNodeType {
  name: string
  path: string
  type: "file" | "directory"
  size?: number
  children?: FileNodeType[]
}

interface FileTreeProps {
  nodes: FileNodeType[]
  toggleSelect: (path: string) => void
  selections: Set<string>
  expandedDirs: Set<string>
  setExpandedDirs: React.Dispatch<React.SetStateAction<Set<string>>>
  searchQuery?: string
}

export default function FileTree({
  nodes,
  toggleSelect,
  selections,
  expandedDirs,
  setExpandedDirs,
  searchQuery = "",
}: FileTreeProps) {
  if (!nodes?.length) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            {searchQuery ? "🔍" : "📁"}
          </div>
          <p className="font-medium">{searchQuery ? "No matches found" : "No files found"}</p>
          <p className="text-sm">
            {searchQuery
              ? `No files match "${searchQuery}". Try a different search term.`
              : "Try adjusting your search or load a different directory"}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <ul className="space-y-1">
        {nodes.map((node) => (
          <FileNode
            key={node.path}
            node={node}
            toggleSelect={toggleSelect}
            selections={selections}
            expandedDirs={expandedDirs}
            setExpandedDirs={setExpandedDirs}
            searchQuery={searchQuery}
          />
        ))}
      </ul>
    </div>
  )
}
