-- Add soft delete columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_active IS 'Indicates if the employee is currently active';
COMMENT ON COLUMN public.profiles.deactivated_at IS 'Timestamp when the employee was deactivated';
COMMENT ON COLUMN public.profiles.deactivation_reason IS 'Optional reason for deactivation';