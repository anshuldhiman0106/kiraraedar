"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type AuthSessionState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

export function useAuthSession(): AuthSessionState {
  const [state, setState] = useState<AuthSessionState>({
    session: null,
    user: null,
    loading: true,
  });

  useEffect(() => {
    let active = true;

    const applySession = (session: Session | null) => {
      if (!active) return;
      setState({
        session,
        user: session?.user ?? null,
        loading: false,
      });
    };

    supabase.auth.getSession().then(({ data }) => {
      applySession(data.session ?? null);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session ?? null);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return state;
}
