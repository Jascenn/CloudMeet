/**
 * Host-initiated reschedule proposal API endpoint
 * Creates a reschedule proposal and sends email to attendee
 */

import { json, error, type RequestEvent } from '@sveltejs/kit';
import { getCurrentUser } from '$lib/server/auth';
import { getEmailTemplates, isEmailEnabled } from '$lib/server/email';

export const POST = async (event: RequestEvent) => {
	const env = event.platform?.env;
	if (!env) {
		throw error(500, 'Platform env not available');
	}

	const db = env.DB;

	// Get current user
	const userId = await getCurrentUser(event);
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const body = await event.request.json() as {
			bookingId: string;
			proposedStartTime: string;
			proposedEndTime: string;
			message?: string | null;
		};

		const { bookingId, proposedStartTime, proposedEndTime, message } = body;

		if (!bookingId || !proposedStartTime || !proposedEndTime) {
			throw error(400, 'Booking ID and proposed times are required');
		}

		// Get booking and verify ownership
		const booking = await db
			.prepare(
				`SELECT b.id, b.user_id, b.status, b.start_time, b.end_time,
				b.attendee_name, b.attendee_email, b.attendee_notes,
				e.name as event_name, e.slug as event_slug,
				u.name as host_name, u.email as host_email, u.contact_email, u.settings, u.brand_color
				FROM bookings b
				JOIN event_types e ON b.event_type_id = e.id
				JOIN users u ON b.user_id = u.id
				WHERE b.id = ?`
			)
			.bind(bookingId)
			.first<{
				id: string;
				user_id: string;
				status: string;
				start_time: string;
				end_time: string;
				attendee_name: string;
				attendee_email: string;
				attendee_notes: string | null;
				event_name: string;
				event_slug: string;
				host_name: string;
				host_email: string;
				contact_email: string | null;
				settings: string | null;
				brand_color: string | null;
			}>();

		if (!booking) {
			throw error(404, 'Booking not found');
		}

		if (booking.user_id !== userId) {
			throw error(403, 'You do not have permission to reschedule this booking');
		}

		if (booking.status !== 'confirmed') {
			throw error(400, 'Only confirmed bookings can be rescheduled');
		}

		// Generate a unique response token
		const responseToken = crypto.randomUUID();

		// Create reschedule proposal
		await db
			.prepare(
				`INSERT INTO reschedule_proposals
				(booking_id, proposed_start_time, proposed_end_time, message, proposed_by, response_token, expires_at)
				VALUES (?, ?, ?, ?, 'host', ?, datetime('now', '+7 days'))`
			)
			.bind(bookingId, proposedStartTime, proposedEndTime, message || null, responseToken)
			.run();

		// Mark original booking as having a pending proposal
		await db
			.prepare(`UPDATE bookings SET status = 'rescheduled' WHERE id = ?`)
			.bind(bookingId)
			.run();

		// Send email to attendee with proposal
		if (env.EMAILIT_API_KEY) {
			try {
				// Parse user settings for time format
				let timeFormat: '12h' | '24h' = '12h';
				try {
					const settings = booking.settings ? JSON.parse(booking.settings) : {};
					timeFormat = settings.timeFormat === '24h' ? '24h' : '12h';
				} catch {
					// Keep default
				}

				const appUrl = env.APP_URL || '';
				const responseUrl = `${appUrl}/reschedule-response/${responseToken}`;

				// Send proposal email
				await sendRescheduleProposalEmail(
					{
						attendeeName: booking.attendee_name,
						attendeeEmail: booking.attendee_email,
						eventName: booking.event_name,
						eventSlug: booking.event_slug,
						hostName: booking.host_name,
						hostEmail: booking.host_email,
						oldStartTime: new Date(booking.start_time),
						oldEndTime: new Date(booking.end_time),
						newStartTime: new Date(proposedStartTime),
						newEndTime: new Date(proposedEndTime),
						message: message || null,
						responseUrl,
						appUrl,
						timeFormat,
						brandColor: booking.brand_color || '#3b82f6'
					},
					{
						apiKey: env.EMAILIT_API_KEY,
						from: env.EMAIL_FROM || booking.host_email,
						replyTo: booking.contact_email || booking.host_email
					}
				);
			} catch (emailErr) {
				console.error('Failed to send reschedule proposal email:', emailErr);
				// Don't fail the request if email fails
			}
		}

		return json({ success: true, responseToken });
	} catch (err: any) {
		console.error('Propose reschedule error:', err);
		if (err?.status) throw err;
		throw error(500, 'Failed to create reschedule proposal');
	}
};

