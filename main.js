const { app, BrowserWindow, ipcMain, screen, Menu, Tray, nativeImage, globalShortcut } = require('electron');
const path = require('path');

// Window size — the dog lives inside this. Tall enough for jump animations.
const WIN_W = 76;
const WIN_H = 84;

let win = null;
let tray = null;

// Wander state, all in screen coordinates of the window's top-left.
const state = {
  x: 0,
  y: 0,
  targetX: 0,
  targetY: 0,
  mode: 'idle',      // 'idle' | 'walk'
  facing: 1,         // 1 = right, -1 = left
  angle: 180,        // travel direction in screen degrees
  restUntil: 0,      // timestamp until which the dog rests before roaming again
  nextAction: 0,     // timestamp of the next little idle action
  dragging: false,
};

let workArea = { x: 0, y: 0, width: 1440, height: 900 };
const SPEED = 2.0;          // pixels per tick while walking

// Little things the dog does while resting (handled by the renderer).
const ACTIONS = ['look', 'yawn', 'jump', 'smile', 'tongue', 'sneeze', 'lick', 'lie', 'look', 'smile'];

const rand = (a, b) => a + Math.random() * (b - a);

// Random rest window between roams (adjustable from the menu bar).
const REST = { min: 5000, max: 3600000 };
const MIN_CHOICES = [5000, 15000, 30000, 60000, 120000];
const MAX_CHOICES = [30000, 60000, 300000, 900000, 1800000, 3600000];
function fmtMs(ms) {
  if (ms < 60000) return (ms / 1000) + 's';
  if (ms < 3600000) return (ms / 60000) + ' min';
  return (ms / 3600000) + ' hr';
}

function groundY() {
  return workArea.y + workArea.height - WIN_H - 4;
}

function pickNewTarget() {
  // Roam anywhere on the screen, not just along the bottom.
  const minX = workArea.x, maxX = workArea.x + workArea.width - WIN_W;
  const minY = workArea.y, maxY = workArea.y + workArea.height - WIN_H;
  state.targetX = Math.round(rand(minX, maxX));
  state.targetY = Math.round(rand(minY, maxY));
  // angle of travel (screen degrees: 0=right, 90=down, 180=left, -90=up)
  const dx = state.targetX - state.x, dy = state.targetY - state.y;
  state.angle = Math.atan2(dy, dx) * 180 / Math.PI;
  state.facing = dx >= 0 ? 1 : -1;
  state.mode = 'walk';
  sendState();
}

function startResting(now) {
  state.mode = 'idle';
  // Rest for a random spell within the configured window.
  state.restUntil = now + rand(REST.min, REST.max);
  state.nextAction = now + rand(1500, 6000);
  sendState();
}

function sendState() {
  if (win && !win.isDestroyed()) {
    win.webContents.send('state', { mode: state.mode, facing: state.facing, angle: state.angle });
  }
}

function tick() {
  if (!win || win.isDestroyed() || state.dragging) return;

  const now = Date.now();

  if (state.mode === 'idle') {
    if (now >= state.restUntil) {
      pickNewTarget();
    } else if (now >= state.nextAction) {
      // perform a random little action, then wait a random spell
      const a = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      win.webContents.send('action', a);
      state.nextAction = now + rand(4000, 16000);
    }
    return;
  }

  // mode === 'walk' — move toward the target in 2D
  const dx = state.targetX - state.x;
  const dy = state.targetY - state.y;
  const dist = Math.hypot(dx, dy);
  if (dist <= SPEED) {
    state.x = state.targetX;
    state.y = state.targetY;
    win.setBounds({ x: Math.round(state.x), y: Math.round(state.y), width: WIN_W, height: WIN_H });
    startResting(now);
    return;
  }

  if (Math.abs(dx) > 0.5) state.facing = dx >= 0 ? 1 : -1;
  state.x += (dx / dist) * SPEED;
  state.y += (dy / dist) * SPEED;
  win.setBounds({ x: Math.round(state.x), y: Math.round(state.y), width: WIN_W, height: WIN_H });
}

