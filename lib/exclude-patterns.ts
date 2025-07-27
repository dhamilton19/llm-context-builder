
import ignore from 'ignore';

// Cache for compiled ignore patterns
const ignoreCache = new Map<string, any>();

/**
 * A helper function that returns an ignore instance for the given patterns.
 * Caches the instance based on the patterns.
 *
 * @param patterns The gitignore patterns.
 * @returns An ignore instance.
 */
function getIgnorer(patterns: string[]) {
  const cacheKey = patterns.join('\n');
  if (ignoreCache.has(cacheKey)) {
    return ignoreCache.get(cacheKey);
  }

  const ignorer = ignore().add(patterns);
  ignoreCache.set(cacheKey, ignorer);
  return ignorer;
}

/**
 * Checks if a file path should be excluded based on the given gitignore patterns.
 *
 * @param filePath The path of the file to check.
 * @param patterns An array of gitignore patterns.
 * @returns `true` if the file should be excluded, `false` otherwise.
 */
export function shouldExclude(filePath: string, patterns: string[]): boolean {
  if (patterns.length === 0) {
    return false;
  }

  const ignorer = getIgnorer(patterns);
  return ignorer.ignores(filePath);
}

/**
 * Parses gitignore content and returns an array of patterns.
 *
 * @param gitignoreContent The content of the .gitignore file.
 * @returns An array of gitignore patterns.
 */
export function parseGitignorePatterns(gitignoreContent: string): string[] {
  return gitignoreContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));
}