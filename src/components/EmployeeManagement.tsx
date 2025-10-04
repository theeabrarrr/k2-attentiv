import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { UserPlus, Trash2, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role?: string;
}

export const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "employee" as "admin" | "manager" | "employee",
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

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
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            All Employees
          </CardTitle>
          <CardDescription>Manage employee accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell className="font-medium">{emp.full_name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {emp.role}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {employees.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
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
