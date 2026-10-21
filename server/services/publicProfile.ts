import { toPublicProfile, type PublicProfile } from "../../src/lib/profile/public";
import { GameError } from "../errors";
import { presentCharacter } from "./characterSheet";
import { findProfileByHandle } from "./profiles";

export async function loadPublicProfile(raw: string): Promise<PublicProfile> {
  const profile = await findProfileByHandle(raw);
  if (!profile) throw new GameError(404, "unknown_profile");
  try {
    return toPublicProfile(await presentCharacter(profile.id));
  } catch (error) {
    if (error instanceof Error && error.message === "unauthenticated") throw new GameError(404, "unknown_profile");
    throw error;
  }
}
