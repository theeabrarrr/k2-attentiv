import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface FuelReport {
  id: string;
  date: string;
  total_km: number;
  total_amount: number;
}

export function FuelHistoryTable() {
  const [reports, setReports] = useState<FuelReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserReports();
  }, []);

  const fetchUserReports = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in");
        return;
      }

      const { data, error } = await supabase
        .from("fuel_reports")
        .select("id, date, total_km, total_amount")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error("Error fetching reports:", error);
      toast.error("Failed to load fuel reports");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-effect border-border/50 shadow-card">
      <CardHeader>
        <CardTitle className="text-xl text-primary">My Fuel Reports</CardTitle>
        <CardDescription>View your submitted fuel allowance reports</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total KM</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No fuel reports submitted yet
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">
                        {format(new Date(report.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-right">{report.total_km.toFixed(2)} km</TableCell>
                      <TableCell className="text-right">PKR {report.total_amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
