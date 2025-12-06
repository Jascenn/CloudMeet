/**
 * Cancellation email templates
 */

import type { BookingEmailData } from '../types';
import { createEmailFormatters } from '../formatters';
import { generateBaseEmail } from './base';

/**
 * Generate HTML email for cancellation
 */
export function generateCancellationEmail(data: BookingEmailData): string {
	const { formatDate, formatTime } = createEmailFormatters(data.timeFormat, data.timezone);
	const brandColor = data.brandColor || '#3b82f6';

	const headerContent = `
		<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Meeting Cancelled</h1>
	`;

	const customMessageSection = data.customMessage ? `
		<p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 24px; padding: 16px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #ef4444;">
			${data.customMessage}
		</p>
	` : '';

	const bodyContent = `
		<p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 24px;">
			Hi <strong>${data.attendeeName}</strong>,
		</p>
		<p style="margin: 0 0 30px; color: #4b5563; font-size: 16px; line-height: 24px;">
			Your meeting with <strong>${data.hostName}</strong> has been cancelled.
		</p>
		${customMessageSection}
		<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
			<tr>
				<td style="padding: 24px;">
					<h2 style="margin: 0 0 16px; color: #111827; font-size: 18px; font-weight: 600; text-decoration: line-through;">Cancelled Meeting</h2>
					<div style="margin-bottom: 12px;">
						<div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Event</div>
						<div style="color: #111827; font-size: 16px; font-weight: 500;">${data.eventName}</div>
					</div>
					<div style="margin-bottom: 12px;">
						<div style="color: #6b7280; font-size: 14px; margin-bottom: 4px;">Originally Scheduled</div>
						<div style="color: #111827; font-size: 16px; font-weight: 500;">${formatDate(data.startTime)} at ${formatTime(data.startTime)}</div>
					</div>
				</td>
			</tr>
		</table>
		<p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 20px;">
			If you'd like to reschedule, please visit <a href="${data.appUrl}/${data.eventSlug || ''}" style="color: ${brandColor}; text-decoration: none;">${data.hostName}'s booking page</a>.
		</p>
	`;

	return generateBaseEmail({
		title: 'Meeting Cancelled',
		headerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		headerContent,
		bodyContent,
		footerContent: `This is an automated email from ${data.hostName}'s meeting scheduler.`,
		hostName: data.hostName
	});
}

/**
 * Generate admin cancellation notification email
 */
export function generateAdminCancellationEmail(data: BookingEmailData): string {
	const { formatDate, formatTime } = createEmailFormatters(data.timeFormat, data.timezone);

	const customMessageSection = data.customMessage ? `
		<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 30px;">
			<tr>
				<td style="padding: 20px;">
					<div style="color: #6b7280; font-size: 14px; font-weight: 600; margin-bottom: 8px;">Cancellation reason:</div>
					<div style="color: #374151; font-size: 15px; line-height: 22px;">${data.customMessage}</div>
				</td>
			</tr>
		</table>
	` : '';

	const headerContent = `
		<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Booking Cancelled</h1>
	`;

	const bodyContent = `
		<p style="margin: 0 0 20px; color: #4b5563; font-size: 16px; line-height: 24px;">
			A meeting has been cancelled.
		</p>

		<table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fef2f2; border-radius: 8px; border: 1px solid #fecaca; margin-bottom: 30px;">
			<tr>
				<td style="padding: 24px;">
					<div style="margin-bottom: 12px;">
						<div style="color: #991b1b; font-size: 14px; margin-bottom: 4px;">Attendee</div>
						<div style="color: #111827; font-size: 16px; font-weight: 500;">${data.attendeeName}</div>
						<div style="color: #6b7280; font-size: 14px;">${data.attendeeEmail}</div>
					</div>

					<div style="margin-bottom: 12px;">
						<div style="color: #991b1b; font-size: 14px; margin-bottom: 4px;">Event</div>
						<div style="color: #111827; font-size: 16px; font-weight: 500;">${data.eventName}</div>
					</div>

					<div style="margin-bottom: 12px;">
						<div style="color: #991b1b; font-size: 14px; margin-bottom: 4px;">Was scheduled for</div>
						<div style="color: #111827; font-size: 16px; font-weight: 500;">${formatDate(data.startTime)}</div>
						<div style="color: #6b7280; font-size: 14px;">${formatTime(data.startTime)} - ${formatTime(data.endTime)}</div>
					</div>
				</td>
			</tr>
		</table>

		${customMessageSection}
	`;

	return generateBaseEmail({
		title: 'Booking Cancelled',
		headerGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
		headerContent,
		bodyContent,
		footerContent: 'Powered by',
		hostName: data.hostName
	});
}
