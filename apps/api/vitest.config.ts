import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        // Runs before each test file (and before the file's imports), so it can
        // populate process.env before `config/env.ts` validates it.
        setupFiles: ['./vitest.setup.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*.ts'],
            exclude: [
                'src/**/*.test.ts',
                'src/**/*.d.ts',
                'src/index.ts', // server entry point (bootstrapping)
                'src/db/**', // mongoose connection wrapper
                'src/cache/**', // redis client init
                'src/config/passport.ts', // third-party strategy config
            ],
        },
    },
});
