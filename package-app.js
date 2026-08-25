/**
 * Custom Lightweight packaging script for Lumina Edit Pro
 * Bypasses npm zip-extraction bugs on Node.js v24 on Windows.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_DIR = __dirname;
const DIST_DIR = path.join(PROJECT_DIR, 'dist');
const BUILD_DIR = path.join(DIST_DIR, 'LuminaEditPro-win32-x64');
const APP_DIR = path.join(BUILD_DIR, 'resources', 'app');

// Path to cached electron zip
const CACHE_ZIP = 'C:\\Users\\SSC\\AppData\\Local\\electron\\Cache\\c94f2fc32e1fb05767f75322ea533eeb9828155f017ec184140930a3ec825e81\\electron-v31.7.7-win32-x64.zip';

console.log('--- Custom Packaging Starting ---');

// 1. Clean previous build
if (fs.existsSync(DIST_DIR)) {
  console.log('Cleaning previous build...');
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(BUILD_DIR, { recursive: true });

// 2. Extract Electron template using PowerShell for maximum robustness
console.log('Extracting Electron zip cache...');
const extractCmd = `powershell -Command "Expand-Archive -Path '${CACHE_ZIP}' -DestinationPath '${BUILD_DIR}' -Force"`;
execSync(extractCmd, { stdio: 'inherit' });

// 3. Rename electron.exe to LuminaEditPro.exe
console.log('Renaming binary executable...');
fs.renameSync(path.join(BUILD_DIR, 'electron.exe'), path.join(BUILD_DIR, 'LuminaEditPro.exe'));

// 4. Create resources/app folder
console.log('Creating resources/app folder...');
fs.mkdirSync(APP_DIR, { recursive: true });

// 5. Copy files
const FILES_TO_COPY = [
  'index.html',
  'manifest.json',
  'sw.js',
  'icon.svg',
  'main-electron.js',
  'package.json'
];

FILES_TO_COPY.forEach(file => {
  fs.copyFileSync(path.join(PROJECT_DIR, file), path.join(APP_DIR, file));
});

// Helper function to copy folder recursively
function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const fromPath = path.join(from, element);
    const toPath = path.join(to, element);
    if (fs.lstatSync(fromPath).isDirectory()) {
      copyFolderSync(fromPath, toPath);
    } else {
      fs.copyFileSync(fromPath, toPath);
    }
  });
}

console.log('Copying css/ and js/ source folders...');
copyFolderSync(path.join(PROJECT_DIR, 'css'), path.join(APP_DIR, 'css'));
copyFolderSync(path.join(PROJECT_DIR, 'js'), path.join(APP_DIR, 'js'));

// 6. Strip devDependencies from resources/app/package.json to keep it clean
console.log('Cleaning target app metadata...');
const targetPkgPath = path.join(APP_DIR, 'package.json');
const targetPkg = JSON.parse(fs.readFileSync(targetPkgPath, 'utf8'));
delete targetPkg.devDependencies;
fs.writeFileSync(targetPkgPath, JSON.stringify(targetPkg, null, 2));

console.log('--- Lumina Edit Pro packaged successfully to dist/LuminaEditPro-win32-x64/ ---');
