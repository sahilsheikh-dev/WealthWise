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
      'CR-1', 'CR-2', 'CR-3', 'CR-4', 'CR-5', 'CR-6', 'CR-7',
      'CR-8', 'CR-9', 'CR-10', 'CR-11', 'CR-12', 'CR-13', 'CR-14',
      'CR-15', 'CR-16',
    ]) {
      expect(statusRecords).toContain(id);
    }

    for (const id of [
      'FX-BASE', 'FX-U1', 'FX-U2', 'FX-U3', 'FX-U4',
      'FX-B1', 'FX-B2',
      'FX-T1', 'FX-T2', 'FX-T3', 'FX-T4', 'FX-T5',
      'FX-S1', 'FX-S2', 'FX-I1', 'FX-L1', 'FX-L2',
      'FX-E1', 'FX-E2',
    ]) {
      expect(dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
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
      'P15-A', 'P15-A2', 'P15-B', 'P15-C',
      'P16-A', 'P16-B', 'P16-C', 'P17-A', 'P17-B', 'P17-C',
      'P18-R0', 'P18-R1', 'P18-R2', 'P18-R3', 'P18-R4', 'P18-R5',
      'P18-R6', 'P18-LEDGER', 'P18-R7',
      'P19-A', 'P19-B', 'P20-A', 'P20-B', 'P20-C', 'P21-A', 'P21-B',
      'P22-A', 'P22-B', 'P23-A', 'P24-A', 'P25-A', 'P26-A', 'P27-A',
      'P28-A',
    ];

    const loggedIds = promptLog.split('\n')
      .filter((line) => /^\| P\d/.test(line))
      .map((line) => line.split('|')[1]?.trim());
    expect(loggedIds).toHaveLength(new Set(loggedIds).size);

    for (const id of promptIds) {
      const rows = promptLog.split('\n').filter((line) => line.startsWith(`| ${id} |`));
      expect(rows).toHaveLength(1);
    }
  });

  it('logs every remapped/new part exactly once in the dashboard and prompt log', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const newPartIds = [
      'P16-A', 'P16-B', 'P16-C', 'P17-A', 'P17-B', 'P17-C',
      'P18-R0', 'P18-R1', 'P18-R2', 'P18-R3', 'P18-R4', 'P18-R5',
      'P18-R6', 'P18-LEDGER', 'P18-R7',
      'P19-A', 'P19-B', 'P20-A', 'P20-B', 'P20-C', 'P21-A', 'P21-B',
      'P22-A', 'P22-B', 'P23-A', 'P24-A', 'P25-A', 'P26-A', 'P27-A',
      'P28-A',
    ];

    for (const id of newPartIds) {
      expect(dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
      expect(promptLog.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
    }
  });

  it('maps every legacy ID exactly once in the dashboard Legacy ID column', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const legacyIds = [
      'P15-D', 'P15-E', 'P15-G', 'P15-H', 'P15-I', 'P15-J',
      'P15-fix-0', 'P15-FIX-R1', 'P15-FIX-R2', 'P15-FIX-R3',
      'P15-FIX-R4', 'P15-FIX-R5', 'P15-FIX-R6', 'P15-LEDGER',
      'P15-SEED', 'P15-F', 'P15-K', 'P15-L', 'P15-M',
    ];

    for (const id of legacyIds) {
      const rows = dashboard.split('\n').filter((line) => line.startsWith('|') && line.split('|')[2]?.trim() === id);
      expect(rows).toHaveLength(1);
    }
  });

  it('keeps progress bars, percentages and counts consistent with dashboard statuses', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const progressBlock = dashboard.match(/```text\n([\s\S]*?)\n```/)?.[1] ?? '';
    const rows = dashboard.split('\n').filter((line) =>
      /^\| (?:Phase \d+|P\d+-[A-Z0-9-]+) \|/.test(line),
    );
    const counts = new Map<number, { done: number; total: number }>();

    for (const row of rows) {
      const cells = row.split('|').map((cell) => cell.trim());
      const id = cells[1];
      const status = cells[3];
      if (!id || !status) continue;
      const phaseMatch = id.match(/^Phase (\d+)$/) ?? id.match(/^P(\d+)-/);
      if (!phaseMatch) continue;
      const phase = Number(phaseMatch[1]);
      const count = counts.get(phase) ?? { done: 0, total: 0 };
      count.total += 1;
      if (status.startsWith('Done') || status.startsWith('Superseded')) count.done += 1;
      counts.set(phase, count);
    }
    expect(rows.some((row) => row.split('|')[3]?.trim().startsWith('Superseded'))).toBe(true);

    const total = [...counts.values()].reduce((sum, count) => sum + count.total, 0);
    const done = [...counts.values()].reduce((sum, count) => sum + count.done, 0);
    const expected: [string, number, number][] = [
      ['Overall progress', done, total],
      ...Array.from({ length: 28 }, (_, index): [string, number, number] => {
        const phase = index + 1;
        const count = counts.get(phase) ?? { done: 0, total: 0 };
        return [`Phase ${phase}`, count.done, count.total];
      }),
    ];
    const lines = progressBlock.split('\n');
    expect(lines).toHaveLength(expected.length);

    expected.forEach(([name, completed, partCount], index) => {
      const match = lines[index]?.match(/^(Overall progress|Phase \d+)\s+([█░]{10})\s+(\d+)%\s+\((\d+)\/(\d+)\)$/);
      expect(match?.[1]).toBe(name);
      const percentage = partCount === 0 ? 0 : Math.round((completed / partCount) * 100);
      const filled = partCount === 0 ? 0 : Math.round((completed / partCount) * 10);
      expect(match?.[2]).toBe(`${'█'.repeat(filled)}${'░'.repeat(10 - filled)}`);
      expect(Number(match?.[3])).toBe(percentage);
      expect(Number(match?.[4])).toBe(completed);
      expect(Number(match?.[5])).toBe(partCount);
    });
    const phase18 = progressBlock.split('\n').find((line) => line.startsWith('Phase 18'));
    expect(phase18).toContain('100% (9/9)');
  });

  it('records the unchanged FX/CH IDs, CR-4 through CR-20 and current phase work', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const decisions = ledger.split('## 4. Architecture and decisions')[1]?.split('## 5. Phase history')[0] ?? '';

    expect(`${dashboard}\n${register}`).toContain('CR-3');
    for (const id of [
      'FX-BASE', 'CH-1', 'CH-2', 'CH-3', 'CH-4',
      'CR-4', 'CR-5', 'CR-6', 'CR-7', 'CR-8', 'CR-9', 'CR-10',
      'CR-11', 'CR-12', 'CR-13', 'CR-14', 'CR-15', 'CR-16', 'CR-17',
      'CR-18', 'CR-19', 'CR-20',
    ]) {
      expect(`${dashboard}\n${register}`).toContain(id);
    }
    expect(promptLog).toContain('| P18-LEDGER |');
    expect(promptLog).toContain('| P19-C |');
    expect(register).toContain('| CR-16 | Templates joins History and Month review; remove Budget header menu. | Superseded by CR-17 |');
    expect(register).toContain('| CR-20 | Emergency fund is a goal, not an entity: remove ledger entries and the Emergency fund invest category and instrument reference; visualization-only screen. | Planned | P21-A/B. |');
    expect(decisions).toContain('DEC-FORM-COMPONENTS');
    expect(ledger).toContain('5aeefb96e70df7c388e5eb39454285204adb5707');
  });
});
