import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UserSearch, CheckCircle2, XCircle, Clock, Calendar } from "lucide-react";
import { format } from "date-fns";
import { getCurrentAttendanceCycle, getPastCycles, type AttendanceCycle } from "@/lib/attendanceCycle";

interface Employee {
  id: string;
  full_name: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  check_in_time: string;
  check_out_time: string | null;
  notes: string | null;
}

interface EmployeeSummary {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export const EmployeeAttendanceReport = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<EmployeeSummary>({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<AttendanceCycle>(getCurrentAttendanceCycle());
  const [availableCycles] = useState<AttendanceCycle[]>(getPastCycles(6));

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeAttendance(selectedEmployeeId);
    }
  }, [selectedEmployeeId, selectedCycle]);

  const fetchEmployees = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setUserRole(roleData?.role || null);

    // If admin/manager, get all employees; if employee, just their own profile
    let query = supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");

    if (roleData?.role === "employee") {
      query = query.eq("id", user.id);
    }

    const { data } = await query;
    
    if (data) {
      setEmployees(data);
      // Auto-select if employee (only one option)
      if (roleData?.role === "employee" && data.length === 1) {
        setSelectedEmployeeId(data[0].id);
      }
    }
  };

  const fetchEmployeeAttendance = async (employeeId: string) => {
    setLoading(true);
    
    // Use selected attendance cycle (26th to 25th)
    const { startDate, endDate } = selectedCycle;

    const { data } = await supabase
      .from("attendance")
      .select("id, date, status, check_in_time, check_out_time, notes")
      .eq("user_id", employeeId)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (data) {
      setRecords(data);
      
      // Calculate summary
      const present = data.filter(r => r.status === "present").length;
      const absent = data.filter(r => r.status === "absent").length;
      const late = data.filter(r => r.status === "late").length;
      const total = data.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setSummary({ present, absent, late, total, percentage });
    }
    
    setLoading(false);
  };

  const handleCycleChange = (cycleLabel: string) => {
    const cycle = availableCycles.find(c => c.label === cycleLabel);
    if (cycle) {
      setSelectedCycle(cycle);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "late":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "absent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      <Card className="shadow-card glass-effect border-border/50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserSearch className="h-5 w-5 text-primary" />
            Employee Attendance Report
          </CardTitle>
          <CardDescription className="flex items-center gap-2 flex-wrap">
            <span>Search and view individual employee attendance</span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Select value={selectedCycle.label} onValueChange={handleCycleChange}>
                <SelectTrigger className="w-[240px] h-8 glass-effect">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableCycles.map((cycle) => (
                    <SelectItem key={cycle.label} value={cycle.label}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
            <SelectTrigger className="w-full glass-effect">
              <SelectValue placeholder="Select an employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEmployeeId && (
        <>
          <Card className="shadow-card glass-effect border-border/50 animate-fade-in">
            <CardHeader>
              <CardTitle>{selectedEmployee?.full_name} - Attendance Summary</CardTitle>
              <CardDescription>{selectedCycle.label}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="flex items-center gap-3 p-4 rounded-lg glass-effect border border-green-500/30">
                  <CheckCircle2 className="h-8 w-8 text-green-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Present</p>
                    <p className="text-2xl font-bold">{summary.present}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg glass-effect border border-yellow-500/30">
                  <Clock className="h-8 w-8 text-yellow-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Late</p>
                    <p className="text-2xl font-bold">{summary.late}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-lg glass-effect border border-red-500/30">
                  <XCircle className="h-8 w-8 text-red-400" />
                  <div>
                    <p className="text-sm text-muted-foreground">Absent</p>
                    <p className="text-2xl font-bold">{summary.absent}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Attendance Rate</p>
                  <p className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                    {summary.percentage}%
                  </p>
                </div>
                <Progress value={summary.percentage} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {summary.present} present out of {summary.total} total records
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card glass-effect border-border/50 animate-fade-in">
            <CardHeader>
              <CardTitle>Detailed Attendance Records</CardTitle>
              <CardDescription>All records for {selectedEmployee?.full_name}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : records.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No attendance records found</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Check In</TableHead>
                        <TableHead>Check Out</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">
                            {format(new Date(record.date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.check_in_time || "—"}</TableCell>
                          <TableCell>{record.check_out_time || "—"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {record.notes || "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
