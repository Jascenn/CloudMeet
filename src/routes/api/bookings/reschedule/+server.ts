/**
 * Reschedule Booking API endpoint
 * Reschedules a booking to a new time slot without requiring attendee to re-enter details
 */

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCalendarEvent, cancelCalendarEvent, getValidAccessToken } from '$lib/server/google-calendar';
import { sendRescheduleEmail, sendAdminRescheduleNotification, getEmailTemplates, isEmailEnabled } from '$lib/server/email';

export const POST: RequestHandler = async ({ request, platform }) => {
	const env = platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	try {
		const body = await request.json() as {
			bookingId: string;
			newStartTime: string;
			newEndTime: string;
			timezone?: string;
		};
		const { bookingId, newStartTime, newEndTime, timezone } = body;

		// Validate required fields
		if (!bookingId || !newStartTime || !newEndTime) {
			throw error(400, 'Missing required fields');
		}

		const db = env.DB;

		// Get the original booking with all details
		const originalBooking = await db
			.prepare(
				`SELECT b.id, b.user_id, b.event_type_id, b.start_time, b.end_time,
				b.attendee_name, b.attendee_email, b.attendee_notes, b.google_event_id,
				e.name as event_name, e.slug as event_slug, e.description as event_description,
				e.duration_minutes as duration,
				u.id as host_user_id, u.name as host_name, u.email as host_email,
				u.contact_email, u.settings, u.brand_color
				FROM bookings b
				JOIN event_types e ON b.event_type_id = e.id
				JOIN users u ON b.user_id = u.id
				WHERE b.id = ? AND b.status IN ('confirmed', 'rescheduled')`
			)
			.bind(bookingId)
			.first<{
				id: string;
				user_id: string;
				event_type_id: string;
				start_time: string;
				end_time: string;
				attendee_name: string;
				attendee_email: string;
				attendee_notes: string | null;
				google_event_id: string | null;
				event_name: string;
				event_slug: string;
				event_description: string | null;
				duration: number;
				host_user_id: string;
				host_name: string;
				host_email: string;
				contact_email: string | null;
				settings: string | null;
				brand_color: string | null;
			}>();

		if (!originalBooking) {
			throw error(404, 'Booking not found or already cancelled');
		}

		const newStartDateTime = new Date(newStartTime);
		const newEndDateTime = new Date(newEndTime);
		const oldStartDateTime = new Date(originalBooking.start_time);
		const oldEndDateTime = new Date(originalBooking.end_time);

		// Check for conflicts with existing bookings (excluding the original booking)
		const conflict = await db
			.prepare(
				`SELECT id FROM bookings
				WHERE user_id = ? AND status = 'confirmed' AND id != ?
				AND (
					(start_time <= ? AND end_time > ?)
					OR (start_time < ? AND end_time >= ?)
					OR (start_time >= ? AND end_time <= ?)
				)`
			)
			.bind(
				originalBooking.user_id,
				bookingId,
				newStartTime, newStartTime,
				newEndTime, newEndTime,
				newStartTime, newEndTime
			)
			.first();

		if (conflict) {
			throw error(409, 'This time slot is no longer available');
		}

		// Cancel old Google Calendar event and create new one
		let newCalendarEventId: string | null = null;
		let newMeetingUrl: string | null = null;

		try {
			const accessToken = await getValidAccessToken(
				db,
				originalBooking.user_id,
				env.GOOGLE_CLIENT_ID,
				env.GOOGLE_CLIENT_SECRET
			);

			// Cancel old calendar event if it exists
			if (originalBooking.google_event_id) {
				try {
					await cancelCalendarEvent(accessToken, originalBooking.google_event_id);
				} catch (err) {
					console.error('Error cancelling old Google Calendar event:', err);
				}
			}

			// Create new calendar event
			const notes = originalBooking.attendee_notes;
			const calendarEvent = await createCalendarEvent(accessToken, {
				summary: `${originalBooking.event_name} with ${originalBooking.attendee_name}`,
				description: `${originalBooking.event_description || ''}\n\nAttendee: ${originalBooking.attendee_name} (${originalBooking.attendee_email})${notes ? `\n\nNotes from attendee:\n${notes}` : ''}`,
				start: {
					dateTime: newStartDateTime.toISOString(),
					timeZone: 'UTC'
				},
				end: {
					dateTime: newEndDateTime.toISOString(),
					timeZone: 'UTC'
				},
				attendees: [
					{ email: originalBooking.attendee_email }
				],
				conferenceData: {
					createRequest: {
						requestId: crypto.randomUUID(),
						conferenceSolutionKey: { type: 'hangoutsMeet' }
					}
				}
			});

			newCalendarEventId = calendarEvent.id;
			newMeetingUrl = calendarEvent.hangoutLink || calendarEvent.htmlLink || null;
		} catch (err) {
			console.error('Error with Google Calendar:', err);
			// Continue without calendar event if there's an error
		}

		// Update the booking with new times (keeping attendee info) and set status to confirmed
		await db
			.prepare(
				`UPDATE bookings SET
					start_time = ?,
					end_time = ?,
					google_event_id = ?,
					meeting_url = ?,
					status = 'confirmed'
				WHERE id = ?`
			)
			.bind(
				newStartTime,
				newEndTime,
				newCalendarEventId,
				newMeetingUrl,
				bookingId
			)
			.run();

		// Mark any pending reschedule proposals for this booking as superseded
		await db
			.prepare(`UPDATE reschedule_proposals SET status = 'counter_proposed', responded_at = CURRENT_TIMESTAMP WHERE booking_id = ? AND status = 'pending'`)
			.bind(bookingId)
			.run();

		// Cancel any old scheduled reminder emails and create new ones
		await db
			.prepare(`UPDATE scheduled_emails SET status = 'cancelled' WHERE booking_id = ? AND status = 'pending'`)
			.bind(bookingId)
			.run();

		// Invalidate availability cache for both old and new dates
		const oldDateStr = oldStartDateTime.toISOString().split('T')[0];
		const newDateStr = newStartDateTime.toISOString().split('T')[0];
		await env.KV.delete(`availability:${originalBooking.event_slug}:${oldDateStr}`);
		await env.KV.delete(`availability:${originalBooking.event_slug}:${newDateStr}`);

		// Send reschedule email (not cancellation email!)
		if (env.EMAILIT_API_KEY) {
			try {
				// Parse user settings for time format
				let timeFormat: '12h' | '24h' = '12h';
				try {
					const settings = originalBooking.settings ? JSON.parse(originalBooking.settings) : {};
					timeFormat = settings.timeFormat === '24h' ? '24h' : '12h';
				} catch {
					// Keep default
				}

				const replyToEmail = originalBooking.contact_email || originalBooking.host_email;
				const templates = await getEmailTemplates(db, originalBooking.user_id);

				// Check if reschedule email template is enabled (default to true)
				if (isEmailEnabled(templates, 'reschedule')) {
					const template = templates.get('reschedule');
					await sendRescheduleEmail(
						{
							attendeeName: originalBooking.attendee_name,
							attendeeEmail: originalBooking.attendee_email,
							eventName: originalBooking.event_name,
							eventDescription: originalBooking.event_description || '',
							startTime: newStartDateTime,
							endTime: newEndDateTime,
							oldStartTime: oldStartDateTime,
							oldEndTime: oldEndDateTime,
							meetingUrl: newMeetingUrl,
							bookingId: originalBooking.id,
							hostName: originalBooking.host_name,
							hostEmail: originalBooking.host_email,
							hostContactEmail: originalBooking.contact_email || undefined,
							appUrl: env.APP_URL || '',
							timeFormat,
							timezone: timezone || 'UTC',
							brandColor: originalBooking.brand_color || undefined,
							attendeeNotes: originalBooking.attendee_notes
						},
						{
							apiKey: env.EMAILIT_API_KEY,
							from: env.EMAIL_FROM || originalBooking.host_email,
							replyTo: replyToEmail
						},
						template?.subject || undefined
					);
				}

				// Send admin notification
				try {
					await sendAdminRescheduleNotification(
						{
							attendeeName: originalBooking.attendee_name,
							attendeeEmail: originalBooking.attendee_email,
							eventName: originalBooking.event_name,
							eventDescription: originalBooking.event_description || '',
							startTime: newStartDateTime,
							endTime: newEndDateTime,
							oldStartTime: oldStartDateTime,
							oldEndTime: oldEndDateTime,
							meetingUrl: newMeetingUrl,
							bookingId: originalBooking.id,
							hostName: originalBooking.host_name,
							hostEmail: originalBooking.host_email,
							appUrl: env.APP_URL || '',
							timeFormat,
							timezone: timezone || 'UTC',
							brandColor: originalBooking.brand_color || undefined,
							attendeeNotes: originalBooking.attendee_notes
						},
						originalBooking.host_email,
						{
							apiKey: env.EMAILIT_API_KEY,
							from: env.EMAIL_FROM || originalBooking.host_email
						}
					);
				} catch (adminEmailErr) {
					console.error('Failed to send admin reschedule notification:', adminEmailErr);
				}

				// Schedule new reminder emails
				const reminderTypes = ['reminder_24h', 'reminder_1h'] as const;
				const reminderOffsets: Record<string, number> = {
					'reminder_24h': 24 * 60 * 60 * 1000,
					'reminder_1h': 60 * 60 * 1000
				};

				for (const reminderType of reminderTypes) {
					if (isEmailEnabled(templates, reminderType)) {
						const scheduledFor = new Date(newStartDateTime.getTime() - reminderOffsets[reminderType]);
						if (scheduledFor > new Date()) {
							await db
								.prepare(`INSERT INTO scheduled_emails (booking_id, template_type, scheduled_for) VALUES (?, ?, ?)`)
								.bind(bookingId, reminderType, scheduledFor.toISOString())
								.run();
						}
					}
				}
			} catch (emailError) {
				console.error('Failed to send reschedule email:', emailError);
			}
		}

		return json({
			success: true,
			bookingId,
			meetingUrl: newMeetingUrl
		});
	} catch (err: any) {
		console.error('Reschedule error:', err);
		if (err?.status) throw err;
		throw error(500, 'Failed to reschedule booking');
	}
};
