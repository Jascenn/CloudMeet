import type { CacheEntry, CacheStrategy } from './types';

export class KVCache {
	constructor(private kv: KVNamespace) {}

	async get<T>(strategy: CacheStrategy): Promise<T | null> {
		try {
			const cached = await this.kv.get<CacheEntry<T>>(strategy.key, 'json');
			if (!cached) return null;
			
			// Check if cache is still valid
			const now = Date.now();
			if (now - cached.timestamp > cached.ttl * 1000) {
				// Cache expired
				await this.delete(strategy.key);
				return null;
			}
			
			return cached.data;
		} catch (error) {
			console.error(`KV Cache get error for ${strategy.key}:`, error);
			return null;
		}
	}

	async set<T>(strategy: CacheStrategy, data: T): Promise<void> {
		try {
			const entry: CacheEntry<T> = {
				data,
				timestamp: Date.now(),
				ttl: strategy.ttl
			};
			
			await this.kv.put(strategy.key, JSON.stringify(entry), {
				expirationTtl: strategy.ttl
			});
		} catch (error) {
			console.error(`KV Cache set error for ${strategy.key}:`, error);
		}
	}

	async delete(key: string): Promise<void> {
		try {
			await this.kv.delete(key);
		} catch (error) {
			console.error(`KV Cache delete error for ${key}:`, error);
		}
	}

	async increment(key: string, ttl: number = 86400): Promise<number> {
		try {
			const current = await this.kv.get(key);
			const value = current ? parseInt(current) + 1 : 1;
			await this.kv.put(key, value.toString(), { expirationTtl: ttl });
			return value;
		} catch (error) {
			console.error(`KV Cache increment error for ${key}:`, error);
			return 0;
		}
	}

	async getWithLock<T>(
		dataStrategy: CacheStrategy,
		lockStrategy: CacheStrategy,
		fetcher: () => Promise<T>
	): Promise<T | null> {
		// Check cache first
		const cached = await this.get<T>(dataStrategy);
		if (cached) return cached;
		
		// Check if locked
		const lock = await this.get<boolean>(lockStrategy);
		if (lock) {
			// Wait a bit and try to get cached data again
			await new Promise(resolve => setTimeout(resolve, 100));
			return this.get<T>(dataStrategy);
		}
		
		// Set lock
		await this.set(lockStrategy, true);
		
		try {
			// Fetch fresh data
			const data = await fetcher();
			
			// Cache the data
			await this.set(dataStrategy, data);
			
			return data;
		} finally {
			// Release lock
			await this.delete(lockStrategy.key);
		}
	}
}