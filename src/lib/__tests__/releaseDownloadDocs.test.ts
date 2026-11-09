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

function readDownloadBlock(contents: string, filePath: string): string {
  const lines = contents.split(/\r?\n/);
  const start = lines.indexOf('## Download');
  if (start < 0) throw new Error(`Missing Download block in ${filePath}.`);
  const end = lines.indexOf('', start + 1);
  if (end < 0) throw new Error(`Unterminated Download block in ${filePath}.`);
  return lines.slice(start, end).join('\n');
}

function readSection(contents: string, heading: string, filePath: string): string {
  const lines = contents.split(/\r?\n/);
  const start = lines.indexOf(heading);
  if (start < 0) throw new Error(`Missing ${heading} section in ${filePath}.`);
  const end = lines.findIndex((line, index) => index > start && /^## /.test(line));
  return lines.slice(start, end < 0 ? lines.length : end).join('\n').trim();
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

    const olderPublishedFiles = readdirSync(publishedDirectory)
      .filter((file) => /^v\d+\.\d+\.\d+\.md$/.test(file) && file !== `${latestVersion}.md`);

    for (const file of olderPublishedFiles) {
      const filePath = join(publishedDirectory, file);
      const block = readDownloadBlock(readFileSync(filePath, 'utf8'), filePath);
      const version = file.slice(0, -'.md'.length);
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
    const publishedFiles = readdirSync(publishedDirectory)
      .filter((file) => /^v\d+\.\d+\.\d+\.md$/.test(file));

    for (const file of publishedFiles) {
      const version = file.slice(0, -'.md'.length);
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

  it('uses verified contributor links and release-specific attribution guidance', () => {
    const publishedPath = join(publishedDirectory, 'v1.0.0.md');
    const draftPath = join(root, 'docs', 'releases', 'drafts', 'v1.1.0.md');
    const publishedV11Path = join(publishedDirectory, 'v1.1.0.md');
    const releasePath = existsSync(publishedV11Path) ? publishedV11Path : draftPath;
    const templatePath = join(root, 'docs', 'releases', 'TEMPLATE.md');
    const publishedContributors = readSection(
      readFileSync(publishedPath, 'utf8'),
      '## Contributors',
      publishedPath,
    );
    const releaseContributors = readSection(
      readFileSync(releasePath, 'utf8'),
      '## Contributors',
      releasePath,
    );
    const template = readFileSync(templatePath, 'utf8').replace(/\s+/g, ' ');

    expect(releaseContributors).toBe(publishedContributors);
    expect(template).toContain('verified from commits included in this release');
    expect(template).toContain('Do not use a generic placeholder');
    expect(template).toContain('unless they also contributed to this release');
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
    const screenshotSections = [
      {
        file: 'README.md',
        heading: '### Screenshots',
        asset: 'https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.0.0/WealthWise-v1.0.0-home.png',
        image: 'docs/releases/screenshots/v1.0.0/WealthWise-v1.0.0-home.png',
      },
      {
        file: 'docs/releases/published/v1.0.0.md',
        heading: '## Screenshots',
        asset: 'https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.0.0/WealthWise-v1.0.0-home.png',
        image: 'docs/releases/screenshots/v1.0.0/WealthWise-v1.0.0-home.png',
      },
      {
        file: 'docs/releases/published/v1.1.0.md',
        heading: '## Screenshots',
        asset: 'https://github.com/sahilsheikh-dev/WealthWise/releases/download/v1.1.0/WealthWise-v1.1.0-home.png',
        image: 'docs/releases/screenshots/v1.1.0/WealthWise-v1.1.0-home.png',
      },
      {
        file: 'docs/releases/drafts/v1.1.1.md',
        heading: '## Screenshots',
        asset: '../screenshots/v1.1.1/WealthWise-v1.1.1-home.png',
        image: 'docs/releases/screenshots/v1.1.1/WealthWise-v1.1.1-home.png',
      },
    ] as const;

    expect(template).toContain('## Screenshots');
    expect(template).toContain('synthetic demo data only');
    expect(template).toContain('Never include personal phone data or a capture script.');
    expect(template).toContain('absolute URL of the matching attached image asset');
    expect(releaseConfig).toContain('one-off capture script outside the repository');
    expect(releaseConfig).toContain('owner has explicitly authorized adding release-specific screenshots');
    expect(releasePrompt).toContain('existing v1.0.0 and v1.1.0 published notes');
    expect(releasePrompt).toContain('attach them to the matching GitHub Release');
    expect(releasePrompt).toContain('delete it after capture');
    expect(releasePrompt).toContain('the owner explicitly approves the Markdown release draft');
    expect(releasePrompt).toContain('The owner builds the application from that merged source');
    expect(releasePrompt).toContain('confirms the upload is complete');
    expect(releaseConfig).toContain('Attach the matching screenshot asset');
    expect(buildConfig).toContain('The owner builds the Android APK');
    expect(buildConfig).toContain('Do not start the build on the owner\'s behalf');
    expect(readme).toContain('WealthWise-v1.1.0-home.png');
    expect(readme).toContain('WealthWise-v1.1.1-home.png');
    for (const { file, heading, asset, image } of screenshotSections) {
      const contents = readFileSync(join(root, file), 'utf8');
      expect(contents).toContain(heading);
      expect(contents).toContain(asset);
      expect(existsSync(join(root, image))).toBe(true);
    }
  });

  it('keeps the approved release draft aligned with application package versions', () => {
    const appConfig: { expo: { version: string } } = JSON.parse(
      readFileSync(join(root, 'app.json'), 'utf8'),
    );
    const packageManifest: { version: string } = JSON.parse(
      readFileSync(join(root, 'package.json'), 'utf8'),
    );
    const lockfile: { version: string; packages: { '': { version: string } } } = JSON.parse(
      readFileSync(join(root, 'package-lock.json'), 'utf8'),
    );
    const draft = readFileSync(join(root, 'docs', 'releases', 'drafts', 'v1.1.1.md'), 'utf8');
    const draftVersion = draft.match(/^# WealthWise v(\d+\.\d+\.\d+)$/m)?.[1];

    expect(draftVersion).toBeDefined();
    expect(appConfig.expo.version).toBe(draftVersion);
    expect(packageManifest.version).toBe(draftVersion);
    expect(lockfile.version).toBe(draftVersion);
    expect(lockfile.packages[''].version).toBe(draftVersion);
  });
});
