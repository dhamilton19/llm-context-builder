export interface FileTypeConfig {
  extensions: string[];
  label: string;
  icon: string;
  color: string;
}

export const FILE_TYPE_PRESETS: Record<string, FileTypeConfig> = {
  frontend: {
    extensions: ['tsx', 'jsx', 'ts', 'js', 'vue', 'svelte', 'html', 'css', 'scss', 'sass', 'less', 'styl'],
    label: 'Frontend',
    icon: '🎨',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  backend: {
    extensions: ['py', 'java', 'go', 'rs', 'rb', 'php', 'cs', 'cpp', 'c', 'kt', 'scala', 'clj'],
    label: 'Backend',
    icon: '⚙️',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  config: {
    extensions: ['json', 'yaml', 'yml', 'toml', 'ini', 'env', 'conf', 'config', 'xml', 'properties'],
    label: 'Config',
    icon: '🔧',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  docs: {
    extensions: ['md', 'txt', 'rst', 'adoc', 'tex', 'rtf'],
    label: 'Documentation',
    icon: '📚',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  scripts: {
    extensions: ['sh', 'bash', 'zsh', 'fish', 'ps1', 'bat', 'cmd'],
    label: 'Scripts',
    icon: '📜',
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  },
  data: {
    extensions: ['csv', 'tsv', 'json', 'xml', 'sql', 'db', 'sqlite'],
    label: 'Data',
    icon: '📊',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200'
  }
};

export const COMMON_EXTENSIONS = [
  // Frontend
  'tsx', 'jsx', 'ts', 'js', 'vue', 'svelte', 'html', 'css', 'scss', 'sass',
  // Backend
  'py', 'java', 'go', 'rs', 'rb', 'php', 'cs', 'cpp', 'c',
  // Config
  'json', 'yaml', 'yml', 'toml', 'env', 'xml',
  // Documentation
  'md', 'txt', 'rst',
  // Scripts
  'sh', 'bash', 'ps1', 'bat',
  // Other
  'sql', 'dockerfile', 'gitignore', 'lock'
];

export function getFileExtension(filename: string): string {
  const parts = filename.toLowerCase().split('.');
  if (parts.length === 1) return '';
  
  // Handle special cases like .gitignore, .env, etc.
  if (filename.startsWith('.') && parts.length === 2) {
    return filename.substring(1);
  }
  
  return parts[parts.length - 1];
}

export function getFileTypePreset(extension: string): string | null {
  for (const [preset, config] of Object.entries(FILE_TYPE_PRESETS)) {
    if (config.extensions.includes(extension.toLowerCase())) {
      return preset;
    }
  }
  return null;
}

export function analyzeFileTypes(filePaths: string[]): {
  extensions: Map<string, number>;
  presets: Map<string, number>;
  total: number;
} {
  const extensions = new Map<string, number>();
  const presets = new Map<string, number>();
  let total = 0;

  for (const path of filePaths) {
    const filename = path.split('/').pop() || '';
    const ext = getFileExtension(filename);
    
    if (ext) {
      total++;
      extensions.set(ext, (extensions.get(ext) || 0) + 1);
      
      const preset = getFileTypePreset(ext);
      if (preset) {
        presets.set(preset, (presets.get(preset) || 0) + 1);
      }
    }
  }

  return { extensions, presets, total };
}

export function shouldIncludeFile(filename: string, selectedExtensions: Set<string>): boolean {
  if (selectedExtensions.size === 0) return true; // No filter means include all
  
  const ext = getFileExtension(filename);
  return selectedExtensions.has(ext);
}