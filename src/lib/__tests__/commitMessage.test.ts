import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const hook = join(root, '.githooks', 'commit-msg');

function runHook(subject: string) {
  const directory = mkdtempSync(join(tmpdir(), 'wealthwise-commit-msg-'));
  const message = join(directory, 'message');
  writeFileSync(message, `${subject}\n`);
  const result = spawnSync('sh', [hook, message], { encoding: 'utf8' });
  rmSync(directory, { recursive: true, force: true });
  return result;
}

describe('commit message enforcement', () => {
  it.each([
    'docs: enforce descriptive commit subjects',
    'feat(budget): add quarterly income',
    'fix: preserve edited values',
  ])('accepts a descriptive Conventional Commit subject: %s', (subject) => {
    expect(runHook(subject).status).toBe(0);
  });

  it.each([
    'chore: user manual changes (checkpoint)',
    'Fix: checkpoint',
    'wIp',
    'UPDATE',
    'misc: describe a change',
  ])('rejects a forbidden or non-Conventional subject: %s', (subject) => {
    expect(runHook(subject).status).not.toBe(0);
  });

  it('keeps forbidden legacy wording out of live commit rules', () => {
    const agents = readFileSync(join(root, 'AGENTS.md'), 'utf8');
    const rules = readFileSync(join(root, 'docs', 'memory', 'rules.md'), 'utf8');
    const ledger = readFileSync(join(root, 'docs', 'PROGRESS.md'), 'utf8');
    const standingRules = ledger.split('## 3. Standing rules')[1]?.split('\n## 4. ')[0] ?? '';

    for (const content of [agents, rules, standingRules]) {
      expect(content).not.toMatch(/user manual changes|\(checkpoint\)/i);
    }
  });
});
