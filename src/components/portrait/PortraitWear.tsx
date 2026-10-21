import type { ReactNode } from "react";
import { itemIconIsLong, ItemGlyph } from "@/components/portrait/ItemIcon";
import { itemIsStaff, type GearPiece } from "@/lib/portrait/gear";
import type { WornLook } from "@/lib/portrait/wear";

export function ChestWear({
  look,
  robePath,
  clipId,
}: {
  look: WornLook | null;
  robePath: string;
  clipId: string;
}) {
  if (!look || look.family !== "vest") return null;
  const { main, light, accent } = look.palette;
  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={robePath} />
        </clipPath>
      </defs>
      <g className="portrait-wear portrait-wear-chest" clipPath={`url(#${clipId})`}>
        <path
          d="M24 72 C38 58 48 64 54 76 L60 86 L66 76 C72 64 82 58 96 72 L98 114 L22 114 Z"
          fill={main}
          stroke="#16120f"
          strokeWidth="1"
          strokeOpacity="0.35"
        />
        <path d="M44 78 L60 72 L76 78 L74 110 L46 110 Z" fill={light} opacity="0.5" />
        {look.mark === "moss" && accent ? <path d="M42 102 H78 V110 H42 Z" fill={accent} opacity="0.75" /> : null}
      </g>
    </>
  );
}

export function BeltWear({
  look,
  robePath,
  clipId,
}: {
  look: WornLook | null;
  robePath: string;
  clipId: string;
}) {
  if (!look || look.family !== "belt") return null;
  const { main, light, accent } = look.palette;
  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={robePath} />
        </clipPath>
      </defs>
      <g className="portrait-wear portrait-wear-belt" clipPath={`url(#${clipId})`}>
        <path d="M20 99 H100 V108 H20 Z" fill={main} />
        <path d="M22 101 H98 V106 H22 Z" fill={light} opacity="0.75" />
        {accent ? (
          <>
            <rect x="54" y="97" width="12" height="13" rx="1.6" fill={accent} />
            <rect x="56.5" y="99.5" width="7" height="8" rx="1" fill="#16120f" opacity="0.35" />
          </>
        ) : null}
      </g>
    </>
  );
}

export function FeetWear({
  look,
  robePath,
  clipId,
}: {
  look: WornLook | null;
  robePath: string;
  clipId: string;
}) {
  if (!look || look.family !== "boots") return null;
  const { main, light, accent } = look.palette;
  return (
    <>
      <defs>
        <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
          <path d={robePath} />
        </clipPath>
      </defs>
      <g className="portrait-wear portrait-wear-feet" clipPath={`url(#${clipId})`}>
        <path d="M28 112 C32 108 52 108 56 114 L55 130 H29 Z" fill={main} />
        <path d="M64 114 C68 108 88 108 92 112 L91 130 H65 Z" fill={main} />
        <path d="M28 122 H56 L55 130 H27 Z" fill={light} />
        <path d="M64 122 H92 L93 130 H65 Z" fill={light} />
        {accent ? (
          <>
            <path d="M34 118 H50 V121 H34 Z" fill={accent} opacity="0.7" />
            <path d="M70 118 H86 V121 H70 Z" fill={accent} opacity="0.7" />
          </>
        ) : null}
      </g>
    </>
  );
}

function HeldMark({
  item,
  x,
  y,
  size,
  rotate,
  flipX,
  flipY,
  stretch = 1,
}: {
  item: GearPiece;
  x: number;
  y: number;
  size: number;
  rotate: number;
  flipX?: boolean;
  flipY?: boolean;
  stretch?: number;
}) {
  const sx = flipX ? -1 : 1;
  const sy = (flipY ? -1 : 1) * stretch;
  const scale = sx !== 1 || sy !== 1 ? ` scale(${sx} ${sy})` : "";
  return (
    <g className="portrait-held" transform={`translate(${x} ${y}) rotate(${rotate})${scale}`}>
      <ItemGlyph slug={item.slug} kind={item.kind} size={size} />
    </g>
  );
}

export function BackSheath({ weapon, swing = false }: { weapon: GearPiece | null; swing?: boolean }) {
  if (!weapon?.twoHanded || itemIsStaff(weapon)) return null;
  const long = itemIconIsLong(weapon.slug, weapon.kind);
  return (
    <g className="portrait-held-back">
      <Swing on={swing} x={64} y={80}>
        <HeldMark item={weapon} x={64} y={80} size={long ? 82 : 70} rotate={225} />
      </Swing>
    </g>
  );
}

export function WalkingStaff({ weapon, swing = false }: { weapon: GearPiece | null; swing?: boolean }) {
  if (!weapon || !itemIsStaff(weapon)) return null;
  const long = itemIconIsLong(weapon.slug, weapon.kind);
  return (
    <g className="portrait-held-staff">
      <Swing on={swing} x={26} y={76}>
        <HeldMark item={weapon} x={26} y={76} size={long ? 104 : 88} rotate={-5} flipX />
      </Swing>
    </g>
  );
}

export function SideArms({
  weapon,
  offhand,
  swing = false,
}: {
  weapon: GearPiece | null;
  offhand: GearPiece | null;
  swing?: boolean;
}) {
  if (weapon?.twoHanded) return null;
  return (
    <g className="portrait-held-sides">
      {weapon ? (
        <Swing on={swing} x={28} y={102}>
          <HeldMark item={weapon} x={28} y={102} size={34} stretch={1.22} rotate={188} />
        </Swing>
      ) : null}
      {offhand ? <HeldMark item={offhand} x={92} y={102} size={34} stretch={1.22} rotate={-8} flipX flipY /> : null}
    </g>
  );
}

function Swing({ on, x, y, children }: { on: boolean; x: number; y: number; children: ReactNode }) {
  if (!on) return children;
  return (
    <g
      className="weapon-swing"
      style={{
        ["--swing-x" as string]: `${(x / 120) * 100}%`,
        ["--swing-y" as string]: `${(y / 130) * 100}%`,
      }}
    >
      {children}
    </g>
  );
}

export function HoodBack({ look }: { look: WornLook | null }) {
  if (!look || look.family !== "hood") return null;
  return (
    <g className="portrait-wear portrait-wear-hood-back">
      <path d="M32 51.5 A 28 28 0 0 1 88 51.5 Z" fill={look.palette.main} />
    </g>
  );
}

export function HeadWear({ look }: { look: WornLook | null }) {
  if (!look || (look.family !== "cap" && look.family !== "hood")) return null;
  const { main, light, accent } = look.palette;
  return (
    <g className="portrait-wear portrait-wear-cap">
      <path d="M36.5 51.5 A 23.5 23.5 0 0 1 83.5 51.5 Z" fill={main} />
      <rect x="36" y="50" width="48" height="2.5" rx="0.6" fill={light} />
      {look.mark === "bone" && accent ? (
        <g>
          <rect x="51" y="20.5" width="18" height="11.5" rx="1.4" fill={accent} />
          <rect x="54.5" y="14" width="11" height="9" rx="1.1" fill="#f4ecda" />
        </g>
      ) : null}
      {look.mark === "gem" && accent ? <rect x="54" y="29" width="12" height="10" rx="1.4" fill={accent} /> : null}
    </g>
  );
}
