module.exports = {
  preset: 'jest-expo',
  collectCoverageFrom: [
    'src/domain/**/*.ts',
    '!src/domain/types.ts',
    'src/data/safeStorage.ts',
    'src/data/migrate.ts',
    'src/data/createAppStore.ts',
  ],
  coverageThreshold: {
    'src/domain/**/*.ts': {
      lines: 90,
      branches: 90,
    },
    'src/data/safeStorage.ts': { lines: 85, branches: 85 },
    'src/data/migrate.ts': { lines: 85, branches: 85 },
    'src/data/createAppStore.ts': { lines: 85, branches: 85 },
  },
};
