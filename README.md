# Yorkie

A Desktop Pet Yorkshire Terrier that lives on your screen, roams around, rests with little
actions, and reacts to your clicks. Built with Electron, a transparent, always-on-top,
click-through-friendly window with no Dock icon.

![Yorkie, a desktop pet that roams your screen](docs/hero.png)

## Highlights

- 🐕 Hand-drawn Yorkie that **walks around your screen** and flips to face its travel direction
- 😴 **Rests** for random spells and idles with little actions such as look around, yawn, jump, smile, stick out tongue, sneeze, lick, lie down
- 🖱️ **Reacts to you** with a click for a random emotion, a drag to reposition, or a double-click to dismiss
- 🎛️ **Menu-bar control** + global hotkeys (⌘⇧Y summon · ⌘⇧Q quit)
- 👻 Stays **out of the Dock and task switcher**, so it's just a pet, not an app window

## Run
```bash
cd ~/yorkie-pet
npm start          # or: npx electron .
```
Or double-click **start.command** in Finder. Double-click **stop.command** to quit.

## How to interact
- **Click the dog** → a random emotion (joy, excitement, anger, sad).
- **Drag the dog** → reposition it anywhere.
- **Double-click the dog** → shows a ✕ button to close the pet.
- **Menu-bar icon** (little Yorkie face) → *Come here (center)* / *Quit*.
- **⌘⇧Y** summon to center · **⌘⇧Q** quit.

## Behavior
- Roams to random spots anywhere on screen (sit pose ↔ walk pose, flips to face travel direction).
- Rests for a random spell (5 seconds to an hour), while resting it does little actions including look around, yawn, jump, smile, stick out tongue, sneeze, lick, lie down.
- Hidden from the Dock and task switcher.

## Project Structure
- `main.js` — Electron main process: transparent always-on-top window, 2D roam/rest loop, tray, shortcuts.
- `index.html` — the pet UI: sprites, CSS animations, click/drag/double-click logic.
- `preload.js` — secure bridge between the window and the main process.
- `assets/` — `sit.png` (resting), `walk.png` (moving), `tray.png` (menu-bar logo).
- `start.command` / `stop.command` — double-clickable launchers to start and stop the pet.
- `package.json` — Electron dependencies and run scripts.

## Start automatically at login (optional)
System Settings → General → Login Items → **+** → choose `start.command`.
