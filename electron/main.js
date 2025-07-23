const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../public/logo.png'),
    titleBarStyle: 'default',
    show: false
  });

  const startUrl = isDev 
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  return mainWindow;
}

function createMenu() {
  const template = [
    // App menu on macOS
    ...(process.platform === 'darwin' ? [{
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    
    // File menu
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Directory...',
          accelerator: process.platform === 'darwin' ? 'Cmd+O' : 'Ctrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog({
              properties: ['openDirectory'],
              title: 'Select Project Directory'
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              const selectedPath = result.filePaths[0];
              // Send the selected path to the renderer process
              const mainWindow = BrowserWindow.getFocusedWindow();
              if (mainWindow) {
                mainWindow.webContents.send('directory-selected', selectedPath);
              }
            }
          }
        },
        { type: 'separator' },
        ...(process.platform === 'darwin' ? [] : [{ role: 'quit' }])
      ]
    },
    
    // Edit menu
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(process.platform === 'darwin' ? [
          { role: 'pasteandmatchstyle' },
          { role: 'delete' },
          { role: 'selectall' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startspeaking' },
              { role: 'stopspeaking' }
            ]
          }
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectall' }
        ])
      ]
    },
    
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' },
        ...(process.platform === 'darwin' ? [
          { type: 'separator' },
          { role: 'front' },
          { type: 'separator' },
          { role: 'window' }
        ] : [])
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Handle directory picker
ipcMain.handle('show-directory-picker', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select Project Directory'
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  
  return null;
});

