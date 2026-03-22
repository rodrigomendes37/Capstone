import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useTeam() {
  const [teamId, setTeamId] = useState(null);
  const [teamRole, setTeamRole] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadTeam() {
      setLoadingTeam(true);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
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
        .eq("user_id", user.id)
        .single();

      if (mounted) {
        if (error || !data) {
          setTeamId(null);
          setTeamRole(null);
        } else {
          setTeamId(data.team_id);
          setTeamRole(data.role);
        }
        setLoadingTeam(false);
      }
    }

    loadTeam();

    return () => {
      mounted = false;
    };
  }, []);

  return { teamId, teamRole, loadingTeam };
}