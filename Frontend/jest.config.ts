import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',

    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.jest.json',
            },
        ],
    },

    moduleNameMapper: {
        '\\.(css|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
        '\\.(jpg|jpeg|png|svg)$': '<rootDir>/src/__mocks__/fileMock.ts',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^react-leaflet$': '<rootDir>/src/__mocks__/reactLeafletMock.tsx',
        '^leaflet$': '<rootDir>/src/__mocks__/leafletMock.ts',
    },

    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],

    /* ================== COVERAGE CONFIG ================== */
    collectCoverage: true,

    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/main.tsx',
        '!src/vite-env.d.ts',
        '!src/**/*.d.ts',
    ],

    coverageDirectory: 'coverage',

    coverageReporters: ['text', 'lcov'],
    /* ===================================================== */
};

export default config;
