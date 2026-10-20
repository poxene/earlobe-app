# Earlo.be

A web RPG where Last.fm listening is the character. This repo is the reboot: Vite + React on the front, Express on the API, Supabase for Postgres.

Phases 1 and 2 are in place.

- **Phase 1.** Connect Last.fm. The session key stays encrypted on the server. `/debug` shows the raw top-artist payload.
- **Phase 2.** First visit builds a character sheet from your top artists: class, subclass, stats, DPS, genre bars, album portrait, XP bar, three empty relic slots.

## Run locally

1. In the [Last.fm API account](https://www.last.fm/api/account/create), set the callback URL to `http://127.0.0.1:5173/auth/lastfm/callback`.
2. Copy `.env.example` to `.env` and fill in the Last.fm key and shared secret, `SESSION_SECRET`, and `TOKEN_ENCRYPTION_KEY` (`openssl rand -base64 32`).
3. Start the database (Docker): `npx supabase start`
4. Put the local API URL and `service_role` key in `.env` as `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`. This repo’s local API port is `54421` so it doesn’t collide with another Supabase stack on the machine.
5. `npm install`
6. `npm run dev`
7. Open http://127.0.0.1:5173

Use a Supabase project that belongs to Earlo.be. Do not point this app at an unrelated database.

The browser never sees the Last.fm shared secret and never calls `ws.audioscrobbler.com`. Game math lives in `src/lib/game` and does not know which music service produced the artists.

Last.fm records scrobbles. It does not start playback or report a playhead, so quests open on Last.fm and a live fight advances from the time the track first showed up as now playing.
