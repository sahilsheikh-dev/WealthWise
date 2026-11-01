import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const memoryDir = join(root, 'docs', 'memory');
const memoryFiles = [
  'README.md',
  'project.md',
  'architecture.md',
  'rules.md',
  'decisions.md',
  'status.md',
  'open-items.md',
  'working-style.md',
];
const header = /^<!-- Purpose: .+ \| Last updated: \d{4}-\d{2}-\d{2} \| Updates: .+ -->/;

function readMemoryFile(name: string): string {
  return readFileSync(join(memoryDir, name), 'utf8');
}

describe('shared AI memory documents', () => {
  it('keeps all memory pages indexed, headed and aligned with source schema/test records', () => {
    const index = readMemoryFile('README.md');
    for (const name of memoryFiles) {
      const content = readMemoryFile(name);
      expect(existsSync(join(memoryDir, name))).toBe(true);
      expect(content).toMatch(header);
      expect(index).toContain(`[${name}](${name})`);
    }

    const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
    expect(agents).toContain('docs/memory/README.md');
    expect(agents).toContain('single instruction entry point for every');
    for (const toolFile of ['CHATGPT.md', 'CLAUDE.md', join('.github', 'copilot-instructions.md')]) {
      expect(existsSync(join(root, toolFile))).toBe(false);
    }

    const schemaSource = readFileSync(join(root, 'src', 'domain', 'schemas.ts'), 'utf8');
    const schemaMatch = schemaSource.match(/SCHEMA_VERSION\s*=\s*(\d+)/);
    if (!schemaMatch) throw new Error('SCHEMA_VERSION is missing from src/domain/schemas.ts.');
    for (const name of ['project.md', 'status.md']) {
      expect(readMemoryFile(name)).toContain(`Schema version: v${schemaMatch[1]}`);
    }

    const testCounts = ['project.md', 'status.md'].map((name) =>
      readMemoryFile(name).match(/Test counts: (\d+) suites, (\d+) tests/),
    );
    for (const count of testCounts) {
      expect(count).not.toBeNull();
    }
    expect(testCounts[0]?.[0]).toBe(testCounts[1]?.[0]);
    expect(testCounts[0]?.[1]).toBe('79');
    expect(testCounts[0]?.[2]).toBe('958');
  });
});
