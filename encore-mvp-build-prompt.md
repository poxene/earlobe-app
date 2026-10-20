# Build Prompt: ENCORE — Spotify-Powered RPG (MVP)

> Paste this entire document into Claude as the project brief. It is written as direct instructions.

---

You are building **ENCORE**, a web RPG where a player's Spotify listening history IS their character. There is no manual character creation. The player's top genres determine their class, listening earns XP, discovering new music unlocks new classes, and quests send players on listening adventures. The core insight: the "grind" is something players already do every day.

**Working title:** ENCORE (changeable, but use it consistently for all in-app copy in this build).

**Tone of in-app copy:** playful music-nerd meets RPG flavor. Quest titles should sound like a bard giving you a mission. Never corporate, never dry.

---

## 1. TECH STACK (non-negotiable)

- **Vite + React** (SPA) for the frontend
- **Express** (TypeScript) for the API — handles everything server-side: Spotify OAuth token exchange, token refresh, polling proxy, cron-triggered sync. The Spotify client secret must NEVER touch the browser.
- **TypeScript** in strict mode, both frontend and API. No `any` without a justifying comment.
- **Supabase** for Postgres + Auth + Row Level Security (RLS on every table). pg_cron for scheduled background sync.
- **Tailwind CSS** for styling
- **React Query** for server-state fetching, caching, and the 30s currently-playing poll
- **Spotify Web API** for all music data
- Deploy target: frontend on Netlify or Vercel (static), API on Fly.io / Render / equivalent Node host

### Why Vite + Express instead of Next.js
This mirrors the builder's existing game stack (Vite frontend + Express API + Supabase). The tradeoff is explicit: two deployments and CORS config instead of Next.js API-route colocation. Worth it here because the builder knows this architecture cold and the game is a heavily client-interactive SPA (live combat bars, polling, animations) where Vite's dev experience shines. All server-side requirements (OAuth, secrets, cron) are covered by Express + Supabase pg_cron — nothing in this spec needs SSR.

### Code conventions
- One clear responsibility per file. Name files for what they do.
- Comments use the format `//—` followed by lowercase text (camelCase identifiers excepted). Example: `//— refresh tokens before they expire, not after`
- API: thin Express routes → service modules in `server/services/`. No game logic in route handlers.
- Frontend: components in `src/components/`, game logic in `src/lib/game/` (pure functions, no API calls), Spotify access ONLY through `src/lib/music/` provider interface + React Query hooks.

---

## 2. ART DIRECTION: "THE VINYL TAVERN"

Dark, moody, late-night record bar. This must be achievable with **CSS + Tailwind + Spotify artwork only** — no custom illustration, no AI-generated images in the MVP.

- **Background:** near-black `#0a0a0f`, with a subtle CSS grain/noise overlay on major surfaces.
- **Primary accent:** warm gold `#d4a24e` for CTAs, level-ups, important highlights.
- **Typography:** a bold condensed display font for character names, class titles, and stat numbers (use Google Fonts — "Bebas Neue" or similar); clean sans (Inter or system) for body/UI text.
- **Primary visual material:** Spotify album artwork via the API. Character "portraits" are a 2×2 mosaic of the player's top 4 album covers with a class-colored gradient overlay. Class cards use genre-mood gradients (see palette).
- **Micro-interactions (CSS only):** animated equalizer bars on the "now playing" indicator; soft glow pulse on level-up; card tilt/flip on class unlock; XP bar fill animation.
- **Layout:** card-based dashboard. Character sheet is the home screen. Must be responsive — mobile viewport is a first-class target (no native app in MVP).

### Genre color coding (use consistently EVERYWHERE — class badges, XP bars, codex entries, feed)

