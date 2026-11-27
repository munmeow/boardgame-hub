# Phase 4 — Private Rooms preview
Apply this update over Phase 3, preserving .git. Overwrite included files. Run from repository root:

- `npm.cmd install` (adds socket.io-client and updates lockfile)
- `npm.cmd run test -w @boardgame-hub/server`
- `npm.cmd run build`
- `npm.cmd run lint`
- Terminal 1: `npm.cmd run dev -w @boardgame-hub/server`
- Terminal 2: `npm.cmd run dev`

Open http://localhost:5173/#/rooms in two separate browser profiles (or a private window). Create with one nickname, join using code with another, mark both Ready. Host can add/remove bots, start a preview and return to lobby. Refresh resumes the seat via sessionStorage while the server retains the room; simultaneous resume may fail until the old connection closes. Explicit Leave room works in the lobby. Closing the browser without leaving preserves a disconnected seat for resume. Use a separate profile to test independent seats.

For a custom backend URL set VITE_GAME_SERVER_URL in apps/web/.env.local (see .env.example), restart Vite, and set WEB_ORIGINS on backend to permitted frontend origins. No production deployment yet.

Phase 4 supports lobby and initial game state preview only. Actual board controls, online bot decisions, animation and per-room Expert context are Phase 5. Host can reset the preview; do not treat this as a production multiplayer release. Local game remains unchanged.

Validation: engine compiled with available global TypeScript; 8 server room tests passed; Node syntax and TSX transpilation checked. npm offline install blocked by uncached express; full frontend build, lint and socket integration not verified. Lockfile not included; install locally and commit updated lockfile.
