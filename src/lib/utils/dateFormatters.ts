/**
 * Date and time formatting utilities
 */

export type TimeFormat = '12h' | '24h';

export interface FormatterOptions {
	timeFormat?: TimeFormat;
	timezone?: string;
}

/**
 * Create a set of formatters based on user preferences
 */
export function createFormatters(options: FormatterOptions = {}) {
	const { timeFormat = '12h', timezone } = options;
	const use12Hour = timeFormat === '12h';

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
			hour12: use12Hour,
			timeZone: timezone
		}).format(date);
	};

	const formatTimeWithZone = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: use12Hour,
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
			hour12: use12Hour,
			timeZoneName: 'short',
			timeZone: timezone
		}).format(date);
	};

	const formatShortDate = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			timeZone: timezone
		}).format(date);
	};

	const formatShortDateTime = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: use12Hour,
			timeZone: timezone
		}).format(date);
	};

	const formatCompactDateTime = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	};

	const formatMonthYear = (date: Date): string => {
		return new Intl.DateTimeFormat('en-US', {
			month: 'long',
			year: 'numeric'
		}).format(date);
	};

	return {
		formatDate,
		formatTime,
		formatTimeWithZone,
		formatDateTime,
		formatShortDate,
		formatShortDateTime,
		formatCompactDateTime,
		formatMonthYear
	};
}

/**
 * Format a local date string (YYYY-MM-DD) from a Date object
 */
export function formatDateLocal(date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Format a date string for display (e.g., "Monday, January 1, 2025")
 */
export function formatSelectedDate(dateStr: string): string {
	const date = new Date(dateStr + 'T12:00:00');
	return new Intl.DateTimeFormat('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	}).format(date);
}

/**
 * Format a time range (e.g., "10:00 AM - 11:00 AM")
 */
export function formatTimeRange(
	start: string | Date,
	end: string | Date,
	options: FormatterOptions = {}
): string {
	const { formatTime } = createFormatters(options);
	const startDate = typeof start === 'string' ? new Date(start) : start;
	const endDate = typeof end === 'string' ? new Date(end) : end;
	return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}

/**
 * Format an ISO string time for display
 */
export function formatIsoTime(
	isoStr: string,
	options: FormatterOptions = {}
): string {
	const { formatTime } = createFormatters(options);
	return formatTime(new Date(isoStr));
}
