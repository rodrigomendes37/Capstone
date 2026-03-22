import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";

export function useAuth() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    ``;
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
      },
    );

    return () => {
      listener?.subsciption?.unsubscribe();
    };
  }, []);

  return session;
}
