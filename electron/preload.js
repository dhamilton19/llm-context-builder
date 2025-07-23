const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  showDirectoryPicker: () => ipcRenderer.invoke('show-directory-picker'),
  getDirectoryContents: (dirPath) => ipcRenderer.invoke('get-directory-contents', dirPath),
  readFiles: (dirPath, selections) => ipcRenderer.invoke('read-files', dirPath, selections),
  onDirectorySelected: (callback) => ipcRenderer.on('directory-selected', callback),
  removeDirectorySelectedListener: (callback) => ipcRenderer.removeListener('directory-selected', callback),
  isElectron: true
});