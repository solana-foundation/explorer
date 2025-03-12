const nextJest = require('next/jest');

const createJestConfig = nextJest({
    // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
    dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
    moduleNameMapper: {
        '^@react-hook/previous$': '<rootDir>/node_modules/@react-hook/previous/dist/main/index.js',
        // '^change-case$': '<rootDir>/node_modules/change-case/dist/index.js',
    },
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(t|j)sx?$': [
            '@swc/jest',
            {
                jsc: {
                    // Add this to properly handle ESM modules
                    parser: {
                        dynamicImport: true,
                        syntax: 'typescript',
                        tsx: true
                    },
                    transform: {
                        react: {
                            runtime: 'automatic'
                        }
                    }
                }
            }
        ],
    },
    transformIgnorePatterns: [
        '/node_modules/(?!(@noble|change-case|@react-hook\\/previous)/)',
    ]
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
