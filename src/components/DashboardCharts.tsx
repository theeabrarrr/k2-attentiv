import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays } from "date-fns";

export const DashboardCharts = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [fuelData, setFuelData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    // Fetch last 7 days attendance
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });

    const attendancePromises = dates.map(async (date) => {
      const { count: presentCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("date", date)
        .eq("status", "present");

      const { count: lateCount } = await supabase
        .from("attendance")
        .select("*", { count: "exact", head: true })
        .eq("date", date)
        .eq("status", "late");

      return {
        date: format(new Date(date), 'MMM dd'),
        Present: presentCount || 0,
        Late: lateCount || 0,
      };
    });

    const attendanceResults = await Promise.all(attendancePromises);
    setAttendanceData(attendanceResults);

    // Fetch last 6 months fuel data
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return {
        month: format(date, 'MMM yyyy'),
        start: format(new Date(date.getFullYear(), date.getMonth(), 1), 'yyyy-MM-dd'),
        end: format(new Date(date.getFullYear(), date.getMonth() + 1, 0), 'yyyy-MM-dd'),
      };
    });

    const fuelPromises = months.map(async ({ month, start, end }) => {
      const { data } = await supabase
        .from("fuel_reports")
        .select("total_amount")
        .gte("date", start)
        .lte("date", end);

      const total = data?.reduce((sum, report) => sum + Number(report.total_amount), 0) || 0;

      return {
        month,
        Amount: Math.round(total),
      };
    });

    const fuelResults = await Promise.all(fuelPromises);
    setFuelData(fuelResults);
    setLoading(false);
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Attendance Trend (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="present" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Present"
              />
              <Line 
                type="monotone" 
                dataKey="late" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Late"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Fuel Expenses (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={fuelData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '12px' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value) => [`PKR ${value}`, "Amount"]}
              />
              <Bar 
                dataKey="amount" 
                fill="hsl(var(--primary))" 
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
