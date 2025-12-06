-- Add canceled_by column to track who cancelled the booking (host or attendee)
ALTER TABLE bookings ADD COLUMN canceled_by TEXT CHECK (canceled_by IN ('host', 'attendee'));
