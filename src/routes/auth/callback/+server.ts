/**
 * Google OAuth callback handler
 */

import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { exchangeCodeForTokens, getGoogleUserInfo, createSessionToken } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
	const env = platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const errorParam = url.searchParams.get('error');

	// Handle OAuth errors
	if (errorParam) {
		throw error(400, `OAuth error: ${errorParam}`);
	}

	if (!code || !state) {
		throw error(400, 'Missing code or state parameter');
	}

	// Verify state to prevent CSRF
	const storedState = await env.KV.get(`oauth_state:${state}`);
	if (!storedState) {
		throw error(400, 'Invalid state parameter');
	}

	// Delete used state
	await env.KV.delete(`oauth_state:${state}`);

	const clientId = env.GOOGLE_CLIENT_ID;
	const clientSecret = env.GOOGLE_CLIENT_SECRET;
	const appUrl = env.APP_URL;
	const adminEmail = env.ADMIN_EMAIL;

	if (!clientId || !clientSecret || !appUrl) {
		throw error(500, 'Missing OAuth configuration');
	}

	try {
		// Exchange code for tokens
		const redirectUri = `${appUrl}/auth/callback`;
		const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);

		// Get user info
		const userInfo = await getGoogleUserInfo(tokens.access_token);

		// Restrict login to admin email only
		if (adminEmail && userInfo.email !== adminEmail) {
			throw error(403, 'Access denied. Only the admin can log in.');
		}

		// Check if user exists in database, or create them
		const db = env.DB;

		// Check if user exists by email
		let user = await db.prepare('SELECT id FROM users WHERE email = ?').bind(userInfo.email).first<{ id: string }>();

		if (!user) {
			// Create the admin user
			const userId = crypto.randomUUID();
			const slug = userInfo.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

			await db
				.prepare(
					`INSERT INTO users (id, email, name, slug, google_refresh_token, created_at)
					VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
				)
				.bind(
					userId,
					userInfo.email,
					userInfo.name,
					slug,
					tokens.refresh_token || null
				)
				.run();

			user = { id: userId };
		} else {
			// Update existing user's tokens
			await db
				.prepare(
					`UPDATE users
					SET google_refresh_token = COALESCE(?, google_refresh_token),
						email = ?,
						name = ?
					WHERE id = ?`
				)
				.bind(
					tokens.refresh_token || null,
					userInfo.email,
					userInfo.name,
					user.id
				)
				.run();
		}

		// Create session token (note: user.id is now a string UUID)
		const sessionToken = await createSessionToken(user.id, env.JWT_SECRET);

		// Set session cookie
		cookies.set('session', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: appUrl.startsWith('https'),
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		// Redirect to dashboard
		throw redirect(302, '/dashboard');
	} catch (err: any) {
		// Re-throw redirects
		if (err?.status && err?.location) {
			throw err;
		}
		console.error('OAuth callback error:', err);
		throw error(500, `Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
	}
};
