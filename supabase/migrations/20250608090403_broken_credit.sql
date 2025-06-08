/*
  # Add current_store_id to user_preferences

  1. Changes
    - Add current_store_id column to user_preferences table
    - Add foreign key constraint to stores table
  
  2. Purpose
    - Allow users to save their current store selection
    - Maintain selected store across sessions
*/

-- Add current_store_id column to user_preferences
ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS current_store_id uuid REFERENCES stores(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_current_store_id ON user_preferences(current_store_id);