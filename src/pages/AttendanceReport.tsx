import { AuthGuard } from "@/components/AuthGuard";
import { EmployeeAttendanceReport } from "@/components/EmployeeAttendanceReport";
import { AttendanceList } from "@/components/AttendanceList";
import { useUserRole } from "@/hooks/useUserRole";
import { useState } from "react";

const AttendanceReport = () => {
  const { role } = useUserRole();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const canEdit = role === "admin" || role === "manager";

  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8 space-y-8">
        <EmployeeAttendanceReport />
        <AttendanceList canEdit={canEdit} refreshTrigger={refreshTrigger} />
      </div>
    </AuthGuard>
  );
};

export default AttendanceReport;
