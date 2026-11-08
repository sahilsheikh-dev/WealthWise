const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const root = process.cwd();
const files = [
  'ChoiceField.tsx',
  'DateField.tsx',
  'IntegerField.tsx',
  'MoneyField.tsx',
  'PercentField.tsx',
  'SegmentedControl.tsx',
  'SwitchRow.tsx',
  'TextField.tsx',
];
const manifest = Object.fromEntries(files.map((file) => {
  const path = join(root, 'src/components/form', file);
  const contents = readFileSync(path);
  return [file, createHash('sha256').update(contents).digest('hex')];
}));

writeFileSync(
  join(root, 'src/components/form/frozen-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
