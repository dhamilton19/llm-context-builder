import ignore from 'glob-gitignore';

interface CacheEntry {
  instance: ReturnType<typeof ignore>;
  patterns: string[];
  timestamp: number;
}

// Cache compiled gitignore instances with 5-minute TTL
const gitignoreCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Default patterns for common exclusions
const DEFAULT_PATTERNS = [
  'node_modules/**',
  'dist/**',
  'build/**',
  '.next/**',
  'coverage/**',
  '.git/**',
  '*.log',
  '.DS_Store',
  'Thumbs.db'
];


/**
 * Get a compiled gitignore instance with caching
 */
function getGitignoreInstance(patterns: string[]): ReturnType<typeof ignore> {
  // Create cache key from patterns
  const cacheKey = patterns.sort().join('|');
  const now = Date.now();
  
  // Check if we have a valid cached entry
  const cached = gitignoreCache.get(cacheKey);
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.instance;
  }
  
  // Create new instance
  const instance = ignore().add(patterns);
  
  // Cache it
  gitignoreCache.set(cacheKey, {
    instance,
    patterns: [...patterns],
    timestamp: now
  });
  
  // Clean up old cache entries (simple cleanup on new entries)
  if (gitignoreCache.size > 10) {
    for (const [key, entry] of gitignoreCache.entries()) {
      if ((now - entry.timestamp) > CACHE_TTL) {
        gitignoreCache.delete(key);
      }
    }
  }
  
  return instance;
}

/**
 * Single helper function to check if a file should be excluded
 * @param filePath - The file path to check (relative or absolute)
 * @param customPatterns - Optional custom patterns to use instead of defaults
 * @returns true if the file should be excluded
 */
export function shouldExclude(filePath: string, customPatterns?: string[]): boolean {
  // Normalize the path - remove leading slash and convert backslashes
  const normalizedPath = filePath.replace(/^\/+/, '').replace(/\\/g, '/');
  
  // Use custom patterns or defaults
  const patterns = customPatterns || DEFAULT_PATTERNS;
  
  // Get cached gitignore instance
  const gitignoreInstance = getGitignoreInstance(patterns);
  
  // Check if the file is ignored
  return gitignoreInstance.ignores(normalizedPath);
}

/**
 * Parse gitignore content into patterns array
 * @param gitignoreContent - Raw .gitignore file content
 * @returns Array of gitignore patterns
 */
export function parseGitignorePatterns(gitignoreContent: string): string[] {
  return gitignoreContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) // Keep negation patterns (!)
    .filter(line => line !== '');
}


/**
 * Clear the gitignore cache (useful for testing or memory management)
 */
export function clearCache(): void {
  gitignoreCache.clear();
}

