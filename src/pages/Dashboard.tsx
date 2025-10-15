import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceSummary } from "@/components/AttendanceSummary";
import { useUserRole } from "@/hooks/useUserRole";

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
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Get week start date (Monday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff)).toISOString().split('T')[0];
    
    // Get month start date
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Fetch total employees
    const { count: totalEmployees } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Fetch today's present count
    const { count: todayPresent } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .eq("date", today)
      .eq("status", "present");

    // Fetch late arrivals this week
    const { count: lateArrivals } = await supabase
      .from("attendance")
      .select("*", { count: "exact", head: true })
      .gte("date", weekStart)
      .eq("status", "late");

    // Fetch attendance rate for this month
    const { data: monthAttendance } = await supabase
      .from("attendance")
      .select("status")
      .gte("date", monthStart)
      .lte("date", monthEnd);

    let attendanceRate = 0;
    if (monthAttendance && monthAttendance.length > 0) {
      const presentCount = monthAttendance.filter(r => r.status === "present").length;
      attendanceRate = Math.round((presentCount / monthAttendance.length) * 100);
    }

    setStats({
      totalEmployees: totalEmployees || 0,
      todayPresent: todayPresent || 0,
      lateArrivals: lateArrivals || 0,
      attendanceRate,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  if (roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center shadow-elevated">
              <span className="text-xl font-bold text-white">K2</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                K2 Attendance System
              </h1>
              <p className="text-sm text-muted-foreground">Welcome, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-lg bg-muted">
              <span className="text-sm font-medium capitalize">{role}</span>
            </div>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Present</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayPresent}</div>
              <p className="text-xs text-muted-foreground">Marked today</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <Clock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.lateArrivals}</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.attendanceRate}%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <AttendanceSummary refreshTrigger={refreshTrigger} />
      </main>
    </div>
  );
};

export default Dashboard;
