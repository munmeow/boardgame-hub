import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const game = 'src/app/games/deep-sea-adventure/components/';
const paths = [game + 'GameLobby.tsx', game + 'DeepSeaAdventure.tsx', game + 'ScoreBoard.tsx', 'index.html'];
for (const path of paths) {
  if (!existsSync(resolve(root, path))) throw new Error(`Missing ${path}; no files edited. Check your project layout.`);
}
for (const path of paths) {
  const full = resolve(root, path);
  const original = readFileSync(full, 'utf8');
  let updated = original;
  if (path === 'index.html') {
    updated = updated.replace(/<title>[^<]*<\/title>/i, '<title>Boardgame Hub</title>');
    updated = updated.replace(/<link\b[^>]*href=["'][^"']*vite\.svg["'][^>]*\/?>/gi, '');
    if (!updated.includes('/hub.svg')) updated = updated.replace(/<\/head>/i, '  <link rel="icon" type="image/svg+xml" href="/hub.svg" />\n  </head>');
  } else {
    // Only visible title strings; imports, types and engine names stay intact.
    updated = updated.replaceAll('DEEP SEA ADVENTURE', 'ABYSS RELAY').replaceAll('Deep Sea Adventure', 'Abyss Relay');
  }
  if (updated !== original) {
    writeFileSync(full, updated, 'utf8');
    console.log('Updated', path);
  } else console.log('Unchanged', path);
}
