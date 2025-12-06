<script lang="ts">
	import { formatSelectedDate } from '$lib/utils/dateFormatters';

	interface TimeSlot {
		start: string;
		end: string;
	}

	interface Props {
		selectedDate: string;
		availableSlots: TimeSlot[];
		selectedSlot: TimeSlot | null;
		loading: boolean;
		brandColor: string;
		formatTime: (isoStr: string) => string;
		onSelectSlot: (slot: TimeSlot) => void;
		onConfirm: () => void;
	}

	let {
		selectedDate,
		availableSlots,
		selectedSlot,
		loading,
		brandColor,
		formatTime,
		onSelectSlot,
		onConfirm
	}: Props = $props();
</script>

<div class="w-52 ml-6 border-l border-gray-200 pl-6 flex flex-col" style="max-height: 400px;">
	<h3 class="text-sm font-medium text-gray-500 mb-4 flex-shrink-0">
		{formatSelectedDate(selectedDate).split(',')[0]}
	</h3>

	{#if loading}
		<div class="flex items-center justify-center py-8">
			<div class="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent" style="border-color: {brandColor}; border-top-color: transparent"></div>
		</div>
	{:else if availableSlots.length === 0}
		<p class="text-sm text-gray-500 py-4">No available times</p>
	{:else}
		<div class="space-y-2 overflow-y-auto flex-1 pr-2 pb-2 scrollbar-thin">
			{#each availableSlots as slot}
				{#if selectedSlot === slot}
					<div class="flex gap-2">
						<button type="button" class="flex-1 py-2.5 px-3 border-2 border-gray-900 bg-gray-900 text-white rounded-lg text-sm font-semibold">
							{formatTime(slot.start)}
						</button>
						<button
							type="button"
							onclick={onConfirm}
							class="flex-1 py-2.5 px-3 text-white rounded-lg text-sm font-semibold transition"
							style="background-color: {brandColor}"
						>
							Next
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={() => onSelectSlot(slot)}
						class="w-full py-2.5 px-3 border-2 rounded-lg text-sm font-semibold transition"
						style="border-color: {brandColor}; color: {brandColor}"
					>
						{formatTime(slot.start)}
					</button>
				{/if}
			{/each}
		</div>
	{/if}
</div>
