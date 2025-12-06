<script lang="ts">
	import { createFormatters } from '$lib/utils/dateFormatters';

	interface Booking {
		id: string;
		event_type_name: string;
		attendee_name: string;
		attendee_email: string;
		start_time: string;
		status: string;
	}

	interface Props {
		booking: Booking | null;
		show: boolean;
		onClose: () => void;
		onCancel: (message: string) => Promise<void>;
	}

	let { booking, show, onClose, onCancel }: Props = $props();

	let cancelMessage = $state('');
	let cancelError = $state('');
	let cancelling = $state(false);

	const { formatCompactDateTime } = createFormatters();

	async function handleCancel() {
		if (!booking) return;

		cancelling = true;
		cancelError = '';

		try {
			await onCancel(cancelMessage.trim() || '');
			cancelMessage = '';
			cancelError = '';
		} catch (err: any) {
			cancelError = err.message || 'Failed to cancel booking';
		} finally {
			cancelling = false;
		}
	}

	function handleClose() {
		cancelMessage = '';
		cancelError = '';
		onClose();
	}
</script>

{#if show && booking}
	<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
		<div class="bg-white rounded-lg shadow-xl max-w-md w-full">
			<div class="p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-2">Cancel Booking</h3>
				<p class="text-sm text-gray-600 mb-4">
					Cancel <strong>{booking.event_type_name}</strong> with <strong>{booking.attendee_name}</strong> on {formatCompactDateTime(new Date(booking.start_time))}?
				</p>

				{#if cancelError}
					<div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm mb-4">
						{cancelError}
					</div>
				{/if}

				<div class="mb-4">
					<label for="cancel-message" class="block text-sm font-medium text-gray-700 mb-1">
						Message to attendee (optional)
					</label>
					<textarea
						id="cancel-message"
						bind:value={cancelMessage}
						placeholder="Let them know why you're cancelling..."
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
					></textarea>
					<p class="text-xs text-gray-500 mt-1">This message will be included in the cancellation email</p>
				</div>

				<div class="flex justify-end gap-3">
					<button
						onclick={handleClose}
						class="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
					>
						Keep Booking
					</button>
					<button
						onclick={handleCancel}
						disabled={cancelling}
						class="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition disabled:opacity-50"
					>
						{cancelling ? 'Cancelling...' : 'Cancel Booking'}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
