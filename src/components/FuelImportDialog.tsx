import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface FuelImportDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

interface CSVRow {
  employeeEmail: string;
  date: string;
  jobNo: string;
  area: string;
  km: number;
}

export function FuelImportDialog({ open, onClose, onComplete }: FuelImportDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const downloadTemplate = () => {
    const template = "Employee Email,Date (YYYY-MM-DD),Job No,Area,KM\nexample@company.com,2025-01-20,JOB-001,North Area,45\nexample@company.com,2025-01-20,JOB-002,South Area,30";
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "fuel_import_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Template downloaded");
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.trim().split("\n");
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(",").map(v => v.trim());
      if (values.length < 5) continue;

      rows.push({
        employeeEmail: values[0],
        date: values[1],
        jobNo: values[2],
        area: values[3],
        km: parseFloat(values[4]) || 0,
      });
    }

    return rows;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsProcessing(true);

    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error("No valid data found in CSV");
        setIsProcessing(false);
        return;
      }

      // Get all unique emails and fetch user IDs
      const emails = [...new Set(rows.map(r => r.employeeEmail))];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email")
        .in("email", emails);

      if (profilesError) throw profilesError;

      const emailToUserId = new Map(profiles?.map(p => [p.email, p.id]) || []);

      // Group rows by employee and date
      const groups = new Map<string, CSVRow[]>();
      rows.forEach(row => {
        const key = `${row.employeeEmail}_${row.date}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(row);
      });

      let successCount = 0;
      let errorCount = 0;

      // Process each group
      for (const [key, groupRows] of groups.entries()) {
        const firstRow = groupRows[0];
        const userId = emailToUserId.get(firstRow.employeeEmail);

        if (!userId) {
          console.error(`User not found: ${firstRow.employeeEmail}`);
          errorCount++;
          continue;
        }

        const totalKm = groupRows.reduce((sum, r) => sum + r.km, 0);
        const totalAmount = totalKm * 9;

        // Insert fuel report
        const { data: report, error: reportError } = await supabase
          .from("fuel_reports")
          .insert({
            user_id: userId,
            date: firstRow.date,
            total_km: totalKm,
            total_amount: totalAmount,
          })
          .select()
          .single();

        if (reportError) {
          console.error(`Error creating report: ${reportError.message}`);
          errorCount++;
          continue;
        }

        // Insert fuel report items
        const items = groupRows.map(row => ({
          report_id: report.id,
          job_no: row.jobNo,
          area: row.area,
          km: row.km,
        }));

        const { error: itemsError } = await supabase
          .from("fuel_report_items")
          .insert(items);

        if (itemsError) {
          console.error(`Error creating items: ${itemsError.message}`);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} fuel report(s)`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} report(s)`);
      }

      onComplete();
      onClose();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Failed to import CSV file");
    } finally {
      setIsProcessing(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Fuel Reports</DialogTitle>
          <DialogDescription>
            Upload a CSV file with fuel report data. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            onClick={downloadTemplate}
            className="w-full"
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV Template
          </Button>

          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={isProcessing}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm">
                {file ? (
                  <span className="text-primary font-medium">{file.name}</span>
                ) : (
                  <>
                    <span className="text-primary font-medium">Click to upload</span>
                    <span className="text-muted-foreground"> or drag and drop</span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">CSV files only</p>
            </label>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleImport}
              disabled={!file || isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
