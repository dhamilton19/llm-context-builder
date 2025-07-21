import { type NextRequest, NextResponse } from "next/server"
import { parseGitignore, isIgnored } from "@/lib/utils"

/* -------- fallback test tree (same shape used on the client) ---------- */
const testTree = [
  {
    name: "src",
    path: "src",
    type: "directory",
    children: [
      {
        name: "components",
        path: "src/components",
        type: "directory",
        children: [
          { name: "Button.tsx", path: "src/components/Button.tsx", type: "file" },
          { name: "Card.tsx", path: "src/components/Card.tsx", type: "file" },
          { name: "Modal.tsx", path: "src/components/Modal.tsx", type: "file" },
          {
            name: "ui",
            path: "src/components/ui",
            type: "directory",
            children: [
              { name: "Input.tsx", path: "src/components/ui/Input.tsx", type: "file" },
              { name: "Select.tsx", path: "src/components/ui/Select.tsx", type: "file" },
            ],
          },
        ],
      },
      {
        name: "utils",
        path: "src/utils",
        type: "directory",
        children: [
          { name: "helpers.ts", path: "src/utils/helpers.ts", type: "file" },
          { name: "constants.ts", path: "src/utils/constants.ts", type: "file" },
          { name: "api.ts", path: "src/utils/api.ts", type: "file" },
        ],
      },
      { name: "App.tsx", path: "src/App.tsx", type: "file" },
      { name: "index.tsx", path: "src/index.tsx", type: "file" },
    ],
  },
  /* …public, docs, root files omitted for brevity – same as before … */
]

/* ---------------------------------------------------------------------- */

export async function GET(req: NextRequest) {
  const dirPath = new URL(req.url).searchParams.get("dirPath")

  // If fs is unavailable (preview) → return test tree
  let fs: typeof import("fs/promises") | null = null
  try {
    fs = await import("fs/promises")
  } catch {
    /* no-op */
  }
  if (!fs) return NextResponse.json(testTree)

  /* ---------- real filesystem branch (local dev / production) --------- */
  const { readdir, stat, readFile } = fs
  const { join } = await import("path")

  // Read .gitignore file if it exists
  async function readGitignore(dir: string): Promise<string[]> {
    try {
      const gitignorePath = join(dir, '.gitignore')
      const gitignoreContent = await readFile(gitignorePath, 'utf-8')
      return parseGitignore(gitignoreContent)
    } catch {
      return []
    }
  }

  async function walk(dir: string, base = "", gitignorePatterns: string[] = []): Promise<any[]> {
    const entries = await readdir(dir)
    const result: any[] = []
    
    for (const entry of entries) {
      // Skip hidden files except .gitignore (we need it to read patterns)
      if (entry.startsWith(".") && entry !== '.gitignore') continue
      
      const full = join(dir, entry)
      const rel = join(base, entry)
      const info = await stat(full)
      
      // Skip .gitignore file from results (don't show it in the tree)
      if (entry === '.gitignore') continue
      
      // Check if this file/directory should be ignored
      if (gitignorePatterns.length > 0 && isIgnored(rel, gitignorePatterns)) {
        continue
      }
      
      if (info.isDirectory()) {
        const children = await walk(full, rel, gitignorePatterns)
        result.push({ name: entry, path: rel, type: "directory", children })
      } else {
        result.push({ name: entry, path: rel, type: "file" })
      }
    }
    return result
  }

  try {
    if (!dirPath) return NextResponse.json({ error: "dirPath missing" }, { status: 400 })
    const gitignorePatterns = await readGitignore(dirPath)
    const tree = await walk(dirPath, "", gitignorePatterns)
    return NextResponse.json(tree)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Unable to read directory" }, { status: 500 })
  }
}
