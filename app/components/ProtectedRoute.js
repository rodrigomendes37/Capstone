import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { supabase } from "../../supabase"; // path relative to app/components

export default function ProtectedRoute({ children }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && session === null) {
      router.replace("/login"); // lowercase!
    }
  }, [isLoading, session, router]);

  if (isLoading) return null;
  return session ? children : null;
}
