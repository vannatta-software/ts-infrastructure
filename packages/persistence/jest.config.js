module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: 'src',
    testMatch: ['**/__tests__/**/*.(test|spec).ts'],
    collectCoverage: true,
    coverageDirectory: '../coverage'
};
