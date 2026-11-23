-- Add signature and recurring config columns to documents table
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS signature_data TEXT,
  ADD COLUMN IF NOT EXISTS recur_freq     TEXT,
  ADD COLUMN IF NOT EXISTS recur_next_date TEXT;
