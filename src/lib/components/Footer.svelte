<script lang="ts">
	let { class: className = '' }: { class?: string } = $props();
</script>

<div class="text-center {className}">
	<a
		href="https://github.com/dennisklappe/CloudMeet"
		target="_blank"
		rel="noopener noreferrer"
		class="text-xs text-gray-400 hover:text-gray-500 transition"
	>
		Powered by CloudMeet
	</a>
</div>
