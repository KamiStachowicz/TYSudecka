// Generuje ikony aplikacji z logo stacji (assets/brand/tvs.jpg). Uruchom: node scripts/make-icons.cjs
const Jimp = require('jimp-compact');
const path = require('node:path');

const assets = path.join(__dirname, '..', 'assets');

async function onCanvas(size, logoWidth, background, out) {
  const logo = await Jimp.read(path.join(assets, 'brand', 'tvs.jpg'));
  logo.resize(logoWidth, Jimp.AUTO);
  const canvas = new Jimp(size, size, background);
  canvas.composite(logo, Math.round((size - logo.bitmap.width) / 2), Math.round((size - logo.bitmap.height) / 2));
  await canvas.writeAsync(path.join(assets, out));
}

(async () => {
  await onCanvas(1024, 820, 0xffffffff, 'icon.png');
  // Android przycina ikonę adaptacyjną do koła/kwadratu, więc logo musi zmieścić się w środkowych ~66%.
  await onCanvas(1024, 600, 0xffffffff, 'android-icon-foreground.png');
  await onCanvas(1024, 700, 0xffffffff, 'splash-icon.png');
  await onCanvas(48, 44, 0xffffffff, 'favicon.png');
  console.log('Ikony wygenerowane.');
})();
