import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Edit, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { FuelReportEditDialog } from "./FuelReportEditDialog";

interface FuelReport {
  id: string;
  user_id: string;
  date: string;
  total_km: number;
  total_amount: number;
  profiles: {
    full_name: string;
  };
}

export function FuelManagementDashboard() {
  const [reports, setReports] = useState<FuelReport[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const [isLoading, setIsLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<FuelReport | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [selectedEmployee, selectedMonth]);

  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("is_active", true)
      .order("full_name");

    if (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
      return;
    }

    setEmployees(data || []);
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("fuel_reports")
        .select("id, user_id, date, total_km, total_amount")
        .order("date", { ascending: false });

      // Filter by employee if selected
      if (selectedEmployee !== "all") {
        query = query.eq("user_id", selectedEmployee);
      }

      // Filter by month
      const startDate = `${selectedMonth}-01`;
      const endDate = format(new Date(selectedMonth + "-01").setMonth(new Date(selectedMonth + "-01").getMonth() + 1), "yyyy-MM-dd");
      query = query.gte("date", startDate).lt("date", endDate);

      const { data: reportsData, error } = await query;
      if (error) throw error;

      // Fetch profile names separately
      if (reportsData && reportsData.length > 0) {
        const userIds = [...new Set(reportsData.map(r => r.user_id))];
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
        const enrichedReports = reportsData.map(report => ({
          ...report,
          profiles: { full_name: profilesMap.get(report.user_id) || "Unknown" }
        }));
        setReports(enrichedReports);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load fuel reports");
    } finally {
      setIsLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reports.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Employee Name", "Date", "Total KM", "Total Amount (PKR)"];
    const csvContent = [
      headers.join(","),
      ...reports.map(report => [
        report.profiles.full_name,
        format(new Date(report.date), "dd/MM/yyyy"),
        report.total_km,
        report.total_amount
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fuel_reports_${selectedMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report exported successfully");
  };

  const handleEditComplete = () => {
    setEditingReport(null);
    fetchReports();
  };

  return (
    <>
      <Card className="glass-effect border-border/50 shadow-card">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">Fuel Management Dashboard</CardTitle>
          <CardDescription>View and manage all fuel reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee</label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Month</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-end">
              <Button onClick={exportToCSV} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Data Table */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total KM</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No fuel reports found for the selected filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.profiles.full_name}</TableCell>
                        <TableCell>{format(new Date(report.date), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">{report.total_km.toFixed(2)} km</TableCell>
                        <TableCell className="text-right">PKR {report.total_amount.toFixed(2)}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingReport(report)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingReport && (
        <FuelReportEditDialog
          report={editingReport}
          open={!!editingReport}
          onClose={() => setEditingReport(null)}
          onComplete={handleEditComplete}
        />
      )}
    </>
  );
}
