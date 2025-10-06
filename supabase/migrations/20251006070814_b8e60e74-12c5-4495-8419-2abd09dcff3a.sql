-- Drop the incorrect foreign key pointing to auth.users
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_user_id_fkey;

-- Add correct foreign key pointing to public.profiles
ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;