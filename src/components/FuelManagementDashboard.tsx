import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Edit, Loader2, Trash2, Upload, FileSpreadsheet } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { format, subMonths } from "date-fns";
import { toast } from "sonner";
import { FuelReportEditDialog } from "./FuelReportEditDialog";
import { FuelImportDialog } from "./FuelImportDialog";
import { formatDateForDB } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface Employee {
  id: string;
  full_name: string;
  total_km: number;
  total_amount: number;
}

interface MonthSummary {
  month: string;
  monthName: string;
  total_km: number;
  total_amount: number;
}

interface DetailedRecord {
  id: string;
  date: string;
  job_no: string;
  area: string;
  km: number;
  amount: number;
  report_id: string;
}

type ViewLevel = "employees" | "months" | "details";

// Generate last 12 months for dropdown
const generateMonthOptions = () => {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const date = subMonths(now, i);
    options.push({
      value: format(date, "yyyy-MM"),
      label: format(date, "MMMM yyyy"),
    });
  }
  return options;
};

export function FuelManagementDashboard() {
  const [viewLevel, setViewLevel] = useState<ViewLevel>("employees");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthSummary | null>(null);
  
  // Month filter for Level 1 (employees view)
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), "yyyy-MM"));
  const monthOptions = generateMonthOptions();
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [details, setDetails] = useState<DetailedRecord[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<any>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);

  useEffect(() => {
    if (viewLevel === "employees") {
      fetchEmployees();
    } else if (viewLevel === "months" && selectedEmployee) {
      fetchMonths(selectedEmployee.id);
    } else if (viewLevel === "details" && selectedEmployee && selectedMonth) {
      fetchDetails(selectedEmployee.id, selectedMonth.month);
    }
  }, [viewLevel, selectedEmployee, selectedMonth, filterMonth]);

  const fetchEmployees = async () => {
    setIsLoading(true);
    try {
      // Get selected month date range
      const [year, month] = filterMonth.split("-").map(Number);
      const startDate = formatDateForDB(new Date(year, month - 1, 1));
      const endDate = formatDateForDB(new Date(year, month, 0));

      // Fetch all active employees
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .eq("is_active", true)
        .order("full_name");

      if (profilesError) throw profilesError;

      // Fetch fuel reports for selected month
      const { data: reportsData, error: reportsError } = await supabase
        .from("fuel_reports")
        .select("user_id, total_km, total_amount")
        .gte("date", startDate)
        .lte("date", endDate);

      if (reportsError) throw reportsError;

      // Aggregate data by employee
      const employeeMap = new Map<string, { total_km: number; total_amount: number }>();
      
      reportsData?.forEach(report => {
        const existing = employeeMap.get(report.user_id) || { total_km: 0, total_amount: 0 };
        employeeMap.set(report.user_id, {
          total_km: existing.total_km + Number(report.total_km),
          total_amount: existing.total_amount + Number(report.total_amount),
        });
      });

      const employeesList: Employee[] = profilesData?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        total_km: employeeMap.get(profile.id)?.total_km || 0,
        total_amount: employeeMap.get(profile.id)?.total_amount || 0,
      })) || [];

      setEmployees(employeesList);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMonths = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("fuel_reports")
        .select("date, total_km, total_amount")
        .eq("user_id", userId)
        .order("date", { ascending: false });

      if (error) throw error;

      // Group by month
      const monthMap = new Map<string, { total_km: number; total_amount: number }>();
      
      data?.forEach(report => {
        const month = format(new Date(report.date), "yyyy-MM");
        const existing = monthMap.get(month) || { total_km: 0, total_amount: 0 };
        monthMap.set(month, {
          total_km: existing.total_km + Number(report.total_km),
          total_amount: existing.total_amount + Number(report.total_amount),
        });
      });

      const monthsList: MonthSummary[] = Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        monthName: format(new Date(month + "-01"), "MMMM yyyy"),
        total_km: data.total_km,
        total_amount: data.total_amount,
      }));

      setMonths(monthsList);
    } catch (error) {
      console.error("Error fetching months:", error);
      toast.error("Failed to load monthly data");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDetails = async (userId: string, month: string) => {
    setIsLoading(true);
    try {
      const startDate = `${month}-01`;
      const endDate = format(new Date(new Date(month + "-01").setMonth(new Date(month + "-01").getMonth() + 1)), "yyyy-MM-dd");

      const { data: reportsData, error: reportsError } = await supabase
        .from("fuel_reports")
        .select("id, date, total_amount")
        .eq("user_id", userId)
        .gte("date", startDate)
        .lt("date", endDate)
        .order("date", { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch items for these reports
      const reportIds = reportsData?.map(r => r.id) || [];
      
      if (reportIds.length === 0) {
        setDetails([]);
        setIsLoading(false);
        return;
      }

      const { data: itemsData, error: itemsError } = await supabase
        .from("fuel_report_items")
        .select("id, report_id, job_no, area, km")
        .in("report_id", reportIds);

      if (itemsError) throw itemsError;

      // Create a map of report dates
      const reportDateMap = new Map(reportsData?.map(r => [r.id, r.date]) || []);

      // Calculate amount per item based on total report amount
      const detailsList: DetailedRecord[] = itemsData?.map(item => {
        const report = reportsData?.find(r => r.id === item.report_id);
        const totalReportKm = itemsData
          .filter(i => i.report_id === item.report_id)
          .reduce((sum, i) => sum + Number(i.km), 0);
        
        const itemAmount = totalReportKm > 0 
          ? (Number(item.km) / totalReportKm) * Number(report?.total_amount || 0)
          : 0;

        return {
          id: item.id,
          date: reportDateMap.get(item.report_id) || "",
          job_no: item.job_no,
          area: item.area,
          km: Number(item.km),
          amount: itemAmount,
          report_id: item.report_id,
        };
      }) || [];

      setDetails(detailsList.sort((a, b) => b.date.localeCompare(a.date)));
    } catch (error) {
      console.error("Error fetching details:", error);
      toast.error("Failed to load detailed records");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to escape CSV values containing commas, quotes, or newlines
  const escapeCSVValue = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      // Escape double quotes by doubling them, then wrap in quotes
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const exportToCSV = () => {
    if (details.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["Date", "Job No", "Area", "KM", "Amount (PKR)"];
    const csvContent = [
      headers.join(","),
      ...details.map(record => [
        format(new Date(record.date), "dd/MM/yyyy"),
        escapeCSVValue(record.job_no),
        escapeCSVValue(record.area),
        record.km.toFixed(2),
        record.amount.toFixed(2)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fuel_details_${escapeCSVValue(selectedEmployee?.full_name || '')}_${selectedMonth?.month}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Report exported successfully");
  };

  // Export summary of all employees with data for selected month
  const exportSummaryCSV = () => {
    const employeesWithData = employees.filter(e => e.total_km > 0 || e.total_amount > 0);
    
    if (employeesWithData.length === 0) {
      toast.error("No employees with data for selected month");
      return;
    }

    const selectedMonthLabel = monthOptions.find(m => m.value === filterMonth)?.label || filterMonth;
    const headers = ["Employee Name", "Total KM", "Total Amount (PKR)"];
    const csvContent = [
      headers.join(","),
      ...employeesWithData.map(emp => [
        escapeCSVValue(emp.full_name),
        emp.total_km.toFixed(2),
        emp.total_amount.toFixed(2)
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `fuel_summary_${filterMonth}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported ${employeesWithData.length} employees with fuel data`);
  };

  const handleDelete = async () => {
    if (!deletingReportId) return;

    try {
      const { error } = await supabase
        .from("fuel_reports")
        .delete()
        .eq("id", deletingReportId);

      if (error) throw error;

      toast.success("Record deleted successfully");
      setDeletingReportId(null);
      
      // Refresh current view
      if (selectedEmployee && selectedMonth) {
        fetchDetails(selectedEmployee.id, selectedMonth.month);
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const handleBack = () => {
    if (viewLevel === "details") {
      setViewLevel("months");
      setSelectedMonth(null);
      setDetails([]);
    } else if (viewLevel === "months") {
      setViewLevel("employees");
      setSelectedEmployee(null);
      setMonths([]);
    }
  };

  const renderBreadcrumb = () => (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink 
            onClick={() => {
              setViewLevel("employees");
              setSelectedEmployee(null);
              setSelectedMonth(null);
            }}
            className="cursor-pointer"
          >
            Employees
          </BreadcrumbLink>
        </BreadcrumbItem>
        {selectedEmployee && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                onClick={() => {
                  setViewLevel("months");
                  setSelectedMonth(null);
                }}
                className="cursor-pointer"
              >
                {selectedEmployee.full_name}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {selectedMonth && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{selectedMonth.monthName}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );

  return (
    <>
      <Card className="glass-effect border-border/50 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">Fuel Management Dashboard</CardTitle>
              <CardDescription>Manage fuel reports by technician</CardDescription>
            </div>
            {viewLevel !== "employees" && (
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
          </div>
          <div className="mt-4">
            {renderBreadcrumb()}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* LEVEL 1: Employees */}
          {viewLevel === "employees" && (
            <>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-semibold">Technicians Overview</h3>
                  <Select value={filterMonth} onValueChange={setFilterMonth}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select month" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={exportSummaryCSV} variant="outline">
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export Summary
                  </Button>
                  <Button onClick={() => setIsImportOpen(true)} variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {employees.map((employee) => {
                    const hasNoData = employee.total_km === 0 && employee.total_amount === 0;
                    
                    return (
                      <Card
                        key={employee.id}
                        className={`cursor-pointer hover:shadow-elevated transition-shadow border-border/50 ${
                          hasNoData ? "opacity-60 bg-muted/30" : ""
                        }`}
                        onClick={() => {
                          setSelectedEmployee(employee);
                          setViewLevel("months");
                        }}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{employee.full_name}</CardTitle>
                            {hasNoData && (
                              <Badge variant="secondary" className="text-xs">
                                No Entry
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total KM:</span>
                            <span className={`font-semibold ${hasNoData ? "text-muted-foreground" : ""}`}>
                              {employee.total_km.toFixed(2)} km
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Cost:</span>
                            <span className={`font-semibold ${hasNoData ? "text-muted-foreground" : "text-primary"}`}>
                              PKR {employee.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* LEVEL 2: Monthly Breakdown */}
          {viewLevel === "months" && selectedEmployee && (
            <>
              <h3 className="text-lg font-semibold">Monthly Breakdown - {selectedEmployee.full_name}</h3>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {months.map((month) => (
                    <Card
                      key={month.month}
                      className="cursor-pointer hover:shadow-elevated transition-shadow border-border/50"
                      onClick={() => {
                        setSelectedMonth(month);
                        setViewLevel("details");
                      }}
                    >
                      <CardHeader>
                        <CardTitle className="text-lg">{month.monthName}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total KM:</span>
                          <span className="font-semibold">{month.total_km.toFixed(2)} km</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-semibold text-primary">PKR {month.total_amount.toFixed(2)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {months.length === 0 && (
                    <div className="col-span-3 text-center text-muted-foreground py-8">
                      No fuel reports found for this employee
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* LEVEL 3: Detailed Records */}
          {viewLevel === "details" && selectedEmployee && selectedMonth && (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Detailed Records - {selectedEmployee.full_name} - {selectedMonth.monthName}
                </h3>
                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Job No</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Area</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">KM</th>
                        <th className="px-4 py-3 text-right text-sm font-medium">Amount</th>
                        <th className="px-4 py-3 text-center text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {details.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                            No detailed records found
                          </td>
                        </tr>
                      ) : (
                        details.map((record) => (
                          <tr key={record.id} className="hover:bg-muted/30">
                            <td className="px-4 py-3">{format(new Date(record.date), "dd/MM/yyyy")}</td>
                            <td className="px-4 py-3">{record.job_no}</td>
                            <td className="px-4 py-3">{record.area}</td>
                            <td className="px-4 py-3 text-right">{record.km.toFixed(2)} km</td>
                            <td className="px-4 py-3 text-right">PKR {record.amount.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2 justify-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    // Find full report for editing
                                    const report = {
                                      id: record.report_id,
                                      user_id: selectedEmployee.id,
                                      date: record.date,
                                      total_km: record.km,
                                      total_amount: record.amount,
                                      profiles: { full_name: selectedEmployee.full_name }
                                    };
                                    setEditingReport(report);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setDeletingReportId(record.report_id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {editingReport && (
        <FuelReportEditDialog
          report={editingReport}
          open={!!editingReport}
          onClose={() => setEditingReport(null)}
          onComplete={() => {
            setEditingReport(null);
            if (selectedEmployee && selectedMonth) {
              fetchDetails(selectedEmployee.id, selectedMonth.month);
            }
          }}
        />
      )}

      <FuelImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={() => {
          fetchEmployees();
        }}
      />

      <AlertDialog open={!!deletingReportId} onOpenChange={() => setDeletingReportId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this fuel report and all its job entries. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
