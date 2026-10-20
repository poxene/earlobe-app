import type { Recipe } from "@/lib/game/varieties";

export function MonsterFigure({
  recipe,
  color,
  echo = false,
  title,
}: {
  recipe: Recipe;
  color: string;
  echo?: boolean;
  title: string;
}) {
  return (
    <svg viewBox="0 0 160 200" role="img" aria-label={title} className="h-full w-full">
      <ellipse cx="80" cy="186" rx="36" ry="8" fill="#000" opacity="0.45" />
      {echo ? (
        <g opacity="0.28" transform="translate(10 -4)">
          <Creature recipe={recipe} color={color} />
        </g>
      ) : null}
      <Creature recipe={recipe} color={color} />
    </svg>
  );
}

function Creature({ recipe, color }: { recipe: Recipe; color: string }) {
  return (
    <g>
      <Extra kind={recipe.extra} color={color} behind />
      <Arms kind={recipe.arms} color={color} />
      <Body kind={recipe.body} color={color} />
      <g transform={headShift(recipe.body)}>
        <Head kind={recipe.head} color={color} />
      </g>
      <Extra kind={recipe.extra} color={color} />
    </g>
  );
}

function Body({ kind, color }: { kind: Recipe["body"]; color: string }) {
  if (kind === "hulk") {
    return (
      <g fill={color}>
        <path d="M48 168 L58 112 L102 112 L112 168 Z" />
        <path d="M46 118 Q40 70 80 62 Q120 70 114 118 Q100 132 80 132 Q60 132 46 118 Z" />
      </g>
    );
  }
  if (kind === "wisp") {
    return <path d="M80 36 C108 70 118 110 80 168 C42 110 52 70 80 36 Z" fill={color} />;
  }
  if (kind === "beast") {
    return (
      <g fill={color}>
        <path d="M28 150 L40 118 L118 112 L132 146 L118 168 L36 168 Z" />
        <path d="M108 118 L124 78 L146 96 L128 124 Z" />
      </g>
    );
  }
  if (kind === "knight") {
    return (
      <g fill={color}>
        <path d="M58 168 L64 108 L96 108 L102 168 Z" />
        <path d="M52 112 L56 64 L104 64 L108 112 Z" />
        <path d="M48 96 L36 128 L52 120 Z" opacity="0.8" />
      </g>
    );
  }
  if (kind === "imp") {
    return (
      <g fill={color}>
        <path d="M58 168 L70 120 L90 120 L102 168 Z" />
        <ellipse cx="80" cy="108" rx="28" ry="24" />
      </g>
    );
  }
  return <path d="M70 40 C120 60 130 100 90 120 C130 140 100 176 60 160 C30 140 40 100 70 40 Z" fill={color} />;
}

function headShift(body: Recipe["body"]): string | undefined {
  if (body === "beast") return "translate(48 34)";
  if (body === "serpent") return "translate(-6 -16)";
  if (body === "imp") return "translate(0 8)";
  return undefined;
}

function Head({ kind, color }: { kind: Recipe["head"]; color: string }) {
  const ink = "#0a0a0f";
  if (kind === "horns") {
    return (
      <g>
        <circle cx="80" cy="58" r="18" fill={color} />
        <path d="M62 54 L48 22 L70 48 Z" fill={color} />
        <path d="M98 54 L112 22 L90 48 Z" fill={color} />
        <circle cx="73" cy="58" r="3" fill={ink} />
        <circle cx="87" cy="58" r="3" fill={ink} />
      </g>
    );
  }
  if (kind === "mask") {
    return (
      <g>
        <ellipse cx="80" cy="58" rx="16" ry="20" fill={color} />
        <path d="M66 58 Q80 70 94 58" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx="73" cy="54" r="3" fill={ink} />
        <circle cx="87" cy="54" r="3" fill={ink} />
      </g>
    );
  }
  if (kind === "crown") {
    return (
      <g>
        <circle cx="80" cy="60" r="16" fill={color} />
        <path d="M62 52 L66 32 L74 48 L80 28 L86 48 L94 32 L98 52 Z" fill={color} />
        <circle cx="74" cy="60" r="2.5" fill={ink} />
        <circle cx="86" cy="60" r="2.5" fill={ink} />
      </g>
    );
  }
  if (kind === "hood") {
    return (
      <g>
        <path d="M58 78 Q56 40 80 34 Q104 40 102 78 Z" fill={color} />
        <path d="M68 62 Q80 78 92 62 Q80 70 68 62 Z" fill={ink} />
      </g>
    );
  }
  if (kind === "eye") {
    return (
      <g>
        <circle cx="80" cy="58" r="16" fill={color} />
        <circle cx="80" cy="58" r="7" fill="none" stroke={ink} strokeWidth="2" />
        <circle cx="80" cy="58" r="2.5" fill={ink} />
      </g>
    );
  }
  return (
    <g>
      <circle cx="80" cy="58" r="16" fill={color} />
      <rect x="68" y="56" width="24" height="3" fill={ink} />
    </g>
  );
}

function Arms({ kind, color }: { kind: Recipe["arms"]; color: string }) {
  if (kind === "claws") {
    return (
      <g fill={color}>
        <path d="M48 100 L22 78 L28 118 L46 112 Z" />
        <path d="M112 100 L138 78 L132 118 L114 112 Z" />
      </g>
    );
  }
  if (kind === "blades") {
    return (
      <g fill={color}>
        <path d="M54 96 L18 70 L24 108 Z" />
        <path d="M106 96 L142 70 L136 108 Z" />
      </g>
    );
  }
  if (kind === "fists") {
    return (
      <g fill={color}>
        <rect x="28" y="96" width="18" height="22" />
        <rect x="114" y="96" width="18" height="22" />
      </g>
    );
  }
  if (kind === "wings") {
    return (
      <g fill={color} opacity="0.85">
        <path d="M70 90 C30 70 18 120 48 130 C40 100 58 96 70 90 Z" />
        <path d="M90 90 C130 70 142 120 112 130 C120 100 102 96 90 90 Z" />
      </g>
    );
  }
  return null;
}

function Extra({ kind, color, behind = false }: { kind: Recipe["extra"]; color: string; behind?: boolean }) {
  if (behind && kind !== "halo" && kind !== "shards") return null;
  if (!behind && (kind === "halo" || kind === "shards")) return null;
  if (kind === "halo") {
    return <ellipse cx="80" cy="28" rx="22" ry="6" fill="none" stroke={color} strokeWidth="2" />;
  }
  if (kind === "tail") {
    return <path d="M108 150 C140 150 146 120 124 112" fill="none" stroke={color} strokeWidth="6" />;
  }
  if (kind === "spikes") {
    return (
      <g fill={color}>
        <path d="M70 70 L76 40 L82 70 Z" />
        <path d="M84 74 L96 46 L100 78 Z" />
        <path d="M58 78 L48 50 L66 80 Z" />
      </g>
    );
  }
  if (kind === "shards") {
    return (
      <g fill={color}>
        <polygon points="24,48 34,40 30,58" />
        <polygon points="128,44 142,36 136,60" />
        <polygon points="118,24 128,16 124,34" />
      </g>
    );
  }
  return null;
}
