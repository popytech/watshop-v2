"use client";

import { useEffect } from "react";

/** Recharge la page dès que la connexion revient — promesse faite à l'écran. */
export function ReloadWhenOnline() {
  useEffect(() => {
    const revenu = () => window.location.reload();
    window.addEventListener("online", revenu);
    return () => window.removeEventListener("online", revenu);
  }, []);

  return null;
}
