import type { CacheEntry } from './types';

export class BrowserCache {
	private memoryCache = new Map<string, CacheEntry<any>>();
	
	get<T>(key: string): T | null {
		// Try memory cache first
		const memEntry = this.memoryCache.get(key);
		if (memEntry && this.isValid(memEntry)) {
			return memEntry.data;
		}
		
		// Try localStorage
		try {
			const stored = localStorage.getItem(`cache:${key}`);
			if (!stored) return null;
			
			const entry: CacheEntry<T> = JSON.parse(stored);
			if (!this.isValid(entry)) {
				localStorage.removeItem(`cache:${key}`);
				return null;
			}
			
			// Store in memory cache for faster access
			this.memoryCache.set(key, entry);
			return entry.data;
		} catch {
			return null;
		}
	}
	
	set<T>(key: string, data: T, ttl: number): void {
		const entry: CacheEntry<T> = {
			data,
			timestamp: Date.now(),
			ttl
		};
		
		// Store in memory
		this.memoryCache.set(key, entry);
		
		// Store in localStorage
		try {
			localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
		} catch (e) {
			// Handle quota exceeded
			this.clearOldest();
			try {
				localStorage.setItem(`cache:${key}`, JSON.stringify(entry));
			} catch {
				console.warn('LocalStorage quota exceeded');
			}
		}
	}
	
	delete(key: string): void {
		this.memoryCache.delete(key);
		try {
			localStorage.removeItem(`cache:${key}`);
		} catch {}
	}
	
	clear(): void {
		this.memoryCache.clear();
		try {
			const keys = Object.keys(localStorage);
			keys.forEach(key => {
				if (key.startsWith('cache:')) {
					localStorage.removeItem(key);
				}
			});
		} catch {}
	}
	
	private isValid<T>(entry: CacheEntry<T>): boolean {
		const now = Date.now();
		return now - entry.timestamp <= entry.ttl * 1000;
	}
	
	private clearOldest(): void {
		try {
			const cacheKeys: { key: string; timestamp: number }[] = [];
			
			for (let i = 0; i < localStorage.length; i++) {
				const key = localStorage.key(i);
				if (key?.startsWith('cache:')) {
					try {
						const entry = JSON.parse(localStorage.getItem(key) || '{}');
						if (entry.timestamp) {
							cacheKeys.push({ key, timestamp: entry.timestamp });
						}
					} catch {}
				}
			}
			
			// Sort by timestamp and remove oldest 25%
			cacheKeys.sort((a, b) => a.timestamp - b.timestamp);
			const toRemove = Math.ceil(cacheKeys.length * 0.25);
			
			for (let i = 0; i < toRemove; i++) {
				localStorage.removeItem(cacheKeys[i].key);
			}
		} catch {}
	}
}

// Singleton instance
export const browserCache = new BrowserCache();