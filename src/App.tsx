import { useEffect, useState, type ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Attuning } from "@/components/Attuning";
import { ApiError } from "@/lib/api";
import { useCharacter } from "@/hooks/useCharacter";
import { Dashboard, SheetError } from "@/pages/Dashboard";
import { BattlePage } from "@/pages/Battle";
import { CodexPage } from "@/pages/Codex";
import { Debug } from "@/pages/Debug";
import { Login } from "@/pages/Login";
import { PartyPage } from "@/pages/Party";
import { Preview } from "@/pages/Preview";
import { QuestsPage } from "@/pages/Quests";
import { ShopPage } from "@/pages/Shop";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/battle" element={<Authed><BattlePage /></Authed>} />
      <Route path="/codex" element={<Authed><CodexPage /></Authed>} />
      <Route path="/quests" element={<Authed><QuestsPage /></Authed>} />
      <Route path="/shop" element={<Authed><ShopPage /></Authed>} />
      <Route path="/party" element={<Authed><PartyPage /></Authed>} />
      <Route path="/debug" element={<Debug />} />
      {import.meta.env.DEV ? <Route path="/preview" element={<Preview />} /> : null}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Authed({ children }: { children: ReactNode }) {
  const character = useCharacter();
  const ritual = useDelayedFlag(character.isPending, 450);
  if (character.isPending) return <Attuning ritual={ritual} />;
  if (character.isError) {
    const code = character.error instanceof ApiError ? character.error.code : "";
    if (code === "unauthenticated") return <Login />;
    return <SheetError error={character.error} onRetry={() => void character.refetch()} />;
  }
  return children;
}

function Home() {
  const character = useCharacter();
  const ritual = useDelayedFlag(character.isPending, 450);

  if (character.isPending) return <Attuning ritual={ritual} />;
  if (character.isError) {
    const code = character.error instanceof ApiError ? character.error.code : "";
    if (code === "unauthenticated") return <Login />;
    return <SheetError error={character.error} onRetry={() => void character.refetch()} />;
  }
  return <Dashboard sheet={character.data} />;
}

function useDelayedFlag(active: boolean, delayMs: number): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!active) {
      setReady(false);
      return;
    }
    const id = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(id);
  }, [active, delayMs]);
  return active && ready;
}
