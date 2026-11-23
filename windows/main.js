// L & E Plan – Windows-App. Läuft komplett offline; Updates holt sie auf Wunsch von der Web-Adresse.
const { app, BrowserWindow, Menu, dialog, shell, protocol, net, session } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPDATE_URL = process.env.LEPLAN_UPDATE_URL || 'https://aekkert-sudo.github.io/le-plan/';
const FILES = ['index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const BUNDLED = path.join(__dirname, 'app');
let updDir; // wird nach app.ready gesetzt (Benutzerordner)
let win;

protocol.registerSchemesAsPrivileged([{ scheme: 'leplan', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const appDir = () => (fs.existsSync(path.join(updDir, 'index.html')) ? updDir : BUNDLED);
const readLocal = () => fs.readFileSync(path.join(appDir(), 'index.html'));
function versionText() {
  const m = readLocal().toString('utf8').match(/leplan-ver:(\d{8,14})/);
  const t = fs.statSync(path.join(appDir(), 'index.html')).mtime;
  return m ? m[1].replace(/^(\d{4})(\d\d)(\d\d).*/, '$3.$2.$1') : t.toLocaleDateString('de-DE');
}

async function checkUpdate(manual) {
  let remote;
  try {
    const r = await net.fetch(UPDATE_URL + 'index.html?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    remote = Buffer.from(await r.arrayBuffer());
    if (!/L &amp; E Plan|L & E Plan/.test(remote.toString('utf8'))) throw new Error('Inhalt');
  } catch (e) {
    if (manual) dialog.showMessageBox(win, { type: 'info', title: 'Update', message: 'Keine Verbindung zum Internet.', detail: 'Die App funktioniert weiter wie bisher. Für ein Update einfach später mit Internet nochmal „Nach Update suchen“ wählen.' });
    return;
  }
  const ver = b => +((b.toString('utf8').match(/leplan-ver:(\d+)/) || [0, 0])[1]);
  if (hash(remote) === hash(readLocal()) || ver(remote) <= ver(readLocal())) {
    if (manual) dialog.showMessageBox(win, { type: 'info', title: 'Update', message: 'L & E Plan ist auf dem neuesten Stand.' });
    return;
  }
  const { response } = await dialog.showMessageBox(win, {
    type: 'question', title: 'Update verfügbar', buttons: ['Jetzt aktualisieren', 'Später'], defaultId: 0, cancelId: 1,
    message: 'Es gibt eine neue Version von L & E Plan.',
    detail: 'Deine gespeicherten Pläne und Vorlagen bleiben erhalten.'
  });
  if (response !== 0) return;
  try {
    const tmp = updDir + '.neu';
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { recursive: true });
    fs.writeFileSync(path.join(tmp, 'index.html'), remote);
    for (const f of FILES.slice(1)) {
      try { const r = await net.fetch(UPDATE_URL + f, { cache: 'no-store' }); if (r.ok) fs.writeFileSync(path.join(tmp, f), Buffer.from(await r.arrayBuffer())); } catch (e) {}
      if (!fs.existsSync(path.join(tmp, f)) && fs.existsSync(path.join(BUNDLED, f))) fs.copyFileSync(path.join(BUNDLED, f), path.join(tmp, f));
    }
    fs.rmSync(updDir, { recursive: true, force: true });
    fs.renameSync(tmp, updDir);
    win.reload();
    dialog.showMessageBox(win, { type: 'info', title: 'Update', message: 'Update installiert.' });
  } catch (e) {
    dialog.showMessageBox(win, { type: 'error', title: 'Update', message: 'Das Update hat nicht geklappt.', detail: String(e && e.message || e) });
  }
}

function resetToInstalled() {
  dialog.showMessageBox(win, { type: 'question', buttons: ['Zurücksetzen', 'Abbrechen'], cancelId: 1, title: 'Version zurücksetzen',
    message: 'Zurück zur installierten Version?', detail: 'Nur nötig, wenn nach einem Update etwas nicht stimmt. Deine Pläne bleiben erhalten.' })
    .then(({ response }) => { if (response === 0) { fs.rmSync(updDir, { recursive: true, force: true }); win.reload(); } });
}

function buildMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Datei', submenu: [{ label: 'Neu laden', accelerator: 'F5', click: () => win.reload() }, { type: 'separator' }, { label: 'Beenden', role: 'quit' }] },
    { label: 'Ansicht', submenu: [{ label: 'Größer', role: 'zoomIn', accelerator: 'Ctrl+Plus' }, { label: 'Kleiner', role: 'zoomOut' }, { label: 'Normale Größe', role: 'resetZoom' }, { type: 'separator' }, { label: 'Vollbild', role: 'togglefullscreen' }] },
    { label: 'Update', submenu: [
      { label: 'Nach Update suchen', click: () => checkUpdate(true) },
      { label: 'Zurück zur installierten Version', click: resetToInstalled },
      { type: 'separator' },
      { label: 'Version: ' + versionText(), enabled: false }
    ] }
  ]));
}

app.whenReady().then(() => {
  updDir = path.join(app.getPath('userData'), 'app-update');
  protocol.handle('leplan', req => {
    let p = decodeURIComponent(new URL(req.url).pathname).replace(/^\/+/, '') || 'index.html';
    const base = appDir();
    let f = path.normalize(path.join(base, p));
    if (!f.startsWith(base) || !fs.existsSync(f)) f = path.join(BUNDLED, path.basename(p));
    if (!fs.existsSync(f)) return new Response('nicht gefunden', { status: 404 });
    const ext = path.extname(f).toLowerCase();
    const type = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json' }[ext] || 'application/octet-stream';
    return new Response(fs.readFileSync(f), { headers: { 'content-type': type } });
  });

  // PDF speichern: Speichern-Dialog, danach Ordner zeigen
  session.defaultSession.on('will-download', (e, item) => {
    item.setSaveDialogOptions({ title: 'PDF speichern', defaultPath: path.join(app.getPath('documents'), item.getFilename()) });
    item.once('done', (ev, state) => { if (state === 'completed') shell.showItemInFolder(item.getSavePath()); });
  });

  win = new BrowserWindow({
    width: 1400, height: 900, minWidth: 800, minHeight: 560, title: 'L & E Plan',
    icon: path.join(__dirname, 'build', 'icon.ico'), backgroundColor: '#ffffff', autoHideMenuBar: false,
    webPreferences: { contextIsolation: true, sandbox: true, spellcheck: false }
  });
  // mailto: und Internet-Links im normalen Programm öffnen
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('leplan://')) { e.preventDefault(); shell.openExternal(url); } });
  win.webContents.on('page-title-updated', e => e.preventDefault());
  buildMenu();
  win.loadURL('leplan://app/index.html');
  // Beim Start leise nachsehen, ob es ein Update gibt (ohne Internet passiert nichts)
  setTimeout(() => checkUpdate(false), 4000);
});
app.on('window-all-closed', () => app.quit());
