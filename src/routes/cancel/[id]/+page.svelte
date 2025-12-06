<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';
	import Footer from '$lib/components/Footer.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let cancelling = $state(false);
	let reason = $state('');
	const success = $derived($page.url.searchParams.get('success') === 'true');

	function formatDateTime(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	}

	function handleSubmit() {
		cancelling = true;
		return async ({ update }: any) => {
			await update();
			cancelling = false;
		};
	}
</script>

<svelte:head>
	<title>Cancel Booking</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-12">
	<div class="max-w-2xl mx-auto px-4">
		{#if success || data.alreadyCanceled}
			<!-- Success Message -->
			<div class="bg-white rounded-lg shadow-lg p-8 text-center">
				<div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
					<svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 13l4 4L19 7"
						></path>
					</svg>
				</div>
				<h1 class="text-2xl font-bold text-gray-900 mb-2">Booking Cancelled</h1>
				<p class="text-gray-600 mb-6">
					Your meeting has been cancelled successfully. The host has been notified.
				</p>
				<a
					href="/{data.booking.event_slug}"
					class="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
				>
					Book Another Meeting
				</a>
			</div>
		{:else}
			<!-- Cancellation Form -->
			<div class="bg-white rounded-lg shadow-lg p-8">
				<h1 class="text-2xl font-bold text-gray-900 mb-6">Cancel Booking</h1>

				{#if form?.error}
					<div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
						Error: {form.error}
					</div>
				{/if}

				<div class="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-6">
					<h2 class="font-semibold text-gray-900 mb-4">Booking Details</h2>
					<div class="space-y-2 text-sm">
						<div>
							<span class="text-gray-600">Event:</span>
							<span class="ml-2 text-gray-900 font-medium">{data.booking.event_name}</span>
						</div>
						<div>
							<span class="text-gray-600">With:</span>
							<span class="ml-2 text-gray-900 font-medium">{data.booking.host_name}</span>
						</div>
						<div>
							<span class="text-gray-600">Time:</span>
							<span class="ml-2 text-gray-900 font-medium"
								>{formatDateTime(data.booking.start_time)}</span
							>
						</div>
						<div>
							<span class="text-gray-600">Attendee:</span>
							<span class="ml-2 text-gray-900 font-medium">{data.booking.attendee_name}</span>
						</div>
					</div>
				</div>

				<div class="mb-6">
					<label for="reason" class="block text-sm font-medium text-gray-700 mb-2">
						Reason for cancellation (optional)
					</label>
					<textarea
						id="reason"
						name="reason"
						bind:value={reason}
						rows="3"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
						placeholder="Let the host know why you're cancelling..."
					></textarea>
				</div>

				<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
					<p class="text-sm text-yellow-800">
						<strong>Warning:</strong> This action cannot be undone. The host will be notified of the cancellation.
					</p>
				</div>

				<form method="POST" use:enhance={handleSubmit}>
					<input type="hidden" name="reason" value={reason} />
					<div class="flex gap-4">
						<button
							type="submit"
							disabled={cancelling}
							class="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 font-medium"
						>
							{cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
						</button>
						<a
							href="/{data.booking.event_slug}"
							class="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-center font-medium"
						>
							Keep Booking
						</a>
					</div>
				</form>
			</div>
		{/if}

		<Footer class="mt-6" />
	</div>
</div>
