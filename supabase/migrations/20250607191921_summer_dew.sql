/*
  # Fix RLS policies for users and user_preferences tables

  1. Security Updates
    - Update RLS policies for `users` table to allow authenticated users to manage their own data
    - Update RLS policies for `user_preferences` table to allow authenticated users to manage their own preferences
    - Ensure proper INSERT, SELECT, and UPDATE permissions

  2. Changes Made
    - Drop existing restrictive policies
    - Create new policies that allow authenticated users to manage their own records
    - Enable proper user registration and profile management
*/

-- Drop existing policies for users table
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create comprehensive policies for users table
CREATE POLICY "Enable read access for authenticated users" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Enable insert access for authenticated users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for authenticated users" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Drop existing policies for user_preferences table if they exist
DROP POLICY IF EXISTS "Users can manage own preferences" ON user_preferences;

-- Create comprehensive policies for user_preferences table
CREATE POLICY "Enable read access for user preferences" ON user_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Enable insert access for user preferences" ON user_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update access for user preferences" ON user_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable delete access for user preferences" ON user_preferences
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);