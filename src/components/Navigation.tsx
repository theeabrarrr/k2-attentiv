import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, ClipboardCheck } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export const Navigation = () => {
  const { role } = useUserRole();
  const canManage = role === "admin" || role === "manager";

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, showForAll: true },
    { path: "/employees", label: "Employees", icon: Users, showForAll: false },
    { path: "/reports", label: "Reports", icon: FileText, showForAll: true },
    { path: "/mark-attendance", label: "Mark Attendance", icon: ClipboardCheck, showForAll: false },
    { path: "/fuel", label: "Fuel Entry", icon: FileText, showForAll: true },
  ];

  return (
    <nav className="border-b border-border bg-card shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {navItems.map((item) => {
            const shouldShow = item.showForAll || canManage;
            if (!shouldShow) return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-b-2 border-primary text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
