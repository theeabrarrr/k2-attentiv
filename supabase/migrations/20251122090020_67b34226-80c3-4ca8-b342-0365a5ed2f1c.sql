-- PHASE 1: Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings
CREATE POLICY "Everyone can read system settings"
  ON public.system_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage system settings"
  ON public.system_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('FUEL_RATE_PER_KM', '9', 'Fuel rate per kilometer in PKR'),
  ('LATE_ARRIVAL_TIME', '10:15', 'Time after which attendance is marked as late (HH:MM format)')
ON CONFLICT (key) DO NOTHING;

-- Update RLS policies for attendance table
DROP POLICY IF EXISTS "Managers can create attendance" ON public.attendance;
DROP POLICY IF EXISTS "Managers can update attendance" ON public.attendance;
DROP POLICY IF EXISTS "Admins can delete attendance" ON public.attendance;

CREATE POLICY "Admins and managers can insert attendance"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can update attendance"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

CREATE POLICY "Admins and managers can delete attendance"
  ON public.attendance
  FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));