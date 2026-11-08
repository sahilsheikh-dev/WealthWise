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
