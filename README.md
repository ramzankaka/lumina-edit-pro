# Lumina Edit

Professional, 100% offline photo & passport-size editor for desktop and web. Lumina Edit (package name: `lumina-edit-pro`) is provided as a static web app and an Electron app so you can use it in the browser or as a desktop application.

Live demo / GitHub Pages: https://ramzankaka.github.io/lumina-edit/

## Features

- Offline-first photo editor (works without internet)
- Passport-size photo cropping and sizing tools
- Basic image adjustments (crop, rotate, resize)
- Export images for printing or digital use
- Works in browser (static site) and as an Electron desktop app
- Progressive Web App support (manifest.json + service worker)

## Getting started

Prerequisites
- Node.js and npm (for running the Electron app or packaging)
- For the static web version, no build step is required — open `index.html` in a browser or host via GitHub Pages.

Run in Electron (development)
1. Clone the repo:
   git clone https://github.com/ramzankaka/lumina-edit.git
2. Install dependencies:
   npm install
3. Start Electron:
   npm run start

Package for Windows
- The repository includes a packaging script:
  npm run package-win
- This uses electron-packager and will create a `dist/` folder with a packaged Windows app.

Run as static web app
- Open `index.html` in a browser, or serve the repository from any static file server.
- The app includes `manifest.json` and `sw.js` for PWA/web-offline behavior.

## Project structure (important files)
- index.html — main web UI
- js/ — JavaScript source files
- css/ — styles
- main-electron.js — Electron main process entry
- package-app.js — helper packaging script
- manifest.json — web manifest for PWA
- sw.js — service worker for offline caching
- icon.svg — app icon

## Usage tips
- For passport-size exports, use the built-in size presets in the UI.
- If the Electron app cannot access local files, ensure proper file permissions on your OS.
- The app is designed to run offline once loaded (service worker caches assets).

## Contributing
Contributions are welcome. To contribute:
1. Fork the repository.
2. Create a branch for your change.
3. Open a pull request with a clear description of your changes.

Please open issues for bugs or feature requests.

## License
This project is licensed under the MIT License — see the included `LICENSE` file for details.

## Author
Sardar Ramzan Baloch (GitHub: @ramzankaka)  
Homepage / Demo: https://ramzankaka.github.io/lumina-edit/
