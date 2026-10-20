import type { ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { apiPost } from "@/lib/api";

export function Frame({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

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
      {children}
    </>
  );
}