| Genre family      | Color   | Hex     |
|-------------------|---------|---------|
| Metal             | blood red   | `#c1121f` |
| Hip-hop           | gold        | `#d4a24e` |
| Electronic        | cyan        | `#00e5ff` |
| Rock              | orange      | `#ff6b35` |
| Jazz              | deep blue   | `#4361ee` |
| Classical         | ivory       | `#f4f1de` |
| Pop               | hot pink    | `#ff2e93` |
| Folk / Country    | forest green| `#386641` |
| Ambient / Lo-fi   | lavender    | `#b8a9e8` |
| Punk              | lime        | `#a3e635` |
| Unmapped / Other  | slate gray  | `#64748b` |

### Item & monster visuals (no custom illustration in MVP)
Two visual languages, both CSS/SVG only:
- **Monsters:** one geometric SVG sigil per monster type (see bestiary table in §8), drawn in the monster's genre color, displayed over the track's album art with the HP bar beneath. Cohesive, mysterious, cheap. Design the full sigil set once as `components/sigils/` — consistency matters more than detail.
- **Relics:** small inline SVG sigils in the relic's genre color on RelicCards and in the 3 equip slots.
- No emoji as iconography. No AI-generated art. Spotify artwork + geometric sigils + genre colors carry the entire visual identity.

---

## 3. SPOTIFY INTEGRATION

### OAuth
- Use the Spotify **Authorization Code flow**.
- Required scopes: `user-read-playback-state user-read-currently-playing user-read-recently-played user-top-read user-read-email user-modify-playback-state`
- Handle token refresh automatically and silently. Store refresh tokens securely. The app must NEVER get stuck in a manual re-login loop — if a refresh fails, attempt one silent retry, then surface a single clean "reconnect Spotify" button.

### Endpoints you will use
- `GET /me` — profile (display name, avatar)
- `GET /me/top/artists?time_range=medium_term&limit=50` — genre aggregation source. Artist objects include `genres[]`.
- `GET /me/top/tracks?time_range=short_term&limit=50` — recent favorites
- `GET /me/player/currently-playing` — live polling source
- `GET /me/player/recently-played?limit=50` — backfill + background sync

### Polling strategy
- While the dashboard is open: poll `currently-playing` every **30 seconds**.
- Background: sync `recently-played` on app load and via Supabase pg_cron (every 15 min) hitting the Express `POST /api/cron/sync` endpoint, to catch listening while the app is closed.
- Track `progress_ms` vs `duration_ms` — a track only counts toward XP/quests if played past **50%** duration.

### Playback control (quest "play" buttons)
Yes — the game can start playback for the player. This is what makes quests feel magical instead of administrative.
- `PUT /me/player/play` with `{ "context_uri": "spotify:album:{id}" }` starts an album on the player's device. Same pattern works for playlists and single tracks (`uris: [...]`).
- Requires the `user-modify-playback-state` scope (included above).
- **Requires Spotify Premium AND an active device** (phone/desktop app open, or web player). Before firing, call `GET /me/player/devices` — if no active device, show a "open Spotify on a device first" state on the button instead of failing silently.
- **Free-tier fallback:** render a deep link (`https://open.spotify.com/album/{id}`) that opens their Spotify app; the player taps play manually. Quest tracking works identically afterward since the poller watches `currently-playing` regardless of how playback started.
- Quest UX: every quest card with a listening objective gets a primary **"Begin"** button. Tap → playback starts (or deep link opens) → the poller tracks progress → completion modal fires when the objective is met. Closed loop, no manual check-ins.
- **Out of MVP scope:** the Spotify Web Playback SDK (embeds a player directly in the web app, Premium-only). That's the phase-2 upgrade — "the game itself plays the quest for you." Note it in code comments where playback is invoked, but do not build it now.

### Provider abstraction (multi-service roadmap)
MVP is **Spotify-only** — deliberately. But do NOT hardcode Spotify throughout the game logic. Abstract all music access behind a provider interface so a second service can be added later without rewriting game systems:

