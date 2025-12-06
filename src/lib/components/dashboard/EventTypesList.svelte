<script lang="ts">
	interface EventType {
		id: string;
		name: string;
		slug: string;
		duration: number;
		description?: string | null;
		is_active: boolean;
	}

	interface Props {
		eventTypes: EventType[];
	}

	let { eventTypes }: Props = $props();
</script>

<div>
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-xl font-bold text-gray-900">Event Types</h2>
		<a
			href="/dashboard/event-types/new"
			class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
		>
			+ New Event Type
		</a>
	</div>

	<div class="space-y-4">
		{#if eventTypes && eventTypes.length > 0}
			{#each eventTypes as eventType}
				<div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
					<div class="flex justify-between items-start mb-2">
						<div>
							<h3 class="font-semibold text-gray-900">{eventType.name}</h3>
							<p class="text-sm text-gray-600">{eventType.duration} minutes</p>
						</div>
						<span
							class="px-2 py-1 text-xs rounded-full {eventType.is_active
								? 'bg-green-100 text-green-800'
								: 'bg-gray-100 text-gray-800'}"
						>
							{eventType.is_active ? 'Active' : 'Inactive'}
						</span>
					</div>
					{#if eventType.description}
						<p class="text-sm text-gray-600 mb-3">{eventType.description}</p>
					{/if}
					<div class="flex gap-2">
						<a
							href="/{eventType.slug}"
							target="_blank"
							class="text-sm text-blue-600 hover:text-blue-700"
						>
							View Page
						</a>
						<span class="text-gray-300">|</span>
						<a
							href="/dashboard/event-types/{eventType.id}"
							class="text-sm text-blue-600 hover:text-blue-700"
						>
							Edit
						</a>
					</div>
				</div>
			{/each}
		{:else}
			<div class="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
				<p class="text-gray-600 mb-4">No event types yet</p>
				<a
					href="/dashboard/event-types/new"
					class="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
				>
					Create Your First Event Type
				</a>
			</div>
		{/if}
	</div>
</div>
