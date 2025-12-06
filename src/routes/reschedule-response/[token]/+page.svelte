<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import type { PageData, ActionData } from './$types';
	import Footer from '$lib/components/Footer.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const success = $derived($page.url.searchParams.get('success'));
	const action = $derived(data.action);

	const brandColor = data.proposal?.brand_color || '#3b82f6';

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

	function formatDate(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric'
		}).format(date);
	}

	function formatTime(dateStr: string) {
		const date = new Date(dateStr);
		return new Intl.DateTimeFormat('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		}).format(date);
	}
</script>

<svelte:head>
	<title>Reschedule Response</title>
</svelte:head>

<div class="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
	{#if success === 'accepted'}
		<!-- Accepted Success -->
		<div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
			<div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
				<svg class="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
				</svg>
			</div>
			<h1 class="text-2xl font-semibold text-gray-900 mb-2">Meeting Rescheduled!</h1>
			<p class="text-gray-600 mb-6">
				Your meeting has been confirmed for the new time. A calendar update has been sent to your email.
			</p>
			<div class="bg-gray-50 rounded-lg p-4 text-left">
				<p class="font-semibold text-gray-900 mb-2">{data.proposal?.event_name}</p>
				<p class="text-sm text-gray-600">{formatDateTime(data.proposal?.proposed_start_time || '')}</p>
			</div>
		</div>
	{:else if success === 'declined'}
		<!-- Declined Success -->
		<div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
			<div class="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
				<svg class="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</div>
			<h1 class="text-2xl font-semibold text-gray-900 mb-2">Meeting Cancelled</h1>
			<p class="text-gray-600 mb-6">
				The meeting has been cancelled. The host has been notified.
			</p>
			<a
				href="/{data.proposal?.event_slug}"
				class="inline-block px-6 py-3 text-white rounded-lg transition"
				style="background-color: {brandColor}"
			>
				Book a New Time
			</a>
		</div>
	{:else if data.alreadyResponded}
		<!-- Already Responded -->
		<div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
			<div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
				<svg class="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
				</svg>
			</div>
			<h1 class="text-2xl font-semibold text-gray-900 mb-2">Already Responded</h1>
			<p class="text-gray-600">
				This reschedule request has already been {data.proposal?.status}.
			</p>
		</div>
	{:else if action === 'counter'}
		<!-- Counter Propose - Redirect to reschedule page -->
		<div class="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
			<h1 class="text-2xl font-semibold text-gray-900 mb-4">Propose Different Time</h1>
			<p class="text-gray-600 mb-6">
				You'll be redirected to choose a different time for your meeting.
			</p>
			<a
				href="/reschedule/{data.proposal?.booking_id}"
				class="inline-block px-6 py-3 text-white rounded-lg transition"
				style="background-color: {brandColor}"
			>
				Choose Different Time
			</a>
		</div>
	{:else}
		<!-- Response Form -->
		<div class="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
			<h1 class="text-2xl font-semibold text-gray-900 mb-2 text-center">Reschedule Request</h1>
			<p class="text-gray-600 mb-6 text-center">
				<strong>{data.proposal?.host_name}</strong> would like to reschedule your meeting.
			</p>

			{#if form?.error}
				<div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
					{form.error}
				</div>
			{/if}

			{#if data.proposal?.message}
				<div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
					<p class="text-sm text-amber-800">{data.proposal.message}</p>
				</div>
			{/if}

			<div class="space-y-4 mb-6">
				<!-- Original Time -->
				<div class="bg-red-50 border border-red-200 rounded-lg p-4">
					<div class="text-xs font-semibold text-red-700 uppercase mb-2">Original Time</div>
					<div class="text-gray-900 line-through">
						<p class="font-medium">{formatDate(data.proposal?.original_start_time || '')}</p>
						<p class="text-sm">{formatTime(data.proposal?.original_start_time || '')} - {formatTime(data.proposal?.original_end_time || '')}</p>
					</div>
				</div>

				<!-- Proposed New Time -->
				<div class="bg-green-50 border border-green-200 rounded-lg p-4">
					<div class="text-xs font-semibold text-green-700 uppercase mb-2">Proposed New Time</div>
					<div class="text-gray-900">
						<p class="font-medium">{formatDate(data.proposal?.proposed_start_time || '')}</p>
						<p class="text-sm">{formatTime(data.proposal?.proposed_start_time || '')} - {formatTime(data.proposal?.proposed_end_time || '')}</p>
					</div>
				</div>
			</div>

			<div class="bg-gray-50 rounded-lg p-4 mb-6">
				<p class="text-sm"><span class="text-gray-600">Meeting:</span> <span class="font-medium">{data.proposal?.event_name}</span></p>
				<p class="text-sm"><span class="text-gray-600">With:</span> <span class="font-medium">{data.proposal?.host_name}</span></p>
			</div>

			<div class="space-y-3">
				<form method="POST" action="?/accept" use:enhance>
					<button
						type="submit"
						class="w-full px-6 py-3 text-white rounded-lg font-medium transition bg-green-600 hover:bg-green-700"
					>
						Accept New Time
					</button>
				</form>

				<form method="POST" action="?/decline" use:enhance>
					<button
						type="submit"
						class="w-full px-6 py-3 text-white rounded-lg font-medium transition bg-red-600 hover:bg-red-700"
					>
						Decline & Cancel Meeting
					</button>
				</form>

				<a
					href="/reschedule/{data.proposal?.booking_id}"
					class="block w-full px-6 py-3 text-center rounded-lg font-medium transition border-2 hover:bg-gray-50"
					style="border-color: {brandColor}; color: {brandColor}"
				>
					Propose Different Time
				</a>
			</div>
		</div>
	{/if}

	<Footer class="mt-6" />
</div>
