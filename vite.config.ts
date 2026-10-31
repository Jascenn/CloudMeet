import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter(),
			alias: {
				$lib: './src/lib'
			}
		})
	],
	resolve: {
		alias: {
			'$lib': '/src/lib'
		}
	}
});
