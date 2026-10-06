"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useStore, type State, type User } from "@/lib/store";

/** L-3: pages behind login. Redirects to "/" when there is no session. */
export function AuthGate({ children }: { children: (state: State & { user: User }) => ReactNode }) {
  const state = useStore();
  const router = useRouter();
  const signedOut = state !== null && !state.user;

  useEffect(() => {
    if (signedOut) router.replace("/");
  }, [signedOut, router]);

  if (!state || !state.user) return null;
  return <>{children(state as State & { user: User })}</>;
}
