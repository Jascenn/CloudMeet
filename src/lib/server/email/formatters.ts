/**
 * Email date/time formatters
 */

import type { BookingEmailData } from './types';

export interface EmailFormatters {
	formatDate: (date: Date) => string;
	formatTime: (date: Date) => string;
	formatDateTime: (date: Date) => string;
}

/**
 * Create formatters based on user preferences
 */
export function createEmailFormatters(timeFormat: '12h' | '24h' = '12h', timezone?: string): EmailFormatters {
	const formatDate = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			timeZone: timezone
		}).format(date);
	};

	const formatTime = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: timeFormat === '12h',
			timeZoneName: 'short',
			timeZone: timezone
		}).format(date);
	};

	const formatDateTime = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: timeFormat === '12h',
			timeZoneName: 'short',
			timeZone: timezone
		}).format(date);
	};

	return { formatDate, formatTime, formatDateTime };
}

/**
 * Replace template variables in subject
 */
export function replaceSubjectVariables(subject: string, data: BookingEmailData): string {
	const formatDate = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).format(date);
	};

	const formatTime = (date: Date) => {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	};

	return subject
		.replace(/{event_name}/g, data.eventName)
		.replace(/{host_name}/g, data.hostName)
		.replace(/{attendee_name}/g, data.attendeeName)
		.replace(/{date}/g, formatDate(data.startTime))
		.replace(/{time}/g, formatTime(data.startTime));
}
