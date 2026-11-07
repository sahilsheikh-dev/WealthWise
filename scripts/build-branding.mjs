import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const BRAND_CONCEPT = 'a';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const brandingDir = resolve(root, 'assets/branding');
const outputDir = resolve(root, 'assets/images');
const brand = JSON.parse(await readFile(resolve(brandingDir, 'brand.json'), 'utf8'));
const conceptSvg = await readFile(resolve(brandingDir, `concepts/${BRAND_CONCEPT}.svg`), 'utf8');
const art = conceptSvg.match(/<svg[^>]*>([\s\S]*)<\/svg>/)?.[1];
if (!art) throw new Error(`Brand concept ${BRAND_CONCEPT} is not a supported SVG document.`);

await mkdir(outputDir, { recursive: true });

function svgDocument(size, body, background = 'none') {
  const backgroundNode = background === 'none'
    ? ''
    : `<rect width="100" height="100" fill="${background}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">${backgroundNode}${body}</svg>`;
}

function artwork(color, inset = 0) {
  const viewSize = 100 - inset * 2;
  const source = art.replace(/#[\da-f]{6}/gi, color);
  return `<svg x="${inset}" y="${inset}" width="${viewSize}" height="${viewSize}" viewBox="0 0 100 100">${source}</svg>`;
}

async function render(fileName, size, svg) {
  const rendered = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  await writeFile(resolve(outputDir, fileName), rendered);
}

const { background, mark, monochrome, splashLight, splashDark } = brand.colors;
await render('icon.png', 1024, svgDocument(1024, artwork(mark), background));
await render('android-icon-foreground.png', 1024, svgDocument(1024, artwork(mark, 24)));
await render('android-icon-background.png', 1024, svgDocument(1024, '', background));
await render('android-icon-monochrome.png', 1024, svgDocument(1024, artwork(monochrome, 24)));
await render('favicon.png', 48, svgDocument(48, artwork(mark), background));
await render('splash-icon.png', 256, svgDocument(256, artwork(splashLight)));
await render('splash-icon-dark.png', 256, svgDocument(256, artwork(splashDark)));

for (const [suffix, size] of [['1x', 48], ['2x', 96], ['3x', 144]]) {
  const circleAndMark = `<circle cx="50" cy="50" r="49" fill="${background}"/>${artwork(mark, 8)}`;
  const svg = svgDocument(100, circleAndMark);
  await render(`mark@${suffix}.png`, size, svg);
  if (suffix === '1x') await render('mark.png', size, svg);
}

console.log(`Built branding assets from concept ${BRAND_CONCEPT}.`);
