-- Add designation column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS designation text;

-- Add status column to fuel_reports with default 'Pending'
ALTER TABLE public.fuel_reports ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending';

-- Create unique constraint on user_id and date for attendance to prevent duplicates
-- First drop if exists, then recreate
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_user_id_date_key'
  ) THEN
    ALTER TABLE public.attendance ADD CONSTRAINT attendance_user_id_date_key UNIQUE (user_id, date);
  END IF;
END $$;