const { mkdirSync, rmSync } = require('fs');
const { join } = require('path');
const { spawnSync } = require('child_process');

const projectRoot = join(__dirname, '..');
const buildDir = join(projectRoot, 'build');
const masterPngPath = join(buildDir, 'logo-master.png');
const pngPath = join(buildDir, 'logo-source.png');
const iconsetDir = join(buildDir, 'icon.iconset');
const icnsPath = join(buildDir, 'icon.icns');

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

rmSync(iconsetDir, { recursive: true, force: true });
mkdirSync(iconsetDir, { recursive: true });

run('cp', [masterPngPath, pngPath]);

const sizes = [
  ['16', 'icon_16x16.png'],
  ['32', 'icon_16x16@2x.png'],
  ['32', 'icon_32x32.png'],
  ['64', 'icon_32x32@2x.png'],
  ['128', 'icon_128x128.png'],
  ['256', 'icon_128x128@2x.png'],
  ['256', 'icon_256x256.png'],
  ['512', 'icon_256x256@2x.png'],
  ['512', 'icon_512x512.png'],
  ['1024', 'icon_512x512@2x.png']
];

for (const [size, filename] of sizes) {
  run('sips', ['-z', size, size, pngPath, '--out', join(iconsetDir, filename)]);
}

rmSync(icnsPath, { force: true });
run('iconutil', ['-c', 'icns', iconsetDir, '-o', icnsPath]);

console.log(`Built icon assets at ${icnsPath}`);
