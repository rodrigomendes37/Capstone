import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useRole() {
  const [role, setRole] = useState(null);
  const [loadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load(userId) {
      if (!mounted) return;
      setLoadingRole(true);

      if (!userId) {
        if (mounted) {
          setRole(null);
          setLoadingRole(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        setRole(null);
      } else {
        setRole(data?.role ?? null);
      }

      setLoadingRole(false);
    }

    async function init() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      await load(session?.user?.id ?? null);
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { role, loadingRole };
}
