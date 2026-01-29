import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',

    transform: {
        '^.+\\.(ts|tsx)$': [
            'ts-jest',
            {
                tsconfig: 'tsconfig.jest.json'
            }
        ]
    },

    moduleNameMapper: {
        '\\.(css|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
        '\\.(jpg|jpeg|png|svg)$': '<rootDir>/src/__mocks__/fileMock.ts',
        '^@/(.*)$': '<rootDir>/src/$1',  // <-- ADD THIS LINE
    },

    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
};

export default config;
