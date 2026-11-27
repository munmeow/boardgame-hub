# Boardgame Hub – Phase 1

Patch for the existing repository, not a standalone project. Back up or commit existing changes first. Copy the `apps` folder into the repository root and merge folders (replace App.tsx only if it is the existing game entry point; preserve any custom App logic). If vercel.json already exists, merge its settings manually.

From apps/web run `node scripts/brand.mjs`, then `npm.cmd run build` and `npm.cmd run dev` on Windows. No additional npm packages required. The script replaces visible game titles in the three existing components without overwriting current lobby or game logic. Internal directory and class names stay unchanged. It updates the HTML title and Vite favicon. Review git diff afterwards; the script is idempotent.

Vercel: import the GitHub repo, select apps/web as Root Directory, Vite framework, npm run build, dist output. Keep the project private/restricted for development until rights review is complete. Do not publish third-party assets or protected expression without permission. Abyss Relay and Boardgame Hub are provisional names, not trademark-cleared. No official affiliation is claimed. This patch does not include online multiplayer or authentication.