```typescript
//— the game never talks to spotify directly, only through this
interface MusicProvider {
  getDisplayProfile(): Promise<{ name: string; avatarUrl: string }>;
  getTopArtists(limit: number): Promise<ProviderArtist[]>; //— artist with genre tags + image
  getRecentlyPlayed(limit: number): Promise<PlayRecord[]>; //— with played_at timestamps
  getCurrentlyPlaying(): Promise<NowPlaying | null>;       //— track + progress_ms + is_playing
  startPlayback(contextUri: string): Promise<void>;         //— quest "begin" buttons
  getDevices(): Promise<Device[]>;                          //— active-device check
}
```

`lib/music/spotify.ts` implements this for Spotify in the MVP. Game code (`lib/game/*`, components, API routes) imports only the interface.

**Why Spotify first, and the honest comparison:**

| Capability | Spotify Web API | Apple Music (MusicKit + API) | Tidal |
|---|---|---|---|
| Recently-played with timestamps | Yes (50 items) | Capped/limited, no rich ranges | No equivalent |
| Top artists/tracks by time range | Yes (short/medium/long) | No time-range equivalent | No |
| Currently-playing poll | Yes | Only for in-app MusicKit player, not system-wide | No |
| Remote playback control | Yes (Premium + active device) | Full in-browser via MusicKit JS (subscription req.) | No official API |
| Genre data | Rich artist genre tags | Genre names on catalog items (usable) | Thin |
| Dev signup cost | Free | $99/yr Apple Developer membership | — |
| User base | Largest | Large, iOS-skewed | Niche audiophile |

- **Apple Music is the phase-2 candidate**, but its listening-history APIs are the dealbreaker for MVP: without rich top-artist history, the "your taste is your build" hook doesn't work. Revisit once the core loop is proven.
- **Tidal: skip.** No official public API with listening-history or playback-control capabilities (only unofficial reverse-engineered projects). User base too small to justify the work.

### HARD CONSTRAINT (verified, do not work around it)
Spotify **deprecated** `audio-features`, `audio-analysis`, `recommendations`, and `related-artists` for new apps on **November 27, 2024**. They return 403. **Do not design anything around them.** All stat derivation comes from **artist genre tags + listening patterns only**. This is a deliberate design constraint, not a limitation to route around.

---

## 4. CHARACTER SYSTEM

### 4a. Generation (THE HOOK — build and polish this first)
On first login after OAuth:
1. Fetch top 50 artists (medium_term).
2. Normalize genre strings via keyword matching (see mapping table). Spotify genre tags are messy (`"indie rock"`, `"alt z"`, `"escape room"`…) — match on keywords, first match wins, unmatched genres fall back to `Wanderer`.
3. Aggregate listening weight per genre family.
4. **Primary class** = highest-weight genre family. **Subclass** = second highest (must clear a minimum threshold, else no subclass yet).
5. Generate stats from the weighted blend (see 4c).
6. Render the character sheet within ~10 seconds of OAuth completing. Show a fun "attuning your resonance…" loading state while aggregating — the wait should feel like a ritual, not a spinner.

Character sheet displays: Spotify display name, class + subclass, level 1, five stats with bars, **DPS readout**, top 5 genre families with weight bars, 2×2 album-art portrait mosaic, XP bar, **3 relic equip slots**, battle record (victories / escapes).

### 4b. Genre → class mapping

| Genre keywords (match if tag contains)                          | Class      | Flavor line (show on unlock)                        |
|-----------------------------------------------------------------|------------|-----------------------------------------------------|
| metal, hardcore, grindcore, doom, thrash, death, black metal     | Berserker  | "Your riffs hit like war hammers."                  |
| hip hop, hip-hop, rap, trap, grime                               | Rogue      | "Every bar is a blade."                             |
| edm, electronic, house, techno, dubstep, trance, drum and bass   | Arcanist   | "You conduct voltage like spellfire."               |
| rock, indie rock, alternative, grunge, punk rock                 | Warrior    | "Three chords. Zero mercy."                         |
| jazz, bebop, swing, bossa nova                                   | Bard       | "You weaponize the space between notes."            |
| classical, orchestral, baroque, opera, symphony                  | Cleric     | "Centuries of discipline, channeled."               |
| pop, dance pop, k-pop, synth-pop                                 | Enchanter  | "Catchiness is a form of mind control."             |
| folk, country, americana, bluegrass, singer-songwriter           | Ranger     | "You know every back road by heart."                |
| ambient, lo-fi, chill, downtempo, new age                        | Monk       | "Stillness is a discipline."                        |
| punk, skate punk, post-punk                                      | Barbarian  | "Subtlety is for people with less to prove."        |
| *(no match)*                                                    | Wanderer   | "Your taste defies cartography."                    |

