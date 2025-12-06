<script lang="ts">
	let {
		value = $bindable(''),
		placeholder = 'Enter description...'
	}: {
		value: string;
		placeholder?: string;
	} = $props();

	let editor: HTMLDivElement;
	let initialized = false;

	function execCommand(command: string, val?: string) {
		document.execCommand(command, false, val);
		editor?.focus();
		updateValue();
	}

	function updateValue() {
		if (editor) {
			value = editor.innerHTML;
		}
	}

	function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		const text = e.clipboardData?.getData('text/plain') || '';
		document.execCommand('insertText', false, text);
		updateValue();
	}

	// Set initial content only once when editor is mounted
	$effect(() => {
		if (editor && !initialized) {
			editor.innerHTML = value || '';
			initialized = true;
		}
	});
</script>

<div class="border border-gray-300 rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
	<!-- Toolbar -->
	<div class="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-300">
		<button
			type="button"
			onclick={() => execCommand('bold')}
			class="p-1.5 rounded hover:bg-gray-200 transition"
			title="Bold"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
				<path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z"></path>
				<path d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z"></path>
			</svg>
		</button>
		<button
			type="button"
			onclick={() => execCommand('italic')}
			class="p-1.5 rounded hover:bg-gray-200 transition"
			title="Italic"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<line x1="19" y1="4" x2="10" y2="4"></line>
				<line x1="14" y1="20" x2="5" y2="20"></line>
				<line x1="15" y1="4" x2="9" y2="20"></line>
			</svg>
		</button>
		<button
			type="button"
			onclick={() => execCommand('underline')}
			class="p-1.5 rounded hover:bg-gray-200 transition"
			title="Underline"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path d="M6 3v7a6 6 0 0012 0V3"></path>
				<line x1="4" y1="21" x2="20" y2="21"></line>
			</svg>
		</button>
		<div class="w-px h-5 bg-gray-300 mx-1"></div>
		<button
			type="button"
			onclick={() => execCommand('insertUnorderedList')}
			class="p-1.5 rounded hover:bg-gray-200 transition"
			title="Bullet List"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<line x1="8" y1="6" x2="21" y2="6"></line>
				<line x1="8" y1="12" x2="21" y2="12"></line>
				<line x1="8" y1="18" x2="21" y2="18"></line>
				<circle cx="4" cy="6" r="1" fill="currentColor"></circle>
				<circle cx="4" cy="12" r="1" fill="currentColor"></circle>
				<circle cx="4" cy="18" r="1" fill="currentColor"></circle>
			</svg>
		</button>
		<button
			type="button"
			onclick={() => execCommand('insertOrderedList')}
			class="p-1.5 rounded hover:bg-gray-200 transition"
			title="Numbered List"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<line x1="10" y1="6" x2="21" y2="6"></line>
				<line x1="10" y1="12" x2="21" y2="12"></line>
				<line x1="10" y1="18" x2="21" y2="18"></line>
				<text x="3" y="7" font-size="6" fill="currentColor" stroke="none">1</text>
				<text x="3" y="13" font-size="6" fill="currentColor" stroke="none">2</text>
				<text x="3" y="19" font-size="6" fill="currentColor" stroke="none">3</text>
			</svg>
		</button>
	</div>

	<!-- Content editable area -->
	<div
		bind:this={editor}
		contenteditable="true"
		oninput={updateValue}
		onpaste={handlePaste}
		class="min-h-[120px] p-3 outline-none prose prose-sm max-w-none"
		data-placeholder={placeholder}
	></div>
</div>

<style>
	[contenteditable]:empty:before {
		content: attr(data-placeholder);
		color: #9ca3af;
		pointer-events: none;
	}

	[contenteditable] :global(ul),
	[contenteditable] :global(ol) {
		padding-left: 1.5rem;
		margin: 0.5rem 0;
	}

	[contenteditable] :global(ul) {
		list-style-type: disc;
	}

	[contenteditable] :global(ol) {
		list-style-type: decimal;
	}

	[contenteditable] :global(li) {
		margin: 0.25rem 0;
	}
</style>
