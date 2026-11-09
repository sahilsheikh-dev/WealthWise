import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const publishedDirectory = join(root, 'docs', 'releases', 'published');
const releasesBaseUrl = 'https://github.com/sahilsheikh-dev/WealthWise/releases';

function readLatestVersion(contents: string): string {
  const versionMatch = contents.match(/^Latest version: (v\d+\.\d+\.\d+)$/m);
  if (!versionMatch?.[1]) throw new Error('Download block has no semantic version.');
  return versionMatch[1];
}

function readPublishedVersions(releaseHistory: string): string[] {
  return [...releaseHistory.matchAll(/^\| (v\d+\.\d+\.\d+) \|.*\| Published \|$/gm)]
    .map((match) => match[1] ?? '');
}

function readDownloadBlock(contents: string, filePath: string): string {
  const lines = contents.split(/\r?\n/);
  const start = lines.indexOf('## Download');
  if (start < 0) throw new Error(`Missing Download block in ${filePath}.`);
  const end = lines.indexOf('', start + 1);
  if (end < 0) throw new Error(`Unterminated Download block in ${filePath}.`);
  return lines.slice(start, end).join('\n');
}

function readScreenshotRowCounts(table: string): number[] {
  return [...table.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map((match) =>
    [...(match[1] ?? '').matchAll(/<img\b/g)].length,
  );
}

function readScreenshotCategories(table: string): string[] {
  return [...table.matchAll(/<img\b[^>]*src="[^"]*WealthWise-v\d+\.\d+\.\d+-([a-z-]+)\.png"/g)]
    .map((match) => match[1] ?? '');
}

describe('published release download documentation', () => {
  it('keeps README and the latest published Download blocks identical', () => {
    const readmePath = join(root, 'README.md');
    const readme = readDownloadBlock(readFileSync(readmePath, 'utf8'), readmePath);
    const version = readLatestVersion(readme);

    const publishedPath = join(publishedDirectory, `${version}.md`);
    const published = readDownloadBlock(readFileSync(publishedPath, 'utf8'), publishedPath);
    expect(readme).toContain(
      `${releasesBaseUrl}/latest/download/WealthWise-android-latest-${version}.apk`,
    );
    expect(published).toBe(readme);
  });

  it('uses each older release versioned asset link, never the latest route', () => {
    const readmePath = join(root, 'README.md');
    const readme = readDownloadBlock(readFileSync(readmePath, 'utf8'), readmePath);
    const latestVersion = readLatestVersion(readme);
    const releaseHistoryPath = join(root, 'docs', 'releases', 'release-history.md');
    const publishedVersions = readPublishedVersions(readFileSync(releaseHistoryPath, 'utf8'));

    for (const version of publishedVersions.filter((entry) => entry !== latestVersion)) {
      const filePath = join(publishedDirectory, `${version}.md`);
      const block = readDownloadBlock(readFileSync(filePath, 'utf8'), filePath);
      expect(block).not.toContain('/latest/');
      expect(block).toContain(
        `${releasesBaseUrl}/download/${version}/WealthWise-android-${version}.apk`,
      );
      expect(block).not.toContain(`WealthWise-android-latest-${version}.apk`);
    }
  });

  it('uses each release asset filename in release history', () => {
    const readmePath = join(root, 'README.md');
    const readme = readDownloadBlock(readFileSync(readmePath, 'utf8'), readmePath);
    const latestVersion = readLatestVersion(readme);

    const releaseHistoryPath = join(root, 'docs', 'releases', 'release-history.md');
    const releaseHistory = readFileSync(releaseHistoryPath, 'utf8');
    const publishedVersions = readPublishedVersions(releaseHistory);

    for (const version of publishedVersions) {
      const assetName = version === latestVersion
        ? `WealthWise-android-latest-${version}.apk`
        : `WealthWise-android-${version}.apk`;
      expect(releaseHistory).toContain(
        `${releasesBaseUrl}/download/${version}/${assetName}`,
      );
    }
  });

  it('does not publish commit identifiers or APK digests in the README or release notes', () => {
    const readmePath = join(root, 'README.md');
    const releaseHistoryPath = join(root, 'docs', 'releases', 'release-history.md');
    const publishedFiles = readdirSync(publishedDirectory)
      .filter((file) => /^v\d+\.\d+\.\d+\.md$/.test(file))
      .map((file) => join(publishedDirectory, file));

    for (const filePath of [readmePath, releaseHistoryPath, ...publishedFiles]) {
      const contents = readFileSync(filePath, 'utf8');
      expect(contents).not.toMatch(/\b[0-9a-f]{40}\b|\b[0-9a-f]{64}\b/i);
      if (filePath !== readmePath) {
        expect(contents).not.toMatch(/\b(?:sha-?256|commit)\b/i);
      }
    }
  });

  it('omits Contributors sections from all release notes and the template', () => {
    const releaseFiles = [
      join(publishedDirectory, 'v1.0.0.md'),
      join(publishedDirectory, 'v1.1.0.md'),
      join(publishedDirectory, 'v1.1.1.md'),
      join(root, 'docs', 'releases', 'TEMPLATE.md'),
    ];

    for (const filePath of releaseFiles) {
      expect(readFileSync(filePath, 'utf8')).not.toMatch(/^## Contributors\s*$/m);
    }
  });

  it('documents version-specific screenshots without retaining the capture script', () => {
    const template = readFileSync(join(root, 'docs', 'releases', 'TEMPLATE.md'), 'utf8')
      .replace(/\s+/g, ' ');
    const releaseConfig = readFileSync(join(root, 'docs', 'releases', 'release-config.md'), 'utf8')
      .replace(/\s+/g, ' ');
    const releasePrompt = readFileSync(join(root, 'docs', 'releases', 'RELEASE_PROMPT.md'), 'utf8')
      .replace(/\s+/g, ' ');
    const buildConfig = readFileSync(join(root, 'docs', 'releases', 'build-config.md'), 'utf8')
      .replace(/\s+/g, ' ');
    const readme = readFileSync(join(root, 'README.md'), 'utf8');
    const readmeScreenshotTables = [...readme.matchAll(/<table>([\s\S]*?)<\/table>/g)];
    const screenshotSets = {
      'v1.0.0': ['home', 'assets', 'liabilities', 'emergency-fund', 'goals', 'insurance', 'transactions'],
      'v1.1.0': ['home', 'assets', 'liabilities', 'emergency-fund', 'goals', 'insurance', 'budget', 'transactions'],
      'v1.1.1': ['home', 'assets', 'liabilities', 'emergency-fund', 'goals', 'insurance', 'budget', 'transactions'],
    } as const;
    const markdownByVersion = {
      'v1.0.0': 'docs/releases/published/v1.0.0.md',
      'v1.1.0': 'docs/releases/published/v1.1.0.md',
      'v1.1.1': 'docs/releases/published/v1.1.1.md',
    } as const;

    expect(template).toContain('## Screenshots');
    expect(template).toContain('synthetic demo data only');
    expect(template).toContain('Never include personal phone data or a capture script.');
    expect(template).toContain('absolute URL of the matching attached image asset');
    expect(template).toContain('Order them Home, Assets, Liabilities, Emergency Fund');
    expect(releaseConfig).toContain('one-off capture script outside the repository');
    expect(releaseConfig).toContain('owner has explicitly authorized adding release-specific screenshots');
    expect(releaseConfig).toContain('reuse the previous release\'s complete screenshot set');
    expect(releaseConfig).toContain('ask-user dialogue to request the absolute local path');
    expect(releaseConfig).toContain('before GitHub Release draft creation');
    expect(releasePrompt).toContain('existing v1.0.0 and v1.1.0 published notes');
    expect(releasePrompt).toContain('attach them to the matching GitHub Release');
    expect(releasePrompt).toContain('delete it after capture');
    expect(releasePrompt).toContain('the owner explicitly approves the Markdown release draft');
    expect(releasePrompt).toContain('The owner builds the application from that merged source');
    expect(releasePrompt).toContain('confirms the upload is complete');
    expect(releasePrompt).toContain('ask-user dialogue to request the absolute local path');
    expect(releasePrompt).toContain('move the note to `docs/releases/published/vX.Y.Z.md`');
    expect(releaseConfig).toContain('Include every supplied screenshot');
    expect(buildConfig).toContain('The owner builds the Android APK');
    expect(buildConfig).toContain('Do not start the build on the owner\'s behalf');
    expect(readme).toContain('### Screenshots');
    expect(readme).not.toMatch(/^#### v\d+\.\d+\.\d+/m);
    expect(readmeScreenshotTables).toHaveLength(1);
    for (const [, table = ''] of readmeScreenshotTables) {
      expect(readScreenshotRowCounts(table)).toEqual([4, 4]);
      expect(readScreenshotCategories(table)).toEqual(screenshotSets['v1.1.1']);
      expect([...table.matchAll(/<img\b[^>]*>/g)].every((match) =>
        (match[0] ?? '').includes('width="150"'),
      )).toBe(true);
    }

    for (const [version, categories] of Object.entries(screenshotSets)) {
      const releasePath = markdownByVersion[version as keyof typeof markdownByVersion];
      const releaseContents = readFileSync(join(root, releasePath), 'utf8');
      expect(releaseContents).toContain('## Screenshots');
      const releaseScreenshotTable = releaseContents.match(/<table>([\s\S]*?)<\/table>/)?.[1] ?? '';
      expect(readScreenshotCategories(releaseScreenshotTable)).toEqual(categories);
      expect(readScreenshotRowCounts(releaseScreenshotTable)).toEqual(
        categories.length === 7 ? [4, 3] : [4, 4],
      );
      expect([...releaseScreenshotTable.matchAll(/<img\b[^>]*>/g)].every((match) =>
        (match[0] ?? '').includes('width="150"'),
      )).toBe(true);

      for (const category of categories) {
        const imageName = `WealthWise-${version}-${category}.png`;
        const repositoryImagePath = `docs/releases/screenshots/${version}/${imageName}`;
        const releaseImagePath = `../screenshots/${version}/${imageName}`;
        expect(existsSync(join(root, repositoryImagePath))).toBe(true);
        if (version === 'v1.1.1') {
          expect(readme).toContain(repositoryImagePath);
        } else {
          expect(readme).not.toContain(repositoryImagePath);
        }
        expect(releaseContents).toContain(releaseImagePath);
      }
    }

    const releaseNote = readFileSync(
      join(root, 'docs', 'releases', 'published', 'v1.1.1.md'),
      'utf8',
    );
    for (const heading of [
      '## Download',
      '## What\'s new in v1.1.1',
      '## Screenshots',
      '## What\'s Included',
      '### New Features',
      '### Improvements',
      '### Fixes',
      '## Breaking Changes and Migration',
      '## Known Limitations',
      '## Upgrade Instructions',
      '**Full Changelog:**',
    ]) {
      expect(releaseNote).toContain(heading);
    }
    expect(releaseNote).toContain('releases/latest/download/WealthWise-android-latest-v1.1.1.apk');
    expect(releaseNote).not.toContain('Not available. The owner will upload the APK');
    expect(releaseNote).not.toContain('**Status:**');
  });

  it('keeps the approved release note aligned with application package versions', () => {
    const appConfig: { expo: { version: string } } = JSON.parse(
      readFileSync(join(root, 'app.json'), 'utf8'),
    );
    const packageManifest: { version: string } = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8'),
    );
    const lockfile: { version: string; packages: { '': { version: string } } } = JSON.parse(
      readFileSync(join(root, 'package-lock.json'), 'utf8'),
    );
    const releaseNote = readFileSync(
      join(root, 'docs', 'releases', 'published', 'v1.1.1.md'),
      'utf8',
    );
    const releaseVersion = releaseNote.match(/^# WealthWise v(\d+\.\d+\.\d+)$/m)?.[1];

    expect(releaseVersion).toBeDefined();
    expect(appConfig.expo.version).toBe(releaseVersion);
    expect(packageManifest.version).toBe(releaseVersion);
    expect(lockfile.version).toBe(releaseVersion);
    expect(lockfile.packages[''].version).toBe(releaseVersion);
  });
});
