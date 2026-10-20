import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { CharacterSheet } from "@/components/CharacterSheet";
import { Frame } from "@/components/Frame";
import { AwayModal, LevelUpModal, QuestModal, ToastStack, UnlockModal } from "@/components/GameOverlays";
import { NowPlayingBar } from "@/components/NowPlayingBar";
import { useGameSync } from "@/hooks/useGameSync";
import { apiSend, ApiError } from "@/lib/api";
import type { CharacterSheetModel, Stats } from "@/lib/game/character";
import { addStats, calculateDps } from "@/lib/game/combat";
import { fightDps } from "@/lib/game/effects";
import type { AwaySummary, GameSnapshot, GameToast } from "@/lib/game/snapshot";
import { nodeById, treeEffects } from "@/lib/game/trees";
import { Header } from "@/components/Header";

export function Dashboard({ sheet }: { sheet: CharacterSheetModel }) {
  const sync = useGameSync();
  const queryClient = useQueryClient();
  const [toasts, setToasts] = useState<GameToast[]>([]);
  const [levelUp, setLevelUp] = useState<{ level: number; unallocated: number } | null>(null);
  const [unlocks, setUnlocks] = useState<{ classId: string; color: string }[]>([]);
  const [away, setAway] = useState<AwaySummary | null>(null);
  const [quest, setQuest] = useState<{ title: string; xp: number } | null>(null);
  const shown = sheet;

  useEffect(() => {
    const data = sync.data;
    if (!data) return;
    setToasts((current) => {
      const ids = new Set(current.map((toast) => toast.id));
      return [...current, ...data.toasts.filter((toast) => !ids.has(toast.id))].slice(-4);
    });
    if (data.levelUp) setLevelUp(data.levelUp);
    if (data.unlocks.length > 0) setUnlocks(data.unlocks);
    if (data.away) setAway(data.away);
    if (data.questCompletions[0]) setQuest(data.questCompletions[0]);
  }, [sync.data]);

  async function refresh(path: string, body?: unknown) {
    await apiSend(path, "POST", body);
    await Promise.all([sync.refetch(), queryClient.invalidateQueries({ queryKey: ["character"] })]);
  }

  async function commit(path: string, body: unknown, patch: (sheet: CharacterSheetModel) => CharacterSheetModel) {
    const snapshot = queryClient.getQueryData<GameSnapshot>(["sync"]);
    const character = queryClient.getQueryData<CharacterSheetModel>(["character"]);
    if (snapshot) queryClient.setQueryData<GameSnapshot>(["sync"], { ...snapshot, sheet: patch(snapshot.sheet) });
    if (character) queryClient.setQueryData<CharacterSheetModel>(["character"], patch(character));
    try {
      await apiSend(path, "POST", body);
      await Promise.all([sync.refetch(), queryClient.invalidateQueries({ queryKey: ["character"] })]);
    } catch (error) {
      if (snapshot) queryClient.setQueryData(["sync"], snapshot);
      if (character) queryClient.setQueryData(["character"], character);
      throw error;
    }
  }

  const unlock = unlocks[0];

  return (
    <Frame>
      <NowPlayingBar />
      {sync.data?.fight ? (
        <p className="mx-auto mb-4 w-full max-w-5xl px-4 text-sm md:px-8">
          <Link to="/battle" className="text-gold hover:text-gold-2">
            {sync.data.fight.trackName} is the current fight.
          </Link>
        </p>
      ) : null}
      <CharacterSheet
        sheet={sync.data?.sheet ?? shown}
        onApplyStats={(grants) => commit("/api/character/allocate", { stats: grants }, (current) => withStatGrants(current, grants))}
        onEquip={(id) => void refresh(`/api/relics/${id}/equip`)}
        onUnequip={(id) => void refresh(`/api/relics/${id}/unequip`)}
        onSwitchClass={(id) => void refresh("/api/character/class", { classId: id })}
        onApplySkills={(ids) => commit("/api/character/skill", { skillIds: ids }, (current) => withSkills(current, ids))}
        onReset={() => void refresh("/api/character/reset")}
      />
      <ToastStack toasts={toasts} onDone={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      {levelUp ? (
        <LevelUpModal level={levelUp.level} unallocated={levelUp.unallocated} onClose={() => setLevelUp(null)} />
      ) : null}
      {unlock ? (
        <UnlockModal
          classId={unlock.classId}
          color={unlock.color}
          onClose={() => setUnlocks((current) => current.slice(1))}
        />
      ) : null}
      {away ? <AwayModal summary={away} onClose={() => setAway(null)} /> : null}
      {quest ? <QuestModal title={quest.title} xp={quest.xp} onClose={() => setQuest(null)} /> : null}
    </Frame>
  );
}

export function SheetError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  const code = error instanceof ApiError ? error.code : "request_failed";
  const reconnect = code === "reconnect_required";

  return (
    <>
      <Header />
      <main className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-display text-5xl tracking-wide text-gold">
          {reconnect ? "Reconnect Last.fm" : "Couldn't load your character"}
        </h1>
        <p className="mt-4 text-zinc-300">
          {reconnect
            ? "Last.fm needs you to sign in again."
            : "Last.fm didn't respond. Try again."}
        </p>
        {reconnect ? (
          <a href="/auth/lastfm?reconnect=1" className="mt-8 inline-flex bg-gold px-6 py-3 text-sm font-semibold text-ink">
            Reconnect Last.fm
          </a>
        ) : (
          <button type="button" onClick={onRetry} className="mt-8 inline-flex bg-gold px-6 py-3 text-sm font-semibold text-ink">
            Try again
          </button>
        )}
      </main>
    </>
  );
}

function withStatGrants(sheet: CharacterSheetModel, grants: Stats): CharacterSheetModel {
  const stats = addStats(sheet.stats, grants);
  const spent = grants.str + grants.agi + grants.int + grants.wis + grants.cha;
  const worn = sheet.relics.flatMap((relic) => relic?.effects ?? []);
  return {
    ...sheet,
    stats,
    unallocatedPoints: Math.max(0, sheet.unallocatedPoints - spent),
    dps: fightDps(calculateDps(stats), stats, worn, 0),
  };
}

function withSkills(sheet: CharacterSheetModel, ids: string[]): CharacterSheetModel {
  let next = sheet;
  for (const id of ids) {
    if (id === "bank") {
      next = { ...next, skillPicks: next.skillPicks - 1, unallocatedPoints: next.unallocatedPoints + 1 };
      continue;
    }
    const node = nodeById(id);
    if (!node) continue;
    const treeNodes = next.treeNodes.includes(node.id) ? next.treeNodes : [...next.treeNodes, node.id];
    const skills = node.skillId && !next.skills.includes(node.skillId) ? [...next.skills, node.skillId] : next.skills;
    const bonus = node.classId === next.className ? treeEffects(next.className, [node.id]).bonus : {};
    const stats = addStats(next.stats, bonus);
    const worn = next.relics.flatMap((relic) => relic?.effects ?? []);
    next = {
      ...next,
      treeNodes,
      skills,
      skillPicks: next.skillPicks - 1,
      stats,
      dps: fightDps(calculateDps(stats), stats, worn, 0),
    };
  }
  return next;
}
