/**
 * Booking page for specific event type (single-user)
 */

import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, fetch }) => {
	const slug = params.slug;

	// Fetch event type data from our own API
	const response = await fetch(`/api/event-type/${slug}`);

	if (!response.ok) {
		throw error(404, 'Event type not found');
	}

	const data = await response.json() as {
		slug: string;
		eventType: any;
		user: any;
	};

	return {
		slug: data.slug,
		eventType: data.eventType,
		user: data.user
	};
};
