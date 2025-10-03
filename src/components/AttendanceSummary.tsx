import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, CheckCircle2, XCircle, Clock } from "lucide-react";

interface Summary {
  present: number;
  absent: number;
  late: number;
  total: number;
  percentage: number;
}

export const AttendanceSummary = () => {
  const [summary, setSummary] = useState<Summary>({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    // Get current month's data
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startDate = startOfMonth.toISOString().split('T')[0];

    let query = supabase
      .from("attendance")
      .select("status")
      .gte("date", startDate);

    // If employee, only show their own stats
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role === "employee") {
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;

    if (data) {
      const present = data.filter(r => r.status === "present").length;
      const absent = data.filter(r => r.status === "absent").length;
      const late = data.filter(r => r.status === "late").length;
      const total = data.length;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      setSummary({ present, absent, late, total, percentage });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <Card className="shadow-card glass-effect border-border/50">
        <CardContent className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card glass-effect border-border/50 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Monthly Summary
        </CardTitle>
        <CardDescription>Overview of this month's attendance</CardDescription>
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
            {summary.present} out of {summary.total} total records
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
