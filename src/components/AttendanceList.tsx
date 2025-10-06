import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, List } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_time: string;
  check_out_time: string | null;
  status: "present" | "late" | "absent";
  notes: string | null;
  profiles: {
    full_name: string;
  };
}

interface AttendanceListProps {
  canEdit: boolean;
  refreshTrigger?: number;
}

export const AttendanceList = ({ canEdit, refreshTrigger }: AttendanceListProps) => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecords();
  }, [refreshTrigger]);

  const fetchRecords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return;

    let query = supabase
      .from("attendance")
      .select(`
        id,
        date,
        check_in_time,
        check_out_time,
        status,
        notes,
        user_id,
        profiles!attendance_user_id_fkey (full_name)
      `)
      .order("date", { ascending: false })
      .limit(50);

    // If not admin/manager, only show their own records
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role === "employee") {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Attendance fetch error:", error);
      toast.error("Failed to load attendance records: " + error.message);
    } else if (data) {
      setRecords(data as any);
    }
    setLoading(false);
  };

  const handleExport = () => {
    if (records.length === 0) {
      toast.error("No records to export");
      return;
    }

    const headers = ["Employee", "Date", "Check-in", "Check-out", "Status", "Notes"];
    const csvContent = [
      headers.join(","),
      ...records.map(r => [
        r.profiles.full_name,
        r.date,
        r.check_in_time,
        r.check_out_time || "N/A",
        r.status,
        r.notes || ""
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Attendance exported successfully!");
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
        return "";
    }
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
    <Card className="shadow-card glass-effect border-border/50 animate-slide-up">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              Attendance Records
            </CardTitle>
            <CardDescription>Recent attendance history</CardDescription>
          </div>
          <Button onClick={handleExport} variant="outline" className="glass-effect">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No attendance records found</p>
        ) : (
          <div className="rounded-md border border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check-in</TableHead>
                  <TableHead>Check-out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{record.profiles.full_name}</TableCell>
                    <TableCell>{format(new Date(record.date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{record.check_in_time}</TableCell>
                    <TableCell>{record.check_out_time || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
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
  );
};
