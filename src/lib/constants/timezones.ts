/**
 * Timezone constants and utilities
 */

export interface TimezoneOption {
	value: string;
	label: string;
}

/**
 * Quick lookup for common timezone labels
 */
export const TIMEZONE_LABELS: Record<string, string> = {
	'America/Los_Angeles': 'Pacific Time',
	'America/Denver': 'Mountain Time',
	'America/Chicago': 'Central Time',
	'America/New_York': 'Eastern Time',
	'America/Anchorage': 'Alaska Time',
	'America/Phoenix': 'Arizona Time',
	'Pacific/Honolulu': 'Hawaii Time',
	'America/St_Johns': 'Newfoundland Time',
	'America/Halifax': 'Atlantic Time',
	'America/Sao_Paulo': 'Brasilia Time',
	'America/Buenos_Aires': 'Buenos Aires Time',
	'America/Mexico_City': 'Mexico City Time',
	'Europe/London': 'UK, Ireland Time',
	'Europe/Paris': 'Central European Time',
	'Europe/Amsterdam': 'Amsterdam Time',
	'Europe/Berlin': 'Berlin Time',
	'Europe/Helsinki': 'Eastern European Time',
	'Europe/Moscow': 'Moscow Time',
	'Europe/Istanbul': 'Turkey Time',
	'Asia/Dubai': 'Dubai Time',
	'Asia/Kolkata': 'India Time',
	'Asia/Bangkok': 'Indochina Time',
	'Asia/Singapore': 'Singapore Time',
	'Asia/Shanghai': 'China Time',
	'Asia/Hong_Kong': 'Hong Kong Time',
	'Asia/Tokyo': 'Japan Time',
	'Asia/Seoul': 'Seoul Time',
	'Australia/Sydney': 'Sydney Time',
	'Australia/Brisbane': 'Brisbane Time',
	'Australia/Perth': 'Perth Time',
	'Pacific/Auckland': 'Auckland Time',
	'UTC': 'UTC Time'
};

/**
 * Comprehensive timezone list grouped by region
 */
