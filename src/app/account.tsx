"use client";

import { useEffect, useRef } from "react";
import { SignInButton, UserButton, useAuth, useUser } from "@clerk/nextjs";

export function Account({ name, guestLabel, onEdit }: { name: string; guestLabel: string; onEdit: () => void }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const previous = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!isLoaded) return;
    if (previous.current !== undefined && previous.current !== userId) window.location.reload();
    previous.current = userId;
  }, [isLoaded, userId]);
  if (!isLoaded) return <span className="account-loading" aria-label="Cargando cuenta"/>;
  if (isSignedIn) return <div className="account-control"><UserButton/><button className="account-name" aria-label="Editar tu nombre" onClick={onEdit}>{user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress.split("@")[0] || name}</button></div>;
  // Clerk alone picks guest vs account controls: the game session lags a login by one fetch.
  return <><SignInButton mode="modal"><button className="secondary login-button">Iniciar sesión</button></SignInButton><button className="avatar" aria-label="Editar tu nombre" onClick={onEdit}>{guestLabel}</button></>;
}
