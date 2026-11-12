import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as ts from 'typescript';

const forbiddenApis = new Set(['fetch', 'XMLHttpRequest', 'WebSocket']);

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    if (!entry.isFile() || !/\.(?:[cm]?[jt]sx?)$/.test(entry.name)) return [];
    return [path];
  });
}

describe('offline runtime boundary', () => {
  it('does not use network request APIs in app or src', () => {
    const usages: string[] = [];
    for (const path of ['app', 'src'].flatMap((directory) => sourceFiles(join(process.cwd(), directory)))) {
      const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
      const inspect = (node: ts.Node) => {
        if (ts.isIdentifier(node) && forbiddenApis.has(node.text)) {
          usages.push(`${path}:${node.getStart(source)}:${node.text}`);
        }
        if (
          ts.isElementAccessExpression(node)
          && node.argumentExpression
          && ts.isStringLiteralLike(node.argumentExpression)
          && forbiddenApis.has(node.argumentExpression.text)
        ) {
          usages.push(`${path}:${node.getStart(source)}:${node.argumentExpression.text}`);
        }
        ts.forEachChild(node, inspect);
      };
      inspect(source);
    }
    expect(usages).toEqual([]);
  });
});
