# LLM Context Builder

Prepare, preview and package any local codebase for large‑language‑model conversations with a few clicks.

> **TL;DR** – Paste or type a local directory path, press **Load**, cherry‑pick files & folders, then copy an XML‑wrapped snippet ready to drop into ChatGPT or Claude. The page URL is updated with `?dirPath=` so you can bookmark specific directories.

**⚠️ LOCAL ONLY** – This app runs locally and reads from your local file system. It cannot be deployed to hosting platforms.

---

## Table of Contents

1. [Features](#features)
2. [Quick Start](#quick-start)
3. [Folder Structure](#folder-structure)
4. [UI/UX Details](#uiux-details)
5. [Tech Stack](#tech-stack)
6. [Configuration](#configuration)
7. [Roadmap](#roadmap)
8. [Contributing](#contributing)
9. [License](#license)

---

## Features

| Area                   | Highlights                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Directory loading**  | Paste local path into the input. Reads directly from your local file system. `.gitignore` rules respected. *File paths must be pasted due to web security restrictions preventing folder pickers from returning full paths.* |
| **Deep‑linking**       | `?dirPath=` query param auto‑populates the input. Bookmarkable URLs for specific directories.                                                              |
| **Smart selection**    | Shift‑click folders to include every nested file; checkboxes propagate upward when all children are selected.                                              |
| **Keyboard shortcuts** | <kbd>⌘/Ctrl</kbd> + <kbd>A</kbd> (select all), <kbd>⌘/Ctrl</kbd> + <kbd>C</kbd> (copy), <kbd>⌘/Ctrl</kbd> + <kbd>F</kbd> (filter), <kbd>Esc</kbd> (clear). |
| **Live preview**       | Instant XML preview with file counts, line counts and token estimate.                                                                                      |
| **Local file access**  | Requires Node.js server environment to read local file system. Cannot run on static hosting platforms.                                                     |
| **Copy → Clipboard**   | One click copies the XML payload ready for your AI chat.                                                                                                   |

---

## Quick Start

```sh
# 1. Clone
$ git clone https://github.com/your‑org/llm‑context‑builder.git
$ cd llm‑context‑builder

# 2. Install deps (use pnpm / yarn / npm as you prefer)
$ pnpm install

# 3. Run dev server (MUST run locally - requires Node.js server)
$ pnpm dev

# 4. Open in browser
#    http://localhost:3000  ➜  paste a local directory path, hit **Load**
```

> **Note**: This app MUST run locally on your machine since it needs Node.js server access to read your local file system. Unfortunately, file paths must be manually pasted due to web security restrictions that prevent folder picker APIs from returning full file paths.

### Production build (local only)

```sh
$ pnpm build && pnpm start
```

**Important**: Even in production, this app requires a Node.js server environment and cannot be deployed to static hosting platforms like Vercel, Netlify, or GitHub Pages since it needs server-side file system access.

---

## Folder Structure

```
app/                 ➜ Next 13/14 app‑router source
  api/               ➜ Edge‑compatible File APIs
  components/        ➜ Re‑usable UI (FileTree, FileNode, etc.)
  hooks/             ➜ Custom React hooks
  ...
lib/                 ➜ Shared utilities (clsx, gitignore parser)
public/
```

Full tree available in the [files panel](#) once the app is running.

---

## UI/UX Details

- **Tailwind CSS** with custom CSS variables for light/dark.
- **Framer Motion** for smooth tree expand/collapse.
- **Lucide‑react** icons.
- **Radix UI primitives** under the hood.
- **Token estimate** is _chars ÷ 4_ – good enough for GPT‑4o sizing.

---

## Tech Stack

| Layer      | Choice                                                   |
| ---------- | -------------------------------------------------------- |
| Framework  | **Next 15 app‑router** (React 19, Server Actions ready)  |
| Styling    | **Tailwind CSS** + **shadcn/ui**                         |
| Animation  | **Framer Motion**                                        |
| Icons      | **Lucide‑react**                                         |
| State      | React hooks + `useSearchParams`                          |
| API Routes | Node.js server routes (TypeScript, requires `fs` access) |

---

## Configuration

### Environment variables

Since this is a local-only application, minimal configuration is needed:

| Variable | Purpose                               | Default |
| -------- | ------------------------------------- | ------- |
| `PORT`   | Port for the local development server | `3000`  |

Create a `.env.local` if you need to override the default port.

---

## Contributing

1. Fork and clone the repo.
2. `pnpm install`
3. Follow existing code style (TypeScript strict, Tailwind, Prettier).
4. Update this README + docs where helpful.
5. Open a pull request – the CI will lint & type‑check automatically.

---

## License

[MIT](LICENSE) © 2025
