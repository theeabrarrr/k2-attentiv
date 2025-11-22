import { AuthGuard } from "@/components/AuthGuard";
import { AttendanceForm } from "@/components/AttendanceForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";

const MarkAttendance = () => {
  const { role, loading } = useUserRole();
  const navigate = useNavigate();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Redirect employees away from this page
  useEffect(() => {
    if (!loading && role === "employee") {
      toast.error("You don't have permission to access this page");
      navigate("/");
    }
  }, [role, loading, navigate]);

  const handleSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    toast.success("Attendance marked successfully");
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AuthGuard>
    );
  }

  if (role === "employee") {
    return null;
  }

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
