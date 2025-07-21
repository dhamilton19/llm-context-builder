import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Gitignore pattern matching utility
export function parseGitignore(gitignoreContent: string): string[] {
  return gitignoreContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
}

export function isIgnored(filePath: string, gitignorePatterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of gitignorePatterns) {
    if (matchesGitignorePattern(normalizedPath, pattern)) {
      return true;
    }
  }
  
  return false;
}

function matchesGitignorePattern(filePath: string, pattern: string): boolean {
  // Remove leading/trailing slashes and normalize
  const cleanPattern = pattern.replace(/^\/+|\/+$/g, '');
  const cleanPath = filePath.replace(/^\/+/, '');
  
  // Handle directory patterns (ending with /)
  if (pattern.endsWith('/')) {
    const dirPattern = cleanPattern.slice(0, -1);
    // Check if this is a directory path or if any parent directory matches
    return cleanPath === dirPattern || cleanPath.startsWith(dirPattern + '/');
  }
  
  // Handle glob patterns
  if (pattern.includes('*')) {
    return matchesGlob(cleanPath, cleanPattern);
  }
  
  // Handle negation patterns (starting with !)
  if (pattern.startsWith('!')) {
    return false; // Negation patterns need special handling in the main logic
  }
  
  // Exact match or directory/file match
  return cleanPath === cleanPattern || 
         cleanPath.startsWith(cleanPattern + '/') ||
         cleanPath.endsWith('/' + cleanPattern) ||
         cleanPath.includes('/' + cleanPattern + '/');
}

function matchesGlob(str: string, pattern: string): boolean {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(str) || regex.test(str.split('/').pop() || '');
}
