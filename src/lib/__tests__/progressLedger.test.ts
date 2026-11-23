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
    expect(sections[sections.length - 1]?.title).toBe('Independent entities');
  });

  it('tracks CR-108 completion with owner-reported physical-device checks', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const dashboardRows = dashboard.split('\n').filter((line) => line.startsWith('| CR-108 |'));
    const registerRows = register.split('\n').filter((line) => line.startsWith('| CR-108 |'));
    const promptRows = promptLog.split('\n').filter((line) => line.startsWith('| CR-108 |'));

    expect(dashboardRows).toHaveLength(1);
    expect(dashboardRows[0]).toContain('| Done (owner-reported device checks Pass) |');
    expect(registerRows).toHaveLength(1);
    expect(registerRows[0]).toContain('| Done (owner-reported device checks Pass) |');
    expect(promptRows).toHaveLength(1);
    expect(promptRows[0]).toContain('All six ordered gates passed');
    expect(promptRows[0]).toContain('O45-O60 are owner-reported Pass (2026-11-11)');
    expect(dashboard).toContain('Revised by P29-Q-R1');
    expect(dashboard).toContain('| P29-Q-R1 | — | Done |');
    expect(dashboard).toContain('| P41-B-R1 | — | Done |');
  });

  it('records P28-F-R6-R3 task and phase PR integration', () => {
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const revisionRow = independentEntities.split('\n').find((line) => line.startsWith('| P28-F-R6-R3 |'));
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(revisionRow).toBeDefined();
    expect(revisionRow).toContain('task PR #138');
    expect(revisionRow).toContain('phase PR #139 merged to `develop` at `fd7ba55`');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-F-R6-R3 |')))
      .toContain('Done; Revised by P28-F-R6-R3-R1');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-F-R6-R3-R1 |')))
      .toContain('| Done |');
    expect(status).toContain('P28-F-R6-R3');
    expect(status).toContain('is integrated into `develop` at `fd7ba55`');
  });

  it('structures the device checklist by release and blocks incomplete releases', () => {
    const checklist = readFileSync(
      join(process.cwd(), 'docs/releases/device-test-checklist.md'),
      'utf8',
    );
    const h1 = [...checklist.matchAll(/^# .+$/gm)].map(([heading]) => heading);
    const h2 = [...checklist.matchAll(/^## (.+)$/gm)].map(([, heading]) => heading);
    const expectedSections = [
      'Next release device checks',
      'v1.0.0 device checks',
      'v1.1.0 device checks',
      'v1.1.1 device checks',
      'v1.2.0 device checks',
      'v1.3.0 device checks',
    ];
    const ids = [...checklist.matchAll(/^\| ([A-Z]+[0-9]+) \|/gm)].map(([, id]) => id);
    const expectedIds = ['X1', 'X2', 'X3', 'X4', 'A1', 'A2', 'A3', 'A4', 'B5', 'B6', 'C7', 'C8', 'D9', 'D10', 'D11', 'D12', 'E13', 'E14', 'E15', 'E16', 'E17', 'F18', 'F19', 'F20', 'G21', 'G22', 'G23', 'H24', 'H25', 'H26', 'H27', 'H28', 'I29', 'I30', 'J31', 'J32', 'J33', 'K34', 'K35', 'K36', 'L37', 'M38', 'N39', 'N40', 'N41', 'N42', 'N43', 'N44', 'O45', 'O46', 'O47', 'O48', 'O49', 'O50', 'O51', 'O52', 'O53', 'O54', 'O55', 'O56', 'O57', 'O58', 'O59', 'O60', 'O61', 'O62', 'O63', 'O64', 'O65', 'O66', 'O67', 'O68', 'O69', 'O70', 'O71', 'O72', 'O73', 'O74', 'O75', 'O76', 'O77', 'O78', 'O79'];

    expect(h1).toEqual(['# WealthWise Android Device Test Checklist']);
    expect(h2[0]).toBe(expectedSections[0]);
    expect(h2.filter((heading) => expectedSections.includes(heading))).toEqual(expectedSections);
    expect(h2).toContain('Release gate');
    expect(checklist).toContain('any row in ANY section of the device checklist');
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual([...expectedIds].sort());

    for (const [index, heading] of expectedSections.entries()) {
      const start = checklist.indexOf(`## ${heading}`);
      const nextHeading = checklist.indexOf('\n## ', start + 1);
      const section = checklist.slice(start, nextHeading === -1 ? undefined : nextHeading);
      expect(section).toContain('| Field | Value |');
      for (const field of ['App version', 'Device model', 'Android version', 'Tester', 'Date']) {
        expect(section).toContain(`| ${field} |`);
      }
      expect(section).toContain('| ID | Test | Result | Notes |');

      if (index > 0) {
        const results = [...section.matchAll(/^\| ([A-Z]+[0-9]+) \| .*? \| (.*?) \|/gm)];
        expect(results.every(([, , result]) => result === 'Pass')).toBe(true);
      }
    }
  });

  it('records CR-119 and keeps the release checklist gate identical across policy docs', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const gate = [
      'A release must not be built, drafted, tagged or published while any row in ANY section of the device checklist (the Next release section and every earlier section) has a Result other than Pass.',
      'Not run, Fail and Blocked all block. Check the checklist first; if blocked, stop and report the blocking IDs, and do not start the build or the GitHub Release draft.',
      'A Pass may only be recorded from an owner-observed or owner-reported device result, never inferred from automated tests or Expo exports.',
      "Only an explicit written owner waiver for named IDs lifts the block; record the waiver in the ledger (Owner-run actions log) and in the release note, and leave the row's Result unchanged.",
    ].join(' ');
    const maintenance = [
      "Maintenance rules: new device checks go under Next release device checks (or the decided version's section) with the next free ID, never into a published release's section, never renumbered.",
      'When the next version is decided, retitle that section `## vX.Y.Z device checks (next release)` and fill its App version.',
      'On publication, retitle it `## vX.Y.Z device checks`, set the published date, move it to the bottom of the version list (ascending order), and create a new empty `## Next release device checks` section at the top.',
      'Device-check results the owner reports are recorded under rule R8 (Owner-run actions log) with their evidence.',
    ].join(' ');
    const policyDocs = [
      'AGENTS.md',
      'docs/memory/rules.md',
      'docs/releases/README.md',
      'docs/releases/RELEASE_PROMPT.md',
      'docs/releases/release-config.md',
      'docs/releases/build-config.md',
      'docs/releases/device-test-checklist.md',
    ];

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-119 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-119 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-119 |'))).toHaveLength(1);
    expect(status).toContain('CR-119');
    expect(openItems).toContain('O61–O74');
    for (const policyPath of policyDocs) {
      const document = readFileSync(join(process.cwd(), policyPath), 'utf8');
      expect(document).toContain(gate);
      if (policyPath !== 'AGENTS.md') expect(document).toContain(maintenance);
    }
  });

  it('records owner-reported physical-device validation as Pass', () => {
    const checklist = readFileSync(
      join(process.cwd(), 'docs/releases/device-test-checklist.md'),
      'utf8',
    );
    const reportedRows = ['O54', 'O55', 'O56', 'O57', 'O58', 'O59', 'O60'];

    for (const id of reportedRows) {
      const row = checklist.split('\n').find((line) => line.startsWith(`| ${id} |`));
      expect(row).toContain('| Pass | Owner-reported, 2026-11-11.');
    }
  });

  it('records owner-approved plans and resolves accepted follow-ups', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').find((line) => line.startsWith('| P40-B |')))
      .toContain('| Planned |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P42-A |')))
      .toContain('| Done; Revised by P42-A-R1 |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P42-A-R1 |')))
      .toContain('| Done |');
    expect(register.split('\n').filter((line) => line.startsWith('| CR-109 |'))).toHaveLength(1);
    expect(register.split('\n').find((line) => line.startsWith('| CR-109 |')))
      .toContain('P42-A task PR #142');
    expect(register.split('\n').find((line) => line.startsWith('| CR-109 |')))
      .toContain('phase PR #143');
    expect(register.split('\n').find((line) => line.startsWith('| CR-109 |')))
      .toContain('898812110a07176434533b9f638b71fa6aef80d0');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-109 |'))).toHaveLength(1);
    expect(openItems).toContain('P42-A is integrated into `develop`');
    expect(status).toContain('P42-A-R1 records task PR #142 and phase PR #143');
    expect(openItems).toContain('A true in-app update check is approved for future planning');
    expect(openItems).toContain('Once-only frequency for investment plans or liabilities is approved for future planning');
    expect(openItems).toContain('Public adoption is an approved future project goal');
    expect(openItems).toContain('P31-D privacy statement is approved');
    expect(openItems).toContain('The owner confirms Sahil Aspak Sheikh as the MIT copyright holder');
    expect(openItems).toContain('P40-B is approved and Planned after P40-A');
    expect(openItems).toContain('Configure branch protection after P31-E passes a real PR run');
    expect(openItems).toContain('Retain the existing stale phase tags');
    expect(openItems).toContain('P29-J is resolved for now');
    expect(openItems).toContain('CR-3 is resolved by owner acceptance');
    expect(openItems).toContain('No fresh backup is requested');
    expect(openItems).toContain('Node 26 is accepted; no Node 24 repair is requested');
    expect(openItems).toContain('The owner accepts the previous documentation-only verification scope');
    expect(openItems).toContain("`codex-changes` was deleted at the owner's direction; no work is to be ported");
  });

  it('records CR-110-R1 planned scope and separates lifecycle activities from phases', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').filter((line) => /^\| P43-(?:A|B|E|F|G) \|/.test(line))).toHaveLength(5);
    for (const id of ['P43-E']) {
      const row = dashboard.split('\n').find((line) => line.startsWith(`| ${id} |`));
      expect(row).toContain('| Planned |');
      expect(row).toContain('Dependencies:');
      expect(row).toContain('Evidence: not started');
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P43-B |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P43-A |'))).toContain('| Done |');
    const workPlacement = dashboard.split('\n').find((line) => line.startsWith('| P43-F |')) ?? '';
    expect(workPlacement).toContain('| Done; Revised by P43-F-R1 |');
    expect(workPlacement).toContain('task PR #153');
    expect(workPlacement).toContain('phase PR #154');
    expect(workPlacement).toContain('6e8632f61226fabbfdeca1040f6dee097a808607');
    expect(workPlacement).toContain('faa126ba75ee58ee703b8e43b375aece91c8f4d1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P43-F-R1 |'))).toContain('| Done |');
    const lifecycleRename = dashboard.split('\n').find((line) => line.startsWith('| P43-A |')) ?? '';
    expect(lifecycleRename).toContain('a2fa24f930da15c49f779577eb749b33f11a7059');
    expect(lifecycleRename).toContain('9d914638e50462cbadef84df3294ed07cbf42732');
    expect(register.split('\n').filter((line) => line.startsWith('| CR-110-R1 |'))).toHaveLength(1);
    expect(register.split('\n').find((line) => line.startsWith('| CR-110 |'))).toContain('Revised by CR-110-R1');
    expect(register.split('\n').find((line) => line.startsWith('| CR-110-R1 |'))).toContain('| Planned |');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-110-R1 |'))).toHaveLength(1);
    expect(promptLog.split('\n').find((line) => line.startsWith('| CR-110 |'))).toContain('Revised by CR-110-R1');
    expect(promptLog.split('\n').find((line) => line.startsWith('| CR-110-R1 |'))).toContain('not started');
    expect(roadmap).toContain('Standalone lifecycle activities (Active; outside numbered development phases)');
    expect(roadmap).toContain('**`cleanup`**');
    expect(roadmap).toContain('**`qa-and-release`**');
    expect(roadmap).toMatch(/Documentation\s+reordering only; Git chronology remains unchanged/);
    expect(roadmap).toContain('list has not yet been supplied or approved');
    const emergencyFund = dashboard.split('\n').find((line) => line.startsWith('| P21-F |')) ?? '';
    expect(emergencyFund).toContain('Done; Revised by P21-F-R1');
    expect(emergencyFund).toContain('effective target = max(stored target, three-month floor)');
    expect(emergencyFund).toContain('three-month minimum floor');
    expect(emergencyFund).toContain('font-scale tests at 1.0/1.3/2.0');
    const transactionForm = dashboard.split('\n').find((line) => line.startsWith('| P20-W |')) ?? '';
    expect(transactionForm).toContain('| Done; Revised by P20-W-R1 and P20-W-R2 |');
    expect(transactionForm).toContain('D1/D2 schema-free scope');
    expect(transactionForm).toContain('Owner decision DEC-P20W-D3-SCHEMA24 assigns schema v24 to P20-W and replans P36-A/B to v25');
    expect(emergencyFund).toContain('font-scale tests at 1.0/1.3/2.0');
    expect(emergencyFund).toContain('owner-supplied Gate 4 exit 1 (20/21; six SDK 57 patch mismatches)');
    expect(emergencyFund).toContain('local Gate 4 attempt exit 1 (`ENOTFOUND registry.npmjs.org`)');
    expect(emergencyFund).toContain('Gates 5–6 exit 0');
    const emergencyFundIntegration = dashboard.split('\n').find((line) => line.startsWith('| P21-F-R1 |')) ?? '';
    expect(emergencyFundIntegration).toContain('| Done |');
    expect(emergencyFundIntegration).toContain('task PR #170');
    expect(emergencyFundIntegration).toContain('c877f6d19e35c0b9fbcba90e9722da7531948c8e');
    expect(emergencyFundIntegration).toContain('phase PR #171');
    expect(emergencyFundIntegration).toContain('2e5e18a7a2be207387a7462b039547f51b0e4631');
    expect(emergencyFundIntegration).toContain('Placement: rule 2;');
    expect(register.split('\n').find((line) => line.startsWith('| CR-117 |'))).toContain('| Done; Revised by P21-F-R1 |');
    expect(register.split('\n').find((line) => line.startsWith('| CR-117 |'))).toContain('Task PR #170');
    expect(register.split('\n').find((line) => line.startsWith('| CR-117 |'))).toContain('phase PR #171');
    expect(promptLog.split('\n').find((line) => line.startsWith('| CR-117 |'))).toContain('Revised by P21-F-R1');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| P21-F-R1 |'))).toHaveLength(1);
    expect(branchIndex).toMatch(/\| P21 \| `phase\/21-emergency-fund` \| `phase-21-complete` \| `[0-9a-f]+` \| 8 \|/);
    expect(openItems).toContain('P21-F is integrated into `develop` through PR #170 and PR #171');
    expect(status).toContain('P21-F-R1 records task PR #170 and phase PR #171');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-W |')))
      .toContain('Owner decision DEC-P20W-D3-SCHEMA24 assigns schema v24 to P20-W and replans P36-A/B to v25');
    expect(roadmap).toContain('one issue per ledger part or CR');
    expect(roadmap).toContain('API rate and noise concerns');
    expect(branchIndex).toContain('| P43 | `phase/43-lifecycle-and-transaction-planning` | — | — | 7 |');
    expect(branchIndex).toContain('Independent entity branch index');
    expect(branchIndex).toContain('| `cleanup` | `cleanup` | `phase/27-cleanup` | `phase-27-complete` | Active |');
    expect(branchIndex).toContain('| `qa-and-release` | `qa-and-release` | `phase/28-qa-and-release` | `phase-28-complete` | Active |');
    expect(branchIndex).toContain('| `schema-migration` | `schema-migration` | `phase/07-schema-migration` | `phase-07-complete` | Active |');
    expect(branchIndex).toContain('| `documentation` | `documentation` | — | — | Active |');
    expect(roadmap).not.toMatch(/^\d+\. \*\*P(?:27|28) —/m);
    expect(roadmap).toContain('P27/P28 remain completed historical milestones');
    expect(roadmap).toContain('P21-F (Previously: P43-C) is Done: one Emergency Fund edit action and combined target/allocation form');
    expect(roadmap).toContain('P20-W (Previously: P43-D)');
    expect(roadmap).toContain('P43-E — GitHub issue strategy');
    expect(roadmap).toContain('P43-F — Work placement and CM-2');
    expect(roadmap).toContain('P43-G — Owner-approval planning reconciliation');
    expect(openItems).toContain('## CR-110-R1 planned work');
    expect(openItems).toContain('phase/43-lifecycle-and-transaction-planning');
    expect(status).toContain('**CR-110-R1 (2026-11-12) is Planned only:**');
  });

  it('records the P20-A-R3 linked savings Paid implementation and verification status', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const revision = dashboard.split('\n').find((line) => line.startsWith('| P20-A-R3 |'));

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2 |')))
      .toContain('Revised by P20-A-R2-R1 and P20-A-R3');
    expect(revision).toContain('| Done; Revised by P20-A-R3-R1 |');
    expect(revision).toContain('Dependencies: none');
    expect(revision).toContain('Reproduced two plan/snapshot link-placement failures');
    expect(revision).toContain('one Deposit entry');
    expect(revision).toContain('no new Budget row');
    expect(revision).toContain('Cash, Savings and Other');
    expect(revision).toContain('Fixed deposit excluded');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| P20-A-R3 |'))).toHaveLength(1);
    expect(promptLog.split('\n').find((line) => line.startsWith('| P20-A-R3 |')))
      .toContain('| In progress;');
    expect(roadmap).toContain('P20-A-R3 — Linked one-time savings Paid from Transactions (Done');
  });

  it('records completed P20-U-R1 findings and fix evidence', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');

    const p20u = dashboard.split('\n').find((line) => line.startsWith('| P20-U |'));
    const p20uR1 = dashboard.split('\n').find((line) => line.startsWith('| P20-U-R1 |'));
    expect(p20u).toContain('Done; Revised by P20-U-R1');
    expect(p20uR1).toContain('| Done |');
    expect(p20uR1).toContain('superseded CR-115’s earlier');
    expect(p20uR1).toContain('four following-scope Income schedule snapshot defects');
    expect(p20uR1).toContain('O73 physical-device check remains Not run');
    expect(p20uR1).toContain('Real-form edit reproduced amount loss when optional fields were cleared');
    expect(p20uR1).toContain('category-line action also dropped `holdingId` in both scopes');
    expect(p20uR1).toContain('Placement: initial work rule 2; continuations rule 3;');

    // Exact fields in evidence/scope
    expect(p20uR1).toContain('start month, frequency, due day');
    expect(p20uR1).toContain('both scopes');
    expect(p20uR1).toContain('H1–H5 findings are recorded in CONT3');
    expect(ledger).toMatch(/Overall progress ████████░░ (?:79|80)% \((?:158\/200|159\/201|160\/202|161\/203|162\/204|163\/205|163\/207|164\/207|165\/208)\)/);
    expect(ledger).toMatch(/P20\s+██████████ (?:100%|98%) \((?:43\/43|44\/44|45\/45|46\/46|47\/47|48\/48|48\/49|49\/49|50\/50)\)/);
    const o73 = checklist.split('\n').find((line) => line.startsWith('| O73 |'));
    expect(o73).toContain('one-time and recurring');
    expect(o73).toContain('Spend, Invest and Income');
    expect(o73).toContain('restart');

    // Register and prompt log checks
    expect(register).toContain('| CR-115 |');
    expect(register).toContain('| CR-116 |');
    expect(register).toContain('| CR-117 |');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| P20-U-R1 |'))).toHaveLength(1);
    expect(roadmap).toContain('P20-U-R1');
    expect(branchIndex).toMatch(/\| P20 \| `phase\/20-budget` \| `phase-20-complete` \| `eed40750f68bebc9168907f79f74a67c1f301b83` \| (?:43|44|45|46|47|48|49|50) \|/);

    // Entity checks: CR-115 belongs in documentation entity under Section 13
    expect(independentEntities).toContain('| CR-115 |');
  });

  it('records CR-113 owner approvals while P21-F proceeds under that authorization', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');

    expect(register.split('\n').find((line) => line.startsWith('| CR-113 |'))).toContain('| Done |');
    for (const [id, decision] of [
      ['P21-F', 'Owner explicitly authorized editing'],
      ['P33-B', 'Android widget implementation is approved'],
      ['P34-A', 'scope and platform research approved'],
      ['P35-B', 'Owner has given a Go'],
      ['P43-B', 'Owner approved the non-release tag-cleanup scope'],
      ['P43-E', 'Owner approved the GitHub issue strategy'],
      ['P44-A', 'owner approved a Transactions stack route'],
      ['P39-A', 'Owner approved keeping P39-A–H in P39'],
      ['P40-A', 'Owner approved keeping P40-A/B in P40'],
    ]) {
      expect(dashboard.split('\n').find((line) => line.startsWith(`| ${id} |`))).toContain(decision);
    }
    expect(openItems).toContain('this update starts no research');
    expect(openItems).toContain('The exact proposed deletion list has not been supplied');
  });

  it('records P44 and CM-2 as separate planned work under CR-111', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');

    expect(dashboard.split('\n').filter((line) => /^\| P44-[A-D] \|/.test(line))).toHaveLength(4);
    for (const [id, dependency] of [
      ['P44-A', 'none'],
      ['P44-B', 'P44-A'],
      ['P44-C', 'P44-B'],
      ['P44-D', 'P44-C'],
    ]) {
      const row = dashboard.split('\n').find((line) => line.startsWith(`| ${id} |`));
      expect(row).toContain('| Planned |');
      expect(row).toContain(`Dependencies: ${dependency}`);
      expect(row).toContain('Evidence: not started');
    }
    expect(dashboard).not.toContain('| CM-2 |');
    expect(register.split('\n').filter((line) => line.startsWith('| CR-111 |'))).toHaveLength(1);
    expect(register.split('\n').find((line) => line.startsWith('| CM-2 |')))
      .toContain('| Active |');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-111 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CM-2 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => /^\| P44-[A-D] \|/.test(line))).toHaveLength(4);
    expect(roadmap).toContain('P44-A — Design');
    expect(roadmap).toContain('P44-B — Pure daily totals selector');
    expect(roadmap).toContain('P44-C — Spending heat map screen and route');
    expect(roadmap).toContain('P44-D — Demo data, layout, accessibility and device checklist');
    expect(roadmap).toContain('owner approved a Transactions stack route');
    expect(roadmap).toContain('unbounded\n      month navigation');
    expect(roadmap).toContain('50-year and 126-year stress fixtures');
    expect(roadmap).toContain('all inflows\n      in Income');
    expect(roadmap).toContain('no\n      persisted schema change is Assumed');
    expect(roadmap).toContain('plain seven-column React Native View');
    expect(roadmap).toContain('CM-2 Git sync rule (Active; enforced)');
    expect(roadmap).toContain('git fetch --all --prune');
    expect(register.split('\n').find((line) => line.startsWith('| CM-2 |')))
      .toContain('| Active |');
    expect(branchIndex).toContain('| P44 | `phase/44-spending-heatmap` | — | — | 4 |');
    expect(status).toContain('CR-111');
    expect(openItems).toContain('CR-111');
  });

  it('enforces current placement records, lifecycle names and CM-2 wording', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const rules = ledger.split('## 3. Standing rules')[1]?.split('## 4. Architecture and decisions')[0] ?? '';
    const placementMoves = ledger.split('### Placement moves')[1]?.split('\n### ')[0] ?? '';
    const exactCm2 = 'After any merge that lands on a target branch (task->phase, phase->develop, release->main, main->develop): git fetch --all --prune; git switch <target>; git pull --ff-only. Refuse and report if the worktree is dirty, the fast-forward fails or the target has no upstream. This rule never authorizes pushing; R3 is unchanged.';
    const scopedDocs = ['AGENTS.md', 'CONTRIBUTING.md', 'docs/PROGRESS.md', 'docs/memory/rules.md', 'docs/memory/status.md', 'docs/memory/open-items.md', 'docs/memory/project.md', 'docs/releases/README.md'];

    expect(rules).toContain('R6 — Work placement');
    expect(register).toContain(exactCm2);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-112 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-112 |'))).toHaveLength(1);
    expect(ledger).toContain('Placement moves');
    expect(placementMoves).toContain('P43-C');
    expect(placementMoves).toContain('P43-D');
    expect(placementMoves).toContain('P31-E');
    // Placement cutoff: CR-112. Earlier part rows are grandfathered; each
    // new or moved row introduced by this task is checked below.
    for (const id of ['P21-F', 'P20-W', 'P20-W-R1', 'P43-F', 'P43-F-R1']) {
      const rows = dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatch(/Placement: rule [1-5]; searched .+; related .+; reason:?.+/);
    }
    for (const name of scopedDocs) {
      const content = readFileSync(join(process.cwd(), name), 'utf8');
      for (const oldName of ['phase/27-cleanup', 'phase/28-qa-and-release']) {
        for (const paragraph of content.split(/\n\s*\n/).filter((candidate) => candidate.includes(oldName))) {
          expect(paragraph.toLowerCase().replace(/\s+/g, ' '))
            .toContain(`historical branch name: \`${oldName}\``);
        }
      }
    }
    expect(dashboard).not.toContain('| P43-C |');
    expect(dashboard).not.toContain('| P43-D |');
    expect(dashboard).not.toContain('| P31-E |');
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P21-F |'))).toHaveLength(1);
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P20-W |'))).toHaveLength(1);
    const standaloneCi = ledger.split('\n').filter((line) => line.includes('Previously: P31-E'));
    expect(standaloneCi).toHaveLength(1);
    expect(standaloneCi[0]).toMatch(/Placement: rule 1; searched .+; related .+; reason:?.+/);
  });

  it('records the CR-112 Doctor retry and complete ordered gate rerun', () => {
    const verification = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';

    expect(verification).toContain('The first `npx expo-doctor` attempt exited 1');
    expect(verification).toContain('A network retry exited 0 with 21/21 checks');
    expect(verification).toContain('npm test -- --coverage --watchman=false');
    expect(verification).toContain('1,324 passed, 1 skipped (1,325 total)');
    expect(verification).toContain('| 4 | `npx expo-doctor` | 0; 21/21 checks passed |');
    expect(verification).toContain('| 6 | `npx expo export --platform ios` | 0 |');
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
      'CR-88', 'CR-89', 'CR-90', 'CR-91', 'CR-92', 'CR-93', 'CR-94', 'CR-95', 'CR-96', 'CR-97', 'CR-98', 'CR-99', 'CR-100', 'CR-101', 'CR-102', 'CR-103', 'CR-106', 'CR-107', 'CR-109', 'CR-110', 'CR-111', 'CR-115', 'CR-116',
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
      'P41-B-R1', 'CR-110-R1', 'CR-111', 'CR-113', 'CR-116', 'P20-S-R2', 'P43-G', 'P43-G-R1', 'CM-2',
      'P01', 'P02', 'P03', 'P04', 'P05', 'P06', 'P06-FIX-R1',
      'P07', 'P08', 'P09', 'P10', 'P11', 'P12', 'P13', 'P14',
      'P15-A', 'P15-A2', 'P15-B', 'P15-C',
      'P16-A', 'P16-B', 'P16-C', 'P17-A', 'P17-B', 'P17-C',
      'P18-R0', 'P18-R1', 'P18-R2', 'P18-R3', 'P18-R4', 'P18-R5',
      'P18-R6', 'P18-LEDGER', 'P18-R7',
      'P19-A', 'P19-B', 'P20-A', 'P20-A-R1', 'P20-A-R2', 'P20-A-R2-R1', 'P20-A-R3', 'P20-B', 'P20-C', 'P20-D', 'P20-E', 'P20-F',
      'P20-G', 'P20-H', 'P20-I', 'P20-J', 'P20-K', 'P20-L', 'P20-M', 'P20-N', 'P20-N-R1', 'P20-N-R2', 'P20-O', 'P20-P', 'P20-Q', 'P20-R', 'P20-S', 'P20-S-R1', 'P20-S-R1-R1', 'P20-S-R2', 'P20-T', 'P20-U', 'P20-U-R1', 'P20-W', 'P20-W-R1', 'P21-A', 'P21-B', 'P21-C', 'P21-C1', 'P21-D', 'P21-F', 'P22-A', 'P23-A', 'P23-B', 'P24-A', 'P25-A', 'P25-B', 'P25-C', 'P25-D', 'P25-E', 'P26-A', 'P27-A',
      'P23-C', 'P23-D', 'P25-F',
      'P28-A', 'P28-A-R1', 'P28-B', 'P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4', 'P28-D', 'P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1', 'P28-F', 'P28-F-R1', 'P28-F-R2', 'P28-F-R2-R1', 'P28-F-R3', 'P28-F-R3-R1', 'P28-F-R3-R2', 'P28-F-R3-R3', 'P28-F-R3-R3-R1', 'P28-F-R4', 'P28-F-R4-R1', 'P28-F-R4-R1-R1', 'P28-F-R4-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1-R1-R1', 'P28-F-R6-R2', 'P28-F-R6-R3', 'P28-F-R6-R3-R1',
      'P29-A', 'P29-B', 'P29-C', 'P29-D', 'P29-E', 'P29-F', 'P29-F2', 'P29-F3', 'P29-F4', 'P29-G', 'P29-H', 'P29-I', 'P29-J', 'P29-K', 'P29-L', 'P29-M', 'P29-N', 'P29-M2', 'P29-O', 'P29-O-R1', 'P29-O1-R1', 'P29-O1-R2', 'P29-O2', 'P29-Q', 'P29-R', 'P29-S', 'P29-T', 'P29-U', 'P29-V', 'P29-W', 'P29-W-R1', 'P29-W-R2', 'P29-X', 'P29-Y', 'P29-Z',
      'P29-AA', 'P29-AB', 'P29-AB-R1', 'P29-AB-R2', 'P29-AB-R2-R1', 'P30-A', 'P30-B', 'P30-C', 'P41-A', 'P44-A', 'P44-B', 'P44-C', 'P44-D',
      'CR-92', 'CR-93', 'CR-94', 'CR-95', 'CR-96', 'CR-106', 'CR-107', 'CR-109', 'CR-110', 'CR-111', 'CR-116', 'CM-2',
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
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const newPartIds = [
      'P41-B-R1', 'P42-A', 'P42-A-R1',
      'P16-A', 'P16-B', 'P16-C', 'P17-A', 'P17-B', 'P17-C',
      'P18-R0', 'P18-R1', 'P18-R2', 'P18-R3', 'P18-R4', 'P18-R5',
      'P18-R6', 'P18-LEDGER', 'P18-R7',
      'P19-A', 'P19-B', 'P20-A', 'P20-A-R1', 'P20-A-R2', 'P20-A-R2-R1', 'P20-A-R3', 'P20-B', 'P20-C', 'P20-D', 'P20-E', 'P20-F',
      'P20-G', 'P20-H', 'P20-I', 'P20-J', 'P20-K', 'P20-L', 'P20-M', 'P20-N', 'P20-N-R1', 'P20-N-R2', 'P20-O', 'P20-P', 'P20-Q', 'P20-R', 'P20-S', 'P20-S-R1', 'P20-S-R1-R1', 'P20-T', 'P20-U', 'P20-U-R1', 'P21-A', 'P21-B', 'P21-C', 'P21-C1', 'P21-D', 'P22-A', 'P23-A', 'P23-B', 'P24-A', 'P25-A', 'P25-B', 'P25-C', 'P25-D', 'P25-E', 'P26-A',
      'P23-C', 'P23-D', 'P25-F',
      'P29-A', 'P29-B', 'P29-C', 'P29-D', 'P29-E', 'P29-F', 'P29-F2', 'P29-F3', 'P29-F4', 'P29-G', 'P29-H', 'P29-I', 'P29-J', 'P29-K', 'P29-L', 'P29-M', 'P29-N', 'P29-M2', 'P29-O', 'P29-O-R1', 'P29-O1-R1', 'P29-O1-R2', 'P29-O2', 'P29-Q', 'P29-R', 'P29-S', 'P29-T', 'P29-U', 'P29-V', 'P29-W', 'P29-W-R1', 'P29-W-R2', 'P29-X', 'P29-Y', 'P29-Z',
      'P29-AA', 'P29-AB', 'P29-AB-R1', 'P29-AB-R2', 'P29-AB-R2-R1', 'P30-A', 'P30-B', 'P30-C', 'P41-A', 'P42-A', 'P42-A-R1', 'P43-F', 'P43-F-R1', 'P43-G', 'P43-G-R1', 'P44-A', 'P44-B', 'P44-C', 'P44-D',
    ];
    const movedEntityPartIds = [
      'P27-A',
      'P28-A', 'P28-A-R1', 'P28-B', 'P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4', 'P28-D', 'P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1', 'P28-F', 'P28-F-R1', 'P28-F-R2', 'P28-F-R2-R1', 'P28-F-R3', 'P28-F-R3-R1', 'P28-F-R3-R2', 'P28-F-R3-R3', 'P28-F-R3-R3-R1', 'P28-F-R4', 'P28-F-R4-R1', 'P28-F-R4-R1-R1', 'P28-F-R4-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1-R1-R1', 'P28-F-R6-R2', 'P28-F-R6-R3', 'P28-F-R6-R3-R1',
    ];

    for (const id of newPartIds) {
      expect(dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
      expect(promptLog.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
    }
    for (const id of movedEntityPartIds) {
      expect(independentEntities.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
      expect(promptLog.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P41-B |')))
      .toContain('Revised by P41-B-R1');
  });

  it('keeps roadmap statuses, owner gates, and prompt-log scope aligned', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const plannedPartIds = [
      'P31-A', 'P31-B', 'P31-C', 'P31-D',
      'P33-A', 'P33-B', 'P33-C',
      'P34-A', 'P34-B', 'P34-C',
      'P35-A', 'P35-B', 'P35-C',
      'P36-A', 'P36-B', 'P36-C', 'P36-D',
      'P37-A', 'P37-B', 'P37-C',
      'P38-A', 'P38-B', 'P38-C',
      'P39-A', 'P39-B', 'P39-C', 'P39-D', 'P39-E', 'P39-F', 'P39-G', 'P39-H',
      'P40-A', 'P40-B',
    ];

    for (const id of plannedPartIds) {
      const dashboardRows = dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`));
      expect(dashboardRows).toHaveLength(1);
      expect(dashboardRows[0]).toContain('| Planned |');
      expect(roadmap.split('\n').filter((line) => line.includes(`${id} —`))).toHaveLength(1);
      expect(promptLog.split('\n').find((line) => line.startsWith(`| ${id} |`))).toBeUndefined();
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P33-C |')))
      .toContain('iOS distribution');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P35-C |')))
      .toContain('P35-B Go');
    for (const phase of [31, 33, 34, 35, 36, 37, 38, 39, 40]) {
      expect(roadmap).toContain(`**P${phase} —`);
    }
  });

  it('uses PN notation outside documented historical commit-subject exclusions', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const progressBlock = dashboard.match(/```text\n([\s\S]*?)\n```/)?.[1] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const dashboardIds = dashboard.split('\n')
      .filter((line) => /^\| P\d+(?:-[A-Za-z0-9-]+)* \|/.test(line))
      .map((line) => line.split('|')[1]?.trim() ?? '');
    const bars = progressBlock.split('\n').slice(1);
    const roadmapLabels = [...roadmap.matchAll(/^\d+\. \*\*(P\d+) —/gm)].map(([, id]) => id);
    const branchLabels = branchIndex.split('\n')
      .filter((line) => /^\| P\d+ \|/.test(line))
      .map((line) => line.split('|')[1]?.trim() ?? '');

    expect(dashboardIds).toContain('P1');
    expect(dashboardIds.every((id) => /^P\d+(?:-[A-Za-z0-9-]+)*$/.test(id))).toBe(true);
    expect(bars.every((line) => /^(?:P\d+|Overall progress)\s/.test(line))).toBe(true);
    expect(roadmapLabels).toContain('P31');
    expect(branchLabels).toEqual([
      ...Array.from({ length: 30 }, (_, index) => `P${index + 1}`),
      'P32', 'P41', 'P42', 'P43', 'P44',
    ]);

    let inSubjectMap = false;
    const outsideOriginalSubjects = ledger.split('\n').map((line) => {
      if (line.startsWith('### Commit label map')) inSubjectMap = true;
      if (line.startsWith('### Original prompt records')) inSubjectMap = false;
      if (inSubjectMap && line.startsWith('|')) {
        const cells = line.split('|');
        cells[2] = '';
        return cells.join('|');
      }
      return line;
    }).join('\n')
      .replace(/docs: align Phase 29\s+progress counter/g, '')
      .replace(/https?:\/\/\S+/g, '');
    expect(outsideOriginalSubjects).not.toMatch(/\bPhases?\s+\d+\b|\bPhase-\d+\b/);
    expect(ledger).toContain('docs: align Phase 29');
    expect(ledger).toContain('Original subject (`git log --format=%s`)');
  });

  it('documents every identifier prefix used in the dashboard and register', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const glossary = ledger.split('### Glossary')[1]?.split('\n## 2. Status dashboard')[0] ?? '';
    const identifiers = `${dashboard}\n${register}`.match(
      /\b(?:P\d+(?:-[A-Za-z0-9]+)*|CR-\d+|FX-[A-Za-z0-9-]+|CH-\d+|CM-\d+|DEC-[A-Za-z0-9-]+|[NAX]\d+)\b/g,
    ) ?? [];
    const prefixes = new Set<string>();

    for (const id of identifiers) {
      if (id.startsWith('P')) prefixes.add('P');
      if (/-R\d+/.test(id)) prefixes.add('-R<n>');
      for (const prefix of ['CR', 'FX', 'CH', 'CM', 'DEC', 'N', 'X', 'A']) {
        if (id.startsWith(`${prefix}-`) || new RegExp(`^${prefix}\\d`).test(id)) prefixes.add(prefix);
      }
    }

    for (const prefix of prefixes) {
      expect(glossary).toContain(`| \`${prefix}\` |`);
    }
    expect(glossary).toContain('| `P<n>-<part>` |');
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
      /^\| P\d+(?:-[A-Za-z0-9-]+)* \|/.test(line),
    );
    const rowIds = rows.map((row) => row.split('|')[1]?.trim());
    const counts = new Map<number, { done: number; total: number }>();
    const emptySlots = new Set([27, 28, 32]);

    expect(rowIds).toHaveLength(new Set(rowIds).size);
    for (const row of rows) {
      const cells = row.split('|').map((cell) => cell.trim());
      const id = cells[1];
      const status = cells[3];
      if (!id || !status) continue;
      const phaseMatch = id.match(/^P(\d+)(?:-|$)/);
      if (!phaseMatch) continue;
      const phase = Number(phaseMatch[1]);
      if (emptySlots.has(phase) || status.startsWith('Empty (reserved)')) {
        continue;
      }
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
      ...Array.from({ length: lastPhase }, (_, index): [string, number, number] | null => {
        const phase = index + 1;
        if (emptySlots.has(phase)) return null;
        const count = counts.get(phase) ?? { done: 0, total: 0 };
        return [`P${phase}`, count.done, count.total];
      }).filter((item): item is [string, number, number] => item !== null),
    ];
    const lines = progressBlock.split('\n');
    expect(lines).toHaveLength(expected.length);

    expected.forEach(([name, completed, partCount], index) => {
      const match = lines[index]?.match(/^(Overall progress|P\d+)\s+([█░]{10})\s+(\d+)%\s+\((\d+)\/(\d+)\)$/);
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
    for (const phase of [7, 20, 21, 22, 23, 25, 30, 31, 43, 44]) {
      const count = counts.get(phase);
      expect(count?.total).toBeGreaterThan(0);
      if (phase === 7) {
        expect(count?.done).toBe(0);
        expect(count?.total).toBe(4);
      } else if (phase === 20) {
        expect(count?.done).toBe(50);
        expect(count?.total).toBe(50);
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2 |')))
          .toContain('Revised by P20-A-R2-R1 and P20-A-R3');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R3 |')))
          .toContain('| Done; Revised by P20-A-R3-R1 |');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2-R1 |')))
          .toContain('| Done |');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1 |')))
          .toContain('Done; Revised by P20-S-R1-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1-R1 |')))
          .toContain('| Done |');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Z |')))
          .toContain('Revised by P20-Z-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Z-R1 |')))
          .toContain('| Done |');
      } else if (phase === 21) {
        expect(count?.done).toBe(8);
        expect(count?.total).toBe(8);
      } else if (phase === 29) {
        expect(count?.done).toBe(42);
        expect(count?.total).toBe(43);
        expect(dashboard.split('\n').find((line) => line.startsWith('| P29-U |')))
          .toContain('Revised by P29-U-R1');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P29-U-R1 |')))
          .toContain('| Planned |');
      } else if (phase === 31) {
        expect(count?.done).toBe(0);
        expect(count?.total).toBe(4);
      } else if (phase === 43) {
        expect(count?.done).toBe(6);
        expect(count?.total).toBe(7);
      } else if (phase === 22) {
        expect(count?.done).toBe(2);
        expect(count?.total).toBe(2);
      } else if (phase === 44) {
        expect(count?.done).toBe(0);
        expect(count?.total).toBe(4);
      } else {
        expect(count?.done).toBe(count?.total);
      }
    }
  });

  it('keeps the phase branch index aligned with dashboard subtask counts', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const index = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const counts = new Map<number, number>();
    const emptySlots = new Set([27, 28, 32]);
    for (const line of dashboard.split('\n')) {
      const id = line.split('|')[1]?.trim();
      const phase = id?.match(/^P(\d+)(?:-|$)/);
      if (phase && !emptySlots.has(Number(phase[1]))) {
        counts.set(Number(phase[1]), (counts.get(Number(phase[1])) ?? 0) + 1);
      }
    }

    const rows = index.split('\n').filter((line) => /^\| P\d+ \|/.test(line));
    expect(rows).toHaveLength(35);
    for (const line of rows) {
      const [, phase, branch, tag, commit, count] = line.split('|').map((cell) => cell.trim().replaceAll('`', ''));
      const number = Number(phase?.match(/^P(\d+)$/)?.[1]);
      if (number === 7) {
        expect(branch).toBe('phase/07-cloud-backup');
        expect(tag).toBe('—');
        expect(commit).toBe('—');
        expect(Number(count)).toBe(4);
        continue;
      }
      if (number === 41) {
        expect(branch).toBe('phase/41-types-frequency-completion');
        expect(tag).toBe('—');
        expect(commit).toBe('—');
        expect(Number(count)).toBe(5);
        continue;
      }
      if (number === 44) {
        expect(branch).toBe('phase/44-spending-heatmap');
        expect(tag).toBe('—');
        expect(commit).toBe('—');
        expect(Number(count)).toBe(4);
        continue;
      }
      if (number === 42) {
        expect(branch).toBe('phase/42-owner-decision-reconciliation');
        expect(tag).toBe('—');
        expect(commit).toBe('15c517573ab892f8c26e2e9722669e389f8dd98f');
        expect(Number(count)).toBe(2);
        continue;
      }
      if (number === 43) {
        expect(branch).toBe('phase/43-lifecycle-and-transaction-planning');
        expect(tag).toBe('—');
        expect(commit).toBe('—');
        expect(Number(count)).toBe(7);
        continue;
      }
      if (emptySlots.has(number)) {
        expect(branch).toContain('Empty (reserved)');
        expect(Number(count)).toBe(0);
        if (number === 27) {
          expect(branch).toContain('cleanup (historical branch name: phase/27-cleanup)');
          expect(tag).toBe('phase-27-complete');
          expect(commit).toMatch(/^[0-9a-f]{40}$/);
        } else if (number === 28) {
          expect(branch).toContain('qa-and-release (historical branch name: phase/28-qa-and-release)');
          expect(tag).toBe('phase-28-complete');
          expect(commit).toMatch(/^[0-9a-f]{40}$/);
        } else if (number === 32) {
          expect(tag).toBe('—');
          expect(commit).toBe('—');
        }
        continue;
      }
      const paddedPhase = String(number).padStart(2, '0');
      expect(branch).toMatch(new RegExp(`^phase/${paddedPhase}-[a-z0-9-]+$`));
      expect(tag).toBe(`phase-${paddedPhase}-complete`);
      expect(commit).toMatch(/^[0-9a-f]{40}$/);
      expect(Number(count)).toBe(counts.get(number));
    }
  });

  it('records the unchanged FX/CH IDs, CR-4 through CR-111 and current phase work', () => {
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
      'CR-88', 'CR-89', 'CR-90', 'CR-91', 'CR-92', 'CR-93', 'CR-94', 'CR-95', 'CR-96', 'CR-97', 'CR-106', 'CR-107', 'CR-108', 'CR-109', 'CR-110', 'CR-111', 'CM-2',
    ]) {
      expect(`${dashboard}\n${register}`).toContain(id);
    }
    expect(promptLog).toContain('| P18-LEDGER |');
    expect(promptLog).toContain('| P19-C |');
    expect(promptLog).toContain('| P28-F-R6 |');
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

  it('marks CR-107 deliverables complete in the dashboard, prompt log, and register', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const registerRows = register.split('\n').filter((line) => line.startsWith('| CR-107 |'));
    const promptRows = promptLog.split('\n').filter((line) => line.startsWith('| CR-107 |'));

    expect(dashboard.split('\n').find((line) => line.startsWith('| P22-A |')))
      .toContain('Revised by P22-A-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P22-A-R1 |'))).toContain('| Done |');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-F |')))
      .toContain('P28-F-R5');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-F-R5 |'))).toContain('| Done |');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-G |'))).toContain('| Done |');
    expect(registerRows).toHaveLength(1);
    expect(registerRows[0]).toContain('| Done |');
    expect(promptRows).toHaveLength(1);
  });

  it('tracks completed P20-M through P20-U while preserving P20-L and P21-D', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
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
      .toContain('Done; Revised by P20-N-R1 and P20-N-R3');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-N-R1 |')))
      .toContain('| Done; Revised by P20-N-R2 |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-N-R2 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-N-R3 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-O |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-P |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Q |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-R |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S |')))
          .toContain('| Done; Revised by P20-S-R1, P20-S-R1-R1, P20-S-R2, P20-S-R2-R1 and P20-S-R2-R2 |');
        expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R2 |')))
          .toContain('| Done; Revised by P20-S-R2-R1 and P20-S-R2-R2 | Searchable shared Dropdown');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1 |')))
      .toContain('Done; Revised by P20-S-R1-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-S-R1-R1 |')))
      .toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-T |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-U |'))).toContain('Done; Revised by P20-U-R1');
    for (const id of ['CR-27', 'CR-28', 'CR-31']) {
      expect(statusFor(id)).toBe('Done');
    }
    expect(statusFor('CR-29')).toBe('Done');
    for (const id of ['CR-47', 'CR-48', 'CR-49', 'CR-50', 'CR-51', 'CR-52', 'CR-53', 'CR-54', 'CR-55']) {
      expect(statusFor(id)).toBe('Done');
    }
    expect(statusFor('CR-56')).toBe('Done');
    expect(statusFor('CR-116')).toBe('Done as P20-S-R2; PR integration recorded by P20-S-R2-R1');
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
      'P26-A', 'P29-AA', 'P29-AB', 'P29-AB-R1', 'P29-AB-R2', 'P29-AB-R2-R1',
    ]) {
      expect(dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
    }
    for (const id of [
      'P27-A', 'P28-A', 'P28-A-R1', 'P28-B', 'P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4', 'P28-D', 'P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1',
    ]) {
      expect(independentEntities.split('\n').filter((line) => line.startsWith(`| ${id} |`))).toHaveLength(1);
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P26-A |'))).toContain('| Done');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P27-A |'))).toContain('| Done');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-A |'))).toContain('Revised by P28-A-R1');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-C |'))).toContain('Revised by P28-C-R4 and earlier revisions');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-A-R1 |'))).toContain('| Done');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-C-R1 |'))).toContain('| Done');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-C-R2 |'))).toContain('| Done');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-C-R3 |'))).toContain('| Done');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-C-R4 |'))).toContain('| Done');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-E |'))).toContain('Revised by P28-E-R1, P28-E-R2, P28-E-R3, P28-E-R4, P28-E-R5 and P28-E-R5-R1');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-E-R1 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R1 |'))).toContain('| Done;');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-E-R3 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R3 |'))).toContain('| Done;');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-E-R4 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R4 |'))).toContain('| Done;');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-E-R5 |'))).toContain('| Done; Revised by P28-E-R5-R1 |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R5 |'))).toContain('| Done;');
    expect(independentEntities.split('\n').find((line) => line.startsWith('| P28-E-R5-R1 |'))).toContain('| Done |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P28-E-R5-R1 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-AB |'))).toContain('Revised by P29-AB-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-AB-R1 |'))).toContain('| Done; Revised by P29-AB-R2 |');
    expect(promptLog.split('\n').find((line) => line.startsWith('| P29-AB-R1 |'))).toContain('| Done;');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A |'))).toContain('Revised by P20-A-R1; Revised by P20-A-R2');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R2 |')))
      .toContain('Revised by P20-A-R2-R1 and P20-A-R3');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-A-R3 |')))
      .toContain('| Done; Revised by P20-A-R3-R1 |');
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
    expect(ledger).toContain('Revised by P28-B');
    expect(ledger).toContain('P30 — Release 2 stabilization');
    const release2Roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    expect(release2Roadmap).toContain('P30-A — Failing persistence/restart tests');
    expect(release2Roadmap).toContain('P30-B — Verified fallback authority markers');
    expect(release2Roadmap).toContain('P30-C — Memo-input/cache source guard');
    expect(release2Roadmap).not.toContain('[placeholder]');
    for (const id of [
      'P29-B', 'P29-C', 'P29-D', 'P29-E', 'P29-F', 'P29-F2', 'P29-F3', 'P29-F4', 'P29-G', 'P29-H', 'P29-I', 'P29-J', 'P29-K', 'P29-L', 'P29-N', 'P29-M2', 'P29-R', 'P29-S', 'P29-T', 'P29-V', 'P29-X', 'P29-Y', 'P29-Z', 'P29-AA',
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
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-Q |')))
      .toContain('Done; Revised by P29-Q-R1');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-Q-R1 |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-R |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-O2 |'))).toContain('| Cancelled by owner |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-S |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-T |'))).toContain('| Done |');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P29-U |'))).toMatch(/\|\s*Done(?:;\s*Revised by P29-U-R1)?\s*\|/);
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

  it('records searchable Dropdown PR integration on the revised task row', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const originalRow = dashboard.split('\n').find((line) => line.startsWith('| P20-S-R2 |'));
    const revisionRow = dashboard.split('\n').find((line) => line.startsWith('| P20-S-R2-R1 |'));
    const registerRow = register.split('\n').find((line) => line.startsWith('| P20-S-R2-R1 |'));
    const phaseRow = branchIndex.split('\n').find((line) => line.startsWith('| P20 |'));

    expect(originalRow).toContain('Done; Revised by P20-S-R2-R1');
    expect(revisionRow).toContain('| Done |');
    expect(revisionRow).toContain('Task PR #164');
    expect(revisionRow).toContain('phase PR #165');
    expect(registerRow).toContain('185a5ea125f64ac104344f00ad013d68cdb7a946');
    expect(registerRow).toContain('6b50a1d');
    expect(phaseRow).toMatch(/\|\s*(?:43|44|45|46|47|48|49|50)\s*\|/);
    expect(ledger).toMatch(/Overall progress ████████░░ (?:79|80)% \((?:158\/200|159\/201|160\/202|161\/203|162\/204|163\/205|163\/207|164\/207|165\/208)\)/);
    expect(ledger).toMatch(/P20\s+██████████ (?:100%|98%) \((?:43\/43|44\/44|45\/45|46\/46|47\/47|48\/48|48\/49|49\/49|50\/50)\)/);
    expect(status).toContain('P20-S-R2-R1 records the verified');
  });

  it('records P20-W task/phase integration and the D3 schema ownership decision', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const originalRow = dashboard.split('\n').find((line) => line.startsWith('| P20-W |'));
    const revisionRow = dashboard.split('\n').find((line) => line.startsWith('| P20-W-R1 |'));
    const registerRow = register.split('\n').find((line) => line.startsWith('| P20-W-R1 |'));
    const phaseRow = branchIndex.split('\n').find((line) => line.startsWith('| P20 |'));

    expect(originalRow).toContain('Done; Revised by P20-W-R1 and P20-W-R2');
    expect(originalRow).toContain('D3 is authorized: widen earned-income category to a trimmed nonempty string up to 60 characters');
    expect(originalRow).toContain('Owner decision DEC-P20W-D3-SCHEMA24 assigns schema v24 to P20-W and replans P36-A/B to v25');
    expect(originalRow).toContain('implementation `f2541fd` adds custom earned-income categories');
    expect(originalRow).toContain('PR #182 merged into `phase/20-budget`');
    expect(readFileSync(join(process.cwd(), 'docs/history/entity-history-map.md'), 'utf8')).toContain('Every number from');
    expect(readFileSync(join(process.cwd(), 'docs/history/entity-history-map.md'), 'utf8')).toContain('#39, which is a closed, unmerged PR');
    expect(originalRow).toContain('owner-supplied Gate 4 exit 1 (20/21 checks, six SDK 57 patch mismatches; owner-approved cleanup exception)');
    expect(revisionRow).toContain('| Done |');
    expect(revisionRow).toContain('task PR #174');
    expect(revisionRow).toContain('419a37b07e6853b3c683d22ec243ea58223514c1');
    expect(revisionRow).toContain('phase PR #175');
    expect(revisionRow).toContain('9e47856f20848e03ac6a4b8e699f47c387d08161');
    expect(registerRow).toContain('CM-2 synchronized local `develop`');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| P20-W-R1 |'))).toHaveLength(1);
    expect(phaseRow).toMatch(/\|\s*(?:43|44|45|46|47|48|49|50)\s*\|/);
    expect(ledger).toMatch(/Overall progress ████████░░ (?:79|80)% \((?:158\/200|159\/201|160\/202|161\/203|162\/204|163\/205|163\/207|164\/207|165\/208)\)/);
    expect(ledger).toMatch(/P20\s+██████████ (?:100%|98%) \((?:43\/43|44\/44|45\/45|46\/46|47\/47|48\/48|48\/49|49\/49|50\/50)\)/);
    expect(status).toContain('P20-W-R1 records task PR #174 and phase PR #175');
    expect(openItems).toContain('STOP GATE RESOLVED (DEC-P20W-D3-SCHEMA24');
    expect(openItems).toContain('O69–O72 remain Not run');
  });

  it('preserves every P20-S revision in its parent and adds the next correction row', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const originalRow = dashboard.split('\n').find((line) => line.startsWith('| P20-S |'));
    const correctionRow = dashboard.split('\n').find((line) => line.startsWith('| P20-S-R2-R2 |'));

    expect(originalRow).toContain('P20-S-R2, P20-S-R2-R1 and P20-S-R2-R2');
    expect(correctionRow).toContain('| Done |');
    expect(correctionRow).toContain('retain the P20-S-R2 revision entry');
  });

  it('restructures independent entities, empty slots, and enforces R7 slot-filling rules', () => {
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const agents = readFileSync(join(process.cwd(), 'AGENTS.md'), 'utf8');
    const rules = readFileSync(join(process.cwd(), 'docs/memory/rules.md'), 'utf8');
    const placement = readFileSync(join(process.cwd(), 'docs/memory/work-placement.md'), 'utf8');
    const standingRules = ledger.split('## 3. Standing rules')[1]?.split('## 4. Architecture and decisions')[0] ?? '';

    // Independent entities section and subsections
    expect(ledger).toContain('## 13. Independent entities');
    for (const subsection of [
      '### cleanup',
      '### qa-and-release',
      '### schema-migration',
      '### documentation',
      '### Cancelled / unassigned',
    ]) {
      expect(independentEntities).toContain(subsection);
    }

    // Empty slots in dashboard
    for (const phase of [27, 28, 32]) {
      const row = dashboard.split('\n').find((line) => line.startsWith(`| P${phase} |`));
      expect(row).toBeDefined();
      expect(row).toContain('Empty (reserved)');
    }

    // Empty slots in branch index
    for (const phase of [27, 28, 32]) {
      const row = branchIndex.split('\n').find((line) => line.startsWith(`| P${phase} |`));
      expect(row).toBeDefined();
      expect(row).toContain('Empty (reserved)');
    }
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P7 |'))).toContain('phase/07-cloud-backup');
    expect(branchIndex).toContain('schema-migration');
    expect(branchIndex).toContain('historical branch name: `phase/07-schema-migration`');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P27 |'))).toContain('cleanup');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P27 |'))).toContain('historical branch name: `phase/27-cleanup`');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P28 |'))).toContain('qa-and-release');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P28 |'))).toContain('historical branch name: `phase/28-qa-and-release`');

    // Independent entity branch index table
    expect(branchIndex).toContain('### Independent entity branch index');
    for (const entity of ['cleanup', 'qa-and-release', 'schema-migration', 'documentation']) {
      const row = branchIndex.split('\n').find((line) => line.includes(`\`${entity}\``));
      expect(row).toBeDefined();
    }

    // Every moved row keeps original ID, has Previously: P<old> and Placement line, appears exactly once
    const movedIds = [
      'P7',
      'P27-A',
      'P28-A', 'P28-A-R1', 'P28-B', 'P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4', 'P28-D',
      'P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1',
      'P28-F', 'P28-F-R1', 'P28-F-R2', 'P28-F-R2-R1', 'P28-F-R3', 'P28-F-R3-R1', 'P28-F-R3-R2',
      'P28-F-R3-R3', 'P28-F-R3-R3-R1', 'P28-F-R4', 'P28-F-R4-R1', 'P28-F-R4-R1-R1', 'P28-F-R4-R1-R1-R1',
      'P28-F-R4-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1-R1',
      'P28-F-R4-R1-R1-R1-R1-R1-R1-R1', 'P28-F-R5', 'P28-F-R6', 'P28-F-R6-R1', 'P28-F-R6-R2',
      'P28-F-R6-R3', 'P28-F-R6-R3-R1', 'P28-G',
      'P32-A', 'P32-B', 'P32-C',
    ];
    for (const id of movedIds) {
      const matches = independentEntities.split('\n').filter((line) => line.startsWith(`| ${id} |`));
      expect(matches).toHaveLength(1);
      expect(matches[0]).toContain('Previously:');
      expect(matches[0]).toMatch(/Placement: rule [1-5];/);
      expect(dashboard.split('\n').filter((line) => line.startsWith(`| ${id} |`) && !line.includes('Empty (reserved)'))).toHaveLength(0);
    }

    // R7 in AGENTS.md, rules.md, PROGRESS.md, work-placement.md with exact adjacencies
    for (const doc of [agents, rules, standingRules, placement]) {
      const norm = doc.replace(/\s+/g, ' ');
      expect(norm).toMatch(/R7\s*[—–-]\s*Slot[- ]filling/i);
      expect(norm).toContain('P7 for backup & security (P6) or investments (P8)');
      expect(norm).toContain('P27 for accessibility & performance (P26) work');
      expect(norm).toContain('P28 for income recurrence / Budget income (P29) work');
      expect(norm).toContain('P32 for project health/community (P31) or widgets (P33) work');
    }
    expect(dashboard.split('\n').find((line) => line.startsWith('| P7-A |'))).toBeDefined();
    expect(dashboard.split('\n').find((line) => line.startsWith('| P27 |'))).toContain('adjacent accessibility & performance (P26) work per R7');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P28 |'))).toContain('adjacent income recurrence / Budget income (P29) work per R7');
    expect(dashboard.split('\n').find((line) => line.startsWith('| P32 |'))).toContain('adjacent project health/community (P31) or widgets (P33) work per R7');
  });

  it('enforces entity naming in register, verification matrix and prompt log, and maintains revision chain integrity', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const crRegister = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const verificationMatrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');

    // (a) Prompt log rows must not have P27/P28/P32 in Phase column
    const promptLogRows = promptLog.split('\n').filter((l) => l.startsWith('|') && !l.startsWith('| ID') && !l.startsWith('|---'));
    for (const row of promptLogRows) {
      const phaseCol = row.split('|')[2]?.trim();
      expect(phaseCol).not.toMatch(/^(?:P27|P28|P32)$/);
    }

    // CR register rows must not have P28 in phase column or stray P28 rows
    const crRows = crRegister.split('\n').filter((l) => l.startsWith('|') && !l.startsWith('| ID') && !l.startsWith('|---'));
    for (const row of crRows) {
      const parts = row.split('|').map((s) => s.trim());
      if (parts.length > 3) {
        expect(parts[2]).not.toMatch(/^(?:P27|P28|P32)$/);
      }
    }

    // CR-106 must not be in the Section 2 dashboard
    expect(dashboard.split('\n').filter((l) => l.startsWith('| CR-106 |'))).toHaveLength(0);

    // Section 10 verification matrix must not name legacy P28/P27 phases without entity attribution
    expect(verificationMatrix).not.toContain('| P28-A QA and release |');
    expect(verificationMatrix).not.toContain('| P28-B release metadata |');
    expect(verificationMatrix).not.toContain('| P28-C release organization/build management |');
    expect(verificationMatrix).not.toContain('| P27-A cleanup |');
    expect(verificationMatrix).toContain('cleanup: P27-A (Previously: P27-A)');
    expect(verificationMatrix).toContain('qa-and-release: P28-A (Previously: P28-A)');
    expect(verificationMatrix).toContain('qa-and-release: P28-B (Previously: P28-B)');
    expect(verificationMatrix).toContain('documentation: P28-C (Previously: P28-C)');

    // (b) Revision chains must not straddle independent entities
    const entitySubsections = independentEntities.split(/\n###\s+/).slice(1);
    const entityMap = new Map<string, string>();
    for (const sub of entitySubsections) {
      const entityName = sub.split('\n')[0].trim();
      const rows = sub.split('\n').filter((l) => l.startsWith('|') && !l.startsWith('| ID') && !l.startsWith('|---'));
      for (const row of rows) {
        const id = row.split('|')[1]?.trim();
        if (id) {
          entityMap.set(id, entityName);
        }
      }
    }

    // Every revision in P28-F* belongs in qa-and-release
    const p28fParts = [
      'P28-F', 'P28-F-R1', 'P28-F-R2', 'P28-F-R2-R1', 'P28-F-R3', 'P28-F-R3-R1', 'P28-F-R3-R2',
      'P28-F-R3-R3', 'P28-F-R3-R3-R1', 'P28-F-R4', 'P28-F-R4-R1', 'P28-F-R4-R1-R1', 'P28-F-R4-R1-R1-R1',
      'P28-F-R4-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1', 'P28-F-R4-R1-R1-R1-R1-R1-R1',
      'P28-F-R4-R1-R1-R1-R1-R1-R1-R1', 'P28-F-R5', 'P28-F-R6', 'P28-F-R6-R1', 'P28-F-R6-R2',
      'P28-F-R6-R3', 'P28-F-R6-R3-R1', 'P28-F-R7',
    ];
    for (const part of p28fParts) {
      expect(entityMap.get(part)).toBe('qa-and-release');
    }

    // P28-C* belongs in documentation
    for (const part of ['P28-C', 'P28-C-R1', 'P28-C-R2', 'P28-C-R3', 'P28-C-R4']) {
      expect(entityMap.get(part)).toBe('documentation');
    }

    // P28-E* belongs in documentation
    for (const part of ['P28-E', 'P28-E-R1', 'P28-E-R2', 'P28-E-R3', 'P28-E-R4', 'P28-E-R5', 'P28-E-R5-R1']) {
      expect(entityMap.get(part)).toBe('documentation');
    }

    // (c) Docs-only rows outside P28 moved to documentation entity
    for (const crId of ['CR-106', 'CR-109', 'CR-113', 'CR-114']) {
      expect(entityMap.get(crId)).toBe('documentation');
    }

    // (d) History map deliverable committed and /tmp citations replaced
    const historyMapPath = join(process.cwd(), 'docs/history/entity-history-map.md');
    expect(existsSync(historyMapPath)).toBe(true);
    expect(readFileSync(historyMapPath, 'utf8').length).toBeGreaterThan(100);
    expect(ledger).not.toContain('/tmp/history_map.md');
    expect(status).not.toContain('/tmp/history_map.md');
    expect(openItems).not.toContain('/tmp/history_map.md');
    expect(independentEntities).toContain('docs/history/entity-history-map.md');

  });

  it('records CR-123 planned scope and fills P7 slot under Rule R7', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const placement = readFileSync(join(process.cwd(), 'docs/memory/work-placement.md'), 'utf8');

    expect(dashboard.split('\n').filter((line) => /^\| P7-[A-D] \|/.test(line))).toHaveLength(4);
    for (const [id, dependency] of [
      ['P7-A', 'Dependencies: none'],
      ['P7-B', 'Dependencies: P7-A'],
      ['P7-C', 'Dependencies: P7-B'],
      ['P7-D', 'Dependencies: P7-C'],
    ]) {
      const row = dashboard.split('\n').find((line) => line.startsWith(`| ${id} |`));
      expect(row).toBeDefined();
      expect(row).toContain('| Planned |');
      expect(row).toContain(dependency);
      expect(row).toContain('Evidence: not started');
      expect(row).toMatch(/Placement:\s+rule [1-5]/);
    }

    expect(promptLog.split('\n').find((line) => line.startsWith('| CR-123 |'))).toContain('P7');
    expect(register.split('\n').find((line) => line.startsWith('| CR-123 |'))).toBeDefined();
    expect(roadmap).toContain('**P7 — Cloud Backup (Google Drive)**');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P7 |'))).toContain('phase/07-cloud-backup');
    expect(status).toContain('P7-plan-cloud-backup');
    expect(openItems).toContain('Phase P7 Google Drive automated backup (planned)');
    expect(placement).toContain('phase/07-cloud-backup');
  });

  it('records P20-X Budget category and item sorting under Phase 20', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const verification = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');

    const p20x = dashboard.split('\n').find((line) => line.startsWith('| P20-X |'));
    expect(p20x).toBeDefined();
    expect(p20x).toMatch(/\| Done(?:; Revised by P20-X-R1)? \|/);
    expect(p20x).toContain('Implement sorting for Budget categories and items');
    expect(p20x).toMatch(/Placement:\s+rule [1-5]/);

    expect(promptLog.split('\n').find((line) => line.startsWith('| CR-125 |'))).toContain('P20-X');
    expect(register.split('\n').find((line) => line.startsWith('| CR-125 |'))).toBeDefined();
    expect(verification).toContain('### 2026-11-22 — P20-X Budget category and item sorting');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P20 |'))).toMatch(/\|\s*(?:43|44|45|46|47|48|49|50)\s*\|/);
    expect(checklist).toContain('| O75 |');
    expect(checklist).toContain('P20-X; owner-reported physical-device verification, 2026-11-22.');
    expect(status).toContain('P20-X');
    expect(openItems).toContain('P20-X Budget category and item sorting');
  });

  it('records P20-Y Budget payment date, multi-asset budget links, and limited expense categories under Phase 20', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const verification = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');

    const p20y = dashboard.split('\n').find((line) => line.startsWith('| P20-Y |'));
    expect(p20y).toBeDefined();
    expect(p20y).toMatch(/\| Done(?:; Revised by P20-Y-R1)? \|/);
    expect(p20y).toContain('Implement payment date when marking scheduled/budgeted items Paid');
    expect(p20y).toMatch(/Placement:\s+rule [1-5]/);

    expect(promptLog.split('\n').find((line) => line.startsWith('| CR-126 |'))).toContain('P20-Y');
    expect(register.split('\n').find((line) => line.startsWith('| CR-126 |'))).toBeDefined();
    expect(verification).toContain('### 2026-11-22 — P20-Y Budget payment date, multi-asset budget links, and limited expense categories');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P20 |'))).toMatch(/\|\s*(?:43|44|45|46|47|48|49|50)\s*\|/);
    expect(checklist).toContain('| O76 |');
    expect(checklist).toContain('P20-Y; owner-reported physical-device verification, 2026-11-22.');
    expect(status).toContain('P20-Y');
    expect(openItems).toContain('P20-Y Budget payment date, multi-asset budget links, and limited expense categories');
  });

  it('records owner-reported physical-device validation Pass for O75 and O76 under CR-127', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-127 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-127 |'))).toHaveLength(1);
    expect(checklist).toContain('| O75 |');
    expect(checklist).toContain('| O76 |');
    expect(checklist).toContain('| Pass | P20-X; owner-reported physical-device verification, 2026-11-22. |');
    expect(checklist).toContain('| Pass | P20-Y; owner-reported physical-device verification, 2026-11-22. |');
    expect(checklist).toContain('The owner reports O75 and O76 passed on 2026-11-22.');
    expect(status).toContain('O75 physical-device check validated Pass');
    expect(status).toContain('O76 physical-device check validated Pass');
    expect(openItems).toContain('O75 validated Pass by owner on 2026-11-22');
    expect(openItems).toContain('O76 validated Pass by owner on 2026-11-22');
  });

  it('records owner cancellation of Once-only frequency for investment plans or liabilities under CR-128', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-128 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-128 |'))).toHaveLength(1);
    expect(roadmap).toContain('Once-only frequency for investment plans and liabilities was evaluated and');
    expect(roadmap).toContain('cancelled by owner decision on 2026-11-22 (CR-128)');
    expect(openItems).toContain('Once-only frequency for investment plans or liabilities cancelled (2026-11-22)');
    expect(status).toContain('CR-128 (2026-11-22) — Once-only frequency for plans/liabilities cancelled by owner');
  });

  it('records P20-X-R1 removal of transaction form sorting and dropdown search title under CR-129', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-X |'))).toContain('| Done; Revised by P20-X-R1 |');
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P20-X-R1 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-129 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-129 |'))).toHaveLength(1);
    expect(matrix).toContain('P20-X-R1 Remove sorting from TransactionForm category dropdowns');
    expect(openItems).toContain('P20-X-R1 (CR-129)');
    expect(status).toContain('P20-X-R1 / CR-129');
  });

  it('records P28-F-R7 preparation of v1.3.0 release candidate under CR-130', () => {
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(independentEntities.split('\n').filter((line) => line.startsWith('| P28-F-R7 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-130 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-130 |'))).toHaveLength(1);
    expect(matrix).toContain('P28-F-R7 Prepare v1.3.0 release candidate');
    expect(openItems).toContain('P28-F-R7 (CR-130');
    expect(status).toContain('P28-F-R7 / CR-130');
  });

  it('records P43-B non-release tag deletion and release-only tag policy enforcement under CR-131', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');
    const agents = readFileSync(join(process.cwd(), 'AGENTS.md'), 'utf8');
    const rules = readFileSync(join(process.cwd(), 'docs/memory/rules.md'), 'utf8');
    const standingRules = ledger.split('## 3. Standing rules')[1]?.split('## 4. Architecture and decisions')[0] ?? '';

    expect(dashboard.split('\n').find((line) => line.startsWith('| P43-B |'))).toContain('| Done |');
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-131 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-131 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-131');
    expect(openItems).toContain('P43-B');
    expect(status).toContain('P43-B');

    // Tag rules: only vX.Y.Z release tags are maintained
    for (const doc of [agents, rules, standingRules]) {
      const norm = doc.replace(/\s+/g, ' ');
      expect(norm).toMatch(/Only `vX\.Y\.Z` release tags are maintained in the repository/i);
    }
  });

  it('records P20-Y-R1 linked transactions update on budget item rename under CR-132', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Y |'))).toContain('| Done; Revised by P20-Y-R1 |');
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P20-Y-R1 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-132 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-132 |'))).toHaveLength(1);
    expect(matrix).toContain('P20-Y-R1');
    expect(openItems).toContain('P20-Y-R1');
    expect(status).toContain('P20-Y-R1');
  });

  it('records P20-Y-R2 budget item rename reflection in transaction category item under CR-133', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Y-R1 |'))).toContain('| Done; Revised by P20-Y-R2 |');
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P20-Y-R2 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-133 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-133 |'))).toHaveLength(1);
    expect(matrix).toContain('P20-Y-R2');
    expect(openItems).toContain('P20-Y-R2');
    expect(status).toContain('P20-Y-R2');
  });

  it('records P20-Y-R3 budget item rename sync category only and preserve note under CR-134', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Y-R2 |'))).toContain('| Done; Revised by P20-Y-R3 |');
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P20-Y-R3 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-134 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-134 |'))).toHaveLength(1);
    expect(matrix).toContain('P20-Y-R3');
    expect(openItems).toContain('P20-Y-R3');
    expect(status).toContain('P20-Y-R3');
  });

  it('records CR-135 device check O77 and standing rule requiring physical-device checks for all features and fixes', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-135 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-135 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-135 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-135');
    expect(checklist).toContain('| O77 |');
    expect(checklist).toContain('Not run');
    expect(openItems).toContain('O77');
    expect(status).toContain('CR-135');

    const policyDocs = [
      'AGENTS.md',
      'docs/memory/rules.md',
      'docs/releases/README.md',
      'docs/releases/RELEASE_PROMPT.md',
      'docs/releases/release-config.md',
      'docs/releases/build-config.md',
      'docs/releases/device-test-checklist.md',
    ];
    const ruleSnippet = 'For any new feature, bug fix, behavior change, or revision that modifies user-facing behavior, data integrity, calculations, navigation, or forms, agents must add the corresponding physical-device verification check(s)';
    for (const p of policyDocs) {
      const doc = readFileSync(join(process.cwd(), p), 'utf8');
      expect(doc).toContain(ruleSnippet);
    }
  });

  it('records CR-136 device checklist rearrangement and published release checks rule', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-136 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-136 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-136 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-136');
    expect(checklist).toContain('## v1.3.0 device checks');
    expect(openItems).toContain('CR-136');
    expect(status).toContain('CR-136');

    const policyDocs = [
      'AGENTS.md',
      'docs/memory/rules.md',
      'docs/releases/README.md',
      'docs/releases/RELEASE_PROMPT.md',
      'docs/releases/release-config.md',
      'docs/releases/build-config.md',
      'docs/releases/device-test-checklist.md',
    ];
    const ruleSnippet = 'Once a release is published, move all checks verified for that specific version into its own `## vX.Y.Z device checks` section';
    for (const p of policyDocs) {
      const doc = readFileSync(join(process.cwd(), p), 'utf8');
      expect(doc).toContain(ruleSnippet);
    }
  });

  it('records CR-137 rule prohibiting app version assignment until release draft finalization', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-137 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-137 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-137 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-137');
    expect(checklist).toContain('TBD (unassigned until release draft finalization)');
    expect(openItems).toContain('CR-137');
    expect(status).toContain('CR-137');

    const policyDocs = [
      'AGENTS.md',
      'docs/memory/rules.md',
      'docs/releases/README.md',
      'docs/releases/RELEASE_PROMPT.md',
      'docs/releases/release-config.md',
      'docs/releases/build-config.md',
      'docs/releases/device-test-checklist.md',
    ];
    const ruleSnippet = 'Agents must never add, bump, or assign a specific application version number in the device checklist, metadata tables, package manifests, or anywhere in the repository until the owner explicitly decides to prepare a release candidate draft';
    for (const p of policyDocs) {
      const doc = readFileSync(join(process.cwd(), p), 'utf8');
      expect(doc).toContain(ruleSnippet);
    }
  });

  it('records P20-Y-R4 budget item rename preserve transaction note across all types under CR-138', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Y-R3 |'))).toContain('| Done; Revised by P20-Y-R4 |');
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P20-Y-R4 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-138 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-138 |'))).toHaveLength(1);
    expect(matrix).toContain('P20-Y-R4');
    expect(openItems).toContain('P20-Y-R4');
    expect(status).toContain('P20-Y-R4');
  });

  it('records P20-Y-R5 budget item rename preserve transaction name/note under CR-139', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(dashboard.split('\n').find((line) => line.startsWith('| P20-Y-R4 |'))).toContain('| Done; Revised by P20-Y-R5 |');
    expect(dashboard.split('\n').filter((line) => line.startsWith('| P20-Y-R5 |'))).toHaveLength(1);
    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-139 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-139 |'))).toHaveLength(1);
    expect(matrix).toContain('P20-Y-R5');
    expect(openItems).toContain('P20-Y-R5');
    expect(status).toContain('P20-Y-R5');
  });

  it('records CR-140 owner-reported physical-device validation Pass for O77', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-140 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-140 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-140 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-140');
    expect(checklist).toMatch(/\|\s*O77\s*\|[^|]+\|\s*Pass\s*\|/);
    expect(checklist).toContain('The owner reports O77 passed on 2026-11-23.');
    expect(openItems).toContain('O77');
    expect(status).toContain('CR-140');
  });

  it('records CR-141 reconciliation of completed v1.3.0 publication', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const releaseHistory = readFileSync(join(process.cwd(), 'docs/releases/release-history.md'), 'utf8');
    const releaseReadme = readFileSync(join(process.cwd(), 'docs/releases/README.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-141 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-141 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-141 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-141');
    expect(releaseHistory).toContain('| v1.3.0 | Android | `c2ec9414-ae63-44cc-b34a-0f67f6cb51cb` | android-apk | 4 | 2026-11-22 | Published; artifact verified against EAS (107,030,213 bytes) |');
    expect(releaseReadme).toContain('Publication completed; release/v1.3.0 merged');
    expect(openItems).toContain('CR-141');
    expect(openItems).toContain('P28-F-R7 Prepare and publish v1.3.0 release candidate (Done');
    expect(status).toContain('CR-141');
    expect(status).toContain('P28-F-R7 / CR-130 (2026-11-22) — Prepare and publish v1.3.0 release candidate.');
  });

  it('records CR-142 reconciliation of planned and unimplemented roadmap items', () => {
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-142 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-142 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-142 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-142');
    expect(openItems).toContain('CR-142');
    expect(openItems).toContain('P21-F (Done):** Emergency Fund target editing was completed');
    expect(openItems).toContain('P43-B (Done):** tag-cleanup scope');
    expect(openItems).toContain('Active Planned and Unimplemented Roadmap Items');
    expect(status).toContain('CR-142');
  });

  it('records CR-143 planned scope for P20-Z and P29-U-R1 under Rule R6', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const independentEntities = ledger.split('## 13. Independent entities')[1] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const branchIndex = ledger.split('## 12. Phase branch index')[1]?.split('## 13. Independent entities')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-143 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-143 |'))).toHaveLength(1);
    expect(independentEntities.split('\n').filter((line) => line.startsWith('| CR-143 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-143');

    const p20z = dashboard.split('\n').find((line) => line.startsWith('| P20-Z |'));
    expect(p20z).toBeDefined();
    expect(p20z).toMatch(/\| Done(?:; Revised by P20-Z-R1)? \|/);
    expect(p20z).toContain('Dynamic category filter alongside existing Budget sorting option');
    expect(p20z).toMatch(/Placement:\s+rule 4/);

    const p29u = dashboard.split('\n').find((line) => line.startsWith('| P29-U |'));
    expect(p29u).toContain('Revised by P29-U-R1');

    const p29uR1 = dashboard.split('\n').find((line) => line.startsWith('| P29-U-R1 |'));
    expect(p29uR1).toBeDefined();
    expect(p29uR1).toContain('| Planned |');
    expect(p29uR1).toContain('Dynamic asset valuation inputs and calculations');
    expect(p29uR1).toMatch(/Placement:\s+rule 2/);

    expect(branchIndex.split('\n').find((line) => line.startsWith('| P20 |'))).toContain('50');
    expect(branchIndex.split('\n').find((line) => line.startsWith('| P29 |'))).toContain('43');

    expect(roadmap).toContain('P20-Z — Dynamic budget category filter');
    expect(roadmap).toContain('P29-U-R1 — Dynamic asset valuation inputs and calculations');

    expect(openItems).toContain('CR-143');
    expect(openItems).toContain('P20-Z Dynamic budget category filter');
    expect(openItems).toContain('P29-U-R1 Dynamic asset valuation inputs and calculations');
    expect(status).toContain('CR-143');
  });

  it('records P20-Z dynamic budget category filter implementation under CR-144', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-144 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-144 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-144');

    const p20z = dashboard.split('\n').find((line) => line.startsWith('| P20-Z |'));
    expect(p20z).toBeDefined();
    expect(p20z).toMatch(/\| Done(?:; Revised by P20-Z-R1)? \|/);
    expect(p20z).toContain('categoryOptions computing base categories');
    expect(p20z).toContain('O78');
    expect(p20z).toMatch(/Placement:\s+rule 4/);

    expect(roadmap).toContain('P20-Z — Dynamic budget category filter (Done; Revised by P20-Z-R1; CR-144; O78 physical-device check open)');
    expect(checklist).toMatch(/\|\s*O78\s*\|[^|]+\|\s*Not run\s*\|/);
    expect(checklist).toContain('P20-Z; physical-device check required.');
    expect(openItems).toContain('P20-Z Dynamic budget category filter (Done; Revised by P20-Z-R1; CR-144)');
    expect(openItems).toContain('O78');
    expect(status).toContain('CR-144');
    expect(status).toContain('P20-Z');
  });

  it('records P20-Z-R1 budget filter icon indicator refinement and owner margin preservation under CR-145', () => {
    const dashboard = ledger.split('## 2. Status dashboard')[1]?.split('## 3. Standing rules')[0] ?? '';
    const promptLog = ledger.split('## 6. Prompt and session log')[1]?.split('## 7. Change-request register')[0] ?? '';
    const register = ledger.split('## 7. Change-request register')[1]?.split('## 8. Known issues and risks')[0] ?? '';
    const matrix = ledger.split('## 10. Verification matrix')[1]?.split('## 11. Session and release log')[0] ?? '';
    const roadmap = ledger.split('## 9. Upcoming roadmap')[1]?.split('## 10. Verification matrix')[0] ?? '';
    const checklist = readFileSync(join(process.cwd(), 'docs/releases/device-test-checklist.md'), 'utf8');
    const openItems = readFileSync(join(process.cwd(), 'docs/memory/open-items.md'), 'utf8');
    const status = readFileSync(join(process.cwd(), 'docs/memory/status.md'), 'utf8');

    expect(promptLog.split('\n').filter((line) => line.startsWith('| CR-145 |'))).toHaveLength(1);
    expect(register.split('\n').filter((line) => line.startsWith('| CR-145 |'))).toHaveLength(1);
    expect(matrix).toContain('CR-145');

    const p20zR1 = dashboard.split('\n').find((line) => line.startsWith('| P20-Z-R1 |'));
    expect(p20zR1).toBeDefined();
    expect(p20zR1).toContain('| Done |');
    expect(p20zR1).toContain("updated filterActive to selectedCategory !== 'All'");
    expect(p20zR1).toContain('O79');
    expect(p20zR1).toMatch(/Placement:\s+rule 2/);

    expect(roadmap).toContain('Revised by P20-Z-R1 (Done; CR-145; O79 physical-device check open)');
    expect(checklist).toMatch(/\|\s*O79\s*\|[^|]+\|\s*Not run\s*\|/);
    expect(checklist).toContain('P20-Z-R1; physical-device check required.');
    expect(openItems).toContain('P20-Z-R1 Budget filter icon indicator dot and margin refinement (Done; CR-145)');
    expect(openItems).toContain('O79');
    expect(status).toContain('CR-145');
    expect(status).toContain('P20-Z-R1');
  });
});
