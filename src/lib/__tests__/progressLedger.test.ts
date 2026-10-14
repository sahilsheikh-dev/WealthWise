import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ledger = readFileSync(join(process.cwd(), 'docs/PROGRESS.md'), 'utf8');

describe('permanent progress ledger', () => {
  it('keeps the ten required sections in order', () => {
    const headings = [
      '## 1. How to use this file',
      '## 2. Status dashboard',
      '## 3. Standing rules',
      '## 4. Architecture and decisions',
      '## 5. Phase history',
      '## 6. Prompt and session log',
      '## 7. Change-request register',
      '## 8. Known issues and risks',
      '## 9. Upcoming roadmap',
      '## 10. Verification matrix',
    ];
    const positions = headings.map((heading) => ledger.indexOf(heading));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
  });

  it('lists every fix and CR-1 in the dashboard', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    for (const id of [
      'FX-U1', 'FX-U2', 'FX-U3', 'FX-U4',
      'FX-B1', 'FX-B2',
      'FX-T1', 'FX-T2', 'FX-T3', 'FX-T4',
      'FX-E1', 'FX-E2', 'CR-1',
    ]) {
      expect(dashboard).toContain(id);
    }
  });
});
