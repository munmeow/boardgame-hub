# Phase 2

Node 22.13+ (use current Node 22 LTS). Run from repository root: `npm ci`, `npm run test`, `npm run build`, `npm run lint`, `npm run dev`.

Shared package builds native Node ESM into dist; web builds it automatically. After changing shared code during Vite dev, rebuild with `npm run check:engine` (or restart dev).

Vercel: root apps/web, enable Include source files outside Root Directory, Node 22.x, use vercel.json commands (remove conflicting dashboard overrides).

Migration: remove old frontend engine/, bot/, types/, rules/, tests/ and apps/web/package-lock.json before overlaying this source. Keep .git and local secrets.

Online server not implemented. Bot module contains global mutable opponent evidence and roll history; isolate per room before multiplayer. Never send raw hidden treasure values to online clients.