### 4c. Stats
Five stats, scale 1–100: **STR, AGI, INT, WIS, CHA**.

Each genre family has a stat vector (weights sum to 1.0):

| Class      | STR | AGI | INT | WIS | CHA |
|------------|-----|-----|-----|-----|-----|
| Berserker  | .50 | .20 | .05 | .05 | .20 |
| Rogue      | .15 | .40 | .15 | .05 | .25 |
| Arcanist   | .05 | .15 | .55 | .15 | .10 |
| Warrior    | .35 | .25 | .10 | .10 | .20 |
| Bard       | .10 | .20 | .20 | .15 | .35 |
| Cleric     | .10 | .05 | .25 | .50 | .10 |
| Enchanter  | .05 | .15 | .15 | .10 | .55 |
| Ranger     | .25 | .30 | .10 | .25 | .10 |
| Monk       | .15 | .25 | .10 | .40 | .10 |
| Barbarian  | .45 | .30 | .05 | .05 | .15 |
| Wanderer   | .20 | .20 | .20 | .20 | .20 |

Character stat = `10 + 90 × Σ(genre_weight_fraction × genre_vector)` per stat, rounded. Recompute from a **rolling 30-day window**, refreshed **once daily** (not realtime — avoids jitter from a single listening session).

### 4d. Class unlocks & switching
- A genre family counts toward unlock at **5+ hours listened in the rolling 30-day window**.
- Crossing the threshold unlocks the class with a celebratory modal (flavor line from the table, genre color theme).
- Player may switch active class among unlocked classes, with a **24-hour cooldown** between switches.
- **Design rule: breadth unlocks new classes (horizontal), depth masters the current one (vertical).** A hip-hop-only listener must have a satisfying Rogue mastery track (tiered titles: Cutpurse → Shadow → Ghostwriter → Legend), not a game telling them their taste is narrow.

---

## 5. XP ENGINE

### Awards
| Event                                              | XP   |
|----------------------------------------------------|------|
| First-ever listen to a track                       | 10   |
| Repeat listen (2nd / 3rd / 4th+ )                   | 5 / 2 / 1 (floor of 1 forever after) |
| New artist discovered                              | 25   |
| New genre family discovered (first 5-hr threshold) | 100  |
| Full album completion, zero skips                  | 50   |

- **Daily soft cap:** 500 XP from listening events (quests excluded). Prevents 24/7 farming.
- Track counts only if played past 50% (`progress_ms / duration_ms > 0.5`).
- "New artist" = artist ID never seen in this user's `listening_events`.
- "New genre" = genre family crossing the 5-hour unlock threshold for the first time.

### Level curve
XP required to reach level `n` (cumulative): `floor(100 × n^1.5)`.
- Level 2: 100 · Level 5: ~1,118 · Level 10: ~3,162 · Level 20: ~8,944.
- At ~200–300 XP/day of active listening, level 10 lands around week 2. Tune if playtesting says otherwise.

### Level-up
On level-up: show a celebratory modal. Allocate stat points: **70% auto-allocated** by active class affinity vector, **30% player-allocated** (3 points per level to distribute freely). This gives agency without decision fatigue.

---

## 6. CODEX (collection layer)

The "gotta catch 'em all" system. Three codex types:

- **Artists:** portrait (Spotify image URL), genre tags, discovery date, total listen count. Sorted by recent discovery.
- **Albums:** cover art, artist, completion % (tracks played ÷ total tracks). 100% = "Attuned" badge.
- **Genres:** each family shows a progress bar toward the 5-hour class-unlock threshold. Undiscovered families render as **silhouetted "?" cards** — curiosity driver.

