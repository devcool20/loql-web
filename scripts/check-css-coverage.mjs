import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const cssFiles = ['src/app/globals.css', 'src/app/mobile-v2.css', 'src/app/tailwind.css'];
const defined = new Set();
for (const file of cssFiles) {
  const css = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of css.matchAll(/\.([a-zA-Z_][\w-]*)/g)) defined.add(match[1]);
}

const ignored = new Set(['active','dark','done','error','info','mine','open','selected','success','theirs','destructive','cancel','primary','credit','card','status-','tone-']);
const used = new Map();
const walk = dir => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(tsx|jsx)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      const values = [];
      for (const match of text.matchAll(/className\s*=\s*["']([^"']+)["']/g)) values.push(match[1]);
      for (const match of text.matchAll(/className\s*=\s*\{`([^`]+)`\}/g)) values.push(match[1].replace(/\$\{[^}]+\}/g, ''));
      for (const value of values) for (const token of value.split(/\s+/).filter(Boolean)) {
        if (!/^[a-zA-Z_][\w-]*$/.test(token) || ignored.has(token)) continue;
        if (!used.has(token)) used.set(token, path.relative(root, full));
      }
    }
  }
};
walk(path.join(root, 'src/components/app'));
const missing = [...used].filter(([token]) => !defined.has(token)).sort(([a],[b]) => a.localeCompare(b));
if (missing.length) {
  console.error('Undefined CSS classes:');
  for (const [token, file] of missing) console.error(`  ${token} (${file})`);
  process.exit(1);
}
console.log(`CSS coverage OK: ${used.size} class tokens are defined.`);
