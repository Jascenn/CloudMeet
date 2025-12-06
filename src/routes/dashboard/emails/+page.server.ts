/**
 * Email settings page - requires authentication
 */

import { redirect, type RequestEvent } from '@sveltejs/kit';
import { getCurrentUser } from '$lib/server/auth';

export const load = async (event: RequestEvent) => {
	const userId = await getCurrentUser(event);

	if (!userId) {
		throw redirect(302, '/auth/login');
	}

	return {};
};
