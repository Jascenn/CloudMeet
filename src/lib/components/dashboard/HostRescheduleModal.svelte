<script lang="ts">
	import { createFormatters } from '$lib/utils/dateFormatters';

	interface Booking {
		id: string;
		event_type_name: string;
		event_type_slug: string;
		attendee_name: string;
		attendee_email: string;
		start_time: string;
		end_time: string;
		event_type_id: string;
		duration_minutes: number;
	}

	interface Props {
		booking: Booking | null;
		onClose: () => void;
		onSubmit: (bookingId: string, newStartTime: string, newEndTime: string, message: string) => Promise<void>;
	}

	let { booking, onClose, onSubmit }: Props = $props();

	const { formatCompactDateTime } = createFormatters();

	let selectedDate = $state<string | null>(null);
	let selectedTime = $state<string | null>(null);
	let message = $state('');
	let submitting = $state(false);
	let error = $state<string | null>(null);
	let availableSlots = $state<Array<{ start: string; end: string }>>([]);
	let loadingSlots = $state(false);

	// Calendar state
	let currentMonth = $state(new Date());

	const monthName = $derived(currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' }));

	const calendarDays = $derived(() => {
		const year = currentMonth.getFullYear();
		const month = currentMonth.getMonth();
		const firstDay = new Date(year, month, 1);
		const lastDay = new Date(year, month + 1, 0);
		const startPadding = firstDay.getDay();

		const days: Array<{ date: Date; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }> = [];

		// Previous month padding
		for (let i = startPadding - 1; i >= 0; i--) {
			const date = new Date(year, month, -i);
			days.push({ date, isCurrentMonth: false, isToday: false, isPast: true });
		}

		// Current month
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		for (let day = 1; day <= lastDay.getDate(); day++) {
			const date = new Date(year, month, day);
			const isToday = date.toDateString() === today.toDateString();
			const isPast = date < today;
			days.push({ date, isCurrentMonth: true, isToday, isPast });
		}

		// Next month padding
		const remaining = 42 - days.length;
		for (let i = 1; i <= remaining; i++) {
			const date = new Date(year, month + 1, i);
			days.push({ date, isCurrentMonth: false, isToday: false, isPast: false });
		}

		return days;
	});

	function prevMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
	}

	function nextMonth() {
		currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
	}

	function formatDateKey(date: Date): string {
		return date.toISOString().split('T')[0];
	}

	async function selectDate(date: Date) {
		const dateKey = formatDateKey(date);
		selectedDate = dateKey;
		selectedTime = null;
		availableSlots = [];
		loadingSlots = true;
		error = null;

		try {
			// Fetch available slots for this date
			const response = await fetch(`/api/availability?date=${dateKey}&event=${booking?.event_type_slug}`);
			if (response.ok) {
				const data = await response.json();
				availableSlots = data.slots || [];
			} else {
				error = 'Failed to load available times';
			}
		} catch (err) {
			error = 'Failed to load available times';
		} finally {
			loadingSlots = false;
		}
	}

	function selectSlot(slot: { start: string; end: string }) {
		selectedTime = slot.start;
	}

	function formatSlotTime(isoString: string): string {
		const date = new Date(isoString);
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	async function handleSubmit() {
		if (!booking || !selectedDate || !selectedTime) return;

		submitting = true;
		error = null;

		try {
			const slot = availableSlots.find(s => s.start === selectedTime);
			if (!slot) {
				error = 'Please select a time slot';
				return;
			}

			await onSubmit(booking.id, slot.start, slot.end, message);
			onClose();
		} catch (err: any) {
			error = err.message || 'Failed to send reschedule proposal';
		} finally {
			submitting = false;
		}
	}

	function handleBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			onClose();
		}
	}
</script>

{#if booking}
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
		onclick={handleBackdropClick}
	>
		<div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
			<!-- Header -->
			<div class="p-6 border-b border-gray-200">
				<div class="flex justify-between items-start">
					<div>
						<h2 class="text-xl font-semibold text-gray-900">Propose New Time</h2>
						<p class="text-sm text-gray-600 mt-1">
							Current: {formatCompactDateTime(new Date(booking.start_time))}
						</p>
					</div>
					<button onclick={onClose} class="text-gray-400 hover:text-gray-600">
						<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
				<div class="mt-3 bg-gray-50 rounded-lg p-3">
					<p class="text-sm"><span class="text-gray-600">Meeting:</span> <span class="font-medium">{booking.event_type_name}</span></p>
					<p class="text-sm"><span class="text-gray-600">With:</span> <span class="font-medium">{booking.attendee_name}</span></p>
				</div>
			</div>

			<!-- Body -->
			<div class="p-6">
				{#if error}
					<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
						{error}
					</div>
				{/if}

				<div class="flex gap-6">
					<!-- Calendar -->
					<div class="flex-1">
						<div class="flex items-center justify-between mb-4">
							<button onclick={prevMonth} class="p-1 hover:bg-gray-100 rounded">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
								</svg>
							</button>
							<span class="font-medium">{monthName}</span>
							<button onclick={nextMonth} class="p-1 hover:bg-gray-100 rounded">
								<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
								</svg>
							</button>
						</div>

						<div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
							<div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
						</div>

						<div class="grid grid-cols-7 gap-1">
							{#each calendarDays() as day}
								<button
									type="button"
									disabled={day.isPast || !day.isCurrentMonth}
									onclick={() => selectDate(day.date)}
									class="aspect-square flex items-center justify-center text-sm rounded-lg transition
										{day.isCurrentMonth ? '' : 'text-gray-300'}
										{day.isPast ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-blue-50'}
										{day.isToday ? 'font-bold' : ''}
										{selectedDate === formatDateKey(day.date) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}"
								>
									{day.date.getDate()}
								</button>
							{/each}
						</div>
					</div>

					<!-- Time slots -->
					<div class="flex-1">
						<h3 class="font-medium text-gray-900 mb-3">
							{#if selectedDate}
								Available times
							{:else}
								Select a date
							{/if}
						</h3>

						{#if loadingSlots}
							<div class="text-center py-8 text-gray-500">Loading...</div>
						{:else if selectedDate && availableSlots.length === 0}
							<div class="text-center py-8 text-gray-500">No available times</div>
						{:else if selectedDate}
							<div class="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
								{#each availableSlots as slot}
									<button
										type="button"
										onclick={() => selectSlot(slot)}
										class="px-3 py-2 text-sm border rounded-lg transition
											{selectedTime === slot.start
												? 'bg-blue-600 text-white border-blue-600'
												: 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'}"
									>
										{formatSlotTime(slot.start)}
									</button>
								{/each}
							</div>
						{:else}
							<div class="text-center py-8 text-gray-400">
								<svg class="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
								</svg>
								<p class="text-sm">Pick a date to see times</p>
							</div>
						{/if}
					</div>
				</div>

				<!-- Message -->
				<div class="mt-6">
					<label for="message" class="block text-sm font-medium text-gray-700 mb-2">
						Message to attendee (optional)
					</label>
					<textarea
						id="message"
						bind:value={message}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
						placeholder="Let them know why you need to reschedule..."
					></textarea>
				</div>
			</div>

			<!-- Footer -->
			<div class="p-6 border-t border-gray-200 flex gap-3 justify-end">
				<button
					type="button"
					onclick={onClose}
					class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={handleSubmit}
					disabled={!selectedDate || !selectedTime || submitting}
					class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{submitting ? 'Sending...' : 'Send Proposal'}
				</button>
			</div>
		</div>
	</div>
{/if}
