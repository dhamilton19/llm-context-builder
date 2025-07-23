export interface RecentPath {
  path: string;
  name: string;
  lastAccessed: number;
}

const RECENT_PATHS_KEY = 'llm-context-builder-recent-paths';
const MAX_RECENT_PATHS = 10;

export function getRecentPaths(): RecentPath[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(RECENT_PATHS_KEY);
    if (!stored) return [];
    
    const paths: RecentPath[] = JSON.parse(stored);
    return paths.sort((a, b) => b.lastAccessed - a.lastAccessed);
  } catch (error) {
    console.error('Failed to load recent paths:', error);
    return [];
  }
}

export function addRecentPath(path: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getRecentPaths();
    const name = path.split('/').pop() || path;
    
    // Remove existing entry for this path
    const filtered = existing.filter(p => p.path !== path);
    
    // Add new entry at the beginning
    const updated: RecentPath[] = [
      { path, name, lastAccessed: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT_PATHS);
    
    localStorage.setItem(RECENT_PATHS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save recent path:', error);
  }
}

export function removeRecentPath(path: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const existing = getRecentPaths();
    const filtered = existing.filter(p => p.path !== path);
    localStorage.setItem(RECENT_PATHS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Failed to remove recent path:', error);
  }
}

export function clearRecentPaths(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(RECENT_PATHS_KEY);
  } catch (error) {
    console.error('Failed to clear recent paths:', error);
  }
}