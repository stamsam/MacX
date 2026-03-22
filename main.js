const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const themeCss = fs.readFileSync(path.join(__dirname, 'theme.css'), 'utf8');
const preloadPath = path.join(__dirname, 'preload.js');
const CACHE_CLEAR_INTERVAL_MS = 25 * 60 * 1000;
const SOFT_RELOAD_IDLE_MS = 60 * 60 * 1000;
let liteModeEnabled = true;

app.commandLine.appendSwitch(
  'disable-features',
  'Translate,BackForwardCache,MediaRouter,OptimizationHints,AutofillServerCommunication'
);
app.commandLine.appendSwitch('autoplay-policy', 'user-gesture-required');

function isXDomain(url) {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === 'x.com' ||
      parsed.hostname.endsWith('.x.com') ||
      parsed.hostname === 'twitter.com' ||
      parsed.hostname.endsWith('.twitter.com')
    );
  } catch {
    return false;
  }
}

function isHttpUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function openLinkExternally(url) {
  if (!isHttpUrl(url)) {
    return;
  }

  shell.openExternal(url).catch((error) => {
    console.error(`Failed to open external link: ${url}`, error);
  });
}

function getActiveWindow() {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null;
}

function runInPage(win, script) {
  if (!win || win.isDestroyed()) {
    return Promise.resolve();
  }

  return win.webContents.executeJavaScript(script, true).catch((error) => {
    console.error('Failed to execute page script:', error);
  });
}

function applyLiteMode(win) {
  return runInPage(
    win,
    `document.documentElement.classList.toggle('macx-lite-mode', ${JSON.stringify(liteModeEnabled)});`
  );
}

function toggleLiteMode() {
  liteModeEnabled = !liteModeEnabled;

  for (const win of BrowserWindow.getAllWindows()) {
    void applyLiteMode(win);
  }
}

function navigateCurrentWindow(pathname) {
  const win = getActiveWindow();
  if (!win) {
    return;
  }

  win.loadURL(new URL(pathname, 'https://x.com').toString());
}

function focusSearch() {
  const win = getActiveWindow();
  if (!win) {
    return;
  }

  void runInPage(
    win,
    `(() => {
      const selectors = [
        '[data-testid="SearchBox_Search_Input"] input',
        'input[aria-label="Search query"]',
        'input[placeholder="Search"]'
      ];
      const input = selectors
        .map((selector) => document.querySelector(selector))
        .find(Boolean);
      if (!input) return false;
      input.focus();
      input.select?.();
      return true;
    })();`
  );
}

function composePost() {
  navigateCurrentWindow('/compose/post');
}

function goBack() {
  const win = getActiveWindow();
  if (win?.webContents.canGoBack()) {
    win.webContents.goBack();
  }
}

function goForward() {
  const win = getActiveWindow();
  if (win?.webContents.canGoForward()) {
    win.webContents.goForward();
  }
}

function reloadCurrentWindow(ignoreCache = false) {
  const win = getActiveWindow();
  if (!win) {
    return;
  }

  if (ignoreCache) {
    win.webContents.reloadIgnoringCache();
    return;
  }

  win.webContents.reload();
}

