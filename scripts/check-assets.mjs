import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateSync } from 'node:zlib';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = resolve(root, 'assets/images');
const brand = JSON.parse(await readFile(resolve(root, 'assets/branding/brand.json'), 'utf8'));
const required = [
  'icon.png', 'android-icon-foreground.png', 'android-icon-background.png',
  'android-icon-monochrome.png', 'favicon.png', 'splash-icon.png', 'splash-icon-dark.png',
  'mark.png', 'mark@1x.png', 'mark@2x.png', 'mark@3x.png',
];
const fail = (message) => { throw new Error(message); };

function decodePng(buffer, fileName) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!buffer.subarray(0, 8).equals(signature)) fail(`${fileName} is not a PNG.`);
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8] ?? 0;
      colorType = data[9] ?? 0;
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    offset += length + 12;
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    fail(`${fileName} must use 8-bit RGB or RGBA pixels.`);
  }
  const bytesPerPixel = colorType === 6 ? 4 : 3;
  const rowLength = width * bytesPerPixel;
  const packed = inflateSync(Buffer.concat(idat));
  const pixels = Buffer.alloc(rowLength * height);
  let inputOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = packed[inputOffset] ?? 0;
    inputOffset += 1;
    for (let x = 0; x < rowLength; x += 1) {
      const raw = packed[inputOffset + x] ?? 0;
      const left = x >= bytesPerPixel ? (pixels[y * rowLength + x - bytesPerPixel] ?? 0) : 0;
      const above = y > 0 ? (pixels[(y - 1) * rowLength + x] ?? 0) : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel
        ? (pixels[(y - 1) * rowLength + x - bytesPerPixel] ?? 0)
        : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = above;
      else if (filter === 3) predictor = Math.floor((left + above) / 2);
      else if (filter === 4) {
        const base = left + above - upperLeft;
        const leftDistance = Math.abs(base - left);
        const aboveDistance = Math.abs(base - above);
        const upperLeftDistance = Math.abs(base - upperLeft);
        predictor = leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
          ? left
          : aboveDistance <= upperLeftDistance ? above : upperLeft;
      } else if (filter !== 0) fail(`${fileName} uses an unsupported PNG filter.`);
      pixels[y * rowLength + x] = (raw + predictor) & 255;
    }
    inputOffset += rowLength;
  }
  return { width, height, colorType, bytesPerPixel, pixels };
}

for (const fileName of required) await access(resolve(imageDir, fileName));
const icon = decodePng(await readFile(resolve(imageDir, 'icon.png')), 'icon.png');
if (icon.width !== 1024 || icon.height !== 1024) fail('icon.png must be 1024x1024.');
if (icon.colorType === 6) {
  for (let i = 3; i < icon.pixels.length; i += 4) {
    if (icon.pixels[i] !== 255) fail('icon.png must be fully opaque.');
  }
}

const foreground = decodePng(
  await readFile(resolve(imageDir, 'android-icon-foreground.png')),
  'android-icon-foreground.png',
);
if (foreground.width !== 1024 || foreground.height !== 1024 || foreground.colorType !== 6) {
  fail('The adaptive foreground must be a transparent 1024x1024 PNG.');
}
const safeMin = Math.ceil(foreground.width * 0.17);
const safeMax = Math.floor(foreground.width * 0.83);
for (let y = 0; y < foreground.height; y += 1) {
  for (let x = 0; x < foreground.width; x += 1) {
    const alpha = foreground.pixels[(y * foreground.width + x) * 4 + 3];
    if (alpha && (x < safeMin || x >= safeMax || y < safeMin || y >= safeMax)) {
      fail(`The adaptive foreground artwork exceeds the central 66% safe zone at (${x}, ${y}).`);
    }
  }
}

const monochrome = decodePng(
  await readFile(resolve(imageDir, 'android-icon-monochrome.png')),
  'android-icon-monochrome.png',
);
const monochromeColors = new Set();
const monoHex = brand.colors.monochrome.slice(1);
const expectedMono = [0, 2, 4].map((offset) => Number.parseInt(monoHex.slice(offset, offset + 2), 16));
for (let i = 0; i < monochrome.pixels.length; i += monochrome.bytesPerPixel) {
  const alpha = monochrome.colorType === 6 ? monochrome.pixels[i + 3] : 255;
  if (alpha === 255) {
    const rgb = [monochrome.pixels[i], monochrome.pixels[i + 1], monochrome.pixels[i + 2]];
    if (rgb.some((channel, index) => channel !== expectedMono[index])) {
      fail('The monochrome adaptive icon contains pixels outside its single brand color.');
    }
    monochromeColors.add(rgb.join(','));
  }
}
if (monochromeColors.size !== 1) fail('The monochrome adaptive icon must contain exactly one artwork color.');

const favicon = decodePng(await readFile(resolve(imageDir, 'favicon.png')), 'favicon.png');
if (favicon.width !== 48 || favicon.height !== 48) fail('favicon.png must be 48x48.');
console.log('Brand asset checks passed: dimensions, opacity, adaptive safe zone, monochrome color, and favicon.');
