import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Trash2, Users, RotateCcw, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role?: string;
  is_active?: boolean;
  deactivated_at?: string;
}

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "employee" as "admin" | "manager" | "employee",
  });

  useEffect(() => {
    fetchEmployees();
  }, [showInactive]);

  const fetchEmployees = async () => {
    let query = supabase
      .from("profiles")
      .select("id, full_name, email, is_active, deactivated_at")
      .order("full_name");
    
    // Filter by active status
    if (!showInactive) {
      query = query.eq("is_active", true);
    }

    const { data: profiles } = await query;

    if (profiles) {
      // Fetch roles for each employee
      const employeesWithRoles = await Promise.all(
        profiles.map(async (profile) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", profile.id)
            .single();
          
          return {
            ...profile,
            role: roleData?.role || "employee",
          };
        })
      );
      setEmployees(employeesWithRoles);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in");
        setLoading(false);
        return;
      }

      const response = await supabase.functions.invoke('create-employee', {
        body: formData,
      });

      if (response.error) {
        toast.error(response.error.message);
      } else {
        toast.success("Employee created successfully!");
        setFormData({
          full_name: "",
          email: "",
          password: "",
          role: "employee",
        });
        fetchEmployees();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create employee");
    }
    setLoading(false);
  };

  const handleDeactivate = async (employeeId: string, employeeName: string) => {
    const reason = prompt(`Reason for deactivating ${employeeName}? (Optional)`);
    
    if (!confirm(`Are you sure you want to deactivate ${employeeName}?`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("You must be logged in");
        return;
      }

      const response = await supabase.functions.invoke('delete-employee', {
        body: { employee_id: employeeId, reason },
      });

      if (response.error) {
        toast.error(response.error.message || "Failed to deactivate employee");
      } else {
        toast.success(`${employeeName} has been deactivated successfully`);
        fetchEmployees();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to deactivate employee");
    }
  };

  const handleReactivate = async (employeeId: string, employeeName: string) => {
    if (!confirm(`Are you sure you want to reactivate ${employeeName}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_active: true,
          deactivated_at: null,
          deactivation_reason: null,
        })
        .eq("id", employeeId);

      if (error) {
        toast.error(error.message || "Failed to reactivate employee");
      } else {
        toast.success(`${employeeName} has been reactivated successfully`);
        fetchEmployees();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to reactivate employee");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card glass-effect border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Add New Employee
          </CardTitle>
          <CardDescription>Create a new employee account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  className="glass-effect"
                  placeholder="Enter full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="glass-effect"
                  placeholder="employee@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  className="glass-effect"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v) => setFormData({ ...formData, role: v as any })}
                >
                  <SelectTrigger id="role" className="glass-effect">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="employee">Employee</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="gradient-primary shadow-3d hover:opacity-90">
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? "Creating..." : "Create Employee"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-card glass-effect border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                All Employees
              </CardTitle>
              <CardDescription>Manage employee accounts</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="show-inactive" className="text-sm">Show Inactive</Label>
              <Switch 
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id} className={!emp.is_active ? "opacity-60" : ""}>
                    <TableCell className="font-medium">
                      {emp.full_name}
                      {!emp.is_active && (
                        <span className="ml-2 text-xs text-muted-foreground">(Deactivated)</span>
                      )}
                    </TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {emp.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={emp.is_active ? "default" : "secondary"}>
                        {emp.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {emp.is_active ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivate(emp.id, emp.full_name)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Deactivate employee"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReactivate(emp.id, emp.full_name)}
                          className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                          title="Reactivate employee"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No employees found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
