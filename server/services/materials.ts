import { randomUUID } from "node:crypto";
import {
  STACK_CAP,
  materialBySlug,
  materialsForMonster,
  type MaterialDrop,
  type MaterialStackView,
} from "../../src/lib/game/materials";
import { GameError } from "../errors";
import { getSupabase } from "../supabase";

type StackRow = { id: string; slug: string; quantity: number };

export async function readStacks(userId: string): Promise<MaterialStackView[]> {
  const { data, error } = await getSupabase()
    .from("material_stacks")
    .select("id, slug, quantity")
    .eq("user_id", userId)
    .order("acquired_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).flatMap((row) => {
    const kind = materialBySlug(row.slug);
    if (!kind || row.quantity <= 0) return [];
    return [
      {
        id: row.id,
        slug: kind.slug,
        name: kind.name,
        monster: kind.monster,
        blurb: kind.blurb,
        color: kind.color,
        tier: kind.tier,
        quantity: row.quantity,
      },
    ];
  });
}

export async function grantMaterials(userId: string, drops: readonly MaterialDrop[]): Promise<void> {
  for (const drop of drops) {
    if (drop.quantity > 0) await addToStacks(userId, drop.slug, drop.quantity);
  }
}

export async function takeMaterials(userId: string, monster: string, amount: number): Promise<() => Promise<void>> {
  const slugs = materialsForMonster(monster).map((row) => row.slug);
  if (slugs.length === 0 || amount <= 0) throw new GameError(409, "not_enough_materials");
  const found = await getSupabase()
    .from("material_stacks")
    .select("id, slug, quantity")
    .eq("user_id", userId)
    .in("slug", slugs);
  if (found.error) throw new Error(found.error.message);
  const before = (found.data ?? []).map((row) => ({ id: row.id, slug: row.slug, quantity: row.quantity }));
  const total = before.reduce((sum, row) => sum + row.quantity, 0);
  if (total < amount) throw new GameError(409, "not_enough_materials");
  const ordered = [...before].sort((a, b) => a.quantity - b.quantity || a.id.localeCompare(b.id));
  let left = amount;
  for (const row of ordered) {
    if (left <= 0) break;
    if (row.quantity <= left) {
      const removed = await getSupabase().from("material_stacks").delete().eq("id", row.id).eq("user_id", userId);
      if (removed.error) throw new Error(removed.error.message);
      left -= row.quantity;
      continue;
    }
    const updated = await getSupabase()
      .from("material_stacks")
      .update({ quantity: row.quantity - left })
      .eq("id", row.id)
      .eq("user_id", userId);
    if (updated.error) throw new Error(updated.error.message);
    left = 0;
  }
  return async () => {
    const restored = await getSupabase().from("material_stacks").upsert(
      before.map((row) => ({ id: row.id, user_id: userId, slug: row.slug, quantity: row.quantity })),
    );
    if (restored.error) throw new Error(restored.error.message);
  };
}

export async function splitStack(userId: string, stackId: string, take: number): Promise<void> {
  if (!Number.isInteger(take) || take < 1) throw new GameError(400, "bad_quantity");
  const row = await loadStack(userId, stackId);
  if (take >= row.quantity) throw new GameError(400, "bad_quantity");
  const updated = await getSupabase()
    .from("material_stacks")
    .update({ quantity: row.quantity - take })
    .eq("id", row.id)
    .eq("user_id", userId);
  if (updated.error) throw new Error(updated.error.message);
  const created = await getSupabase().from("material_stacks").insert({
    id: randomUUID(),
    user_id: userId,
    slug: row.slug,
    quantity: take,
  });
  if (created.error) throw new Error(created.error.message);
}

export async function combineStack(userId: string, stackId: string): Promise<void> {
  const row = await loadStack(userId, stackId);
  if (row.quantity >= STACK_CAP) throw new GameError(409, "stack_full");
  const others = await getSupabase()
    .from("material_stacks")
    .select("id, slug, quantity")
    .eq("user_id", userId)
    .eq("slug", row.slug)
    .neq("id", row.id)
    .order("quantity", { ascending: true });
  if (others.error) throw new Error(others.error.message);
  let room = STACK_CAP - row.quantity;
  let gained = 0;
  for (const other of others.data ?? []) {
    if (room <= 0) break;
    const move = Math.min(room, other.quantity);
    if (move <= 0) continue;
    if (move === other.quantity) {
      const removed = await getSupabase().from("material_stacks").delete().eq("id", other.id).eq("user_id", userId);
      if (removed.error) throw new Error(removed.error.message);
    } else {
      const updated = await getSupabase()
        .from("material_stacks")
        .update({ quantity: other.quantity - move })
        .eq("id", other.id)
        .eq("user_id", userId);
      if (updated.error) throw new Error(updated.error.message);
    }
    room -= move;
    gained += move;
  }
  if (gained <= 0) return;
  const updated = await getSupabase()
    .from("material_stacks")
    .update({ quantity: row.quantity + gained })
    .eq("id", row.id)
    .eq("user_id", userId);
  if (updated.error) throw new Error(updated.error.message);
}

async function addToStacks(userId: string, slug: string, amount: number): Promise<void> {
  let left = amount;
  const found = await getSupabase()
    .from("material_stacks")
    .select("id, quantity")
    .eq("user_id", userId)
    .eq("slug", slug)
    .order("quantity", { ascending: false });
  if (found.error) throw new Error(found.error.message);
  for (const row of found.data ?? []) {
    if (left <= 0) break;
    const room = STACK_CAP - row.quantity;
    if (room <= 0) continue;
    const add = Math.min(room, left);
    const updated = await getSupabase()
      .from("material_stacks")
      .update({ quantity: row.quantity + add })
      .eq("id", row.id)
      .eq("user_id", userId);
    if (updated.error) throw new Error(updated.error.message);
    left -= add;
  }
  while (left > 0) {
    const take = Math.min(STACK_CAP, left);
    const created = await getSupabase().from("material_stacks").insert({
      id: randomUUID(),
      user_id: userId,
      slug,
      quantity: take,
    });
    if (created.error) throw new Error(created.error.message);
    left -= take;
  }
}

async function loadStack(userId: string, stackId: string): Promise<StackRow> {
  const { data, error } = await getSupabase()
    .from("material_stacks")
    .select("id, slug, quantity")
    .eq("id", stackId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new GameError(404, "stack_not_found");
  return data;
}
