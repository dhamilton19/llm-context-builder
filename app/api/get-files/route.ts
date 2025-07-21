import { type NextRequest, NextResponse } from "next/server"
import { parseGitignore, isIgnored } from "@/lib/utils"

// Mock file contents for test data
const mockFileContents: Record<string, string> = {
  "src/components/Button.tsx": `import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button 
      onClick={onClick}
      className={\`btn btn-\${variant}\`}
    >
      {children}
    </button>
  )
}`,
  "src/components/Card.tsx": `import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={\`card \${className}\`}>
      {children}
    </div>
  )
}`,
  "src/components/Modal.tsx": `import React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}`,
  "src/components/ui/Input.tsx": `import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, ...props }: InputProps) {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input {...props} />
    </div>
  )
}`,
  "src/components/ui/Select.tsx": `import React from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
}

export function Select({ options, ...props }: SelectProps) {
  return (
    <select {...props}>
      {options.map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}`,
  "src/utils/helpers.ts": `export function formatDate(date: Date): string {
  return date.toLocaleDateString()
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}`,
  "src/utils/constants.ts": `export const API_BASE_URL = 'https://api.example.com'

export const COLORS = {
  primary: '#007bff',
  secondary: '#6c757d',
  success: '#28a745',
  danger: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8'
}

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
}`,
  "src/utils/api.ts": `const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export async function fetchData<T>(endpoint: string): Promise<T> {
  const response = await fetch(\`\${API_BASE}\${endpoint}\`)
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`)
  }
  
  return response.json()
}

export async function postData<T>(endpoint: string, data: any): Promise<T> {
  const response = await fetch(\`\${API_BASE}\${endpoint}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`)
  }
  
  return response.json()
}`,
  "src/App.tsx": `import React from 'react'
import { Button } from './components/Button'
import { Card } from './components/Card'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>My React App</h1>
      </header>
      <main>
        <Card>
          <h2>Welcome!</h2>
          <p>This is a sample React application.</p>
          <Button onClick={() => alert('Hello!')}>
            Click me
          </Button>
        </Card>
      </main>
    </div>
  )
}

export default App`,
  "src/index.tsx": `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`,
  "package.json": `{
  "name": "my-react-app",
  "version": "1.0.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^4.9.5"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version"
    ]
  }
}`,
  "tsconfig.json": `{
  "compilerOptions": {
    "target": "es5",
    "lib": [
      "dom",
      "dom.iterable",
      "es6"
    ],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": [
    "src"
  ]
}`,
  ".gitignore": `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*`,
  "tailwind.config.js": `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
  "docs/README.md": `# My React App

This is a sample React application built with TypeScript and Tailwind CSS.

## Getting Started

1. Install dependencies: \`npm install\`
2. Start the development server: \`npm start\`
3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Features

- React 18 with TypeScript
- Tailwind CSS for styling
- Component-based architecture
- Utility functions and constants

## Project Structure

- \`src/components/\` - Reusable UI components
- \`src/utils/\` - Utility functions and constants
- \`docs/\` - Documentation files
- \`public/\` - Static assets`,
  "docs/CONTRIBUTING.md": `# Contributing Guide

Thank you for your interest in contributing to this project!

## Development Setup

1. Fork the repository
2. Clone your fork: \`git clone <your-fork-url>\`
3. Install dependencies: \`npm install\`
4. Create a feature branch: \`git checkout -b feature/your-feature\`

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

## Submitting Changes

1. Commit your changes: \`git commit -m "Add your feature"\`
2. Push to your branch: \`git push origin feature/your-feature\`
3. Create a Pull Request`,
}

export async function POST(request: NextRequest) {
  // Try to load Node's fs & path only if they exist (local dev / prod)
  let fs: typeof import("fs/promises") | null = null
  let path: typeof import("path") | null = null
  try {
    fs = await import("fs/promises")
    path = await import("path")
  } catch {
    /* running in edge / preview – fall back to mock only */
  }

  // Helper function to read .gitignore patterns
  async function readGitignore(dir: string): Promise<string[]> {
    if (!fs || !path) return []
    try {
      const { readFile } = fs
      const { join } = path
      const gitignorePath = join(dir, '.gitignore')
      const gitignoreContent = await readFile(gitignorePath, 'utf-8')
      return parseGitignore(gitignoreContent)
    } catch {
      return []
    }
  }

  try {
    const { dirPath, selections } = await request.json()
    console.log('get-files API called with:', { dirPath, selections });

    if (!dirPath || !Array.isArray(selections)) {
      return new NextResponse("Invalid request body", { status: 400 })
    }

    // Read gitignore patterns
    const gitignorePatterns = await readGitignore(dirPath)
    console.log('gitignore patterns:', gitignorePatterns);

    let xml = "<files>\n"

    for (const rel of selections) {
      console.log('Processing selection:', rel);
      
      // Skip .gitignore file and ignored files
      if (rel === '.gitignore' || (gitignorePatterns.length > 0 && isIgnored(rel, gitignorePatterns))) {
        console.log('Skipping ignored file:', rel);
        continue
      }

      // 1) Preview or explicit test-project → use mocks
      if (!fs || dirPath === "/sample/project") {
        if (mockFileContents[rel]) {
          console.log('Adding mock content for:', rel);
          xml += `  <file path="${rel}">\n${mockFileContents[rel]}\n  </file>\n`
        } else {
          console.log('Adding directory entry for:', rel);
          xml += `  <directory path="${rel}" />\n`
        }
        continue
      }

      /* ---------- real filesystem branch ---------- */
      const { readFile, stat } = fs
      const { join } = path!
      try {
        const fullPath = join(dirPath, rel);
        console.log('Attempting to read file:', fullPath);
        
        const info = await stat(fullPath)
        if (info.isFile()) {
          const content = await readFile(fullPath, "utf-8")
          console.log('Successfully read file:', rel, 'content length:', content.length);
          xml += `  <file path="${rel}">\n${content}\n  </file>\n`
        } else {
          console.log('Adding directory entry for:', rel);
          xml += `  <directory path="${rel}" />\n`
        }
      } catch (error) {
        console.log('Error reading file:', rel, error);
        xml += `  <file path="${rel}" error="Unable to read" />\n`
      }
    }

    xml += "</files>"
    console.log('Final XML response length:', xml.length);
    console.log('Final XML preview:', xml.substring(0, 500));
    return new NextResponse(xml, { headers: { "Content-Type": "application/xml" } })
  } catch (e) {
    console.error("get-files error:", e)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
