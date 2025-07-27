const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showDirectoryPicker: () => ipcRenderer.invoke('show-directory-picker'),

  // New streaming API for directory contents
  streamDirectoryContents: (dirPath) => ipcRenderer.send('stream-directory-contents', dirPath),
  onDirectoryEntry: (callback) => ipcRenderer.on('directory-entry', (event, ...args) => callback(...args)),
  onDirectoryStreamEnd: (callback) => ipcRenderer.on('directory-stream-end', (event, ...args) => callback(...args)),
  onDirectoryStreamError: (callback) => ipcRenderer.on('directory-stream-error', (event, ...args) => callback(...args)),

  readFiles: (dirPath, selections) => ipcRenderer.invoke('read-files', dirPath, selections),
  onDirectorySelected: (callback) => ipcRenderer.on('directory-selected', callback),
  removeDirectorySelectedListener: (callback) => ipcRenderer.removeListener('directory-selected', callback),
  isElectron: true,

  // Cleanup listeners
  cleanupDirectoryListeners: () => {
    ipcRenderer.removeAllListeners('directory-entry');
    ipcRenderer.removeAllListeners('directory-stream-end');
    ipcRenderer.removeAllListeners('directory-stream-error');
  }
});