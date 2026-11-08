module.exports = {
  preset: 'jest-expo',
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    '!src/domain/types.ts',
    'src/data/safeStorage.ts',
    'src/data/migrate.ts',
    'src/data/createAppStore.ts',
    'src/data/metaStore.ts',
    'src/lib/lockPolicy.ts',
    'src/lib/securitySettings.ts',
    'src/lib/authenticate.ts',
  ],
  coverageThreshold: {
    'src/domain/**/*.ts': {
      lines: 90,
      branches: 90,
    },
    'src/data/safeStorage.ts': { lines: 85, branches: 85 },
    'src/data/migrate.ts': { lines: 85, branches: 85 },
    'src/data/createAppStore.ts': { lines: 85, branches: 85 },
    'src/data/metaStore.ts': { lines: 85, branches: 85 },
    'src/lib/lockPolicy.ts': { lines: 90, branches: 90 },
    'src/lib/securitySettings.ts': { lines: 90, branches: 90 },
    'src/lib/authenticate.ts': { lines: 90, branches: 90 },
  },
};
