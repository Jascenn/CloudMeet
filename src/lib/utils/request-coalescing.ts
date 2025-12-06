export class RequestCoalescer {
	private pendingRequests = new Map<string, Promise<any>>();
	private batchQueues = new Map<string, { items: any[]; timer: number | null }>();

	// Coalesce identical requests
	async coalesce<T>(
		key: string,
		fetcher: () => Promise<T>
	): Promise<T> {
		if (this.pendingRequests.has(key)) {
			return this.pendingRequests.get(key) as Promise<T>;
		}

		const promise = fetcher().finally(() => {
			this.pendingRequests.delete(key);
		});

		this.pendingRequests.set(key, promise);
		return promise;
	}

	// Batch multiple operations
	async batch<T, R>(
		queueKey: string,
		item: T,
		processor: (items: T[]) => Promise<R[]>,
		delay: number = 10 // ms to wait for more items
	): Promise<R> {
		return new Promise((resolve, reject) => {
			// Initialize queue if needed
			if (!this.batchQueues.has(queueKey)) {
				this.batchQueues.set(queueKey, { items: [], timer: null });
			}

			const queue = this.batchQueues.get(queueKey)!;
			const itemIndex = queue.items.length;
			queue.items.push({ item, resolve, reject, index: itemIndex });

			// Clear existing timer
			if (queue.timer !== null) {
				clearTimeout(queue.timer);
			}

			// Set new timer
			queue.timer = setTimeout(async () => {
				const { items } = queue;
				this.batchQueues.delete(queueKey);

				if (items.length === 0) return;

				try {
					// Process all items in batch
					const batchItems = items.map(i => i.item);
					const results = await processor(batchItems);

					// Resolve individual promises
					items.forEach((item, idx) => {
						if (results[idx] !== undefined) {
							item.resolve(results[idx]);
						} else {
							item.reject(new Error('No result for batch item'));
						}
					});
				} catch (error) {
					// Reject all promises on error
					items.forEach(item => item.reject(error));
				}
			}, delay) as unknown as number;
		});
	}

	// Clear all pending operations
	clear(): void {
		this.pendingRequests.clear();
		
		this.batchQueues.forEach(queue => {
			if (queue.timer !== null) {
				clearTimeout(queue.timer);
			}
			queue.items.forEach(item => {
				item.reject(new Error('Request coalescer cleared'));
			});
		});
		
		this.batchQueues.clear();
	}
}

// Global instance for the app
export const requestCoalescer = new RequestCoalescer();

// Helper for batching availability checks
export async function batchAvailabilityCheck(
	dates: string[],
	userId: string,
	fetcher: (userId: string, dates: string[]) => Promise<Map<string, any>>
): Promise<Map<string, any>> {
	// Group dates by week for efficient caching
	const weekGroups = new Map<string, string[]>();
	
	dates.forEach(date => {
		const week = getWeekKey(new Date(date));
		if (!weekGroups.has(week)) {
			weekGroups.set(week, []);
		}
		weekGroups.get(week)!.push(date);
	});

	// Fetch each week's data
	const results = new Map<string, any>();
	
	await Promise.all(
		Array.from(weekGroups.entries()).map(async ([week, weekDates]) => {
			const weekData = await requestCoalescer.coalesce(
				`availability:${userId}:${week}`,
				() => fetcher(userId, weekDates)
			);
			
			weekData.forEach((value, date) => {
				results.set(date, value);
			});
		})
	);

	return results;
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