import type { PagesFunction } from '@cloudflare/workers-types';

export const onRequest: PagesFunction = async (context) => {
	const { request, next } = context;
	const url = new URL(request.url);
	const path = url.pathname;

	// Add security headers
	const response = await next();
	const headers = new Headers(response.headers);

	// Security headers
	headers.set('X-Frame-Options', 'DENY');
	headers.set('X-Content-Type-Options', 'nosniff');
	headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

	// Cache headers based on path
	if (path.startsWith('/api/availability')) {
		// Cache availability endpoints
		headers.set('Cache-Control', 'public, max-age=300, s-maxage=300'); // 5 minutes
		headers.set('CDN-Cache-Control', 'max-age=300');
	} else if (path.startsWith('/api/events') || path.startsWith('/api/users')) {
		// Cache relatively static data
		headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600'); // 1 hour
		headers.set('CDN-Cache-Control', 'max-age=3600');
	} else if (path.startsWith('/book/')) {
		// Cache booking pages
		headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
		headers.set('CDN-Cache-Control', 'max-age=300');
	} else if (path.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?)$/)) {
		// Long cache for static assets
		headers.set('Cache-Control', 'public, max-age=31536000, immutable');
		headers.set('CDN-Cache-Control', 'max-age=31536000');
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers
	});
};