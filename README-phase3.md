# Phase 3 – Multiplayer server foundation

Extract this additive update into the Phase 2 repository root. It adds apps/server only and this README; existing web/engine sources are unchanged.

Node >=22.13. From root run `npm install` (not `npm ci` on the first install; the new workspace requires updating the existing root lockfile). Commit the updated lockfile. `npm run test -w @boardgame-hub/server` builds the shared engine and runs core tests. `npm run dev -w @boardgame-hub/server` listens on port 3001. GET http://localhost:3001/health returns service status. Keep frontend running separately using `npm run dev`.

Environment: PORT default 3001; WEB_ORIGINS comma-separated exact origins (default http://localhost:5173,http://127.0.0.1:5173). Use HTTPS/WSS and explicit origins in production. In-memory rooms only, maximum 200; empty rooms expire after 30 minutes. Disconnected seats remain reserved; a match waits for the disconnected player's return. Host moves to another connected member. No bots, permanent leave/kick, turn timeout, public discovery, persistence or browser lobby yet. These are later phases. Session token must be stored privately by client; never broadcast it.

## Socket.IO protocol
All requests send an object and acknowledgement callback. Responses `{ok:true,...}` or `{ok:false,error}`.

| Event | Payload |
|---|---|
| room:create | {name} |
| room:join | {code,name} |
| room:resume | {code,token} |
| room:ready | {code,ready:boolean} |
| room:start | {code} |
| game:action | {code,version,action} |

Create/join/resume ack includes `{memberId,token,room}`; other successful calls include `{room}`. Broadcast `room:state` contains room snapshot. `game:committed` contains `{version,action,room}`; the committed dice are server-generated. Clients must deduplicate snapshots by version. Public state deliberately omits `value` from track/cargo treasures; define a separate public type when implementing online UI rather than casting as full GameState. Collected values remain visible. The server does not wait for client animations yet; future client must gate inputs during animation and reconcile with server snapshots. NEXT_ROUND is host-only. All members including host must be ready to start. The online server only uses ordinary fair dice; Expert V9 remains unchanged in local mode.

## Validation
Shared engine compiled using installed TypeScript; five node:test core tests passed. Socket.IO transport not exercised without installed dependencies. Full frontend build not rerun. Dependency lock regeneration must be done by npm install on user's machine before Vercel build.
