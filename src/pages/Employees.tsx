import { AuthGuard } from "@/components/AuthGuard";
import { EmployeeManagement } from "@/components/EmployeeManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const Employees = () => {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Employee Management
            </CardTitle>
            <CardDescription>Add and manage employee accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeManagement />
          </CardContent>
        </Card>
      </div>
    </AuthGuard>
  );
};

export default Employees;
