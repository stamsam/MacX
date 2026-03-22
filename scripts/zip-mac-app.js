const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const appPath = join(__dirname, '..', 'dist', 'mac-arm64', 'MacX.app');
const zipPath = join(__dirname, '..', 'dist', 'MacX-mac-arm64.zip');

if (!existsSync(appPath)) {
  console.error(`Expected app bundle at ${appPath}, but it does not exist.`);
  process.exit(1);
}

const result = spawnSync(
  'ditto',
  ['-c', '-k', '--sequesterRsrc', '--keepParent', appPath, zipPath],
  {
    stdio: 'inherit',
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Created shareable archive at ${zipPath}`);
