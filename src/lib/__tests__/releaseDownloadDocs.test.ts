import { readdirSync, readFileSync } from 'node:fs';
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
});
