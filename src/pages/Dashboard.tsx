import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LogOut, Users, Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceForm } from "@/components/AttendanceForm";
import { AttendanceList } from "@/components/AttendanceList";
import { AttendanceSummary } from "@/components/AttendanceSummary";
import { useUserRole } from "@/hooks/useUserRole";

const Dashboard = () => {
  const navigate = useNavigate();
  const { role, loading: roleLoading } = useUserRole();
  const [userName, setUserName] = useState("");

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

  const canManageAttendance = role === "admin" || role === "manager";

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,hsl(260_80%_20%),transparent_50%),radial-gradient(circle_at_80%_20%,hsl(195_100%_20%),transparent_50%)]" />
      
      <header className="relative border-b border-border/50 glass-effect">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-xl font-bold">K2</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                K2 Attendance System
              </h1>
              <p className="text-sm text-muted-foreground">Welcome, {userName}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full glass-effect border border-primary/30">
              <span className="text-sm font-medium capitalize">{role}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} className="glass-effect">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="relative container mx-auto px-4 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card glass-effect border-border/50 animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Active users</p>
            </CardContent>
          </Card>

          <Card className="shadow-card glass-effect border-border/50 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Present</CardTitle>
              <Calendar className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">Marked today</p>
            </CardContent>
          </Card>

          <Card className="shadow-card glass-effect border-border/50 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
              <Clock className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—</div>
              <p className="text-xs text-muted-foreground">This week</p>
            </CardContent>
          </Card>

          <Card className="shadow-card glass-effect border-border/50 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">—%</div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <AttendanceSummary />

        {canManageAttendance && (
          <Card className="shadow-card glass-effect border-border/50 animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Mark Attendance
              </CardTitle>
              <CardDescription>Record attendance for employees</CardDescription>
            </CardHeader>
            <CardContent>
              <AttendanceForm />
            </CardContent>
          </Card>
        )}

        <AttendanceList canEdit={canManageAttendance} />
      </main>
    </div>
  );
};

export default Dashboard;
