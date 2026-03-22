# MacX

MacX is an unofficial desktop wrapper for `x.com` built with Electron. It keeps the core X experience, but adds a warm custom theme, desktop-friendly link handling, native keyboard shortcuts, and a lighter rendering mode.

This project is not affiliated with, endorsed by, or sponsored by X Corp.

## Features

- Warm custom theme with a native-feeling macOS presentation
- External links open in your default browser instead of trapping you in the embedded view
- X and Twitter popup links can open in their own MacX window
- Native keyboard shortcuts for core navigation
- Lite Mode to reduce blur and shadow overhead
- Shareable Apple Silicon build output

## Screenshots

### Login

![MacX login screen](media/screenshot-login.png)

### Search

![MacX search view](media/screenshot-home.png)

### Profile

![MacX profile view](media/screenshot-profile.png)

## Development

```bash
cd MacX
npm install
npm start
```

## Keyboard Shortcuts

- `Cmd+1` Home
- `Cmd+2` Explore
- `Cmd+3` Notifications
- `Cmd+4` Messages
- `Cmd+5` Bookmarks
- `Cmd+L` Focus search
- `Cmd+N` New window
- `Cmd+Shift+N` New post
- `Cmd+[` Back
- `Cmd+]` Forward
- `Cmd+R` Reload
- `Cmd+Shift+R` Hard reload
- `Cmd+Shift+L` Toggle Lite Mode

## Build Assets

The master icon artwork lives at `build/logo-master.png`.

To rebuild the app icon set from that image:

```bash
npm run build:assets
```

The build uses `logo-master.png` directly.

## Build the App

```bash
cd MacX
npm run build:mac:signed
```

Output:

`dist/mac-arm64/MacX.app`

To open the built app from Terminal:

```bash
npm run open:mac
```

## Build a Shareable Copy

```bash
cd MacX
npm run package:share
```

Output:

`dist/MacX-mac-arm64.zip`

The archive is for Apple Silicon Macs. User sessions stay local, so each person signs in with their own X account.

## Install Notes

1. Unzip `MacX-mac-arm64.zip`.
2. Move `MacX.app` into `Applications`.
3. Open it. Because this build is ad-hoc signed and not notarized, macOS may warn that the app is from an unidentified developer. Right-click the app, choose `Open`, and confirm.

If Gatekeeper still blocks launch, you have two options:

Option 1: Allow it in System Settings.

- Open `System Settings`
- Go to `Privacy & Security`
- Scroll to the security section near the bottom
- Click `Open Anyway` or allow `MacX.app` if macOS shows it there

Option 2: Remove the quarantine flag in Terminal.

```bash
xattr -dr com.apple.quarantine /Applications/MacX.app
```

That command should be run in the macOS `Terminal` app.
