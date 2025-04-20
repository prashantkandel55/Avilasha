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

      // Install React DevTools
      if (isDev) {
        // installExtension(REACT_DEVELOPER_TOOLS)
        //   .then((name) => console.log(`Added Extension: ${name}`))
        //   .catch((err) => console.log('An error occurred: ', err));
      }

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
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          preload: path.join(__dirname, 'preload.cjs'),
          webviewTag: true,
          webSecurity: !isDev, // Disable webSecurity in development to allow loading local resources
          allowRunningInsecureContent: isDev,
          enableRemoteModule: false,
          sandbox: false, // Required for preload script
          devTools: isDev
        },
        icon: path.join(__dirname, '../public/avilasha.png'),
        backgroundColor: '#ffffff',
        show: false
      });

      mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        // Check for updates
        if (!isDev) {
          autoUpdater.checkForUpdatesAndNotify();
        }

        // Set up window maximize/unmaximize event listeners after window is ready
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

      // Let us register listeners on the window, so we can update the state
      // automatically (the listeners will be removed when the window is closed)
      // and restore the maximized or full screen state
      mainWindowState.manage(mainWindow);

      // Create tray icon
      tray = new Tray(path.join(__dirname, '../public/avilasha.png'));
      const contextMenu = Menu.buildFromTemplate([
        { 
          label: 'Show App', 
          click: () => mainWindow.show() 
        },
        { 
          label: 'Quit', 
          click: () => app.quit() 
        }
      ]);
      tray.setToolTip('Avilasha');
      tray.setContextMenu(contextMenu);

      // Load the app - dynamically adjust for any port Vite might be using
      if (isDev) {
        // Function to test connecting to a URL
        const testConnection = async (url) => {
          try {
            console.log(`Attempting to load: ${url}`);
            await mainWindow.loadURL(url);
            console.log(`Successfully connected to: ${url}`);
            return true;
          } catch (err) {
            console.log(`Failed to connect to: ${url}`, err.message);
            return false;
          }
        };

        console.log('Trying to connect to Vite development server...');
        
        // Try to connect to different ports (prefer 3003, then 3001, 3002)
        const possiblePorts = [3003, 3001, 3002];
        let connected = false;
        
        for (const port of possiblePorts) {
          if (connected) break;
          
          const url = `http://localhost:${port}`;
          console.log(`Attempting to connect to port ${port}...`);
          
          try {
            connected = await testConnection(url);
            if (connected) {
              console.log(`Successfully connected to Vite server on port ${port}`);
            }
          } catch (error) {
            // Just try next port
          }
        }
        
        if (!connected) {
          console.log('Failed to connect to Vite server on any port. Trying to load from dist directory...');
          try {
            const distPath = path.join(__dirname, '../dist/index.html');
            console.log(`Attempting to load from: ${distPath}`);
            
            if (!await fileExists(distPath)) {
              console.warn('Dist folder not found. Please run "npm run build" first or start Vite dev server.');
              mainWindow.webContents.send('show-error', {
                title: 'Development Error',
                message: 'Could not connect to development server and dist folder not found.'
              });
            } else {
              await mainWindow.loadFile(distPath);
              console.log('Successfully loaded app from dist directory');
            }
          } catch (error) {
            console.error('Failed to load app from dist directory:', error);
            mainWindow.webContents.send('show-error', {
              title: 'Load Error',
              message: 'Failed to load the application. Please check console for details.'
            });
          }
        }
        
        // Open DevTools
        mainWindow.webContents.openDevTools();
      } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(err => {
          console.error('Failed to load app:', err);
          app.quit();
        });
      }

      mainWindow.on('closed', () => {
        mainWindow = null;
        if (tray) {
          tray.destroy();
          tray = null;
        }
      });

      mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();
      });

      // IPC handlers for window controls and tray
      ipcMain.on('app-minimize', () => {
        if (mainWindow) mainWindow.minimize();
      });
      ipcMain.on('app-maximize', () => {
        if (mainWindow) {
          if (mainWindow.isMaximized()) {
            mainWindow.unmaximize();
          } else {
            mainWindow.maximize();
          }
        }
      });
      ipcMain.on('app-close', () => {
        if (mainWindow) mainWindow.close();
      });
      ipcMain.handle('is-maximized', () => {
        if (mainWindow) return mainWindow.isMaximized();
        return false;
      });

      // Notify renderer when maximize state changes
      if (mainWindow) {
        mainWindow.on('maximize', () => {
          mainWindow.webContents.send('maximize-change', true);
        });
        mainWindow.on('unmaximize', () => {
          mainWindow.webContents.send('maximize-change', false);
        });
      }

      // Tray controls
      ipcMain.on('hide-to-tray', () => {
        if (mainWindow && tray) {
          mainWindow.hide();
        }
      });
      ipcMain.on('show-from-tray', () => {
        if (mainWindow) mainWindow.show();
      });

      // Error handling
      ipcMain.on('show-error', (event, { title, message }) => {
        if (mainWindow) {
          mainWindow.webContents.send('show-error', { title, message });
        }
      });

      // Auto-update events
      autoUpdater.on('update-available', () => {
        if (mainWindow) mainWindow.webContents.send('update_available');
      });
      autoUpdater.on('update-downloaded', () => {
        if (mainWindow) mainWindow.webContents.send('update_downloaded');
      });
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