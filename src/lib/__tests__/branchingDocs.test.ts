import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), 'utf8');
}

describe('shared branching and contributor rules', () => {
  it('states that COMMON RULES apply to every prompt', () => {
    expect(read('AGENTS.md')).toMatch(/## COMMON RULES[\s\S]*apply to every prompt/i);
  });

  it('tracks owner-run and remote-only actions from verifiable evidence', () => {
    for (const file of ['AGENTS.md', 'docs/memory/rules.md']) {
      expect(read(file)).toMatch(/R8[\s\S]*verifiable evidence/i);
      expect(read(file)).toContain('Owner actions pending');
    }
    expect(read('AGENTS.md')).toContain('0. Reconcile remote state');
    const memoryIndex = read('docs/memory/README.md');
    expect(memoryIndex).toContain('script -a /tmp/wealthwise-remote-snapshot/owner-terminal-$(date +%F).log');
    expect(memoryIndex).toContain('only copies the clipboard');
    expect(memoryIndex).toContain('export-remote-snapshot.sh');
    expect(memoryIndex).toContain('every manual merge');
    expect(read('AGENTS.md')).toContain('script -a /tmp/wealthwise-remote-snapshot/owner-terminal-$(date +%F).log');
    expect(read('docs/memory/rules.md')).toContain('script -a /tmp/wealthwise-remote-snapshot/owner-terminal-$(date +%F).log');
    expect(read('docs/memory/README.md')).toContain('headRefOid');
    expect(read('docs/memory/README.md')).toContain('detail files for the latest 60 PRs');
    expect(read('docs/memory/README.md')).toContain('refresh the snapshot before the next agent task');
    expect(read('docs/memory/working-style.md')).toContain('Owner-run actions log');
    const progress = read('docs/PROGRESS.md');
    expect(progress).toContain('### Owner-run actions log');
    for (const column of ['Date and time (IST and UTC)', 'Evidence kind', 'Action', 'Branch or PR', 'SHA', 'Result', 'Source file']) {
      expect(progress).toContain(column);
    }
  });

  it.each(['CONTRIBUTING.md', 'docs/memory/rules.md'])(
    'documents every branch prefix in %s',
    (relativePath) => {
      const contents = read(relativePath);
      for (const prefix of ['main', 'develop', 'phase/', 'task/', 'release/', 'hotfix/', 'contrib/']) {
        expect(contents).toContain(prefix);
      }
    },
  );
});
