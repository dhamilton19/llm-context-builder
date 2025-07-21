"use client"

import { useEffect } from "react"

interface UseKeyboardShortcutsProps {
  onSelectAll: () => void
  onCopy: () => void
  onSearch: () => void
  onEscape: () => void
}

export function useKeyboardShortcuts({ onSelectAll, onCopy, onSearch, onEscape }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey
      const activeElement = document.activeElement
      const isInputFocused = activeElement?.tagName === "INPUT" || activeElement?.tagName === "TEXTAREA"

      if (cmdOrCtrl && e.key === "a") {
        // Only prevent default and select all files if not in an input
        if (!isInputFocused) {
          e.preventDefault()
          onSelectAll()
        }
        // Let native text selection work in inputs
      } else if (cmdOrCtrl && e.key === "c") {
        // Only prevent default and copy files if not in an input
        if (!isInputFocused) {
          e.preventDefault()
          onCopy()
        }
        // Let native copy work in inputs
      } else if (cmdOrCtrl && e.key === "f") {
        e.preventDefault()
        onSearch()
      } else if (e.key === "Escape") {
        onEscape()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onSelectAll, onCopy, onSearch, onEscape])
}
