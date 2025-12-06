-- Migration: Add email templates and scheduled emails
-- Date: 2024-12-03

-- Email templates and settings
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('confirmation', 'cancellation', 'reschedule', 'reminder_24h', 'reminder_1h', 'reminder_30m')),
    is_enabled BOOLEAN DEFAULT 1,
    subject TEXT,
    custom_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, template_type)
);

CREATE INDEX IF NOT EXISTS idx_email_templates_user ON email_templates(user_id);

-- Scheduled emails for reminders
CREATE TABLE IF NOT EXISTS scheduled_emails (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    booking_id TEXT NOT NULL,
    template_type TEXT NOT NULL,
    scheduled_for DATETIME NOT NULL,
    sent_at DATETIME,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_scheduled_emails_pending ON scheduled_emails(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_scheduled_emails_booking ON scheduled_emails(booking_id);
