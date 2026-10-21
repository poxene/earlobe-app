import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { TownChat } from "@/components/TownSquare";
import { useCharacter } from "@/hooks/useCharacter";
import { apiPost } from "@/lib/api";

export function Frame({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const authed = useCharacter().isSuccess;

  async function logout() {
    try {
      await apiPost("/auth/logout");
    } finally {
      queryClient.clear();
    }
  }

  return (
    <>
      <Header nav onLogout={() => void logout()} />
      <div className={authed ? "pb-[var(--dock)]" : undefined}>{children}</div>
      {authed ? <TownChat /> : null}
    </>
  );
}
