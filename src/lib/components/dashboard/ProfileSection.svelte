<script lang="ts">
	interface Props {
		user: {
			name?: string;
			email?: string;
			profile_image?: string | null;
			brand_color?: string;
			contact_email?: string | null;
			settings?: string | null;
		} | null;
		onProfileSaved?: () => void;
	}

	let { user, onProfileSaved }: Props = $props();

	// Parse user settings
	function getUserSettings() {
		try {
			return user?.settings ? JSON.parse(user.settings) : {};
		} catch {
			return {};
		}
	}

	// Profile edit state
	let showProfileEdit = $state(false);
	let profileName = $state(user?.name || '');
	let profileImage = $state(user?.profile_image || '');
	let brandColor = $state(user?.brand_color || '#3b82f6');
	let contactEmail = $state(user?.contact_email || '');
	let timeFormat = $state<'12h' | '24h'>(getUserSettings().timeFormat || '12h');
	let savingProfile = $state(false);
	let uploadingImage = $state(false);
	let profileError = $state('');
	let profileSuccess = $state('');

	// Preset brand colors
	const presetColors = [
		'#3b82f6', // Blue
		'#8b5cf6', // Purple
		'#ec4899', // Pink
		'#ef4444', // Red
		'#f97316', // Orange
		'#eab308', // Yellow
		'#22c55e', // Green
		'#14b8a6', // Teal
		'#06b6d4', // Cyan
		'#6366f1', // Indigo
		'#000000', // Black
		'#6b7280'  // Gray
	];

	async function handleImageUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		uploadingImage = true;
		profileError = '';

		try {
			const formData = new FormData();
			formData.append('image', file);

			const response = await fetch('/api/profile', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errData = await response.json() as { message?: string };
				throw new Error(errData.message || 'Failed to upload image');
			}

			const result = await response.json() as { imageUrl?: string };
			profileImage = result.imageUrl || '';
			profileSuccess = 'Image uploaded successfully';
			setTimeout(() => profileSuccess = '', 3000);
		} catch (err: any) {
			profileError = err.message || 'Failed to upload image';
		} finally {
			uploadingImage = false;
		}
	}

	async function saveProfile() {
		savingProfile = true;
		profileError = '';
		profileSuccess = '';

		try {
			const response = await fetch('/api/profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: profileName,
					profileImage,
					brandColor,
					contactEmail,
					timeFormat
				})
			});

			if (!response.ok) {
				const errData = await response.json() as { message?: string };
				throw new Error(errData.message || 'Failed to save profile');
			}

			profileSuccess = 'Profile saved successfully';
			showProfileEdit = false;
			onProfileSaved?.();
		} catch (err: any) {
			profileError = err.message || 'Failed to save profile';
		} finally {
			savingProfile = false;
		}
	}
</script>

<div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
	<div class="flex items-center justify-between mb-4">
		<h2 class="text-lg font-semibold text-gray-900">Your Profile</h2>
		<button
			onclick={() => showProfileEdit = !showProfileEdit}
			class="text-sm text-blue-600 hover:text-blue-700"
		>
			{showProfileEdit ? 'Cancel' : 'Edit Profile'}
		</button>
	</div>

	{#if showProfileEdit}
		<!-- Edit Mode -->
		<div class="space-y-4">
			{#if profileError}
				<div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">
					{profileError}
				</div>
			{/if}
			{#if profileSuccess}
				<div class="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">
					{profileSuccess}
				</div>
			{/if}

			<div class="flex items-start gap-6">
				<!-- Profile Image Upload -->
				<div class="flex-shrink-0">
					<div class="relative">
						{#if profileImage}
							<img
								src={profileImage}
								alt="Profile"
								class="w-24 h-24 rounded-full object-cover"
							/>
						{:else}
							<div class="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-3xl">
								{profileName?.charAt(0) || 'U'}
							</div>
						{/if}
						<label class="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
							<input
								type="file"
								accept="image/*"
								onchange={handleImageUpload}
								class="hidden"
								disabled={uploadingImage}
							/>
							{#if uploadingImage}
								<div class="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
							{:else}
								<svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
								</svg>
							{/if}
						</label>
					</div>
					<p class="text-xs text-gray-500 mt-2 text-center">Max 2MB</p>
				</div>

				<!-- Name Input -->
				<div class="flex-1 space-y-4">
					<div>
						<label for="profile-name" class="block text-sm font-medium text-gray-700 mb-2">
							Display Name
						</label>
						<input
							type="text"
							id="profile-name"
							bind:value={profileName}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="Your name"
						/>
						<p class="text-xs text-gray-500 mt-1">This name will be shown on your booking page</p>
					</div>

					<div>
						<label for="contact-email" class="block text-sm font-medium text-gray-700 mb-2">
							Contact Email
						</label>
						<input
							type="email"
							id="contact-email"
							bind:value={contactEmail}
							class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							placeholder="your@business-email.com"
						/>
						<p class="text-xs text-gray-500 mt-1">
							Business email shown in booking emails. Leave empty to use {user?.email}
						</p>
					</div>
				</div>
			</div>

			<!-- Brand Color -->
			<div class="mt-6">
				<label class="block text-sm font-medium text-gray-700 mb-3">
					Brand Color
				</label>
				<div class="flex items-center gap-4">
					<div class="flex flex-wrap gap-2">
						{#each presetColors as color}
							<button
								type="button"
								onclick={() => brandColor = color}
								class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 {brandColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : 'border-gray-200'}"
								style="background-color: {color}"
								title={color}
							></button>
						{/each}
					</div>
					<div class="flex items-center gap-2">
						<label class="relative cursor-pointer">
							<input
								type="color"
								bind:value={brandColor}
								class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
							/>
							<div
								class="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 transition"
								style="background-color: {brandColor}"
							>
								<svg class="w-4 h-4 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
								</svg>
							</div>
						</label>
						<span class="text-sm text-gray-500 font-mono">{brandColor}</span>
					</div>
				</div>
				<p class="text-xs text-gray-500 mt-2">This color will be used on your booking page for buttons and accents</p>
			</div>

			<!-- Time Format -->
			<div class="mt-6">
				<label class="block text-sm font-medium text-gray-700 mb-3">
					Time Format
				</label>
				<div class="flex gap-3">
					<button
						type="button"
						onclick={() => timeFormat = '12h'}
						class="px-4 py-2 rounded-lg border-2 text-sm font-medium transition {timeFormat === '12h' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}"
					>
						12-hour (AM/PM)
					</button>
					<button
						type="button"
						onclick={() => timeFormat = '24h'}
						class="px-4 py-2 rounded-lg border-2 text-sm font-medium transition {timeFormat === '24h' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:border-gray-400'}"
					>
						24-hour
					</button>
				</div>
				<p class="text-xs text-gray-500 mt-2">Choose how times are displayed on your booking page</p>
			</div>

			<div class="flex justify-end mt-6">
				<button
					onclick={saveProfile}
					disabled={savingProfile}
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
				>
					{savingProfile ? 'Saving...' : 'Save Profile'}
				</button>
			</div>
		</div>
	{:else}
		<!-- View Mode -->
		<div class="flex items-center gap-4">
			{#if user?.profile_image}
				<img
					src={user.profile_image}
					alt="Profile"
					class="w-16 h-16 rounded-full object-cover"
				/>
			{:else}
				<div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
					{user?.name?.charAt(0) || 'U'}
				</div>
			{/if}
			<div>
				<p class="font-semibold text-gray-900">{user?.name}</p>
				<p class="text-sm text-gray-600">{user?.email}</p>
			</div>
		</div>
	{/if}
</div>
