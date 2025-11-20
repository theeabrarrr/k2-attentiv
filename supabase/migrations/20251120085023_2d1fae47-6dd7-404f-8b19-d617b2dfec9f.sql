-- Update RLS policies for fuel_reports to allow Admins/Managers to UPDATE and DELETE

-- Drop existing policies that need updates
DROP POLICY IF EXISTS "Employees can update their own fuel reports" ON fuel_reports;
DROP POLICY IF EXISTS "Admins can delete fuel reports" ON fuel_reports;

-- Recreate policies with correct permissions
CREATE POLICY "Employees can update their own fuel reports" ON fuel_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins and Managers can update all fuel reports" ON fuel_reports
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Admins and Managers can delete fuel reports" ON fuel_reports
  FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Update RLS policies for fuel_report_items
DROP POLICY IF EXISTS "Employees can update items for their own reports" ON fuel_report_items;
DROP POLICY IF EXISTS "Employees can delete items for their own reports" ON fuel_report_items;

CREATE POLICY "Employees can update items for their own reports" ON fuel_report_items
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM fuel_reports
    WHERE fuel_reports.id = fuel_report_items.report_id
    AND fuel_reports.user_id = auth.uid()
  ));

CREATE POLICY "Admins and Managers can update all fuel report items" ON fuel_report_items
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

CREATE POLICY "Employees can delete items for their own reports" ON fuel_report_items
  FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM fuel_reports
    WHERE fuel_reports.id = fuel_report_items.report_id
    AND fuel_reports.user_id = auth.uid()
  ));

CREATE POLICY "Admins and Managers can delete all fuel report items" ON fuel_report_items
  FOR DELETE
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));