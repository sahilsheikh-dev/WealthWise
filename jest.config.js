module.exports = {
  preset: 'jest-expo',
  collectCoverageFrom: ['src/domain/**/*.ts', '!src/domain/types.ts'],
  coverageThreshold: {
    'src/domain/**/*.ts': {
      lines: 90,
      branches: 90,
    },
  },
};
