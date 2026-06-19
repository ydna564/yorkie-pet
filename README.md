# 🐶 Yorkie — Desktop Pet (电子宠物)

A Yorkshire Terrier that lives on your screen. It roams around, rests with little
actions, and reacts to your clicks.

## Run
```bash
cd ~/yorkie-pet
npm start          # or: npx electron .
```
Or double-click **start.command** in Finder. Double-click **stop.command** to quit.

## How to interact
- **Click the dog** → a random emotion (😊 joy, 🤩 excitement, 😠 anger, 🥺 sad).
- **Drag the dog** → reposition it anywhere.
- **Double-click the dog** → shows a ✕ button to close the pet.
- **Menu-bar icon** (little Yorkie face) → *Come here (center)* / *Quit*.
- **⌘⇧Y** summon to center · **⌘⇧Q** quit.

## Behavior
- Roams to random spots anywhere on screen (sit pose ↔ walk pose, flips to face travel direction).
- Rests for a random spell (5 seconds to an hour); while resting it does little actions:
  look around, yawn, jump, smile, stick out tongue, sneeze, lick, lie down.
- Always on top; transparent except the dog, so clicks elsewhere pass through.
- Hidden from the Dock and task switcher.

## Files
- `main.js` — Electron main process: transparent always-on-top window, 2D roam/rest loop, tray, shortcuts.
- `index.html` — the pet UI: sprites, CSS animations, click/drag/double-click logic.
- `preload.js` — secure bridge between the window and the main process.
- `assets/` — `sit.png` (resting), `walk.png` (moving), `tray.png` (menu-bar logo).

## Start automatically at login (optional)
System Settings → General → Login Items → **+** → choose `start.command`.
