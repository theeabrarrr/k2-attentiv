import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Clock, Save } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
}

export const AttendanceForm = () => {
  const [employees, setEmployees] = useState<Profile[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkInTime, setCheckInTime] = useState("09:00");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [status, setStatus] = useState<"present" | "late" | "absent">("present");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name");
    
    if (data) {
      setEmployees(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("You must be logged in");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("attendance").upsert({
      user_id: selectedEmployee,
      date,
      check_in_time: checkInTime,
      check_out_time: checkOutTime || null,
      status,
      notes: notes || null,
      created_by: user.id,
    }, {
      onConflict: 'user_id,date'
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Attendance recorded successfully!");
      setSelectedEmployee("");
      setCheckInTime("09:00");
      setCheckOutTime("");
      setStatus("present");
      setNotes("");
      setDate(new Date().toISOString().split('T')[0]);
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employee">Employee</Label>
          <Select value={selectedEmployee} onValueChange={setSelectedEmployee} required>
            <SelectTrigger id="employee" className="glass-effect">
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((emp) => (
                <SelectItem key={emp.id} value={emp.id}>
                  {emp.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="glass-effect"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkin">Check-in Time</Label>
          <Input
            id="checkin"
            type="time"
            value={checkInTime}
            onChange={(e) => setCheckInTime(e.target.value)}
            required
            className="glass-effect"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="checkout">Check-out Time</Label>
          <Input
            id="checkout"
            type="time"
            value={checkOutTime}
            onChange={(e) => setCheckOutTime(e.target.value)}
            className="glass-effect"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus(v as "present" | "late" | "absent")} required>
            <SelectTrigger id="status" className="glass-effect">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="present">Present</SelectItem>
              <SelectItem value="late">Late</SelectItem>
              <SelectItem value="absent">Absent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Add any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="glass-effect resize-none"
          rows={3}
        />
      </div>

      <Button type="submit" disabled={loading} className="gradient-primary shadow-3d hover:opacity-90 transition-all">
        {loading ? (
          <Clock className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Save className="mr-2 h-4 w-4" />
        )}
        Save Attendance
      </Button>
    </form>
  );
};