Codex lives at `/codex` with tab navigation between the three types, plus a fourth **Bestiary** tab (see §8) for monster types encountered, defeated, and escaped. Every discovery fires a small toast: "New artist discovered: [name] +25 XP".

---

## 7. QUESTS

Four quest types for MVP. Quest shape: `{ id, type, title, description, objective (machine-readable JSON), xp_reward, expires_at }`.

**Type 1 — Discovery.** *"The Bard requests new horizons."*
Objective: listen to 3 full albums from a genre family outside the player's current top 5.
Reward: 150 XP + progress toward a subclass unlock.
Evaluation: match album completions (from listening_events) against genre families not in top 5.

**Type 2 — Deep Cut.** *"Find the unheard."*
Objective: pick an artist the player has never played, with **<100k Spotify followers** (follower count IS exposed on artist objects — use it), and play 5 of their tracks past 50%.
Reward: 100 XP + "Deep Delver" codex badge.
Note: Spotify does NOT expose per-track play counts via the API. Do not attempt to use them. Artist follower count is the rarity proxy.

**Type 3 — Ritual.** *"The full ceremony."*
Objective: play an album start to finish, track order, zero skips.
Reward: 75 XP.
Evaluation: consecutive listening_events matching album track order with no interleaving tracks.

**Type 4 — Social.** *"A friend's recommendation."*
Objective: play a track that a party member has played in the last 7 days and you never have.
Reward: 50 XP to both players.
Requires the party system (section 8).

**Quest lifecycle:** 3 active quests per player at a time (one Discovery, one rotating between Deep Cut/Ritual, one Social if in a party else a second rotating type). Weekly refresh every Monday. Progress bars visible on the quest card. Completion fires a modal with the reward.

---

## 8. COMBAT: THE HUNT

Every completed track spawns a monster. **The track is the timer; your build is the damage.** Two bars race: monster HP depletes at YOUR DPS rate, track progress is the countdown.

### Spawn & resolution
1. **Spawn:** when a track starts, spawn a monster of the track's genre family (bestiary table below). Monster HP = `duration_seconds × 10 × tier_scalar`. Tier scalars: standard (<6 min) ×1.0, elite (6–10 min) ×1.15, boss (10+ min) ×1.3.
2. **DPS formula:** `power = STR×0.35 + AGI×0.25 + INT×0.20 + WIS×0.10 + CHA×0.10`, then `DPS = 8 + power × 0.15`. Equipped relics modify stats BEFORE this calc. Tune in playtesting — target ~70% win rate for a level-appropriate build on standard tracks.
3. **Outcomes** (evaluated at kill or track end):
   - Kill with >50% of track remaining → **FLAWLESS**: bonus loot, increased relic chance
   - Kill with 10–50% remaining → **CLEAN**: standard loot
   - Kill with <10% remaining → **DOWN TO THE WIRE**: standard loot, dramatic flavor text
   - Track ends with HP remaining → **ESCAPED**: bestiary sighting logged, 10% consolation XP, no penalty
   - Skip at any point → **ESCAPED**, instantly
4. **No death. Ever.** Monsters escape; the player never dies, never loses XP, items, or progress. All outcomes are non-negative — the worst case is gaining less. Non-negotiable for a background-listening game: you cannot punish outcomes the player wasn't present for.

### Echo spawns
Kill a monster with >10% of the track remaining and its death cry summons an **echo**: same monster type, HP density +2/sec per echo (10 → 12 → 14 → 16…), loot tier +1 each. Flavor: "the chorus repeats, so does the monster." Density eventually outpaces DPS or the track ends — self-terminating, no hard cap (soft-cap display at 4 echoes). Each echo pays its own loot tier. Kills inside the final 10% get the flawless bonus instead — no awkward 8-second fights.

### Bestiary

