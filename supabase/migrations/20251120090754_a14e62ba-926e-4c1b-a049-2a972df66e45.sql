-- Allow Admins and Managers to insert fuel reports for any employee
DROP POLICY IF EXISTS "Employees can insert their own fuel reports" ON public.fuel_reports;

CREATE POLICY "Employees can insert their own fuel reports" 
ON public.fuel_reports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins and Managers can insert fuel reports for anyone" 
ON public.fuel_reports 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));

-- Allow Admins and Managers to insert fuel report items for any report
CREATE POLICY "Admins and Managers can insert all fuel report items" 
ON public.fuel_report_items 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'manager'::app_role));