function createWindow() {
  const primary = screen.getPrimaryDisplay();
  workArea = primary.workArea;

  state.x = workArea.x + Math.round(workArea.width / 2);
  state.y = groundY();

  win = new BrowserWindow({
    width: WIN_W,
    height: WIN_H,
    x: Math.round(state.x),
    y: Math.round(state.y),
    transparent: true,
    frame: false,
    resizable: false,
    movable: true,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.loadFile('index.html');

  // Start fully click-through; the dog toggles this off when the cursor is over it.
  win.setIgnoreMouseEvents(true, { forward: true });

  // Begin resting, then roam after a short spell.
  startResting(Date.now());
  state.restUntil = Date.now() + rand(3000, 8000);

  setInterval(tick, 16);

  win.on('closed', () => { win = null; });
}

function createTray() {
  // Little Yorkie face logo in the menu bar.
  let img = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png'));
  if (!img.isEmpty()) {
    img = img.resize({ width: 18, height: 18, quality: 'best' });
    img.setTemplateImage(false);
  }
  try {
    tray = new Tray(img);
    tray.setToolTip('Yorkie desktop pet');
    buildMenu();
  } catch (e) {
    // Tray can fail on some setups; not fatal.
  }
}

function setRest(which, v) {
  REST[which] = v;
  // keep min <= max by nudging the other bound onto a valid choice
  if (REST.min > REST.max) {
    if (which === 'min') {
      REST.max = MAX_CHOICES.find((x) => x >= REST.min) || MAX_CHOICES[MAX_CHOICES.length - 1];
    } else {
      const ok = MIN_CHOICES.filter((x) => x <= REST.max);
      REST.min = ok.length ? ok[ok.length - 1] : MIN_CHOICES[0];
    }
  }
  buildMenu();
}

function buildMenu() {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    { label: 'Yorkie is wandering…', enabled: false },
    { type: 'separator' },
    { label: 'Come here (center)', click: () => { centerDog(); } },
    { type: 'separator' },
    { label: `Rest between moves: ${fmtMs(REST.min)} – ${fmtMs(REST.max)}`, enabled: false },
    { label: 'Minimum rest', submenu: MIN_CHOICES.map((v) => (
        { label: fmtMs(v), type: 'radio', checked: REST.min === v, click: () => setRest('min', v) })) },
    { label: 'Maximum rest', submenu: MAX_CHOICES.map((v) => (
        { label: fmtMs(v), type: 'radio', checked: REST.max === v, click: () => setRest('max', v) })) },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function centerDog() {
  state.x = workArea.x + Math.round(workArea.width / 2 - WIN_W / 2);
  state.y = groundY();
  startResting(Date.now());
  if (win && !win.isDestroyed()) {
    win.setBounds({ x: Math.round(state.x), y: Math.round(state.y), width: WIN_W, height: WIN_H });
  }
  sendState();
}

// ---- IPC from renderer ----

// Toggle click-through based on whether the cursor is over the dog's body.
ipcMain.on('set-interactive', (_e, interactive) => {
  if (!win || win.isDestroyed()) return;
  win.setIgnoreMouseEvents(!interactive, { forward: true });
});

// Dragging the dog with the mouse.
ipcMain.on('drag-start', () => { state.dragging = true; });
ipcMain.on('drag-move', (_e, { dx, dy }) => {
  if (!win || win.isDestroyed()) return;
  state.x += dx;
  state.y += dy;
  // Keep within the work area.
  state.x = Math.max(workArea.x, Math.min(workArea.x + workArea.width - WIN_W, state.x));
  state.y = Math.max(workArea.y, Math.min(workArea.y + workArea.height - WIN_H, state.y));
  win.setBounds({ x: Math.round(state.x), y: Math.round(state.y), width: WIN_W, height: WIN_H });
});
ipcMain.on('drag-end', () => {
  state.dragging = false;
  startResting(Date.now());
});

ipcMain.on('quit', () => app.quit());

app.whenReady().then(() => {
  if (process.platform === 'darwin' && app.dock) app.dock.hide();
  createWindow();
  createTray();

  // Keyboard escape hatches (tray icons can be invisible on some macOS setups).
  globalShortcut.register('CommandOrControl+Shift+Y', () => centerDog()); // summon to center
  globalShortcut.register('CommandOrControl+Shift+Q', () => app.quit());  // quit
});

app.on('will-quit', () => globalShortcut.unregisterAll());

app.on('window-all-closed', () => {
  // Keep running in background even if window closes; quit handled via tray.
  if (process.platform !== 'darwin') app.quit();
});
