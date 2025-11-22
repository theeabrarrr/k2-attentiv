import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Calendar, Clock, TrendingUp, Fuel, ClipboardCheck, Fuel as FuelIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceSummary } from "@/components/AttendanceSummary";
import { DashboardCharts } from "@/components/DashboardCharts";
import { useUserRole } from "@/hooks/useUserRole";
import { getCurrentAttendanceCycle } from "@/lib/attendanceCycle";
import { getCurrentKarachiDate, formatDateForDB } from "@/lib/dateUtils";

const Dashboard = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [userName, setUserName] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    todayPresent: 0,
    lateArrivals: 0,
    attendanceRate: 0,
    totalFuelAmount: 0,
    myWorkingDays: 0,
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserName(profile.full_name);
        }
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (role) {
      fetchDashboardStats();
    }
  }, [role]);

  const fetchDashboardStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current attendance cycle (26th to 25th)
    const attendanceCycle = getCurrentAttendanceCycle();
    const cycleStart = attendanceCycle.startDate;
    const cycleEnd = attendanceCycle.endDate;

    // Get current calendar month (1st to 30th/31st) in Asia/Karachi timezone
    const nowKarachi = getCurrentKarachiDate();
    const calendarMonthStart = formatDateForDB(new Date(nowKarachi.getFullYear(), nowKarachi.getMonth(), 1));
    const calendarMonthEnd = formatDateForDB(new Date(nowKarachi.getFullYear(), nowKarachi.getMonth() + 1, 0));

    const today = formatDateForDB(nowKarachi);
    const dayOfWeek = nowKarachi.getDay();
    const diff = nowKarachi.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = formatDateForDB(new Date(nowKarachi.setDate(diff)));

    let myWorkingDays = 0;
    if (role === 'employee') {
      // For employees: count their working days in current ATTENDANCE CYCLE
      const { count } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("date", cycleStart)
        .lte("date", cycleEnd)
        .in("status", ["present", "late"]);
      myWorkingDays = count || 0;
    }

    const { count: totalEmployees } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true);
    const { count: todayPresent } = await supabase.from("attendance").select("*", { count: "exact", head: true }).eq("date", today).eq("status", "present");
    const { count: lateArrivals } = await supabase.from("attendance").select("*", { count: "exact", head: true }).gte("date", weekStart).eq("status", "late");
    
    // Attendance Rate uses ATTENDANCE CYCLE dates
    const { data: cycleAttendance } = await supabase.from("attendance").select("status").gte("date", cycleStart).lte("date", cycleEnd);
    
    let attendanceRate = 0;
    if (cycleAttendance && cycleAttendance.length > 0) {
      const presentCount = cycleAttendance.filter(r => r.status === "present").length;
      attendanceRate = Math.round((presentCount / cycleAttendance.length) * 100);
    }

    // Fuel uses CALENDAR MONTH dates
    const { data: fuelReports } = await supabase.from("fuel_reports").select("total_amount").gte("date", calendarMonthStart).lte("date", calendarMonthEnd);
    const totalFuelAmount = fuelReports?.reduce((sum, report) => sum + Number(report.total_amount), 0) || 0;

    setStats({ totalEmployees: totalEmployees || 0, todayPresent: todayPresent || 0, lateArrivals: lateArrivals || 0, attendanceRate, totalFuelAmount, myWorkingDays });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (roleLoading) {
    return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border/50">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, <span className="font-medium">{userName || "Loading..."}</span> {role && <span className="ml-2 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium uppercase">{role}</span>}</p>
          </div>
          <Button onClick={handleLogout} variant="outline" className="flex items-center gap-2"><LogOut className="h-4 w-4" />Logout</Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {role === 'employee' ? (
            <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">My Working Days</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.myWorkingDays}</div>
                <p className="text-xs text-muted-foreground mt-1">Current Cycle</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Employees</CardTitle>
                <Users className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent><div className="text-3xl font-bold">{stats.totalEmployees}</div></CardContent>
            </Card>
          )}

          <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today's Present</CardTitle>
              <Calendar className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.todayPresent}</div></CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Late Arrivals (Week)</CardTitle>
              <Clock className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.lateArrivals}</div></CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
              <TrendingUp className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.attendanceRate}%</div></CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Fuel (Current Month)</CardTitle>
              <Fuel className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent><div className="text-3xl font-bold">{stats.totalFuelAmount.toFixed(0)}</div><p className="text-xs text-muted-foreground mt-1">PKR</p></CardContent>
          </Card>
        </div>

        <DashboardCharts />

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate("/mark-attendance")}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><ClipboardCheck className="h-5 w-5 text-primary" />Mark Attendance</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Quickly record attendance for today</p></CardContent>
          </Card>

          <Card className="border-border/50 shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => navigate("/fuel")}>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><FuelIcon className="h-5 w-5 text-primary" />Add Fuel Entry</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Submit your fuel allowance report</p></CardContent>
          </Card>
        </div>

        <AttendanceSummary refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default Dashboard;
