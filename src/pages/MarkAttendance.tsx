import { AuthGuard } from "@/components/AuthGuard";
import { AttendanceForm } from "@/components/AttendanceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const MarkAttendance = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success("Attendance marked successfully");
  };

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-elevated max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Mark Attendance
            </CardTitle>
            <CardDescription>Record attendance for employees</CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default MarkAttendance;
