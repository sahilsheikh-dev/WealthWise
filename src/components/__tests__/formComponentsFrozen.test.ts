import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type FrozenManifest = Record<string, string>;

const formDirectory = join(process.cwd(), 'src/components/form');
const manifest = JSON.parse(
  readFileSync(join(formDirectory, 'frozen-manifest.json'), 'utf8'),
) as FrozenManifest;
const auditedComponents = [
  'ChoiceField.tsx',
  'DateField.tsx',
  'IntegerField.tsx',
  'MoneyField.tsx',
  'PercentField.tsx',
  'SegmentedControl.tsx',
  'SwitchRow.tsx',
  'TextField.tsx',
];
const failureMessage = 'Input components are user-owned. If you changed them on purpose run: node scripts/freezeFormComponents.js and commit the manifest.';

describe('user-owned input components', () => {
  it('contains the full audited field-component set', () => {
    expect(Object.keys(manifest).sort()).toEqual([...auditedComponents].sort());
  });

  it('matches each frozen component hash', () => {
    for (const [file, expectedHash] of Object.entries(manifest)) {
      const contents = readFileSync(join(formDirectory, file));
      const actualHash = createHash('sha256').update(contents).digest('hex');
      if (actualHash !== expectedHash) {
        throw new Error(`${failureMessage} (${file})`);
      }
    }
  });
});
