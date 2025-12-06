import type { KVCache } from '$lib/cache/kv-cache';
import type { D1Database } from '@cloudflare/workers-types';
import { CACHE_STRATEGIES } from '$lib/cache/types';

export class APIMonitor {
	constructor(
		private kv: KVCache,
		private db: D1Database,
		private limits = {
			daily: {
				kv_reads: 100000,
				kv_writes: 1000,
				d1_queries: 1000
			},
			warning_threshold: 0.8 // Warn at 80% usage
		}
	) {}

	async trackKVRead(): Promise<boolean> {
		return this.track('kv_reads');
	}

	async trackKVWrite(): Promise<boolean> {
		return this.track('kv_writes');
	}

	async trackD1Query(): Promise<boolean> {
		return this.track('d1_queries');
	}

	private async track(type: 'kv_reads' | 'kv_writes' | 'd1_queries'): Promise<boolean> {
		const today = new Date().toISOString().split('T')[0];
		const key = `api-usage:${type}:${today}`;
		
		// Increment counter
		const count = await this.kv.increment(key, 86400); // 24 hour TTL
		
		// Check if we're approaching limits
		const limit = this.limits.daily[type];
		const threshold = limit * this.limits.warning_threshold;
		
		if (count >= limit) {
			console.error(`API limit exceeded for ${type}: ${count}/${limit}`);
			return false; // Should serve from cache only
		}
		
		if (count >= threshold) {
			console.warn(`API usage warning for ${type}: ${count}/${limit} (${Math.round(count/limit*100)}%)`);
		}
		
		// Log to D1 for long-term tracking (batched)
		if (count % 100 === 0) { // Only log every 100 requests
			await this.logToDatabase(type, today, count);
		}
		
		return true; // OK to proceed
	}

	private async logToDatabase(type: string, date: string, count: number): Promise<void> {
		try {
			await this.db.prepare(`
				INSERT INTO api_usage (date, endpoint, count)
				VALUES (?, ?, ?)
				ON CONFLICT(date, endpoint) 
				DO UPDATE SET count = excluded.count
			`).bind(date, type, count).run();
		} catch (error) {
			console.error('Failed to log API usage to database:', error);
		}
	}

	async getUsageStats(): Promise<{
		today: Record<string, number>;
		limits: { kv_reads: number; kv_writes: number; d1_queries: number };
		percentages: Record<string, number>;
	}> {
		const today = new Date().toISOString().split('T')[0];
		const stats: Record<string, number> = {};
		const percentages: Record<string, number> = {};

		for (const type of ['kv_reads', 'kv_writes', 'd1_queries'] as const) {
			const key = `api-usage:${type}:${today}`;
			const strategy = { key, ttl: 86400 };
			const count = parseInt(await this.kv.get<string>(strategy) || '0');
			stats[type] = count;
			percentages[type] = Math.round((count / this.limits.daily[type]) * 100);
		}
		
		return {
			today: stats,
			limits: this.limits.daily,
			percentages
		};
	}
}

// Middleware to track API usage
export function createAPIMiddleware(monitor: APIMonitor) {
	return async function trackUsage(
		request: Request,
		env: App.Platform['env'],
		next: () => Promise<Response>
	): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;
		
		// Track based on endpoint patterns
		if (path.startsWith('/api/availability')) {
			const canProceed = await monitor.trackKVRead();
			if (!canProceed) {
				// Serve cached response only
				return new Response(
					JSON.stringify({ 
						error: 'Rate limit exceeded', 
						cached: true,
						message: 'Serving cached data only'
					}),
					{ 
						status: 200, // Still 200 to not break the app
						headers: {
							'Content-Type': 'application/json',
							'X-Cache-Only': 'true'
						}
					}
				);
			}
		}
		
		return next();
	};
}