function buildAppMenu() {
  const template = [
    ...(process.platform === 'darwin'
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' },
              { type: 'separator' },
              { role: 'services' },
              { type: 'separator' },
              { role: 'hide' },
              { role: 'hideOthers' },
              { role: 'unhide' },
              { type: 'separator' },
              { role: 'quit' }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'New Window',
          accelerator: 'CommandOrControl+N',
          click: () => createWindow()
        },
        {
          label: 'New Post',
          accelerator: 'CommandOrControl+Shift+N',
          click: composePost
        }
      ]
    },
    {
      label: 'Navigate',
      submenu: [
        { label: 'Home', accelerator: 'CommandOrControl+1', click: () => navigateCurrentWindow('/home') },
        { label: 'Explore', accelerator: 'CommandOrControl+2', click: () => navigateCurrentWindow('/explore') },
        {
          label: 'Notifications',
          accelerator: 'CommandOrControl+3',
          click: () => navigateCurrentWindow('/notifications')
        },
        { label: 'Messages', accelerator: 'CommandOrControl+4', click: () => navigateCurrentWindow('/messages') },
        { label: 'Bookmarks', accelerator: 'CommandOrControl+5', click: () => navigateCurrentWindow('/i/bookmarks') },
        { type: 'separator' },
        { label: 'Focus Search', accelerator: 'CommandOrControl+L', click: focusSearch },
        { label: 'Back', accelerator: 'CommandOrControl+[', click: goBack },
        { label: 'Forward', accelerator: 'CommandOrControl+]', click: goForward }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Reload', accelerator: 'CommandOrControl+R', click: () => reloadCurrentWindow(false) },
        {
          label: 'Hard Reload',
          accelerator: 'CommandOrControl+Shift+R',
          click: () => reloadCurrentWindow(true)
        },
        {
          label: 'Toggle Lite Mode',
          accelerator: 'CommandOrControl+Shift+L',
          click: toggleLiteMode
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, ...(process.platform === 'darwin' ? [{ role: 'front' }] : [])]
    }
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function attachLinkHandlers(win) {
  const { webContents } = win;

  webContents.setWindowOpenHandler(({ url }) => {
    if (isXDomain(url)) {
      createWindow(url);
    } else if (isHttpUrl(url)) {
      openLinkExternally(url);
    }

    return { action: 'deny' };
  });

  webContents.on('will-navigate', (event, url) => {
    if (isXDomain(url)) {
      return;
    }

    event.preventDefault();
    openLinkExternally(url);
  });
}

function scheduleMemoryMaintenance(win) {
  let hiddenAt = 0;
  const { session } = win.webContents;

  const clearMemoryHeavyCaches = async () => {
    try {
      await session.clearCache();
      await session.clearStorageData({
        storages: ['shadercache', 'cachestorage', 'serviceworkers', 'websql']
      });
    } catch (error) {
      console.error('Memory cleanup failed:', error);
    }
  };

  const maybeSoftReload = () => {
    if (!hiddenAt) {
      return;
    }

    const hiddenDuration = Date.now() - hiddenAt;
    if (hiddenDuration >= SOFT_RELOAD_IDLE_MS && !win.webContents.isDestroyed()) {
      hiddenAt = 0;
      win.webContents.reload();
    }
  };

  const cleanupInterval = setInterval(clearMemoryHeavyCaches, CACHE_CLEAR_INTERVAL_MS);
  win.on('hide', () => {
    hiddenAt = Date.now();
  });
  win.on('minimize', () => {
    hiddenAt = Date.now();
  });
  win.on('show', maybeSoftReload);
  win.on('restore', maybeSoftReload);
  win.on('closed', () => {
    clearInterval(cleanupInterval);
  });
}

function createWindow(initialUrl = 'https://x.com') {
  const win = new BrowserWindow({
    width: 1400,
    height: 920,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#F6F3ED',
    title: 'MacX',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: preloadPath,
      partition: 'persist:macx',
      spellcheck: false,
      backgroundThrottling: true,
      devTools: !app.isPackaged,
      v8CacheOptions: 'bypassHeatCheckAndEagerCompile'
    }
  });

  let insertedThemeKey = null;
  const applyTheme = async () => {
    try {
      if (insertedThemeKey) {
        await win.webContents.removeInsertedCSS(insertedThemeKey).catch(() => {});
      }
      insertedThemeKey = await win.webContents.insertCSS(themeCss);
    } catch (error) {
      console.error('Failed to inject theme CSS:', error);
    }
  };

  win.webContents.on('did-finish-load', async () => {
    await applyTheme();
    await applyLiteMode(win);
  });
  attachLinkHandlers(win);
  win.once('ready-to-show', () => {
    win.show();
  });
  scheduleMemoryMaintenance(win);

  win.loadURL(initialUrl);

  return win;
}

app.whenReady().then(() => {
  buildAppMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
