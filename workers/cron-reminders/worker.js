/**
 * Cron Worker for CloudMeet email reminders
 * Runs every 5 minutes and calls the main app's reminder endpoint
 */

export default {
	async scheduled(event, env) {
		const url = `${env.APP_URL}/api/cron/send-reminders?secret=${env.CRON_SECRET}`;

		try {
			const response = await fetch(url);
			const result = await response.json();
			console.log('Cron reminder result:', result);
		} catch (err) {
			console.error('Cron reminder failed:', err);
		}
	}
};
