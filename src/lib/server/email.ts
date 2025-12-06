/**
 * Email service - re-exports from modular email module
 *
 * This file maintains backward compatibility by re-exporting from the new
 * modular email structure in src/lib/server/email/
 */

export {
	// Types
	type BookingEmailData,
	type RescheduleEmailData,
	type EmailTemplate,
	type EmailTemplateType,
	// Formatters
	createEmailFormatters,
	replaceSubjectVariables,
	// Template generators
	generateBookingEmail,
	generateBookingEmailText,
	generateCancellationEmail,
	generateAdminCancellationEmail,
	generateRescheduleEmail,
	generateAdminRescheduleEmail,
	generateReminderEmail,
	getDefaultReminderSubject,
	generateAdminNotificationEmail,
	// Send functions
	sendBookingEmail,
	sendCancellationEmail,
	sendRescheduleEmail,
	sendReminderEmail,
	sendAdminNotificationEmail,
	sendAdminCancellationNotification,
	sendAdminRescheduleNotification,
	// Database functions
	getEmailTemplates,
	isEmailEnabled
} from './email/index';
