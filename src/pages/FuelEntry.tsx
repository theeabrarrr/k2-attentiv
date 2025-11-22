import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { FuelManagementDashboard } from "@/components/FuelManagementDashboard";
import { FuelHistoryTable } from "@/components/FuelHistoryTable";
import { FuelImportDialog } from "@/components/FuelImportDialog";
import { formatDateForDB, getCurrentKarachiDate } from "@/lib/dateUtils";

interface JobItem {
  job_no: string;
  area: string;
  km: number;
}

export default function FuelEntry() {
  const { role, loading: roleLoading } = useUserRole();
  const { get } = useSystemSettings();
  const [date, setDate] = useState<Date>(getCurrentKarachiDate());
  const [items, setItems] = useState<JobItem[]>([
    { job_no: "", area: "", km: 0 },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [refreshHistory, setRefreshHistory] = useState(0);

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

  const fuelRate = get("FUEL_RATE_PER_KM") as number;
  const totalKm = items.reduce((sum, item) => sum + (Number(item.km) || 0), 0);
  const totalAmount = totalKm * fuelRate;

  const handleSubmit = async () => {
    // Validation
    const hasEmptyFields = items.some(item => !item.job_no || !item.area || !item.km);
    if (hasEmptyFields) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in");
        return;
      }

      // Insert fuel report
      const { data: report, error: reportError } = await supabase
        .from("fuel_reports")
        .insert({
          user_id: user.id,
          date: formatDateForDB(date),
          total_km: totalKm,
          total_amount: totalAmount,
        })
        .select()
        .single();

      if (reportError) {
        if (reportError.code === "23505") {
          toast.error("A fuel report for this date already exists");
        } else {
          toast.error("Failed to create fuel report");
        }
        console.error(reportError);
        return;
      }

      // Insert fuel report items
      const itemsToInsert = items.map(item => ({
        report_id: report.id,
        job_no: item.job_no,
        area: item.area,
        km: item.km,
      }));

      const { error: itemsError } = await supabase
        .from("fuel_report_items")
        .insert(itemsToInsert);

      if (itemsError) {
        toast.error("Failed to save job items");
        console.error(itemsError);
        return;
      }

      toast.success("Fuel report submitted successfully");
      
      // Reset form
      setItems([{ job_no: "", area: "", km: 0 }]);
      setDate(getCurrentKarachiDate());
      setRefreshHistory(prev => prev + 1);
    } catch (error) {
      console.error("Error submitting fuel report:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show admin dashboard if user is admin or manager
  if (roleLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (role === "admin" || role === "manager") {
    return (
      <div className="container mx-auto p-4 max-w-7xl">
        <FuelManagementDashboard />
      </div>
    );
  }

  // Technician view
  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      <Card className="glass-effect border-border/50 shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl text-primary">Fuel Entry</CardTitle>
              <CardDescription>Record your daily fuel usage</CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsImportOpen(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(day) => day && setDate(day)}
                  initialFocus
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
            <p className="text-sm text-muted-foreground">Rate: PKR {fuelRate} per km</p>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || items.length === 0}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Fuel Report"}
          </Button>
        </CardContent>
      </Card>

      <FuelHistoryTable key={refreshHistory} />

      <FuelImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onComplete={() => setRefreshHistory(prev => prev + 1)}
      />
    </div>
  );
}
