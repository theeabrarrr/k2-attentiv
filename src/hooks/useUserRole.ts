import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "manager" | "employee";

export const useUserRole = () => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setRole(data.role as UserRole);
      }
      setLoading(false);
    };

    fetchRole();
  }, []);

  return { role, loading, isAdmin: role === "admin", isManager: role === "manager", isEmployee: role === "employee" };
};
