/*
  # Remove theme_mode column from stores table

  1. Changes
    - Remove `theme_mode` column from `stores` table as it's not being used in the application
    - This column was originally intended for light/dark mode but the functionality was moved to user preferences

  2. Notes
    - This is a safe operation as the column is not referenced in the current codebase
    - The theme mode functionality is handled at the application level, not per store
*/

-- Remove the theme_mode column from stores table
ALTER TABLE stores DROP COLUMN IF EXISTS theme_mode;