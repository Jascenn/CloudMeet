import type { PagesFunction } from '@cloudflare/workers-types';
import { KVCache } from '../../../src/lib/cache/kv-cache';
import { CACHE_STRATEGIES } from '../../../src/lib/cache/types';
import { APIMonitor } from '../../../src/lib/utils/api-monitor';
import { getAvailabilityWithCache } from '../../../src/lib/cache/strategies';

export const onRequestGet: PagesFunction<{
	KV: KVNamespace;
	DB: D1Database;
}> = async (context) => {
	const { request, env } = context;
	const url = new URL(request.url);
	const userId = url.searchParams.get('userId');
	const date = url.searchParams.get('date');
	
	if (!userId || !date) {
		return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	
	// Initialize services
	const kv = new KVCache(env.KV);
	const monitor = new APIMonitor(kv, env.DB);
	
	// Track API usage
	const canProceed = await monitor.trackKVRead();
	if (!canProceed) {
		// Serve stale cache if available
		const strategy = CACHE_STRATEGIES.AVAILABILITY(userId, date);
		const staleData = await kv.get(strategy);
		
		if (staleData) {
			return new Response(JSON.stringify({
				...staleData,
				stale: true,
				reason: 'API limit exceeded'
			}), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'public, max-age=300',
					'X-Cache-Status': 'stale'
				}
			});
		}
		
		return new Response(JSON.stringify({ 
			error: 'Service temporarily unavailable',
			retry: 300 
		}), {
			status: 503,
			headers: { 'Content-Type': 'application/json' }
		});
	}
	
	try {
		// Get availability with caching
		const availability = await getAvailabilityWithCache(
			{ kv, db: env.DB },
			userId,
			date
		);
		
		return new Response(JSON.stringify(availability), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=300, s-maxage=300',
				'CDN-Cache-Control': 'max-age=300',
				'X-Cache-Status': availability.cached ? 'hit' : 'miss'
			}
		});
	} catch (error) {
		console.error('Availability API error:', error);
		
		// Try to serve from cache on error
		const strategy = CACHE_STRATEGIES.AVAILABILITY(userId, date);
		const cachedData = await kv.get(strategy);
		
		if (cachedData) {
			return new Response(JSON.stringify({
				...cachedData,
				fallback: true
			}), {
				status: 200,
				headers: {
					'Content-Type': 'application/json',
					'X-Cache-Status': 'fallback'
				}
			});
		}
		
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

// Batch endpoint for fetching multiple dates
export const onRequestPost: PagesFunction<{
	KV: KVNamespace;
	DB: D1Database;
}> = async (context) => {
	const { request, env } = context;
	
	try {
		const { userId, dates } = await request.json();
		
		if (!userId || !Array.isArray(dates)) {
			return new Response(JSON.stringify({ error: 'Invalid request' }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		
		const kv = new KVCache(env.KV);
		const monitor = new APIMonitor(kv, env.DB);
		
		// Check if we can proceed
		await monitor.trackKVRead();
		
		// Process in batches to optimize cache hits
		const results = new Map();
		const uncachedDates = [];
		
		// Check cache first
		for (const date of dates) {
			const strategy = CACHE_STRATEGIES.AVAILABILITY(userId, date);
			const cached = await kv.get(strategy);
			
			if (cached) {
				results.set(date, cached);
			} else {
				uncachedDates.push(date);
			}
		}
		
		// Fetch uncached dates if any
		if (uncachedDates.length > 0) {
			// Group by week for efficient fetching
			const weekGroups = groupDatesByWeek(uncachedDates);
			
			for (const [week, weekDates] of weekGroups) {
				const weekData = await fetchWeekAvailability(env.DB, userId, week);
				
				// Cache and add to results
				for (const date of weekDates) {
					const dayData = extractDayFromWeek(weekData, date);
					const strategy = CACHE_STRATEGIES.AVAILABILITY(userId, date);
					await kv.set(strategy, dayData);
					results.set(date, dayData);
				}
			}
		}
		
		// Convert map to object
		const response = Object.fromEntries(results);
		
		return new Response(JSON.stringify(response), {
			status: 200,
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'public, max-age=300'
			}
		});
	} catch (error) {
		console.error('Batch availability error:', error);
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};

function groupDatesByWeek(dates: string[]): Map<string, string[]> {
	const groups = new Map<string, string[]>();
	
	dates.forEach(date => {
		const week = getWeekKey(new Date(date));
		if (!groups.has(week)) {
			groups.set(week, []);
		}
		groups.get(week)!.push(date);
	});
	
	return groups;
}

function getWeekKey(date: Date): string {
	const year = date.getFullYear();
	const week = Math.ceil((((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
	return `${year}-W${week}`;
}

async function fetchWeekAvailability(db: D1Database, userId: string, week: string): Promise<any> {
	// This would fetch from database/calendar
	// For demo, return mock data
	return {
		week,
		days: {}
	};
}

function extractDayFromWeek(weekData: any, date: string): any {
	// Extract specific day from week data
	return {
		date,
		slots: [],
		cached: true
	};
}