interface RescheduleProposalEmailData {
	attendeeName: string;
	attendeeEmail: string;
	eventName: string;
	eventSlug: string;
	hostName: string;
	hostEmail: string;
	oldStartTime: Date;
	oldEndTime: Date;
	newStartTime: Date;
	newEndTime: Date;
	message: string | null;
	responseUrl: string;
	appUrl: string;
	timeFormat: '12h' | '24h';
	brandColor: string;
}

interface EmailConfig {
	apiKey: string;
	from: string;
	replyTo: string;
}

async function sendRescheduleProposalEmail(data: RescheduleProposalEmailData, config: EmailConfig): Promise<void> {
	const formatDate = (date: Date) => date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
	const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: data.timeFormat === '12h' });

	const htmlBody = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Reschedule Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6;">
	<table role="presentation" style="width: 100%; border-collapse: collapse;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
					<!-- Header -->
					<tr>
						<td style="padding: 40px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); text-align: center;">
							<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Reschedule Request</h1>
						</td>
					</tr>

					<!-- Body -->
					<tr>
						<td style="padding: 40px;">
							<p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 24px;">
								Hi <strong>${data.attendeeName}</strong>,
							</p>
							<p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 24px;">
								<strong>${data.hostName}</strong> would like to reschedule your meeting.
							</p>

							${data.message ? `
							<div style="margin: 0 0 30px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #f59e0b;">
								<p style="margin: 0; color: #4b5563; font-size: 15px; line-height: 22px;">${data.message}</p>
							</div>
							` : ''}

							<!-- Time comparison -->
							<table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
								<tr>
									<td style="width: 48%; vertical-align: top;">
										<div style="background-color: #fef2f2; border-radius: 8px; padding: 16px; border: 1px solid #fecaca;">
											<div style="color: #991b1b; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Original Time</div>
											<div style="color: #111827; font-size: 15px; font-weight: 500; text-decoration: line-through;">${formatDate(data.oldStartTime)}</div>
											<div style="color: #6b7280; font-size: 14px; text-decoration: line-through;">${formatTime(data.oldStartTime)} - ${formatTime(data.oldEndTime)}</div>
										</div>
									</td>
									<td style="width: 4%; text-align: center; vertical-align: middle;">
										<span style="color: #9ca3af; font-size: 20px;">→</span>
									</td>
									<td style="width: 48%; vertical-align: top;">
										<div style="background-color: #f0fdf4; border-radius: 8px; padding: 16px; border: 1px solid #bbf7d0;">
											<div style="color: #166534; font-size: 12px; font-weight: 600; margin-bottom: 8px; text-transform: uppercase;">Proposed Time</div>
											<div style="color: #111827; font-size: 15px; font-weight: 500;">${formatDate(data.newStartTime)}</div>
											<div style="color: #6b7280; font-size: 14px;">${formatTime(data.newStartTime)} - ${formatTime(data.newEndTime)}</div>
										</div>
									</td>
								</tr>
							</table>

							<!-- Action buttons -->
							<table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
								<tr>
									<td align="center">
										<a href="${data.responseUrl}?action=accept" style="display: inline-block; padding: 14px 28px; background-color: #10b981; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 0 8px;">Accept New Time</a>
										<a href="${data.responseUrl}?action=decline" style="display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 0 8px;">Decline</a>
									</td>
								</tr>
							</table>

							<p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px; text-align: center;">
								Or <a href="${data.responseUrl}?action=counter" style="color: ${data.brandColor}; text-decoration: none;">propose a different time</a>
							</p>
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
							<p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 18px; text-align: center;">
								This reschedule request was sent by ${data.hostName}.<br>
								Powered by <a href="https://github.com/dennisklappe/CloudMeet" style="color: #6b7280; text-decoration: none;">CloudMeet</a>
							</p>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`;

	const response = await fetch('https://api.emailit.com/v1/emails', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${config.apiKey}`
		},
		body: JSON.stringify({
			from: `${data.hostName} <${config.from}>`,
			to: data.attendeeEmail,
			reply_to: config.replyTo,
			subject: `Reschedule Request: ${data.eventName} with ${data.hostName}`,
			html: htmlBody
		})
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed to send email: ${errorText}`);
	}
}
