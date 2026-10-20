import { classForFamily } from "@/lib/game/classes";
import type { Stats } from "@/lib/game/character";
import { skillById, skillsForClass } from "@/lib/game/skills";

export const LEGACY_POINT_CAP = 4;
export const LEGACY_SHARE = 0.15;
const DEEP_LIBRARY = 20;

export type TreeNode = {
  id: string;
  classId: string;
  tier: 1 | 2 | 3;
  name: string;
  detail: string;
  requires: string | null;
  skillId: string | null;
  stat: keyof Stats | null;
  echoes: number;
};

const ZERO: Stats = { str: 0, agi: 0, int: 0, wis: 0, cha: 0 };

export function legacyGrant(input: {
  artistCount: number;
  shares: { family: string; share: number }[];
}): { points: number; classes: string[] } {
  const ranked = [...input.shares].sort((a, b) => b.share - a.share);
  const primary = classForFamily(ranked[0]?.family ?? "Unmapped").id;
  const classes = new Set<string>([primary]);
  for (const row of input.shares) {
    if (row.family === "Unmapped" || row.share < LEGACY_SHARE) continue;
    classes.add(classForFamily(row.family).id);
  }
  let points = input.artistCount > 0 ? 1 : 0;
  points += Math.max(0, classes.size - 1);
  if (input.artistCount >= DEEP_LIBRARY) points += 1;
  return { points: Math.min(LEGACY_POINT_CAP, points), classes: [...classes] };
}

export function nodesForClass(classId: string): TreeNode[] {
  return skillsForClass(classId).flatMap((skill) => {
    const root = `${skill.id}:ink`;
    const press = `${skill.id}:press`;
    const stat = skill.stat.toUpperCase();
    return [
      {
        id: root,
        classId,
        tier: 1 as const,
        name: `${skill.name} +1 ${stat}`,
        detail: `+1 ${stat} while this class is active.`,
        requires: null,
        skillId: null,
        stat: skill.stat,
        echoes: 0,
      },
      {
        id: press,
        classId,
        tier: 2 as const,
        name: `${skill.name} +1 echo`,
        detail: "+1 echo on a kill while this class is active.",
        requires: root,
        skillId: null,
        stat: null,
        echoes: 1,
      },
      {
        id: skill.id,
        classId,
        tier: 3 as const,
        name: skill.name,
        detail: skill.detail,
        requires: press,
        skillId: skill.id,
        stat: null,
        echoes: 0,
      },
    ];
  });
}

export function nodeById(id: string): TreeNode | undefined {
  const skillId = id.replace(/:(ink|press)$/, "");
  const skill = skillById(skillId);
  if (!skill) return undefined;
  return nodesForClass(classIdForSkill(skill.id)).find((node) => node.id === id);
}

export function nodeOwned(node: TreeNode, nodes: readonly string[], skills: readonly string[]): boolean {
  if (nodes.includes(node.id)) return true;
  return node.skillId !== null && skills.includes(node.skillId);
}

export function canSpend(
  node: TreeNode,
  classIds: readonly string[],
  nodes: readonly string[],
  skills: readonly string[],
): boolean {
  if (!classIds.includes(node.classId) || nodeOwned(node, nodes, skills)) return false;
  if (!node.requires) return true;
  const parent = nodeById(node.requires);
  return parent ? nodeOwned(parent, nodes, skills) : false;
}

export function withoutPending(pending: readonly string[], id: string): string[] {
  const remove = new Set<string>([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const entry of pending) {
      if (remove.has(entry) || entry === "bank") continue;
      const node = nodeById(entry);
      if (node?.requires && remove.has(node.requires)) {
        remove.add(entry);
        changed = true;
      }
    }
  }
  return pending.filter((entry) => !remove.has(entry));
}

export function purchasable(classIds: readonly string[], nodes: readonly string[], skills: readonly string[]): TreeNode[] {
  return classIds.flatMap((classId) => nodesForClass(classId).filter((node) => canSpend(node, classIds, nodes, skills)));
}

export function treeEffects(classId: string, nodes: readonly string[]): { bonus: Stats; echoes: number } {
  const bonus = { ...ZERO };
  let echoes = 0;
  for (const node of nodesForClass(classId)) {
    if (!nodes.includes(node.id)) continue;
    if (node.stat) bonus[node.stat] += 1;
    echoes += node.echoes;
  }
  return { bonus, echoes };
}

function classIdForSkill(skillId: string): string {
  const classes = [
    "Berserker",
    "Rogue",
    "Arcanist",
    "Warrior",
    "Bard",
    "Cleric",
    "Enchanter",
    "Ranger",
    "Monk",
    "Barbarian",
    "Wanderer",
  ];
  return classes.find((classId) => skillsForClass(classId).some((skill) => skill.id === skillId)) ?? "Wanderer";
}
