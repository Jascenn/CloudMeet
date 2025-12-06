export interface CacheEntry<T> {
	data: T;
	timestamp: number;
	ttl: number;
}

export interface CacheStrategy {
	key: string;
	ttl: number;
}

export const CACHE_STRATEGIES = {
	AVAILABILITY: (userId: string, date: string): CacheStrategy => ({
		key: `availability:${userId}:${date}`,
		ttl: 300 // 5 minutes
	}),
	CALENDAR: (userId: string, week: string): CacheStrategy => ({
		key: `calendar:${userId}:${week}`,
		ttl: 900 // 15 minutes
	}),
	EVENTS: (userId: string): CacheStrategy => ({
		key: `events:${userId}`,
		ttl: 3600 // 1 hour
	}),
	BOOKINGS: (date: string): CacheStrategy => ({
		key: `bookings:${date}`,
		ttl: 60 // 1 minute
	}),
	SYNC_LOCK: (userId: string): CacheStrategy => ({
		key: `sync-lock:${userId}`,
		ttl: 60 // 1 minute
	}),
	LAST_SYNC: (userId: string): CacheStrategy => ({
		key: `lastsync:${userId}`,
		ttl: 300 // 5 minutes
	}),
	API_USAGE: (date: string): CacheStrategy => ({
		key: `api-calls:${date}`,
		ttl: 86400 // 24 hours
	}),
	AVAILABILITY_RULES: (userId: string): CacheStrategy => ({
		key: `rules:${userId}`,
		ttl: 3600 // 1 hour
	})
} as const;