| Genre family   | Monster            | Sigil motif (SVG, genre-colored) |
|----------------|--------------------|----------------------------------|
| Metal          | Demon              | angular horn cluster             |
| Electronic     | Construct          | hexagon core                     |
| Hip-hop        | Shadowblade        | crescent dagger                  |
| Classical      | Celestial Guardian | radiant ring                     |
| Jazz           | Trickster Fae      | spiral mask                      |
| Rock           | Ogre               | heavy fist block                 |
| Pop            | Siren              | wave crest                       |
| Folk / Country | Dire Beast         | claw marks                       |
| Ambient        | Voidling           | hollow eye                       |
| Punk           | Rioter Gremlin     | jagged star                      |
| Unmapped       | Mimic              | shifting shard                   |

Per monster type, track lifetime: encountered, defeated, escaped, best grade, fastest kill. Unencountered types render as silhouettes (curiosity driver, same as codex).

### Loot
- **Echoes** (soft currency): awarded per kill, scaled by tier + speed grade. MVP sink: quest re-roll (100 echoes, once per week). More sinks are phase 2.
- **Relics** (equipment): drop from elite+ kills (6+ min tracks), guaranteed on boss kills (10+ min), increased chance on FLAWLESS grades. Each relic: genre-flavored name ("Demon Horn"), stat boosts (e.g. +4 STR, +2 AGI), rarity (common / rare / epic by source tier and echo depth).
- **Equip:** 3 relic slots on the character sheet. Equipping changes stats → visibly changes DPS. Unequipped relics live in inventory.
- **Relic visuals:** inline SVG sigils in the relic's genre color — small, geometric, cohesive. No emoji, no external art.

### Battle log & "while you were away"
- Every fight appends to a battle log: monster, outcome, grade, loot, timestamp.
- On login after absence: summary modal — "🎵 while you were away — 14 battles: 11 victories, 3 escaped. +380 XP, 1 relic (Demon Horn +2 STR)." The return moment must feel like opening presents, never a casualty report.
- Fights resolve deterministically from the listening record, so closed-app listening resolves truthfully on next sync. **Store the stat/DPS snapshot with each encounter** — never recompute historical fights with current stats.

### Design rules
- Gain-framing only. No death, no decay, no stamina tax in MVP.
- Power-relative spawning keeps fights fair as the player levels.
- The strategic game is the LISTENING (what you play, which class you feed, which relics you equip). Combat is the resolution mechanic, not a skill test. Active tap-combat is phase 2, opt-in only.

## 9. SOCIAL: PARTY + FEED (MVP-lite)

- **Party:** create or join via a short invite code. Max 6 members. One party per player for MVP.
- **Party view** (`/party`): each member's card shows class, level, and **live now-playing** (track + artist, refreshed with the 30s poll; show "silent" state when nothing is playing).
- **Feed:** reverse-chronological events: "X discovered [artist]", "Y completed [quest]", "Z unlocked [Berserker]", "X is listening to [track]". Party-scoped for MVP (no global feed).
- **Explicitly out of scope:** PvP, guilds, synced listening parties, DMs.

---

## 10. DATA MODEL (Supabase Postgres)

