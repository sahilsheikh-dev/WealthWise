import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import * as ts from 'typescript';

function sourceFilesUnder(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const filePath = join(directory, name);
    if (statSync(filePath).isDirectory()) return sourceFilesUnder(filePath);
    if (!/\.(ts|tsx)$/.test(name) || /\.d\.ts$/.test(name) || /\.(test|spec)\.(ts|tsx)$/.test(name)) {
      return [];
    }
    return [filePath];
  });
}

function callName(call: ts.CallExpression): string {
  if (ts.isIdentifier(call.expression)) return call.expression.text;
  return ts.isPropertyAccessExpression(call.expression) ? call.expression.name.text : '';
}

function isTopLevelDeclaration(declaration: ts.Declaration): boolean {
  let current: ts.Node = declaration;
  while (current.parent && !ts.isSourceFile(current.parent)) {
    if (ts.isFunctionLike(current.parent)) return false;
    current = current.parent;
  }
  return Boolean(current.parent && ts.isSourceFile(current.parent));
}

function externalReferences(
  callback: ts.ArrowFunction | ts.FunctionExpression,
  checker: ts.TypeChecker,
): Map<string, ts.Symbol> {
  const references = new Map<string, ts.Symbol>();
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) {
      const parent = node.parent;
      const isPropertyName =
        (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
        (ts.isPropertyAssignment(parent) && parent.name === node) ||
        (ts.isMethodDeclaration(parent) && parent.name === node) ||
        (ts.isPropertyDeclaration(parent) && parent.name === node);
      if (!isPropertyName && node.text !== 'undefined') {
        const symbol = checker.getSymbolAtLocation(node);
        const declarations = symbol?.declarations ?? [];
        const isLocal = declarations.some((declaration) =>
          declaration.getStart() >= callback.getStart() && declaration.end <= callback.end,
        );
        const isModuleOrGlobal = declarations.some((declaration) =>
          isTopLevelDeclaration(declaration) || declaration.getSourceFile().isDeclarationFile,
        );
        if (!isLocal && !isModuleOrGlobal && symbol) references.set(node.text, symbol);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(callback.body);
  return references;
}

function isDirectlyStableHookValue(symbol: ts.Symbol): boolean {
  for (const declaration of symbol.declarations ?? []) {
    if (ts.isBindingElement(declaration) && ts.isArrayBindingPattern(declaration.parent)) {
      const pattern = declaration.parent;
      const variable = pattern.parent;
      const initializer = ts.isVariableDeclaration(variable) ? variable.initializer : undefined;
      if (
        pattern.elements.indexOf(declaration) === 1 &&
        initializer &&
        ts.isCallExpression(initializer) &&
        ['useState', 'useReducer'].includes(callName(initializer))
      ) {
        return true;
      }
    }
    if (
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      ts.isCallExpression(declaration.initializer) &&
      ['useRef', 'createRef'].includes(callName(declaration.initializer))
    ) {
      return true;
    }
  }
  return false;
}

function isStableHookValue(
  symbol: ts.Symbol,
  checker: ts.TypeChecker,
  visiting = new Set<ts.Symbol>(),
): boolean {
  if (isDirectlyStableHookValue(symbol)) return true;
  if (visiting.has(symbol)) return false;
  visiting.add(symbol);
  for (const declaration of symbol.declarations ?? []) {
    if (
      ts.isVariableDeclaration(declaration) &&
      declaration.initializer &&
      (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))
    ) {
      const references = externalReferences(declaration.initializer, checker);
      if ([...references.values()].every((reference) => isDirectlyStableHookValue(reference))) return true;
    }
  }
  return false;
}

function dependencyReferences(
  callback: ts.ArrowFunction | ts.FunctionExpression,
  checker: ts.TypeChecker,
): Set<string> {
  return new Set([...externalReferences(callback, checker)]
    .filter(([, symbol]) => !isStableHookValue(symbol, checker))
    .map(([name]) => name));
}

function dependencyArrayReferences(array: ts.ArrayLiteralExpression): Set<string> {
  const references = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isIdentifier(node)) references.add(node.text);
    ts.forEachChild(node, visit);
  };
  visit(array);
  return references;
}

describe('React memo input source guard', () => {
  it('lists every closure input and prevents unreviewed module-level caches', () => {
    const root = process.cwd();
    const files = [...sourceFilesUnder(join(root, 'app')), ...sourceFilesUnder(join(root, 'src'))];
    const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
    if (!configPath) throw new Error('TypeScript configuration is missing.');
    const config = ts.readConfigFile(configPath, (path) => readFileSync(path, 'utf8'));
    if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, '\n'));
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
    const program = ts.createProgram(parsed.fileNames, parsed.options);
    const checker = program.getTypeChecker();
    const violations: string[] = [];

    for (const filePath of files) {
      const sourceFile = program.getSourceFile(resolve(filePath));
      if (!sourceFile) throw new Error(`TypeScript did not load ${relative(root, filePath)}.`);
      const fileName = relative(root, filePath);

      for (const statement of sourceFile.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
          const initializer = declaration.initializer;
          if (!initializer || !ts.isNewExpression(initializer) || !ts.isIdentifier(initializer.expression)) continue;
          if (initializer.expression.text === 'Map' || initializer.expression.text === 'WeakMap') {
            const line = sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;
            violations.push(`${fileName}:${line} module-level ${initializer.expression.text} cache`);
          }
        }
      }

      const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node)) {
          const name = callName(node);
          if (name === 'useMemo' || name === 'useCallback') {
            const callback = node.arguments[0];
            const dependencies = node.arguments[1];
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            if (!callback || (!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback))) {
              violations.push(`${fileName}:${line} ${name} callback is not explicit`);
            } else if (!dependencies || !ts.isArrayLiteralExpression(dependencies)) {
              violations.push(`${fileName}:${line} ${name} dependency list is not explicit`);
            } else {
              const listed = dependencyArrayReferences(dependencies);
              for (const input of dependencyReferences(callback, checker)) {
                if (!listed.has(input)) violations.push(`${fileName}:${line} ${name} omits ${input}`);
              }
            }
          } else if (
            name === 'memo' &&
            ts.isPropertyAccessExpression(node.expression) &&
            ts.isIdentifier(node.expression.expression) &&
            node.expression.expression.text === 'React' &&
            (!node.arguments[1] ||
              (!ts.isArrowFunction(node.arguments[1]) && !ts.isFunctionExpression(node.arguments[1])))
          ) {
            const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
            violations.push(`${fileName}:${line} React.memo needs an explicit props comparator`);
          }
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
    }

    expect(violations).toEqual([]);
  });
});
