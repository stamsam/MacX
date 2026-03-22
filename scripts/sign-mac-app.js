const { existsSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const appPath = join(__dirname, '..', 'dist', 'mac-arm64', 'MacX.app');

if (!existsSync(appPath)) {
  console.error(`Expected app bundle at ${appPath}, but it does not exist.`);
  process.exit(1);
}

const result = spawnSync(
  'codesign',
  ['--force', '--deep', '--sign', '-', '--timestamp=none', appPath],
  {
    stdio: 'inherit',
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const verify = spawnSync('codesign', ['--verify', '--deep', '--strict', appPath], {
  stdio: 'inherit',
});

if (verify.status !== 0) {
  process.exit(verify.status ?? 1);
}

console.log(`Signed and verified ${appPath}`);
