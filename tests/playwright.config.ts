import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './specs',
    timeout: 90_000,
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: [['list'], ['html', { open: 'never' }]],
    use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:3000',
    },
});