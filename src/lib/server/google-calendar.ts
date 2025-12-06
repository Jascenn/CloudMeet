/**
 * Google Calendar API integration
 * Uses REST API directly (no googleapis library) for Cloudflare Workers compatibility
 */

export interface CalendarEvent {
	id: string;
	summary: string;
	start: { dateTime: string; timeZone?: string };
	end: { dateTime: string; timeZone?: string };
	status: string;
	hangoutLink?: string;
	htmlLink?: string;
}

export interface BusySlot {
	start: string; // ISO 8601
	end: string; // ISO 8601
}

export interface FreeBusyResponse {
	calendars: {
		[calendarId: string]: {
			busy: Array<{
				start: string;
				end: string;
			}>;
		};
	};
}

/**
 * Get user's busy times from Google Calendar
 */
export async function getBusyTimes(
	accessToken: string,
	startDate: Date,
	endDate: Date,
	calendarId: string = 'primary'
): Promise<BusySlot[]> {
	const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			timeMin: startDate.toISOString(),
			timeMax: endDate.toISOString(),
			items: [{ id: calendarId }]
		})
	});

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to fetch busy times: ${error}`);
	}

	const data: FreeBusyResponse = await response.json();
	return data.calendars[calendarId]?.busy || [];
}

/**
 * Create a calendar event (for bookings)
 */
export async function createCalendarEvent(
	accessToken: string,
	event: {
		summary: string;
		description?: string;
		start: { dateTime: string; timeZone: string };
		end: { dateTime: string; timeZone: string };
		attendees?: Array<{ email: string }>;
		conferenceData?: {
			createRequest: {
				requestId: string;
				conferenceSolutionKey: { type: string };
			};
		};
	},
	calendarId: string = 'primary'
): Promise<CalendarEvent> {
	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?conferenceDataVersion=1`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(event)
		}
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to create calendar event: ${error}`);
	}

	return response.json();
}

/**
 * Update a calendar event
 */
export async function updateCalendarEvent(
	accessToken: string,
	eventId: string,
	updates: Partial<{
		summary: string;
		description: string;
		start: { dateTime: string; timeZone: string };
		end: { dateTime: string; timeZone: string };
		status: string;
	}>,
	calendarId: string = 'primary'
): Promise<CalendarEvent> {
	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
		{
			method: 'PATCH',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(updates)
		}
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to update calendar event: ${error}`);
	}

	return response.json();
}

/**
 * Cancel a calendar event (for cancellations)
 */
export async function cancelCalendarEvent(
	accessToken: string,
	eventId: string,
	calendarId: string = 'primary'
): Promise<void> {
	const response = await fetch(
		`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
		{
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}
	);

	if (!response.ok) {
		const error = await response.text();
		throw new Error(`Failed to cancel calendar event: ${error}`);
	}
}

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken(
	db: D1Database,
	userId: string,
	clientId: string,
	clientSecret: string
): Promise<string> {
	// Get user's tokens from database
	const user = await db
		.prepare('SELECT google_refresh_token FROM users WHERE id = ?')
		.bind(userId)
		.first<{
			google_refresh_token: string | null;
		}>();

	if (!user?.google_refresh_token) {
		throw new Error('User not connected to Google Calendar');
	}

	// Refresh access token to get a fresh one
	const { refreshAccessToken } = await import('./auth.js');
	const tokens = await refreshAccessToken(user.google_refresh_token, clientId, clientSecret);

	return tokens.access_token;
}
