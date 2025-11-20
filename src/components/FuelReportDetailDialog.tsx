import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

interface JobItem {
  id: string;
  job_no: string;
  area: string;
  km: number;
}

interface FuelReportDetailDialogProps {
  report: {
    id: string;
    date: string;
    total_km: number;
    total_amount: number;
  };
  open: boolean;
  onClose: () => void;
}

const RATE_PER_KM = 9;

export function FuelReportDetailDialog({ report, open, onClose }: FuelReportDetailDialogProps) {
  const [items, setItems] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchReportItems();
    }
  }, [open, report.id]);

  const fetchReportItems = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("fuel_report_items")
        .select("*")
        .eq("report_id", report.id);

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error("Error fetching report items:", error);
      toast.error("Failed to load report details");
    } finally {
      setIsLoading(false);
    }
  };

  const totalKm = items.reduce((sum, item) => sum + (Number(item.km) || 0), 0);
  const totalAmount = totalKm * RATE_PER_KM;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Fuel Report Details</DialogTitle>
          <DialogDescription>
            Viewing report for {format(new Date(report.date), "PPP")}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Job Items - Read Only */}
            <div className="space-y-4">
              <Label className="text-lg">Job Details</Label>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Label className="text-xs">Job No</Label>
                      <Input
                        value={item.job_no}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-5">
                      <Label className="text-xs">Area</Label>
                      <Input
                        value={item.area}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">KM</Label>
                      <Input
                        type="number"
                        value={item.km}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary - Read Only */}
            <div className="border-t border-border pt-4 space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total KM:</span>
                <span className="text-primary">{totalKm.toFixed(2)} km</span>
              </div>
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span className="text-primary">PKR {totalAmount.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground">Rate: PKR {RATE_PER_KM} per km</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
