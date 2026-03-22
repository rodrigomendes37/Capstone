import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useRole() {
  const [role, setRole] = useState(null); // "athlete" | "coach" | null
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoadingRole(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (mounted) {
          setRole(null);
          setLoadingRole(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (mounted) {
        setRole(error ? null : data?.role ?? null);
        setLoadingRole(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return { role, loadingRole };
}