export const TIMEZONE_GROUPS: Record<string, TimezoneOption[]> = {
	'US/Canada': [
		{ value: 'America/Los_Angeles', label: 'Pacific Time - US & Canada' },
		{ value: 'America/Denver', label: 'Mountain Time - US & Canada' },
		{ value: 'America/Chicago', label: 'Central Time - US & Canada' },
		{ value: 'America/New_York', label: 'Eastern Time - US & Canada' },
		{ value: 'America/Anchorage', label: 'Alaska Time' },
		{ value: 'America/Phoenix', label: 'Arizona Time' },
		{ value: 'America/St_Johns', label: 'Newfoundland Time' },
		{ value: 'Pacific/Honolulu', label: 'Hawaii Time' }
	],
	'America': [
		{ value: 'America/Buenos_Aires', label: 'Buenos Aires Time' },
		{ value: 'America/Sao_Paulo', label: 'Brasilia Time' },
		{ value: 'America/Santiago', label: 'Santiago Time' },
		{ value: 'America/Bogota', label: 'Bogota, Lima Time' },
		{ value: 'America/Caracas', label: 'Caracas Time' },
		{ value: 'America/Mexico_City', label: 'Mexico City Time' },
		{ value: 'America/Halifax', label: 'Atlantic Time' },
		{ value: 'America/Montevideo', label: 'Montevideo Time' }
	],
	'Europe': [
		{ value: 'Europe/London', label: 'UK, Ireland, Lisbon Time' },
		{ value: 'Europe/Paris', label: 'Central European Time' },
		{ value: 'Europe/Helsinki', label: 'Eastern European Time' },
		{ value: 'Europe/Moscow', label: 'Moscow Time' },
		{ value: 'Europe/Istanbul', label: 'Turkey Time' },
		{ value: 'Europe/Minsk', label: 'Minsk Time' },
		{ value: 'Europe/Amsterdam', label: 'Amsterdam Time' },
		{ value: 'Europe/Berlin', label: 'Berlin Time' },
		{ value: 'Europe/Rome', label: 'Rome Time' },
		{ value: 'Europe/Madrid', label: 'Madrid Time' },
		{ value: 'Europe/Stockholm', label: 'Stockholm Time' },
		{ value: 'Europe/Warsaw', label: 'Warsaw Time' },
		{ value: 'Europe/Athens', label: 'Athens Time' },
		{ value: 'Europe/Zurich', label: 'Zurich Time' }
	],
	'Asia': [
		{ value: 'Asia/Dubai', label: 'Dubai Time' },
		{ value: 'Asia/Kolkata', label: 'India, Sri Lanka Time' },
		{ value: 'Asia/Bangkok', label: 'Indochina Time' },
		{ value: 'Asia/Singapore', label: 'Singapore, Perth Time' },
		{ value: 'Asia/Shanghai', label: 'China Time' },
		{ value: 'Asia/Hong_Kong', label: 'Hong Kong Time' },
		{ value: 'Asia/Tokyo', label: 'Japan, Korea Time' },
		{ value: 'Asia/Seoul', label: 'Seoul Time' },
		{ value: 'Asia/Jakarta', label: 'Jakarta Time' },
		{ value: 'Asia/Manila', label: 'Manila Time' },
		{ value: 'Asia/Karachi', label: 'Pakistan Time' },
		{ value: 'Asia/Tehran', label: 'Tehran Time' },
		{ value: 'Asia/Jerusalem', label: 'Israel Time' },
		{ value: 'Asia/Beirut', label: 'Lebanon Time' },
		{ value: 'Asia/Baghdad', label: 'Baghdad Time' },
		{ value: 'Asia/Kabul', label: 'Kabul Time' },
		{ value: 'Asia/Kathmandu', label: 'Kathmandu Time' },
		{ value: 'Asia/Vladivostok', label: 'Vladivostok Time' },
		{ value: 'Asia/Yekaterinburg', label: 'Yekaterinburg Time' }
	],
	'Africa': [
		{ value: 'Africa/Cairo', label: 'Cairo Time' },
		{ value: 'Africa/Lagos', label: 'West Africa Time' },
		{ value: 'Africa/Johannesburg', label: 'South Africa Time' },
		{ value: 'Africa/Nairobi', label: 'East Africa Time' },
		{ value: 'Africa/Casablanca', label: 'Casablanca Time' }
	],
	'Australia': [
		{ value: 'Australia/Sydney', label: 'Sydney, Melbourne Time' },
		{ value: 'Australia/Brisbane', label: 'Brisbane Time' },
		{ value: 'Australia/Adelaide', label: 'Adelaide Time' },
		{ value: 'Australia/Perth', label: 'Perth Time' },
		{ value: 'Australia/Darwin', label: 'Darwin Time' }
	],
	'Pacific': [
		{ value: 'Pacific/Auckland', label: 'Auckland Time' },
		{ value: 'Pacific/Fiji', label: 'Fiji Time' },
		{ value: 'Pacific/Guam', label: 'Guam Time' },
		{ value: 'Pacific/Tahiti', label: 'Tahiti Time' }
	],
	'Atlantic': [
		{ value: 'Atlantic/Azores', label: 'Azores Time' },
		{ value: 'Atlantic/Cape_Verde', label: 'Cape Verde Time' },
		{ value: 'Atlantic/Reykjavik', label: 'Iceland Time' }
	],
	'UTC': [
		{ value: 'UTC', label: 'UTC Time' }
	]
};

/**
 * Get a friendly label for a timezone
 */
export function getTimezoneLabel(tz: string): string {
	return TIMEZONE_LABELS[tz] || tz.replace(/_/g, ' ').split('/').pop() || tz;
}

/**
 * Detect the user's timezone
 */
export function detectTimezone(): string {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		return 'Europe/Amsterdam';
	}
}

/**
 * Get the current time in a specific timezone
 */
export function getCurrentTime(tz: string, use12Hour = true): string {
	try {
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: use12Hour,
			timeZone: tz
		}).format(new Date());
	} catch {
		return '--:--';
	}
}

/**
 * Get timezone label with current time
 */
export function getTimezoneWithTime(tz: string, use12Hour = true): string {
	return `${getTimezoneLabel(tz)} (${getCurrentTime(tz, use12Hour)})`;
}
