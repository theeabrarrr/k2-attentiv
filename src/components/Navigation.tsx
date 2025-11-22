import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, FileText, ClipboardCheck } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export const Navigation = () => {
  const { role } = useUserRole();
  const canManage = role === "admin" || role === "manager";

  const navItems = [
    { path: "/", label: "Dashboard", icon: LayoutDashboard, showForAll: true },
    { path: "/employees", label: "Employees", icon: Users, showForAll: false, adminOnly: true },
    { path: "/reports", label: "Reports", icon: FileText, showForAll: true },
    { path: "/mark-attendance", label: "Mark Attendance", icon: ClipboardCheck, showForAll: false, adminOnly: true },
    { path: "/fuel", label: "Fuel Entry", icon: FileText, showForAll: true },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex gap-1">
          {navItems.map((item) => {
            // Hide admin-only items from employees
            if (item.adminOnly && role === "employee") return null;
            const shouldShow = item.showForAll || canManage;
            if (!shouldShow) return null;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all relative ${
                    isActive
                      ? "text-primary after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
