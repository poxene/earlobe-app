import { useId } from "react";
import { BackSheath, BeltWear, ChestWear, FeetWear, HeadWear, HoodBack, SideArms, WalkingStaff } from "@/components/portrait/PortraitWear";
import { bodyPaths, parseBody, type BodyType } from "@/lib/portrait/body";
import { gearBySlug, slotIndex, type EquipSlot, type GearPiece } from "@/lib/portrait/gear";
import { wearFor } from "@/lib/portrait/wear";

export function ListenerPortrait({
  color,
  name,
  relics,
  body = "body6",
  size = 180,
  attacking = false,
}: {
  color: string;
  name?: string;
  relics: readonly ({ gearSlug?: string | null } | null)[];
  body?: BodyType | string;
  size?: number;
  attacking?: boolean;
}) {
  const clipRaw = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shape = bodyPaths(parseBody(body), true);
  const worn = (slot: EquipSlot) => gearBySlug(relics[slotIndex(slot)]?.gearSlug);
  const head = wearFor("head", worn("head")?.slug);
  const chest = wearFor("chest", worn("chest")?.slug);
  const belt = wearFor("belt", worn("belt")?.slug);
  const feet = wearFor("feet", worn("feet")?.slug);
  const weapon = held(worn("weapon"));
  const offhand = held(worn("offhand"));
  const height = Math.round(size * (130 / 120));

  return (
    <svg
      className="portrait mx-auto"
      width={size}
      height={height}
      viewBox="0 0 120 130"
      role="img"
      aria-label={name ? `${name} portrait` : "Listener portrait"}
    >
      <circle cx="60" cy="122" r="16" fill="#14110e" />
      <BackSheath weapon={weapon} swing={attacking} />
      <path d={shape.robe} fill={color} />
      <path d={shape.trim} fill="#d4a24e" opacity="0.55" />
      <FeetWear look={feet} robePath={shape.robe} clipId={`wear-feet-${clipRaw}`} />
      <ChestWear look={chest} robePath={shape.robe} clipId={`wear-chest-${clipRaw}`} />
      <circle cx="60" cy="93" r="9" fill="#c9a15b" />
      <BeltWear look={belt} robePath={shape.robe} clipId={`wear-belt-${clipRaw}`} />
      <HoodBack look={head} />
      <circle cx="60" cy="52" r="22" fill="#e6c2a2" />
      <HeadWear look={head} />
      <circle cx="52" cy="54" r="3" fill="#1a140f" />
      <circle cx="68" cy="54" r="3" fill="#1a140f" />
      <path d="M54 64 Q60 68 66 64" fill="none" stroke="#a56b62" strokeWidth="1.4" strokeLinecap="round" />
      <SideArms weapon={weapon} offhand={offhand} swing={attacking} />
      <WalkingStaff weapon={weapon} swing={attacking} />
    </svg>
  );
}

function held(piece: GearPiece | null): GearPiece | null {
  if (!piece || (piece.kind !== "weapon" && piece.slot !== "offhand")) return null;
  return piece;
}

export function BodyChip({ body }: { body: BodyType }) {
  const shape = bodyPaths(body, true);
  return (
    <svg className="h-8 w-8" viewBox="16 60 88 74" aria-hidden>
      <path d={shape.robe} fill="#2a3b30" />
      <path d={shape.trim} fill="#6f9b6a" opacity="0.55" />
    </svg>
  );
}
