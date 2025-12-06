-- Add contact_email field to users table
-- This allows users to specify a business email separate from their Google login email
ALTER TABLE users ADD COLUMN contact_email TEXT;
