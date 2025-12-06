-- Reschedule proposals for host-initiated reschedules
CREATE TABLE IF NOT EXISTS reschedule_proposals (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    booking_id TEXT NOT NULL,
    proposed_start_time DATETIME NOT NULL,
    proposed_end_time DATETIME NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'counter_proposed', 'expired')),
    proposed_by TEXT NOT NULL CHECK (proposed_by IN ('host', 'attendee')),
    response_token TEXT UNIQUE NOT NULL,
    responded_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX idx_reschedule_proposals_booking ON reschedule_proposals(booking_id);
CREATE INDEX idx_reschedule_proposals_token ON reschedule_proposals(response_token);
CREATE INDEX idx_reschedule_proposals_status ON reschedule_proposals(status);
