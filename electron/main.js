process.on('uncaughtException', function (err) {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', function (reason, promise) {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function initialize() {
  try {
    const electron = await import('electron');
    const { app, BrowserWindow, ipcMain, Tray, Menu, session } = electron;
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { autoUpdater } = await import('electron-updater');
    const windowStateKeeper = (await import('electron-window-state')).default;
    // Devtools installer import fix for ESM/CJS compatibility (strict)
    const devtoolsInstaller = await import('electron-devtools-installer');
    const installExtension = devtoolsInstaller.default || devtoolsInstaller;
    const { REACT_DEVELOPER_TOOLS, REDUX_DEVTOOLS } = devtoolsInstaller;
    const { default: electronDebug } = await import('electron-debug');

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

    // Enable electron debug features
    electronDebug();

    let mainWindow;
    let tray = null;
    let store;

    // Path to Avilasha logo
    const iconPath = path.join(__dirname, '../public/Avilasha.svg');

    // Initialize store
    const initStore = async () => {
      try {
        const Store = (await import('electron-store')).default;
        Store.initRenderer();
        store = new Store({
          name: 'avilasha-store',
          defaults: {
            windowBounds: { width: 1200, height: 800 },
            isMaximized: false
          },
          clearInvalidConfig: true
        });
        console.log('Electron store initialized successfully');
      } catch (error) {
        console.error('Failed to initialize electron-store:', error);
        store = null;
      }
    };

    // Configure auto updater
    if (!isDev) {
      autoUpdater.autoDownload = true;
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.allowDowngrade = true;
      autoUpdater.checkForUpdatesAndNotify();
    }

    // Enable hot reload in development
    if (isDev) {
      try {
        // Temporarily disable hot reload as it's causing issues
        console.log('Hot reloading disabled temporarily');
        // Robust DevTools installer import for ESM/CJS compatibility
        const devtoolsInstaller = await import('electron-devtools-installer');
        const installExtension = devtoolsInstaller.default || devtoolsInstaller;
        const REACT_DEVELOPER_TOOLS = devtoolsInstaller.REACT_DEVELOPER_TOOLS;
        const REDUX_DEVTOOLS = devtoolsInstaller.REDUX_DEVTOOLS;
        if (typeof installExtension === 'function') {
          installExtension(REACT_DEVELOPER_TOOLS)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log('An error occurred: ', err));
          installExtension(REDUX_DEVTOOLS)
            .then((name) => console.log(`Added Extension:  ${name}`))
            .catch((err) => console.log('An error occurred: ', err));
        } else {
          console.warn('Devtools installer is not a function:', installExtension);
        }
      } catch (err) {
        console.log('Error installing devtools:', err);
      }
      /*
      const reloader = await import('electron-reloader');
      reloader.default(import.meta.url, {
        debug: true,
        watchRenderer: true
      });
      console.log('Hot reloading enabled');
      */
    }

    // Make this function async to use await inside
    async function createWindow() {
      // Set up Content Security Policy
      session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:;",
              "img-src 'self' 'unsafe-inline' data: blob: https:;",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
              "style-src 'self' 'unsafe-inline';"
            ]
          }
        });
      });

      // Load logo as icon
      const iconPath = path.join(__dirname, '../public/Avilasha.svg');

      // Load the previous state with fallback to defaults
      let mainWindowState = windowStateKeeper({
        defaultWidth: 1200,
        defaultHeight: 800
      });

      // Handle window state persistence
      ipcMain.handle('is-maximized', () => {
        return mainWindow ? mainWindow.isMaximized() : false;
      });

      mainWindow = new BrowserWindow({
        x: mainWindowState.x,
        y: mainWindowState.y,
        width: mainWindowState.width,
        height: mainWindowState.height,
        frame: false,
        icon: iconPath, // Use logo as window/taskbar icon
        resizable: true,
        movable: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.cjs'),
          webviewTag: true,
          webSecurity: !isDev,
          allowRunningInsecureContent: isDev,
          enableRemoteModule: false,
          sandbox: false,
          devTools: isDev
        },
        backgroundColor: '#ffffff',
        show: false
      });

      mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        if (!isDev) {
          autoUpdater.checkForUpdatesAndNotify();
        }
        if (store) {
          mainWindow.on('maximize', () => {
            store.set('isMaximized', true);
            mainWindow.webContents.send('maximize-change', true);
          });
          mainWindow.on('unmaximize', () => {
            store.set('isMaximized', false);
            mainWindow.webContents.send('maximize-change', false);
          });
        }
      });

      mainWindowState.manage(mainWindow);

      // Tray icon
      const { nativeImage } = electron;
      const trayIcon = nativeImage.createFromPath(iconPath);
      tray = new Tray(trayIcon);
      const contextMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow.show() },
        { label: 'Quit', click: () => app.quit() }
      ]);
      tray.setToolTip('Avilasha');
      tray.setContextMenu(contextMenu);

      // --- ENHANCED: Use dynamic dev ports for renderer loading ---
      if (isDev) {
        // Try to connect to Vite dev server
        const testConnection = async (url) => {
          try {
            await mainWindow.loadURL(url);
            return true;
          } catch (err) {
            console.log(`Failed to connect to: ${url}`, err.message);
            return false;
          }
        };
        // Try 3020 first, then fallback to others
        const possiblePorts = [3020, 3010, 3003, 3001, 3002];
        let connected = false;
        for (const port of possiblePorts) {
          if (connected) break;
          const url = `http://localhost:${port}`;
          try {
            connected = await testConnection(url);
          } catch {}
        }
        if (!connected) {
          // Fallback to dist
          try {
            const distPath = path.join(__dirname, '../dist/index.html');
            await mainWindow.loadFile(distPath);
          } catch (error) {
            mainWindow.webContents.executeJavaScript(`document.body.innerHTML = '<pre style="color:red;">Renderer failed to load: ${error.message}</pre>'`);
          }
        }
      } else {
        try {
          const distPath = path.join(__dirname, '../dist/index.html');
          await mainWindow.loadFile(distPath);
        } catch (error) {
          mainWindow.webContents.executeJavaScript(`document.body.innerHTML = '<pre style="color:red;">Renderer failed to load: ${error.message}</pre>'`);
        }
      }
    }

    // Helper to check if file exists
    async function fileExists(filePath) {
      try {
        const fs = await import('fs/promises');
        await fs.access(filePath);
        return true;
      } catch {
        return false;
      }
    }

    // --- Native Dialogs Example ---
    ipcMain.handle('show-confirm-dialog', async (event, options) => {
      const { dialog } = await import('electron');
      const result = await dialog.showMessageBox(mainWindow, {
        type: options?.type || 'question',
        buttons: options?.buttons || ['Yes', 'No'],
        defaultId: options?.defaultId || 0,
        title: options?.title || 'Confirm',
        message: options?.message || 'Are you sure?',
        detail: options?.detail || '',
        cancelId: options?.cancelId ?? 1
      });
      return result.response;
    });

    // --- Auto Update Events ---
    if (!isDev) {
      autoUpdater.on('update-available', () => {
        if (mainWindow) mainWindow.webContents.send('update-available');
      });
      autoUpdater.on('update-downloaded', () => {
        if (mainWindow) mainWindow.webContents.send('update-downloaded');
      });
      autoUpdater.on('error', (err) => {
        if (mainWindow) mainWindow.webContents.send('update-error', err.message);
      });
      ipcMain.on('restart-to-update', () => {
        autoUpdater.quitAndInstall();
      });
    }

    // --- Enhanced Tray Behavior ---
    tray.on('double-click', () => {
      if (mainWindow) mainWindow.show();
    });
    tray.on('click', () => {
      if (mainWindow) mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
    });

    // --- Minimize to Tray Instead of Close ---
    mainWindow.on('close', (event) => {
      if (!app.isQuiting) {
        event.preventDefault();
        mainWindow.hide();
        tray.displayBalloon && tray.displayBalloon({
          icon: iconPath,
          title: 'Avilasha',
          content: 'App is minimized to tray.'
        });
      }
      return false;
    });

    app.whenReady().then(async () => {
      await initStore();
      await createWindow(); // Also add await here since createWindow is now async
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (mainWindow === null) {
        createWindow();
      }
    });

    // Handle IPC messages
    ipcMain.on('app-minimize', () => {
      mainWindow?.minimize();
    });

    ipcMain.on('app-maximize', () => {
      if (mainWindow?.isMaximized()) {
        mainWindow?.unmaximize();
      } else {
        mainWindow?.maximize();
      }
    });

    ipcMain.on('app-close', () => {
      mainWindow?.close();
    });

    // Implement the tray handlers referenced in preload.js
    ipcMain.on('hide-to-tray', () => {
      mainWindow?.hide();
    });

    ipcMain.on('show-from-tray', () => {
      if (mainWindow) {
        mainWindow.show();
      }
    });

  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
}

initialize().catch(error => {
  console.error('Failed to initialize:', error);
  process.exit(1);
});