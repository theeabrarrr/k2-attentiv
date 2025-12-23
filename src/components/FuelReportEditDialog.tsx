import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface JobItem {
  id?: string;
  job_no: string;
  area: string;
  km: number;
}

interface FuelReportEditDialogProps {
  report: {
    id: string;
    date: string;
    total_km: number;
    total_amount: number;
  };
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const RATE_PER_KM = 9;

export function FuelReportEditDialog({ report, open, onClose, onComplete }: FuelReportEditDialogProps) {
  const [items, setItems] = useState<JobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [reportDate, setReportDate] = useState<Date>(new Date(report.date));

  useEffect(() => {
    if (open) {
      setReportDate(new Date(report.date));
    }
  }, [open, report.date]);

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

  const addRow = () => {
    setItems([...items, { job_no: "", area: "", km: 0 }]);
  };

  const removeRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof JobItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const totalKm = items.reduce((sum, item) => sum + (Number(item.km) || 0), 0);
  const totalAmount = totalKm * RATE_PER_KM;

  const handleSave = async () => {
    const hasEmptyFields = items.some(item => !item.job_no || !item.area || !item.km);
    if (hasEmptyFields) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSaving(true);
    try {
      // Update fuel report totals and date
      const { error: reportError } = await supabase
        .from("fuel_reports")
        .update({
          total_km: totalKm,
          total_amount: totalAmount,
          date: format(reportDate, "yyyy-MM-dd"),
        })
        .eq("id", report.id);

      if (reportError) throw reportError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from("fuel_report_items")
        .delete()
        .eq("report_id", report.id);

      if (deleteError) throw deleteError;

      // Insert updated items
      const itemsToInsert = items.map(item => ({
        report_id: report.id,
        job_no: item.job_no,
        area: item.area,
        km: item.km,
      }));

      const { error: insertError } = await supabase
        .from("fuel_report_items")
        .insert(itemsToInsert);

      if (insertError) throw insertError;

      toast.success("Report updated successfully");
      onComplete();
    } catch (error) {
      console.error("Error updating report:", error);
      toast.error("Failed to update report");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fuel Report</DialogTitle>
          <DialogDescription>Modify the job details and kilometers</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Date Field */}
            <div className="space-y-2">
              <Label>Report Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reportDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reportDate ? format(reportDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reportDate}
                    onSelect={(date) => date && setReportDate(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Job Items */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg">Job Details</Label>
                <Button onClick={addRow} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Row
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-3">
                      <Label className="text-xs">Job No</Label>
                      <Input
                        placeholder="Job No"
                        value={item.job_no}
                        onChange={(e) => updateItem(index, "job_no", e.target.value)}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">Area</Label>
                      <Input
                        placeholder="Area"
                        value={item.area}
                        onChange={(e) => updateItem(index, "area", e.target.value)}
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">KM</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.km || ""}
                        onChange={(e) => updateItem(index, "km", parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div className="col-span-2">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => removeRow(index)}
                        disabled={items.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
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

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