// Handle file system operations
ipcMain.handle('get-directory-contents', async (event, dirPath) => {
  const fs = require('fs/promises');
  const path = require('path');
  
  try {
    // Read gitignore patterns first
    const gitignorePatterns = await readGitignorePatterns(dirPath);
    
    const entries = await fs.readdir(dirPath);
    const result = [];
    
    for (const entry of entries) {
      // Skip hidden files except .gitignore
      if (entry.startsWith(".") && entry !== '.gitignore') continue;
      
      const fullPath = path.join(dirPath, entry);
      const stats = await fs.stat(fullPath);
      
      // Skip .gitignore from results (don't show it in the tree)
      if (entry === '.gitignore') continue;
      
      // Check if entry should be ignored based on gitignore patterns
      if (shouldIgnoreFile(entry, gitignorePatterns)) continue;
      
      if (stats.isDirectory()) {
        const children = await getDirectoryContentsRecursive(fullPath, entry, gitignorePatterns);
        result.push({ 
          name: entry, 
          path: entry, 
          type: "directory", 
          children 
        });
      } else {
        result.push({ 
          name: entry, 
          path: entry, 
          type: "file" 
        });
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Unable to read directory: ${error.message}`);
  }
});

async function getDirectoryContentsRecursive(fullPath, relativePath, gitignorePatterns) {
  const fs = require('fs/promises');
  const path = require('path');
  
  try {
    const entries = await fs.readdir(fullPath);
    const result = [];
    
    for (const entry of entries) {
      // Skip hidden files except .gitignore
      if (entry.startsWith(".") && entry !== '.gitignore') continue;
      
      const entryFullPath = path.join(fullPath, entry);
      const entryRelativePath = path.join(relativePath, entry).replace(/\\/g, '/');
      const stats = await fs.stat(entryFullPath);
      
      // Skip .gitignore from results
      if (entry === '.gitignore') continue;
      
      // Check if entry should be ignored based on gitignore patterns
      if (shouldIgnoreFile(entryRelativePath, gitignorePatterns)) continue;
      
      if (stats.isDirectory()) {
        const children = await getDirectoryContentsRecursive(entryFullPath, entryRelativePath, gitignorePatterns);
        result.push({ 
          name: entry, 
          path: entryRelativePath, 
          type: "directory", 
          children 
        });
      } else {
        result.push({ 
          name: entry, 
          path: entryRelativePath, 
          type: "file" 
        });
      }
    }
    
    return result;
  } catch (error) {
    return [];
  }
}

// Handle file reading
ipcMain.handle('read-files', async (event, dirPath, selections) => {
  const fs = require('fs/promises');
  const path = require('path');
  
  // Generate file map (we need to implement this in Node.js context)
  const fileMap = generateFileMapNode(dirPath, selections);
  
  let xml = "<files>\n";
  
  // Add file map section
  if (fileMap) {
    xml += "  <file_map>\n";
    xml += fileMap.split('\n').map(line => `${line}`).join('\n');
    xml += "\n  </file_map>\n\n";
  }
  
  for (const relativePath of selections) {
    try {
      const fullPath = path.join(dirPath, relativePath);
      const stats = await fs.stat(fullPath);
      
      if (stats.isFile()) {
        const content = await fs.readFile(fullPath, "utf-8");
        xml += `  <file path="${relativePath}">\n${content}\n  </file>\n`;
      } else {
        xml += `  <directory path="${relativePath}" />\n`;
      }
    } catch (error) {
      xml += `  <file path="${relativePath}" error="Unable to read" />\n`;
    }
  }
  
  xml += "</files>";
  return xml;
});

// Node.js version of file map generation
function generateFileMapNode(rootPath, selectedPaths) {
  if (selectedPaths.length === 0) {
    return '';
  }

  // Build tree structure from selected paths
  const root = {
    name: rootPath.split('/').pop() || rootPath.split('\\').pop() || rootPath,
    path: rootPath,
    isDirectory: true,
    children: []
  };

  // Sort paths to ensure proper tree building
  const sortedPaths = [...selectedPaths].sort();

  for (const fullPath of sortedPaths) {
    const pathParts = fullPath.split(/[\/\\]/).filter(Boolean);
    let currentNode = root;

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isFile = i === pathParts.length - 1;
      
      // Look for existing child
      let childNode = currentNode.children.find(child => child.name === part);
      
      if (!childNode) {
        childNode = {
          name: part,
          path: pathParts.slice(0, i + 1).join('/'),
          isDirectory: !isFile,
          children: []
        };
        currentNode.children.push(childNode);
      }
      
      currentNode = childNode;
    }
  }

  // Sort children at each level
  sortTreeNode(root);

  // Generate the tree string
  return renderTreeNode(root, rootPath);
}

function sortTreeNode(node) {
  node.children.sort((a, b) => {
    // Directories first
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });

  // Recursively sort children
  for (const child of node.children) {
    sortTreeNode(child);
  }
}

function renderTreeNode(node, rootPath, prefix = '', isLast = true) {
  const lines = [];
  
  // Add root path header
  if (prefix === '') {
    lines.push(rootPath);
  }

  // Render current node's children
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const isLastChild = i === node.children.length - 1;
    const connector = isLastChild ? '└── ' : '├── ';
    const childPrefix = prefix + (isLastChild ? '    ' : '│   ');

    lines.push(prefix + connector + child.name);

    if (child.isDirectory && child.children.length > 0) {
      const subtree = renderTreeNode(child, rootPath, childPrefix, isLastChild);
      const subtreeLines = subtree.split('\n').filter(line => line.trim());
      // Skip the first line (root) and add the rest
      lines.push(...subtreeLines.slice(1));
    }
  }

  return lines.join('\n');
}


// Gitignore pattern handling
async function readGitignorePatterns(dirPath) {
  const fs = require('fs/promises');
  const path = require('path');
  
  try {
    const gitignorePath = path.join(dirPath, '.gitignore');
    const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
    return parseGitignorePatterns(gitignoreContent);
  } catch {
    // Return common defaults if no .gitignore found
    return [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      'coverage/**',
      '.git/**',
    ];
  }
}

function parseGitignorePatterns(gitignoreContent) {
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

function shouldIgnoreFile(filePath, gitignorePatterns) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  
  for (const pattern of gitignorePatterns) {
    if (matchesGitignorePattern(normalizedPath, pattern)) {
      return true;
    }
  }
  
  return false;
}

function matchesGitignorePattern(filePath, pattern) {
  // Convert glob pattern to regex
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(filePath);
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});