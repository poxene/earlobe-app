import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

const LINKS = [
  { to: "/battle", label: "Battle" },
  { to: "/", label: "Sheet" },
  { to: "/codex", label: "Codex" },
  { to: "/quests", label: "Quests" },
  { to: "/shop", label: "Shop" },
  { to: "/party", label: "Party" },
];

export function Header({ onLogout, nav = false }: { onLogout?: () => void; nav?: boolean }) {
  return (
    <header className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5 md:px-8">
      <Link to="/" aria-label="Earlo.be" className="leading-none">
        <Logo size="sm" />
      </Link>
      <div className="flex flex-wrap items-center gap-4">
        {nav
          ? LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="text-sm tracking-wide text-zinc-400 hover:text-zinc-100">
                {link.label}
              </Link>
            ))
          : null}
        {onLogout ? (
          <button type="button" onClick={onLogout} className="text-sm tracking-wide text-zinc-400 hover:text-zinc-100">
            Sign out
          </button>
        ) : null}
      </div>
    </header>
  );
}
