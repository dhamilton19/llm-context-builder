
// Check if a file path matches any of the given patterns
export function matchesPatterns(filePath: string, patterns: string[]): boolean {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of patterns) {
    if (matchesGlob(normalizedPath, pattern)) {
      return true;
    }
  }
  
  return false;
}

// Simple glob pattern matching
function matchesGlob(filePath: string, pattern: string): boolean {
  // Normalize paths
  const normalizedPath = filePath.replace(/\\/g, '/');
  const normalizedPattern = pattern.replace(/\\/g, '/');
  
  // Convert glob pattern to regex
  const regexPattern = normalizedPattern
    .replace(/\./g, '\\.') // Escape dots first
    .replace(/\*\*/g, '.*') // ** matches any number of directories
    .replace(/\*/g, '[^/]*') // * matches anything except /
    .replace(/\?/g, '.'); // ? matches single character
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(normalizedPath);
}


// Check if a file should be excluded based on raw gitignore patterns
export function shouldExcludeFileByGitignore(filePath: string, gitignorePatterns: string[]): boolean {
  return matchesPatterns(filePath, gitignorePatterns);
}

// Parse gitignore content and return raw patterns
export function parseGitignorePatterns(gitignoreContent: string): string[] {
  return gitignoreContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('!'))
    .map(line => {
      // Convert gitignore patterns to work with our matching
      if (line.startsWith('/')) {
        // Root-relative pattern - remove leading slash
        const pattern = line.substring(1);
        // If it's a directory (ends with /) or looks like a directory name, match it and all contents
        if (pattern.endsWith('/') || (!pattern.includes('.') && !pattern.includes('*'))) {
          return `${pattern}/**`;
        }
        return pattern;
      }
      if (!line.includes('/')) {
        // Match anywhere in path - if it looks like a directory, include all contents
        if (!line.includes('.') && !line.includes('*')) {
          return `**/${line}/**`;
        }
        return `**/${line}`;
      }
      return line;
    });
}