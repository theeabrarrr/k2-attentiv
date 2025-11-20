-- Create fuel_reports table
CREATE TABLE public.fuel_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_km NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create fuel_report_items table
CREATE TABLE public.fuel_report_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.fuel_reports(id) ON DELETE CASCADE,
  job_no TEXT NOT NULL,
  area TEXT NOT NULL,
  km NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fuel_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fuel_report_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fuel_reports
CREATE POLICY "Employees can insert their own fuel reports"
ON public.fuel_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Employees can view their own fuel reports"
ON public.fuel_reports
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'manager'::app_role)
);

CREATE POLICY "Employees can update their own fuel reports"
ON public.fuel_reports
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete fuel reports"
ON public.fuel_reports
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for fuel_report_items
CREATE POLICY "Employees can insert items for their own reports"
ON public.fuel_report_items
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fuel_reports
    WHERE id = report_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Employees can view items for their own reports"
ON public.fuel_report_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fuel_reports
    WHERE id = report_id 
    AND (
      user_id = auth.uid() 
      OR has_role(auth.uid(), 'admin'::app_role) 
      OR has_role(auth.uid(), 'manager'::app_role)
    )
  )
);

CREATE POLICY "Employees can update items for their own reports"
ON public.fuel_report_items
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fuel_reports
    WHERE id = report_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Employees can delete items for their own reports"
ON public.fuel_report_items
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.fuel_reports
    WHERE id = report_id AND user_id = auth.uid()
  )
);

-- Create indexes for better performance
CREATE INDEX idx_fuel_reports_user_id ON public.fuel_reports(user_id);
CREATE INDEX idx_fuel_reports_date ON public.fuel_reports(date);
CREATE INDEX idx_fuel_report_items_report_id ON public.fuel_report_items(report_id);