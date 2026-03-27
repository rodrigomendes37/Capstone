import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useTeam() {
  const [teamId, setTeamId] = useState(null);
  const [teamRole, setTeamRole] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load(userId) {
      if (!mounted) return;
      setLoadingTeam(true);

      if (!userId) {
        if (mounted) {
          setTeamId(null);
          setTeamRole(null);
          setLoadingTeam(false);
        }
        return;
      }

      const { data, error } = await supabase
        .from("team_memberships")
        .select("team_id, role")
        .eq("user_id", userId)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        console.log("useTeam error:", error);
        setTeamId(null);
        setTeamRole(null);
      } else {
        setTeamId(data?.team_id ?? null);
        setTeamRole(data?.role ?? null);
      }

      setLoadingTeam(false);
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

  return { teamId, teamRole, loadingTeam };
}
