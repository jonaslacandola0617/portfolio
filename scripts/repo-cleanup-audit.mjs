import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ignoredDirs = new Set(["node_modules", ".git", ".next", "coverage", ".vercel"]);
const codeExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const resolvableExts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const allFiles = walk(root);
const codeFiles = allFiles.filter((file) => codeExts.has(path.extname(file)));
const codeSet = new Set(codeFiles.map((file) => path.normalize(file)));
const rel = (file) => path.relative(root, file).replaceAll(path.sep, "/");

function extractSpecs(source) {
  const specs = new Set();
  const patterns = [
    /(?:import|export)\s+(?:[^'\"]*?\s+from\s+)?["']([^"']+)["']/g,
    /import\(\s*["']([^"']+)["']\s*\)/g,
    /require\(\s*["']([^"']+)["']\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) specs.add(match[1]);
  }
  return [...specs];
}

function resolveLocal(fromFile, spec) {
  let base;
  if (spec.startsWith("@/")) base = path.join(root, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null;

  const candidates = [base];
  for (const ext of resolvableExts) candidates.push(`${base}${ext}`);
  for (const ext of resolvableExts) candidates.push(path.join(base, `index${ext}`));
  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (codeSet.has(normalized)) return normalized;
  }
  return null;
}

function packageName(spec) {
  if (spec.startsWith("node:") || spec.startsWith(".") || spec.startsWith("@/")) return null;
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split("/")[0];
}

const graph = new Map();
const externalUsage = new Map();
for (const file of codeFiles) {
  const source = fs.readFileSync(file, "utf8");
  const deps = new Set();
  for (const spec of extractSpecs(source)) {
    const local = resolveLocal(file, spec);
    if (local) deps.add(local);
    const pkg = packageName(spec);
    if (pkg) {
      if (!externalUsage.has(pkg)) externalUsage.set(pkg, new Set());
      externalUsage.get(pkg).add(rel(file));
    }
  }
  graph.set(file, deps);
}

const appEntryPattern = /(^|\/)app\/.*\/(page|layout|route|loading|error|global-error|not-found|template|default|sitemap|robots|manifest|icon|apple-icon|opengraph-image|twitter-image)\.(ts|tsx|js|jsx)$/;
const rootEntryNames = new Set([
  "middleware.ts",
  "auth.ts",
  "next.config.mjs",
  "tailwind.config.ts",
  "postcss.config.mjs",
]);

const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const scriptText = Object.values(packageJson.scripts ?? {}).join(" ");
const roots = new Set();
for (const file of codeFiles) {
  const relative = rel(file);
  if (appEntryPattern.test(`/${relative}`)) roots.add(file);
  if (rootEntryNames.has(relative)) roots.add(file);
  if (relative.startsWith("prisma/seed/")) roots.add(file);
  if (relative.startsWith("scripts/") && scriptText.includes(relative)) roots.add(file);
}

const reachable = new Set();
const queue = [...roots];
while (queue.length) {
  const file = queue.shift();
  if (!file || reachable.has(file)) continue;
  reachable.add(file);
  for (const dep of graph.get(file) ?? []) if (!reachable.has(dep)) queue.push(dep);
}

const unusedFiles = codeFiles
  .filter((file) => !reachable.has(file))
  .map(rel)
  .filter((file) => file !== "scripts/repo-cleanup-audit.mjs")
  .sort();

const declaredDeps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
const scriptPackages = new Set();
for (const name of Object.keys(declaredDeps)) {
  const executable = name.startsWith("@") ? name.split("/")[1] : name;
  if (scriptText.includes(executable) || scriptText.includes(name)) scriptPackages.add(name);
}
const configPackages = new Set(["tailwindcss-animate"]);
const unusedDependencies = Object.keys(declaredDeps)
  .filter((name) => !externalUsage.has(name) && !scriptPackages.has(name) && !configPackages.has(name))
  .sort();

console.log("\n=== REPO CLEANUP AUDIT ===");
console.log(`Code files scanned: ${codeFiles.length}`);
console.log(`Entry points: ${roots.size}`);
console.log(`Reachable code files: ${reachable.size}`);
console.log("\nAUDIT_UNUSED_FILES_START");
for (const file of unusedFiles) console.log(file);
console.log("AUDIT_UNUSED_FILES_END");
console.log("\nAUDIT_UNUSED_DEPENDENCIES_START");
for (const dep of unusedDependencies) console.log(dep);
console.log("AUDIT_UNUSED_DEPENDENCIES_END");
console.log("\nAUDIT_EXTERNAL_USAGE_START");
for (const [pkg, files] of [...externalUsage.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${pkg}: ${[...files].sort().join(", ")}`);
}
console.log("AUDIT_EXTERNAL_USAGE_END\n");
