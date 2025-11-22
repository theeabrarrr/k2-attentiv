import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SystemSettings {
  FUEL_RATE_PER_KM: number;
  LATE_ARRIVAL_TIME: string;
}

export const useSystemSettings = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    FUEL_RATE_PER_KM: 9,
    LATE_ARRIVAL_TIME: "10:15",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("key, value");

      if (error) {
        console.error("Error fetching system settings:", error);
        return;
      }

      if (data) {
        const settingsMap: any = {};
        data.forEach((item) => {
          if (item.key === "FUEL_RATE_PER_KM") {
            settingsMap[item.key] = parseFloat(item.value);
          } else {
            settingsMap[item.key] = item.value;
          }
        });
        setSettings({ ...settings, ...settingsMap });
      }
    } catch (error) {
      console.error("Error in fetchSettings:", error);
    } finally {
      setLoading(false);
    }
  };

  const get = (key: keyof SystemSettings) => {
    return settings[key];
  };

  return { settings, loading, get };
};
