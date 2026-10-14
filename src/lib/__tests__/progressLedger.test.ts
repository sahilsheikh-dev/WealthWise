import { existsSync, readFileSync } from 'node:fs';
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

  it('lists every fix and CR in the dashboard or register', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const statusRecords = `${dashboard}\n${register}`;
    for (const id of [
      'FX-BASE', 'FX-U1', 'FX-U2', 'FX-U3', 'FX-U4',
      'FX-B1', 'FX-B2',
      'FX-T1', 'FX-T2', 'FX-T3', 'FX-T4', 'FX-T5',
      'FX-S1', 'FX-S2', 'FX-I1', 'FX-L1', 'FX-L2',
      'FX-E1', 'FX-E2',
      'CH-1', 'CH-2', 'CH-3', 'CH-4',
      'CR-1', 'CR-2',
    ]) {
      expect(statusRecords).toContain(id);
    }
  });

  it('does not retain the prompt archive directory', () => {
    expect(existsSync(join(process.cwd(), 'docs', 'prompts'))).toBe(false);
  });

  it('logs every prompt ID exactly once', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const promptIds = [
      'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P06-FIX-R1',
      'P07', 'P08', 'P09', 'P10', 'P11', 'P12', 'P13', 'P14',
      'P15-A', 'P15-A2', 'P15-B', 'P15-C', 'P15-D', 'P15-E',
      'P15-F', 'P15-G', 'P15-H', 'P15-I', 'P15-J',
      'P15-FIX-R1', 'P15-FIX-R2', 'P15-FIX-R3', 'P15-FIX-R4',
      'P15-SEED', 'P15-LEDGER',
    ];

    for (const id of promptIds) {
      const rows = promptLog.split('\n').filter((line) => line.startsWith(`| ${id} |`));
      expect(rows).toHaveLength(1);
    }
  });
});