```sql
--— profiles: one row per user, created on first OAuth
profiles (id uuid pk, spotify_id text unique, display_name text, avatar_url text, created_at timestamptz)

--— spotify_tokens: encrypted tokens, one row per user
spotify_tokens (user_id uuid pk fk, access_token text, refresh_token text, expires_at timestamptz)

--— listening_events: append-only log of qualifying plays (>50%)
listening_events (id uuid pk, user_id uuid fk, track_id text, track_name text, artist_ids text[], artist_names text[], album_id text, album_name text, played_at timestamptz, ms_played int, duration_ms int)

--— genre_weights: refreshed daily from listening_events (30-day window)
genre_weights (user_id uuid fk, genre_family text, hours_30d numeric, updated_at timestamptz, pk(user_id, genre_family))

--— characters: the player's game state
characters (user_id uuid pk fk, active_class text, unlocked_classes text[], level int, xp int, stat_str int, stat_agi int, stat_int int, stat_wis int, stat_cha int, unallocated_points int)

--— codex
codex_artists (user_id uuid fk, artist_id text, discovered_at timestamptz, listen_count int, pk(user_id, artist_id))
codex_albums (user_id uuid fk, album_id text, tracks_total int, tracks_played int, completed_at timestamptz nullable, pk(user_id, album_id))

--— quests
quests (id uuid pk, type text, title text, description text, objective jsonb, xp_reward int, expires_at timestamptz)
quest_progress (user_id uuid fk, quest_id uuid fk, progress jsonb, completed_at timestamptz nullable, pk(user_id, quest_id))

--— party
parties (id uuid pk, name text, invite_code text unique, created_at timestamptz)
party_members (party_id uuid fk, user_id uuid fk, joined_at timestamptz, pk(party_id, user_id))
feed_events (id uuid pk, party_id uuid fk nullable, user_id uuid fk, type text, payload jsonb, created_at timestamptz)

--— encounters: one row per track-fight. store the stat/dps snapshot — never recompute historical fights
encounters (id uuid pk, user_id uuid fk, track_id text, monster_type text, hp_max int, dps_at_fight numeric, echo_depth int default 0, outcome text, grade text nullable, loot_echoes int, relic_id uuid nullable, started_at timestamptz, resolved_at timestamptz)

--— relics: equipment. equipped=false = in inventory
relics (id uuid pk, user_id uuid fk, name text, monster_type text, rarity text, stat_bonuses jsonb, equipped boolean default false, acquired_at timestamptz)

--— bestiary: per-type lifetime stats, upserted on each encounter
bestiary (user_id uuid fk, monster_type text, encountered int default 0, defeated int default 0, escaped int default 0, best_grade text nullable, fastest_kill_sec int nullable, pk(user_id, monster_type))
```

RLS: users can read/write only their own rows everywhere except `parties`/`party_members`/`feed_events`, which are visible to party members.

---

## 11. FILE STRUCTURE (suggested)

```
#— frontend (vite spa)
src/
  pages/
    Login.tsx                 //— spotify connect button, flavor copy
    Dashboard.tsx             //— character sheet home
    Codex.tsx
    Quests.tsx
    Party.tsx
    Bestiary.tsx              //— or as a codex tab
  lib/
    music/provider.ts         //— MusicProvider interface (game code imports ONLY this)
    music/spotify.ts          //— calls the EXPRESS api, never spotify directly
    music/normalize.ts        //— genre keyword mapping → genre family
    game/character.ts         //— generation, stat blending, class unlocks
    game/xp.ts                //— award rules, level curve, level-up allocation
    game/quests.ts            //— quest definitions + progress evaluators
    game/combat.ts            //— dps calc, monster hp, resolution, echo spawns, grade assignment
    game/loot.ts              //— loot tables, relic generation, rarity rolls
    hooks/
      useNowPlaying.ts        //— react-query 30s poll → now-playing state
      useCharacter.ts         //— character sheet data
  components/
    CharacterSheet.tsx / XpBar.tsx / EqualizerBars.tsx
    CodexCard.tsx / QuestCard.tsx / PartyMemberCard.tsx
    ClassUnlockModal.tsx / LevelUpModal.tsx
    CombatBars.tsx            //— the two racing bars: monster hp (drains at dps rate) vs track progress (the timer)
    BattleLog.tsx             //— per-fight entries + "while you were away" summary modal
    RelicCard.tsx             //— svg sigil + stat boosts + equip/unequip button
    BestiaryGrid.tsx          //— monster types with lifetime stats, silhouettes for unseen
    sigils/                   //— one cohesive geometric svg component per monster type + relic motif, genre-colored

#— api (express, typescript)
server/
  routes/
    auth.ts                   //— GET /auth/spotify/callback (oauth code exchange, sets session)
    spotify.ts                //— GET /api/spotify/now-playing (proxy w/ server-side token)
                              //— POST /api/spotify/play (playback control w/ premium + active-device check)
    cron.ts                   //— POST /api/cron/sync (recently-played backfill; called by supabase pg_cron)
  services/
    spotifyClient.ts          //— authenticated spotify fetch + silent token refresh
    tokenStore.ts             //— encrypted token persistence via supabase
  middleware/
    requireAuth.ts            //— session check for all /api/* routes
```

