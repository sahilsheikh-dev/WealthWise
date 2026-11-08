import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const publishedDirectory = join(root, 'docs', 'releases', 'published');
const latestDownloadUrl =
  'https://github.com/sahilsheikh-dev/WealthWise/releases/latest/download/WealthWise-android.apk';

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
    const versionMatch = readme.match(/^Latest version: (v\d+\.\d+\.\d+)$/m);
    if (!versionMatch?.[1]) throw new Error('README Download block has no semantic version.');

    const publishedPath = join(publishedDirectory, `${versionMatch[1]}.md`);
    const published = readDownloadBlock(readFileSync(publishedPath, 'utf8'), publishedPath);
    expect(published).toBe(readme);
  });

  it('uses each older release versioned asset link, never the latest route', () => {
    const readmePath = join(root, 'README.md');
    const readme = readDownloadBlock(readFileSync(readmePath, 'utf8'), readmePath);
    const versionMatch = readme.match(/^Latest version: (v\d+\.\d+\.\d+)$/m);
    if (!versionMatch?.[1]) throw new Error('README Download block has no semantic version.');

    const olderPublishedFiles = readdirSync(publishedDirectory)
      .filter((file) => /^v\d+\.\d+\.\d+\.md$/.test(file) && file !== `${versionMatch[1]}.md`);

    for (const file of olderPublishedFiles) {
      const filePath = join(publishedDirectory, file);
      const block = readDownloadBlock(readFileSync(filePath, 'utf8'), filePath);
      const version = file.slice(0, -'.md'.length);
      expect(block).not.toContain(latestDownloadUrl);
      expect(block).toContain(
        `https://github.com/sahilsheikh-dev/WealthWise/releases/download/${version}/WealthWise-android.apk`,
      );
    }
  });

  it('does not publish commit identifiers or APK digests in the README or release notes', () => {
    const readmePath = join(root, 'README.md');
    const publishedFiles = readdirSync(publishedDirectory)
      .filter((file) => /^v\d+\.\d+\.\d+\.md$/.test(file))
      .map((file) => join(publishedDirectory, file));

    for (const filePath of [readmePath, ...publishedFiles]) {
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
});
