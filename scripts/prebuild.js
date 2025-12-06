import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.join(__dirname, '..');
const STATIC_DIR = path.join(ROOT_DIR, 'static');
const AVAILABILITY_DIR = path.join(STATIC_DIR, 'availability');

// This script generates static availability configuration files
// These are loaded at build time to reduce API calls

async function generateStaticAvailability() {
	console.log('Generating static availability files...');
	
	// Ensure directories exist
	await fs.mkdir(AVAILABILITY_DIR, { recursive: true });
	
	// Default availability rules (can be customized)
	const defaultRules = {
		version: 1,
		generated: new Date().toISOString(),
		defaultSchedule: {
			// Monday - Friday
			1: { start: '09:00', end: '17:00', available: true },
			2: { start: '09:00', end: '17:00', available: true },
			3: { start: '09:00', end: '17:00', available: true },
			4: { start: '09:00', end: '17:00', available: true },
			5: { start: '09:00', end: '17:00', available: true },
			// Weekend
			0: { available: false },
			6: { available: false }
		},
		eventTypeDefaults: {
			'30min': { duration: 30, buffer: 15 },
			'60min': { duration: 60, buffer: 15 },
			'15min': { duration: 15, buffer: 5 }
		},
		slotIncrement: 15 // minutes
	};
	
	await fs.writeFile(
		path.join(AVAILABILITY_DIR, 'defaults.json'),
		JSON.stringify(defaultRules, null, 2)
	);
	
	// Generate timezone data
	const timezones = [
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'Europe/London',
		'Europe/Paris',
		'Asia/Tokyo',
		'Australia/Sydney'
	];
	
	await fs.writeFile(
		path.join(AVAILABILITY_DIR, 'timezones.json'),
		JSON.stringify({ supported: timezones }, null, 2)
	);
	
	console.log('Static files generated successfully');
}

// Generate cache warming list
async function generateCacheWarmingList() {
	const warmingList = {
		paths: [
			'/api/availability/defaults',
			'/api/events/types'
		],
		generated: new Date().toISOString()
	};
	
	await fs.writeFile(
		path.join(STATIC_DIR, 'cache-warming.json'),
		JSON.stringify(warmingList, null, 2)
	);
}

// Main execution
async function main() {
	try {
		await generateStaticAvailability();
		await generateCacheWarmingList();
		console.log('Prebuild completed successfully');
	} catch (error) {
		console.error('Prebuild failed:', error);
		process.exit(1);
	}
}

main();