---

## 12. BUILD ORDER (sequential — do not skip ahead)

1. **Phase 1 — Spotify OAuth + token management.** End state: user connects Spotify, app can fetch `/me/top/artists`. Include a bare debug view of raw top-artist data.
2. **Phase 2 — Character sheet generator.** Genre aggregation → class → stats → the character sheet UI. Include DPS readout and 3 empty relic slots on the sheet from the start (they fill in later). **STOP HERE and review: if this screen is not instantly delightful, do not continue.** This is the product's hook.
3. **Phase 3 — Listening poller + XP engine.** 30s poll, XP awards per the table, daily cap, level-ups with the modal.
4. **Phase 4 — Combat.** Spawn on track start, DPS-vs-HP resolution, echo spawns, loot (echoes + relics), relic inventory + equip (3 slots), battle log, "while you were away" summary modal. This is the biggest phase — it makes the character sheet *mean* something.
5. **Phase 5 — Codex + bestiary.** Artists/albums/genres tabs plus the bestiary grid.
6. **Phase 6 — Quests.** All four types with real progress evaluation against `listening_events`. Quest cards get "Begin" buttons wired to playback control.
7. **Phase 7 — Party + feed.** Invite codes, now-playing cards, event feed (include battle results in the feed: "X slew a demon (FLAWLESS)").
8. **Phase 8 — Polish.** Empty states, loading rituals, mobile viewport QA, animation pass, sigil set consistency review.

---

## 13. OUT OF SCOPE FOR MVP (do not build these)

PvP / auto-battler · Guilds · Synced listening parties · Mobile native app · Monetization or payments · AI-generated artwork · Anything using Spotify's deprecated endpoints (audio-features, recommendations, related-artists) · Manual tap-combat (combat is auto-resolve in MVP) · Gear sets / set bonuses · Stamina/energy systems · Boss mechanics beyond the 10+ minute track tier

---

## 14. ACCEPTANCE CRITERIA (MVP is done when all are true)

- [ ] New user connects Spotify and sees a character sheet that feels personal within ~10 seconds of OAuth completing.
- [ ] Listening to a brand-new artist visibly earns XP and adds a codex entry with a toast.
- [ ] Playing an album start-to-finish with zero skips completes a Ritual quest.
- [ ] Spending 5 hours in a new genre family unlocks its class with the celebratory modal.
- [ ] Party members can see each other's now-playing track, class, and level on `/party`.
- [ ] Spotify token expiry is handled silently; the user never sees a broken session or a re-login loop.
- [ ] Quest "Begin" buttons start playback on Premium accounts (via `PUT /me/player/play`) and fall back to a Spotify deep link for free-tier users; quest progress tracks correctly either way.
- [ ] Starting a track spawns a genre-appropriate monster; the HP bar depletes at the character's DPS rate while track progress acts as the timer.
- [ ] Skipping a track logs an escape with no penalty; completing it resolves victory or escape honestly from the stored DPS snapshot.
- [ ] Killing with >10% of track remaining spawns an escalating echo with higher loot tier; chains terminate naturally.
- [ ] Equipping a relic visibly changes DPS on the character sheet.
- [ ] Returning after hours away shows a "while you were away" battle summary; the player never dies or loses progress.
- [ ] Bestiary tracks encountered/defeated/escaped per monster type, silhouettes for unseen types.
- [ ] No game-logic file imports Spotify directly — everything goes through the `MusicProvider` interface.
- [ ] All pages are usable on a 390px-wide mobile viewport.
- [ ] No page makes a request to a deprecated Spotify endpoint.

---

Begin with Phase 1. Ask clarifying questions only if a requirement above is genuinely ambiguous — otherwise build.
