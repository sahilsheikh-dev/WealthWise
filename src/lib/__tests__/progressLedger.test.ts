import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ledger = readFileSync(join(process.cwd(), 'docs/PROGRESS.md'), 'utf8');

describe('permanent progress ledger', () => {
  it('keeps numbered sections aligned with the contents index', () => {
    const sections = [...ledger.matchAll(/^## (\d+)\. (.+)$/gm)].map(
      ([, number, title]) => ({ number, title }),
    );
    const contents = ledger.split('## Contents')[1]?.split('\n## 1. How to use this file')[0] ?? '';
    const indexedTitles = [...contents.matchAll(/^\d+\. \[([^\]]+)\]\(#\d+-[^)]+\)$/gm)]
      .map(([, title]) => title);

    expect(sections.map(({ title }) => title)).toEqual(indexedTitles);
    expect(sections.map(({ number }) => number)).toEqual(
      Array.from({ length: sections.length }, (_, index) => String(index + 1)),
    );
    expect(sections[sections.length - 1]?.title).toBe('Phase branch index');
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
      'CR-15', 'CR-16', 'CR-17', 'CR-18', 'CR-19', 'CR-20', 'CR-21',
      'CR-22', 'CR-23', 'CR-24', 'CR-25', 'CR-26', 'CR-27', 'CR-28',
      'CR-29', 'CR-30', 'CR-31', 'CR-32', 'CR-33', 'CR-34', 'CR-35', 'CR-36',
      'CR-37', 'CR-38', 'CR-39', 'CR-40', 'CR-41', 'CR-42', 'CR-43', 'CR-44', 'CR-45', 'CR-46',
      'CR-47', 'CR-48', 'CR-49', 'CR-50', 'CR-51', 'CR-52', 'CR-53', 'CR-54', 'CR-55', 'CR-56', 'CR-57',
      'CR-58', 'CR-59', 'CR-60', 'CR-61', 'CR-62', 'CR-63', 'CR-64', 'CR-65',
      'CR-66', 'CR-67', 'CR-68', 'CR-69', 'CR-70', 'CR-71', 'CR-72', 'CR-73', 'CR-74', 'CR-75',
      'CR-76', 'CR-77', 'CR-78', 'CR-79', 'CR-80', 'CR-81', 'CR-82', 'CR-83', 'CR-84', 'CR-85', 'CR-86', 'CR-87',
      'CR-88', 'CR-89', 'CR-90', 'CR-91', 'CR-92', 'CR-93', 'CR-94', 'CR-95', 'CR-96', 'CR-97', 'CR-98', 'CR-99', 'CR-100', 'CR-101', 'CR-102',
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
      'P19-A', 'P19-B', 'P20-A', 'P20-A-R1', 'P20-A-R2', 'P20-A-R2-R1', 'P20-B', 'P20-C', 'P20-D', 'P20-E', 'P20-F',
      'P20-G', 'P20-H', 'P20-I', 'P20-J', 'P20-K', 'P20-L', 'P20-M', 'P20-N', 'P20-N-R1', 'P20-N-R2', 'P20-O', 'P20-P', 'P20-Q', 'P20-R', 'P20-S', 'P20-S-R1', 'P20-S-R1-R1', 'P20-T', 'P20-U', 'P21-A', 'P21-B', 'P21-C', 'P21-C1', 'P21-D', 'P22-A', 'P23-A', 'P23-B', 'P24-A', 'P25-A', 'P25-B', 'P25-C', 'P25-D', 'P25-E', 'P26-A', 'P27-A',
      'P23-C', 'P23-D', 'P25-F',
      'P28-A', 'P28-A-R1', 'P28-B', 'P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4', 'P28-D', 'P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1', 'P28-F', 'P28-F-R1', 'P28-F-R2', 'P28-F-R2-R1', 'P28-F-R3', 'P28-F-R3-R1', 'P28-F-R3-R2', 'P28-F-R3-R3', 'P28-F-R3-R3-R1', 'P28-F-R4', 'P28-F-R4-R1', 'P28-F-R4-R1-R1', 'P28-F-R4-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1',
      'P29-A', 'P29-B', 'P29-C', 'P29-D', 'P29-E', 'P29-F', 'P29-F2', 'P29-F3', 'P29-F4', 'P29-G', 'P29-H', 'P29-I', 'P29-J', 'P29-K', 'P29-L', 'P29-M', 'P29-N', 'P29-M2', 'P29-O', 'P29-O-R1', 'P29-O1-R1', 'P29-O1-R2', 'P29-O2', 'P29-Q', 'P29-R', 'P29-S', 'P29-T', 'P29-U', 'P29-V', 'P29-W', 'P29-W-R1', 'P29-W-R2', 'P29-X', 'P29-Y', 'P29-Z',
      'P29-AA', 'P29-AB', 'P29-AB-R1', 'P29-AB-R2', 'P29-AB-R2-R1', 'P30-A', 'P30-B', 'P30-C',
      'CR-92', 'CR-93', 'CR-94', 'CR-95', 'CR-96',
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
      'P19-A', 'P19-B', 'P20-A', 'P20-A-R1', 'P20-A-R2', 'P20-A-R2-R1', 'P20-B', 'P20-C', 'P20-D', 'P20-E', 'P20-F',
      'P20-G', 'P20-H', 'P20-I', 'P20-J', 'P20-K', 'P20-L', 'P20-M', 'P20-N', 'P20-N-R1', 'P20-N-R2', 'P20-O', 'P20-P', 'P20-Q', 'P20-R', 'P20-S', 'P20-S-R1', 'P20-S-R1-R1', 'P20-T', 'P20-U', 'P21-A', 'P21-B', 'P21-C', 'P21-C1', 'P21-D', 'P22-A', 'P23-A', 'P23-B', 'P24-A', 'P25-A', 'P25-B', 'P25-C', 'P25-D', 'P25-E', 'P26-A', 'P27-A',
      'P23-C', 'P23-D', 'P25-F',
      'P28-A', 'P28-A-R1', 'P28-B', 'P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4', 'P28-D', 'P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1', 'P28-F', 'P28-F-R1', 'P28-F-R2', 'P28-F-R2-R1', 'P28-F-R3', 'P28-F-R3-R1', 'P28-F-R3-R2', 'P28-F-R3-R3', 'P28-F-R3-R3-R1', 'P28-F-R4', 'P28-F-R4-R1', 'P28-F-R4-R1-R1', 'P28-F-R4-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1',
      'P29-A', 'P29-B', 'P29-C', 'P29-D', 'P29-E', 'P29-F', 'P29-F2', 'P29-F3', 'P29-F4', 'P29-G', 'P29-H', 'P29-I', 'P29-J', 'P29-K', 'P29-L', 'P29-M', 'P29-N', 'P29-M2', 'P29-O', 'P29-O-R1', 'P29-O1-R1', 'P29-O1-R2', 'P29-O2', 'P29-Q', 'P29-R', 'P29-S', 'P29-T', 'P29-U', 'P29-V', 'P29-W', 'P29-W-R1', 'P29-W-R2', 'P29-X', 'P29-Y', 'P29-Z',
      'P29-AA', 'P29-AB', 'P29-AB-R1', 'P29-AB-R2', 'P29-AB-R2-R1', 'P30-A', 'P30-B', 'P30-C',
    ];

    for (const id of newPartIds) {
      expect(dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
      expect(promptLog.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
    }
  });

  it('keeps roadmap phases planned or held and out of the prompt log', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const plannedPartIds = [
      'P31-A', 'P31-B', 'P31-C',
      'P32-A', 'P32-B', 'P32-C',
      'P33-A', 'P33-B', 'P33-C',
      'P34-A', 'P34-B', 'P34-C',
      'P35-A', 'P35-B', 'P35-C',
      'P36-A', 'P36-B', 'P36-C', 'P36-D',
      'P37-A', 'P37-B', 'P37-C',
      'P38-A', 'P38-B', 'P38-C',
    ];
    const heldPartIds = new Set([
      'P33-A', 'P33-B', 'P33-C',
      'P34-A', 'P34-B', 'P34-C',
      'P35-A', 'P35-B', 'P35-C',
    ]);

    for (const id of plannedPartIds) {
      const dashboardRows = dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`));
      expect(dashboardRows).toHaveLength(1);
      expect(dashboardRows[0]).toContain(
        heldPartIds.has(id) ? '| Held by owner |' : '| Planned |',
      );
      expect(roadmap.split('\n').filter((line) => line.includes(`${id} —`))).toHaveLength(1);
      expect(promptLog.split('\n').find((line) => line.startsWith(`| ${id} |`))).toBeUndefined();
    }
    for (const phase of [31, 32, 33, 34, 35, 36, 37, 38]) {
      expect(roadmap).toContain(`**Phase ${phase} —`);
    }
  });

  it('maps every legacy ID exactly once in the dashboard Legacy ID column', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const legacyIds = [
      'P15-D', 'P15-E', 'P15-G', 'P15-H', 'P15-I', 'P15-J',
      'P15-fix-0', 'P15-FIX-R1', 'P15-FIX-R2', 'P15-FIX-R3',
      'P15-FIX-R4', 'P15-FIX-R5', 'P15-FIX-R6', 'P15-LEDGER',
      'P15-F', 'P15-K', 'P15-L', 'P15-M',
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
    const rowIds = rows.map((row) => row.split('|')[1]?.trim());
    const counts = new Map<number, { done: number; total: number }>();

    expect(rowIds).toHaveLength(new Set(rowIds).size);
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
      if (status.startsWith('Done') || status.startsWith('Superseded') || status.startsWith('Cancelled')) count.done += 1;
      counts.set(phase, count);
    }
    expect(rows.some((row) => row.split('|')[3]?.trim().startsWith('Superseded'))).toBe(true);
    expect(rows.some((row) => row.split('|')[3]?.trim().startsWith('Cancelled'))).toBe(true);

    const total = [...counts.values()].reduce((sum, count) => sum + count.total, 0);
    const done = [...counts.values()].reduce((sum, count) => sum + count.done, 0);
    const lastPhase = Math.max(...counts.keys());
    const expected: [string, number, number][] = [
      ['Overall progress', done, total],
      ...Array.from({ length: lastPhase }, (_, index): [string, number, number] => {
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
    const phase18 = counts.get(18);
    expect(phase18?.total).toBeGreaterThan(0);
    expect(phase18?.done).toBe(phase18?.total);
    for (const phase of [20, 21, 22, 23, 25, 28, 30]) {
      const count = counts.get(phase);
      expect(count?.total).toBeGreaterThan(0);
      if (phase === 20) {
        expect(count?.done).toBe(29);
        expect(count?.total).toBe(29);
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2 |')))
          .toContain('Revised by P20-A-R2-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2-R1 |')))
          .toContain('| Done |');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1 |')))
          .toContain('Done; Revised by P20-S-R1-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1-R1 |')))
          .toContain('| Done |');
      } else if (phase === 28) {
        expect(count?.done).toBe(29);
        expect(count?.total).toBe(31);
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E-R4 |')))
          .toContain('| Done |');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E-R5 |')))
          .toContain('| Done; Revised by P28-E-R5-R1 |');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-F |')))
          .toContain('Revised by P28-F-R4');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-F-R4 |')))
          .toContain('Done; Revised by P28-F-R4-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-F-R4-R1 |')))
          .toContain('Done; Revised by P28-F-R4-R1-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-F-R4-R1-R1 |')))
          .toContain('In progress; Revised by P28-F-R4-R1-R1-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-F-R4-R1-R1-R1 |')))
          .toContain('Done; Revised by P28-F-R4-R1-R1-R1-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-F-R4-R1-R1-R1-R1 |')))
          .toContain('Done; Revised by P28-F-R4-R1-R1-R1-R1-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P28-F-R4-R1-R1-R1-R1-R1 |')))
          .toContain('| In progress |');
      } else {
        expect(count?.done).toBe(count?.total);
      }
    }
    const phase28 = counts.get(28);
    const phase28Total = phase28?.total ?? 0;
    const phase28Done = phase28?.done ?? 0;
    const phase28Rows = rows.filter((row) => row.split('|')[1]?.trim().startsWith('P28-'));
    const releaseRevision = phase28Rows.find((row) => row.split('|')[1]?.trim() === 'P28-F-R2');
    const incompleteRows = phase28Rows.filter((row) => {
      const status = row.split('|')[3]?.trim() ?? '';
      return !['Done', 'Superseded', 'Cancelled'].some((closed) => status.startsWith(closed));
    });
    expect(phase28Total).toBeGreaterThan(0);
    expect(releaseRevision).toBeDefined();
    expect(phase28Done).toBe(phase28Total - incompleteRows.length);
  });

  it('keeps the phase branch index aligned with dashboard subtask counts', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const index = ledger.split('## 12. Phase branch index')[1] ?? '';
    const counts = new Map<number, number>();
    for (const line of dashboard.split('\n')) {
      const id = line.split('|')[1]?.trim();
      const phase = id?.match(/^Phase (\d+)$/) ?? id?.match(/^P(\d+)-/);
      if (phase) counts.set(Number(phase[1]), (counts.get(Number(phase[1])) ?? 0) + 1);
    }

    const rows = index.split('\n').filter((line) => /^\| \d{2} \|/.test(line));
    expect(rows).toHaveLength(30);
    for (const line of rows) {
      const [, phase, branch, tag, commit, count] = line.split('|').map((cell) => cell.trim().replaceAll('`', ''));
      const number = Number(phase);
      expect(branch).toMatch(new RegExp(`^phase/${phase}-[a-z0-9-]+$`));
      expect(tag).toBe(`phase-${phase}-complete`);
      expect(commit).toMatch(/^[0-9a-f]{40}$/);
      expect(Number(count)).toBe(counts.get(number));
    }
  });

  it('records the unchanged FX/CH IDs, CR-4 through CR-97 and current phase work', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const decisions = ledger.split('## 4. Architecture and decisions')[1]?.split('## 5. Phase history')[0] ?? '';

    expect(`${dashboard}\n${register}`).toContain('CR-3');
    for (const id of [
      'FX-BASE', 'CH-1', 'CH-2', 'CH-3', 'CH-4',
      'CR-4', 'CR-5', 'CR-6', 'CR-7', 'CR-8', 'CR-9', 'CR-10',
      'CR-11', 'CR-12', 'CR-13', 'CR-14', 'CR-15', 'CR-16', 'CR-17',
      'CR-18', 'CR-19', 'CR-20', 'CR-21', 'CR-22', 'CR-23', 'CR-24',
      'CR-25', 'CR-26', 'CR-27', 'CR-28', 'CR-29', 'CR-30', 'CR-31',
      'CR-32', 'CR-33', 'CR-34', 'CR-35', 'CR-36', 'CR-37', 'CR-38', 'CR-39',
      'CR-40', 'CR-41', 'CR-42', 'CR-43', 'CR-44', 'CR-45', 'CR-46',
      'CR-47', 'CR-48', 'CR-49', 'CR-50', 'CR-51', 'CR-52', 'CR-53', 'CR-54', 'CR-55',
      'CR-56', 'CR-57', 'CR-58', 'CR-59', 'CR-60', 'CR-61',
      'CR-62', 'CR-63', 'CR-64', 'CR-65', 'CR-66', 'CR-67', 'CR-68', 'CR-69',
      'CR-70', 'CR-71', 'CR-72', 'CR-73', 'CR-74', 'CR-75', 'CR-76', 'CR-77',
      'CR-78', 'CR-79', 'CR-80', 'CR-81', 'CR-82', 'CR-83', 'CR-84', 'CR-85', 'CR-86', 'CR-87',
      'CR-88', 'CR-89', 'CR-90', 'CR-91', 'CR-92', 'CR-93', 'CR-94', 'CR-95', 'CR-96', 'CR-97',
    ]) {
      expect(`${dashboard}\n${register}`).toContain(id);
    }
    expect(promptLog).toContain('| P18-LEDGER |');
    expect(promptLog).toContain('| P19-C |');
    expect(register).toContain('| CR-16 | Templates joins History and Month review; remove Budget header menu. | Superseded by CR-17 |');
    expect(register).toContain('| CR-17 | Put History, Month review and Templates in the Budget header as ordered, accessible right-side icons; no body action row or header menu. | Superseded by CR-24 |');
    expect(register).toContain('| CR-18 | Compact expandable Transactions balance card with four balanced metrics, secondary money/pending caption and review action. | Superseded by CR-22 |');
    expect(register).toContain('| CR-23 | Clear later due slots by paying through them in FIFO order, with atomic records and one-step Undo. | Done |');
    expect(register).toContain("| CR-24 | Replace Budget's three header actions with a single three-dot menu and ordered Budget/global entries. | Superseded by CR-30 |");
    expect(register).toContain('| CR-25 | Format Budget bills/dues and the no-budget card with responsive row layout and actions. | Superseded by CR-32 |');
    expect(register).toContain('| CR-26 | Repair the redundant iOS icon override so Expo Doctor passes. | Done |');
    expect(decisions).toContain('DEC-P20D-CR22');
    expect(decisions).toContain('DEC-P20D-CR23');
    expect(decisions).toContain('DEC-P20D-CR24');
    expect(decisions).toContain('DEC-P20D-CR25');
    expect(decisions).toContain('DEC-BUDGET-SCREEN');
    expect(decisions).toContain('DEC-P20H-retired');
    expect(decisions).toContain('DEC-P21C-CR37-38');
    expect(decisions).toContain('DEC-P21C1-CR39');
    expect(decisions).toContain('DEC-P20K-CR44-46');
    expect(decisions).toContain('DEC-BUDGET-DIRECTION');
    expect(decisions).toContain('DEC-BUDGET-SPEC');
    expect(decisions).toContain('DEC-P20Q-CR62-65');
    expect(decisions).toContain('DEC-P20U');
    expect(decisions).toContain('DEC-P20S');
    expect(decisions).toContain('DEC-P20M-CR52');
    expect(decisions).toContain('DEC-P20M-CR53-55');
    expect(decisions).toContain('DEC-P20O-CR58');
    expect(decisions).toContain('DEC-P20O-CR59');
    expect(decisions).toContain('DEC-P20O-DEMO');
    expect(decisions).toContain('DEC-P20J-LEGACY-SHARES');
    expect(decisions).toContain('DEC-P20L-CR47');
    expect(decisions).toContain('DEC-P20L-CR48');
    expect(decisions).toContain('DEC-FORM-COMPONENTS');
    expect(ledger).toContain('5aeefb96e70df7c388e5eb39454285204adb5707');
  });

  it('tracks completed P20-M through P20-U while preserving P20-L and P21-D', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const statusFor = (id: string) => register.split('\n')
      .find((line) => line.startsWith(`| ${id} |`))
      ?.split('|')[3]?.trim();

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-E |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-F |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-G |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-H |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-I |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-J |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-K |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-L |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-M |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-N |')))
      .toContain('Done; Revised by P20-N-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-N-R1 |')))
      .toContain('| Done; Revised by P20-N-R2 |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-N-R2 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-O |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-P |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Q |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-R |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S |')))
      .toContain('| Done; Revised by P20-S-R1 |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1 |')))
      .toContain('Done; Revised by P20-S-R1-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1-R1 |')))
      .toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-T |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-U |'))).toContain('| Done |');
    for (const id of ['CR-27', 'CR-28', 'CR-31']) {
      expect(statusFor(id)).toBe('Done');
    }
    expect(statusFor('CR-29')).toBe('Done');
    for (const id of ['CR-47', 'CR-48', 'CR-49', 'CR-50', 'CR-51', 'CR-52', 'CR-53', 'CR-54', 'CR-55']) {
      expect(statusFor(id)).toBe('Done');
    }
    expect(statusFor('CR-56')).toBe('Done');
    expect(statusFor('CR-57')).toBe('Done');
    expect(statusFor('CR-58')).toBe('Done');
    expect(statusFor('CR-59')).toBe('Done; visible hints and unbudgeted read-only rule superseded by P20-S');
    expect(statusFor('CR-60')).toBe('Done');
    expect(statusFor('CR-61')).toBe('Done');
    expect(statusFor('CR-62')).toBe('Done');
    expect(statusFor('CR-63')).toBe('Done; collapsible rows superseded by P20-R');
    expect(statusFor('CR-64')).toBe('Done; text-button affordances superseded by P20-R');
    expect(statusFor('CR-65')).toBe('Done');
    for (const id of ['CR-66', 'CR-67', 'CR-68', 'CR-69']) {
      expect(statusFor(id)).toBe('Done');
    }
    for (const id of ['CR-70', 'CR-72', 'CR-73', 'CR-74', 'CR-75']) {
      expect(statusFor(id)).toBe('Done');
    }
    expect(statusFor('CR-71')).toBe('Done; FormScreen freeze superseded by CR-76');
    for (const id of ['CR-76', 'CR-77']) {
      expect(statusFor(id)).toBe('Done');
    }
    for (const id of ['CR-82', 'CR-83', 'CR-84', 'CR-85']) {
      expect(statusFor(id)).toBe('Done');
    }
    for (const id of ['CR-86', 'CR-87']) {
      expect(statusFor(id)).toBe('Done');
    }
    expect(statusFor('CR-30')).toBe('Done');
    expect(statusFor('CR-32')).toBe('Done');
    expect(statusFor('CR-33')).toBe('Done');
    expect(statusFor('CR-34')).toBe('Done');
    expect(statusFor('CR-35')).toBe('Done; corrected by CR-43');
    expect(statusFor('CR-36')).toBe('Superseded by CR-40');
    expect(statusFor('CR-37')).toBe('Done');
    expect(statusFor('CR-38')).toBe('Done');
    expect(statusFor('CR-39')).toBe('Done');
    for (const id of ['CR-40', 'CR-41', 'CR-42', 'CR-43']) {
      expect(statusFor(id)).toBe('Done');
    }
    for (const id of ['CR-44', 'CR-45', 'CR-46']) {
      expect(statusFor(id)).toBe('Done');
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P21-C |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P21-C1 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P21-D |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P21-C1 |'))).toContain('| Done;');
    expect(statusFor('CR-25')).toBe('Superseded by CR-32');
    expect(statusFor('CR-24')).toBe('Superseded by CR-30');
    expect(statusFor('CR-21')).toBe('Superseded by CR-27');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P22-B |'))).toBeUndefined();
    expect(promptLog.split('\n').find((line) => line.startsWith('| P22-B |'))).toBeUndefined();
    expect(ledger).not.toContain('P22-B spreadsheet importer');
    expect(dashboard.split('\n').some((line) => line.includes('| P15-SEED |'))).toBe(false);
    for (const id of [
      'P26-A', 'P27-A',       'P28-A', 'P28-A-R1', 'P28-B', 'P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4', 'P28-D', 'P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1', 'P29-AA', 'P29-AB', 'P29-AB-R1', 'P29-AB-R2', 'P29-AB-R2-R1',
    ]) {
      expect(dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P26-A |'))).toContain('| Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P27-A |'))).toContain('| Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-A |'))).toContain('Revised by P28-A-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-C |'))).toContain('Revised by P28-C-R4 and earlier revisions');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-A-R1 |'))).toContain('| Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-C-R1 |'))).toContain('| Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-C-R2 |'))).toContain('| Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-C-R3 |'))).toContain('| Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-C-R4 |'))).toContain('| Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E |'))).toContain('Revised by P28-E-R1, P28-E-R2, P28-E-R3, P28-E-R4, P28-E-R5 and P28-E-R5-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E-R1 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R1 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E-R3 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R3 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E-R4 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R4 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E-R5 |'))).toContain('| Done; Revised by P28-E-R5-R1 |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R5 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28-E-R5-R1 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R5-R1 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-AB |'))).toContain('Revised by P29-AB-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-AB-R1 |'))).toContain('| Done; Revised by P29-AB-R2 |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P29-AB-R1 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A |'))).toContain('Revised by P20-A-R1; Revised by P20-A-R2');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2 |')))
      .toContain('Revised by P20-A-R2-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2-R1 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P20-A-R2 |'))).toContain('| Done;');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P20-A-R2-R1 |'))).toContain('| current request |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-AB-R1 |')))
      .toContain('| Done; Revised by P29-AB-R2 |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-AB-R2 |'))).toContain('Revised by P29-AB-R2-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-AB-R2-R1 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P29-AB-R2 |'))).toContain('Done; Revised by P29-AB-R2-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-N |'))).toContain('Revised by P20-N-R1');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P20-N-R1 |'))).toContain('| current request |');
    expect(ledger).toContain('Revised by P28-A-R1');
    expect(ledger).toContain('Revised by P28-C-R4 and earlier revisions');
    expect(dashboard).toContain('Revised by P28-B');
    expect(ledger).toContain('Phase 30 — Release 2 stabilization');
    const release2Roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    expect(release2Roadmap).toContain('P30-A — Failing persistence/restart tests');
    expect(release2Roadmap).toContain('P30-B — Verified fallback authority markers');
    expect(release2Roadmap).toContain('P30-C — Memo-input/cache source guard');
    expect(release2Roadmap).not.toContain('[placeholder]');
    for (const id of [
      'P29-B', 'P29-C', 'P29-D', 'P29-E', 'P29-F', 'P29-F2', 'P29-F3', 'P29-F4', 'P29-G', 'P29-H', 'P29-I', 'P29-J', 'P29-K', 'P29-L', 'P29-N', 'P29-M2', 'P29-Q', 'P29-R', 'P29-S', 'P29-T', 'P29-U', 'P29-V', 'P29-X', 'P29-Y', 'P29-Z', 'P29-AA',
    ]) {
      expect(dashboard.split('\n').find((line) => line.startsWith(`| ${id} |`))).toContain('| Done |');
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-W |')))
      .toContain('Done; Revised by P29-W-R1 and P29-W-R2');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-W-R1 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-M |'))).toContain('| Superseded by P29-M2 |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-O |')))
      .toContain('Superseded by P29-O1 and P29-S; Revised by P29-O-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-O-R1 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-Q |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-R |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-O2 |'))).toContain('| Cancelled by owner |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-S |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-T |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-U |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-V |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-O1 |')))
      .toContain('Done; Revised by P29-O1-R1 and P29-O1-R2');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-O1-R2 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-W |')))
      .toContain('Done; Revised by P29-W-R1 and P29-W-R2');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-W-R1 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-W-R2 |'))).toContain('| Done |');
    expect(ledger).toContain('DEC-P29E-HOLDING-DELETE');
    expect(ledger).toContain('DEC-P29T-HISTORICAL-ENTRY-SNAPSHOT');
    expect(ledger).toContain('DEC-P29U-LEGACY-VALUATION-COMPAT');
    expect(ledger).toContain('DEC-P29V-SQLITE-VERIFIED-FALLBACK');
    expect(ledger).toContain('DEC-P29V-DATE-STRESS-BOUNDS');
    expect(ledger).toContain('DEC-P29V-BACKUP-ROUNDTRIP');
    expect(ledger).toContain('DEC-P29W-FORECLOSURE-INVENTORY');
    expect(ledger).toContain('DEC-P29W-FORECLOSURE-RECORD');
    expect(ledger).toContain('clears every Budget item link to the holding in the same single write');
    expect(ledger).toContain('DEC-P29G-COVER-MANAGEMENT');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P25-E |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P25-E |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P25-F |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P25-F |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P23-D |'))).toContain('| Done |');
    expect(statusFor('CR-91')).toBe('Done');
    expect(statusFor('CR-1')).toBe('Done; superseded by P24-A (2026-11-08)');
    expect(statusFor('CR-93')).toBe('Done');
    expect(statusFor('CR-94')).toBe('Done');
    expect(statusFor('CR-95')).toBe('Done');
    expect(statusFor('CR-96')).toBe('Done');
    expect(statusFor('CR-97')).toBe('Done');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P25-A |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P25-B |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P25-C |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P25-D |'))).toContain('| Done |');
    expect(ledger).toContain('DEC-TRACKER-CLEANUP');
    expect(ledger).toContain('DEC-P20E-CR27');
    expect(ledger).toContain('DEC-P20E-CR31');
    expect(ledger).toContain('DEC-P20L-CR50');
    expect(ledger).toContain('DEC-P20L-CR49');
    expect(ledger).toContain('DEC-P20L-GATE-TEST');
    expect(ledger).toContain('P20-L / P21-D device checks not verified');
    expect(ledger).toContain('DEC-P21D-CR51');
    expect(ledger).toContain('DEC-P20F-STATUS');
    expect(ledger).toContain('DEC-P20G');
    expect(ledger).toContain('DEC-P20H-retired');
    expect(ledger).toContain('DEC-P20I-CR35-36');
    expect(ledger).toContain('DEC-P20J-CR40-43');
    expect(ledger).toContain('DEC-P20K-CR44-46');
    expect(ledger).toContain('DEC-P20M-CR53-55');
    expect(ledger).toContain('DEC-P20O-CR58');
    expect(ledger).toContain('DEC-P20O-CR59');
    expect(ledger).toContain('DEC-BUDGET-V10');
    expect(ledger).toContain('DEC-P20P-CR60-61');
    expect(ledger).toContain('DEC-P20P-DEMO');
    expect(ledger).toContain('schema v9');
    expect(ledger).toContain('DEC-P21C-CR37-38');
    expect(ledger).toContain('DEC-P21C1-CR39');
  });
});
