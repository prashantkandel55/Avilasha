import { contextBridge, ipcRenderer } from 'electron';

// Safe ipc functions with error handling
const safeIpcRenderer = {
  send: (channel, ...args) => {
    try {
      ipcRenderer.send(channel, ...args);
    } catch (error) {
      console.error(`Error sending ${channel}:`, error);
    }
  },
  on: (channel, func) => {
    try {
      // Deliberately strip event as it includes `sender` 
      const subscription = (event, ...args) => func(...args);
      ipcRenderer.on(channel, subscription);
      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    } catch (error) {
      console.error(`Error on ${channel}:`, error);
      return () => {};
    }
  },
  invoke: async (channel, ...args) => {
    try {
      return await ipcRenderer.invoke(channel, ...args);
    } catch (error) {
      console.error(`Error invoking ${channel}:`, error);
      return null;
    }
  }
};

// Expose protected APIs to renderer
contextBridge.exposeInMainWorld('electron', {
  minimize: () => safeIpcRenderer.send('app-minimize'),
  maximize: () => safeIpcRenderer.send('app-maximize'),
  close: () => safeIpcRenderer.send('app-close'),
  isMaximized: () => safeIpcRenderer.invoke('is-maximized'),
  onMaximizeChange: (callback) => safeIpcRenderer.on('maximize-change', callback),
  // Auto-update related
  onUpdateAvailable: (callback) => safeIpcRenderer.on('update_available', callback),
  onUpdateDownloaded: (callback) => safeIpcRenderer.on('update_downloaded', callback),
  // System tray related
  hideToTray: () => safeIpcRenderer.send('hide-to-tray'),
  showFromTray: () => safeIpcRenderer.send('show-from-tray'),
  // Error handling
  onShowError: (callback) => safeIpcRenderer.on('show-error', callback)
});