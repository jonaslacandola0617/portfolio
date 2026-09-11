import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const sourceRoots = ["app", "components", "hooks", "lib", "types", "scripts", "prisma/seed"];
const extensions = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const files = new Set();

function walk(relativeDir) {
  const absoluteDir = path.join(root, relativeDir);
  if (!fs.existsSync(absoluteDir)) return;
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const relative = path.posix.join(relativeDir.replaceAll(path.sep, "/"), entry.name);
    if (entry.isDirectory()) walk(relative);
    else if (extensions.includes(path.extname(entry.name))) files.add(relative);
  }
}

for (const dir of sourceRoots) walk(dir);
for (const topLevel of ["auth.ts", "middleware.ts", "next.config.ts", "tailwind.config.ts"]) {
  if (fs.existsSync(path.join(root, topLevel))) files.add(topLevel);
}

function isFrameworkEntrypoint(file) {
  if (!file.startsWith("app/")) return false;
  return /\/(page|layout|route|loading|error|not-found|template|default)\.(?:ts|tsx|js|jsx)$/.test(file)
    || /^app\/(robots|sitemap|manifest|icon|apple-icon|opengraph-image|twitter-image)\.(?:ts|tsx|js|jsx)$/.test(file);
}

function resolveLocalImport(fromFile, specifier) {
  let base;
  if (specifier.startsWith("@/")) {
    base = specifier.slice(2);
  } else if (specifier.startsWith(".")) {
    base = path.posix.normalize(path.posix.join(path.posix.dirname(fromFile), specifier));
  } else {
    return null;
  }

  const attempts = [base];
  if (!extensions.some((extension) => base.endsWith(extension))) {
    for (const extension of extensions) attempts.push(`${base}${extension}`);
    for (const extension of extensions) attempts.push(path.posix.join(base, `index${extension}`));
  }
  return attempts.find((candidate) => files.has(candidate)) ?? null;
}

function importsFor(file) {
  const source = fs.readFileSync(path.join(root, file), "utf8");
  const specs = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specs.add(match[1]);
  }
  return [...specs]
    .map((specifier) => resolveLocalImport(file, specifier))
    .filter(Boolean);
}

const graph = new Map([...files].map((file) => [file, importsFor(file)]));
const roots = new Set(
  [...files].filter((file) =>
    isFrameworkEntrypoint(file)
    || file.startsWith("scripts/")
    || file.startsWith("prisma/seed/")
    || ["auth.ts", "middleware.ts", "next.config.ts", "tailwind.config.ts"].includes(file),
  ),
);

const reachable = new Set();
const queue = [...roots];
while (queue.length) {
  const file = queue.pop();
  if (!file || reachable.has(file)) continue;
  reachable.add(file);
  for (const dependency of graph.get(file) ?? []) {
    if (!reachable.has(dependency)) queue.push(dependency);
  }
}

const candidatePrefixes = ["app/", "components/", "hooks/", "lib/", "types/"];
const candidates = [...files]
  .filter((file) => candidatePrefixes.some((prefix) => file.startsWith(prefix)))
  .filter((file) => !reachable.has(file))
  .sort();

console.log(`[dead-code-audit] scanned ${files.size} source files; ${reachable.size} reachable from framework/script entrypoints.`);
if (!candidates.length) {
  console.log("[dead-code-audit] no unreachable source files found.");
  process.exit(0);
}

console.log(`[dead-code-audit] ${candidates.length} unreachable candidate(s):`);
for (const file of candidates) console.log(`  - ${file}`);
console.log("[dead-code-audit] candidates are reported for review; this audit does not delete files automatically.");
