/**
 * Main page - shows event types for single-user setup
 */

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	const db = platform?.env?.DB;
	if (!db) {
		// If database not available, show the landing page
		return { user: null, eventTypes: [] };
	}

	// Get the first (and only) user
	const user = await db
		.prepare('SELECT id, name, slug, email, profile_image, brand_color FROM users LIMIT 1')
		.first<{ id: string; name: string; slug: string; email: string; profile_image: string | null; brand_color: string | null }>();

	if (!user) {
		// No user exists yet, show the landing page
		return { user: null, eventTypes: [] };
	}

	// Get active event types
	const eventTypes = await db
		.prepare(
			`SELECT id, name, slug, duration_minutes as duration, description, is_active
			FROM event_types
			WHERE user_id = ? AND is_active = 1
			ORDER BY name ASC`
		)
		.bind(user.id)
		.all<{
			id: string;
			name: string;
			slug: string;
			duration: number;
			description: string;
			is_active: number;
		}>();

	return {
		user: {
			name: user.name,
			slug: user.slug,
			profileImage: user.profile_image,
			brandColor: user.brand_color
		},
		eventTypes: eventTypes.results
	};
};
