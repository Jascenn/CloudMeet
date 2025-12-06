<script lang="ts">
	import { createFormatters } from '$lib/utils/dateFormatters';

	interface Booking {
		id: string;
		event_type_name: string;
		event_type_slug: string;
		event_type_id: string;
		duration_minutes: number;
		attendee_name: string;
		attendee_email: string;
		start_time: string;
		end_time: string;
		status: string;
		attendee_notes?: string | null;
		canceled_by?: string | null;
		cancellation_reason?: string | null;
	}

	interface Props {
		bookings: Booking[];
		onCancelClick: (bookingId: string) => void;
		onRescheduleClick: (bookingId: string) => void;
	}

	let { bookings, onCancelClick, onRescheduleClick }: Props = $props();

	const { formatCompactDateTime } = createFormatters();

	let sortOrder = $state<'last_booked' | 'upcoming'>('last_booked');

	const sortedBookings = $derived(() => {
		if (!bookings) return [];
		const sorted = [...bookings];
		if (sortOrder === 'upcoming') {
			// Sort by start_time ascending, showing soonest meeting first
			sorted.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
		}
		// 'last_booked' keeps the default order (already sorted by created_at DESC from server)
		return sorted;
	});

	function getStatusColor(status: string) {
		switch (status) {
			case 'confirmed':
				return 'bg-green-100 text-green-800';
			case 'canceled':
				return 'bg-red-100 text-red-800';
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}
</script>

<div>
	<div class="flex justify-between items-center mb-4">
		<h2 class="text-xl font-bold text-gray-900">Upcoming Bookings</h2>
		<select
			bind:value={sortOrder}
			class="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
		>
			<option value="last_booked">Last booked</option>
			<option value="upcoming">Upcoming first</option>
		</select>
	</div>

	<div class="space-y-4">
		{#if sortedBookings().length > 0}
			{#each sortedBookings() as booking}
				<div class="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
					<div class="flex justify-between items-start mb-2">
						<div>
							<h3 class="font-semibold text-gray-900">{booking.event_type_name}</h3>
							<p class="text-sm text-gray-600">{booking.attendee_name}</p>
							<p class="text-xs text-gray-500">{booking.attendee_email}</p>
						</div>
						<div class="flex items-center gap-2">
							<span class="px-2 py-1 text-xs rounded-full {getStatusColor(booking.status)}">
								{booking.status}
							</span>
							{#if booking.status === 'confirmed'}
								<button
									onclick={() => onRescheduleClick(booking.id)}
									class="text-xs text-blue-600 hover:text-blue-700 font-medium"
								>
									Reschedule
								</button>
								<button
									onclick={() => onCancelClick(booking.id)}
									class="text-xs text-red-600 hover:text-red-700 font-medium"
								>
									Cancel
								</button>
							{/if}
						</div>
					</div>
					<div class="text-sm text-gray-700 mt-2">
						<p>{formatCompactDateTime(new Date(booking.start_time))}</p>
					</div>
					{#if booking.attendee_notes}
						<div class="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
							<span class="font-medium">Message:</span> {booking.attendee_notes}
						</div>
					{/if}
					{#if booking.status === 'canceled'}
						<div class="mt-2 text-sm text-red-600 bg-red-50 rounded p-2">
							<span class="font-medium">Cancelled by {booking.canceled_by === 'host' ? 'you' : 'attendee'}</span>
							{#if booking.cancellation_reason}
								<span class="text-red-500">: {booking.cancellation_reason}</span>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{:else}
			<div class="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-200">
				<p class="text-gray-600">No bookings yet</p>
			</div>
		{/if}
	</div>
</div>
