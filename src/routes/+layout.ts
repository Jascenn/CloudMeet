import type { LayoutLoad } from './$types';

export const prerender = false;
export const ssr = true;

export const load: LayoutLoad = async ({ fetch }) => {
	// Load any global data needed across the app
	// This can be cached in stores
	return {
		timestamp: Date.now()
	};
};