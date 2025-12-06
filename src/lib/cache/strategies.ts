import type { KVCache } from './kv-cache';
import type { D1Database } from '@cloudflare/workers-types';
import { CACHE_STRATEGIES } from './types';

export interface CacheContext {
	kv: KVCache;
	db: D1Database;
}

export async function getAvailabilityWithCache(
	ctx: CacheContext,
	userId: string,
	date: string
): Promise<any> {
	const strategy = CACHE_STRATEGIES.AVAILABILITY(userId, date);
	
	// Try KV cache first
	const cached = await ctx.kv.get(strategy);
	if (cached) return cached;
	
	// Check if we need to sync
	const syncStrategy = CACHE_STRATEGIES.LAST_SYNC(userId);
	const lastSync = await ctx.kv.get<number>(syncStrategy);
	const now = Date.now();
	
	if (!lastSync || now - lastSync > 300000) { // 5 minutes
		// Sync needed, but use lock to prevent multiple syncs
		const lockStrategy = CACHE_STRATEGIES.SYNC_LOCK(userId);
		await ctx.kv.getWithLock(
			strategy,
			lockStrategy,
			async () => {
				// Sync calendar data here
				await syncGoogleCalendarIncremental(ctx, userId);
				
				// Calculate availability
				const availability = await calculateAvailability(ctx, userId, date);
				
				// Update last sync time
				await ctx.kv.set(syncStrategy, now);
				
				return availability;
			}
		);
	}
	
	// Calculate from cached data
	const availability = await calculateAvailability(ctx, userId, date);
	
	// Cache the result
	await ctx.kv.set(strategy, availability);
	
	return availability;
}

async function syncGoogleCalendarIncremental(ctx: CacheContext, userId: string): Promise<void> {
	// This would be implemented with actual Google Calendar API
	// For now, it's a placeholder
	const weekKey = getWeekKey(new Date());
	const calendarStrategy = CACHE_STRATEGIES.CALENDAR(userId, weekKey);
	
	// Simulate fetching calendar data
	const calendarData = {
		busySlots: [],
		syncToken: 'mock-sync-token'
	};
	
	// Cache calendar data
	await ctx.kv.set(calendarStrategy, calendarData);
	
	// Update sync token in database
	await ctx.db.prepare(
		'UPDATE users SET sync_token = ?, last_sync = ? WHERE id = ?'
	).bind(calendarData.syncToken, new Date().toISOString(), userId).run();
}

async function calculateAvailability(
	ctx: CacheContext,
	userId: string,
	date: string
): Promise<any> {
	// Get cached rules
	const rulesStrategy = CACHE_STRATEGIES.AVAILABILITY_RULES(userId);
	let rules = await ctx.kv.get<any[]>(rulesStrategy);

	if (!rules) {
		// Fetch from database
		const result = await ctx.db.prepare(`
			SELECT day_of_week, start_time, end_time
			FROM availability_rules
			WHERE user_id = ?
		`).bind(userId).all();

		rules = result.results as any[];
		await ctx.kv.set(rulesStrategy, rules);
	}

	// Get cached calendar data
	const weekKey = getWeekKey(new Date(date));
	const calendarStrategy = CACHE_STRATEGIES.CALENDAR(userId, weekKey);
	const calendarData = await ctx.kv.get<{ busySlots: any[] }>(calendarStrategy) || { busySlots: [] };

	// Get bookings for the date
	const bookingsStrategy = CACHE_STRATEGIES.BOOKINGS(date);
	let bookings = await ctx.kv.get<any[]>(bookingsStrategy);

	if (!bookings) {
		const result = await ctx.db.prepare(`
			SELECT start_time, end_time
			FROM bookings
			WHERE DATE(start_time) = ? AND canceled = 0
		`).bind(date).all();

		bookings = result.results as any[];
		await ctx.kv.set(bookingsStrategy, bookings);
	}

	// Calculate available slots
	const slots = calculateSlots(rules || [], calendarData.busySlots, bookings || [], date);
	
	return {
		date,
		slots,
		cached: true,
		lastSync: new Date().toISOString()
	};
}

function calculateSlots(rules: any[], busySlots: any[], bookings: any[], date: string): any[] {
	// Implementation would merge rules with busy times
	// For now, return mock data
	const dayOfWeek = new Date(date).getDay();
	const dayRules = rules.filter(r => r.day_of_week === dayOfWeek);
	
	const slots: any[] = [];
	
	dayRules.forEach(rule => {
		// Generate slots based on rules, excluding busy times
		const startHour = parseInt(rule.start_time.split(':')[0]);
		const endHour = parseInt(rule.end_time.split(':')[0]);
		
		for (let hour = startHour; hour < endHour; hour++) {
			slots.push({
				start: `${hour}:00`,
				end: `${hour + 1}:00`,
				available: true
			});
		}
	});
	
	return slots;
}

function getWeekKey(date: Date): string {
	const year = date.getFullYear();
	const week = getWeekNumber(date);
	return `${year}-W${week}`;
}

function getWeekNumber(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Request coalescing for batch operations
const pendingRequests = new Map<string, Promise<any>>();

export async function coalescedFetch<T>(
	key: string,
	fetcher: () => Promise<T>
): Promise<T> {
	if (pendingRequests.has(key)) {
		return pendingRequests.get(key) as Promise<T>;
	}
	
	const promise = fetcher();
	pendingRequests.set(key, promise);
	
	try {
		return await promise;
	} finally {
		pendingRequests.delete(key);
	}
}