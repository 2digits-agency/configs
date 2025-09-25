import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		// Node environment for CLI testing
		environment: 'node',
		globals: true,
		coverage: {
			reporter: ['text', 'json', 'html'],
		},
	},
});

