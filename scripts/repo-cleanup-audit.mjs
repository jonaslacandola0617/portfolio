import fs from "node:fs";
import path from "node:path";
import { builtinModules } from "node:module";

const root = process.cwd();
const ignoredDirs = new Set(["node_modules", ".git", ".next", "coverage", ".vercel"]);
const codeExts = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const resolvableExts = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const builtinSet = new Set([...builtinModules, ...builtinModules.map((name) => `node:${name}`)]);

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
  if (builtinSet.has(spec) || spec.startsWith(".") || spec.startsWith("@/")) return null;
  if (spec.startsWith("@")) return spec.split("/").slice(0, 2).join("/");
  return spec.split("/")[0];
}

const graph = new Map();
const externalByFile = new Map();
for (const file of codeFiles) {
  const source = fs.readFileSync(file, "utf8");
  const deps = new Set();
  const externals = new Set();
  for (const spec of extractSpecs(source)) {
    const local = resolveLocal(file, spec);
    if (local) deps.add(local);
    const pkg = packageName(spec);
    if (pkg) externals.add(pkg);
  }
  graph.set(file, deps);
  externalByFile.set(file, externals);
}

const nextEntryNames = new Set([
  "page",
  "layout",
  "route",
  "loading",
  "error",
  "global-error",
  "not-found",
  "template",
  "default",
  "sitemap",
  "robots",
  "manifest",
  "icon",
  "apple-icon",
  "opengraph-image",
  "twitter-image",
]);
const rootEntryNames = new Set([
  "middleware.ts",
  "instrumentation.ts",
  "instrumentation-client.ts",
  "mdx-components.tsx",
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
  const parsed = path.parse(relative);
  if (relative.startsWith("app/") && nextEntryNames.has(parsed.name)) roots.add(file);
  if (rootEntryNames.has(relative)) roots.add(file);
  if (relative.endsWith(".d.ts")) roots.add(file);
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

const reachableExternalUsage = new Map();
for (const file of reachable) {
  for (const pkg of externalByFile.get(file) ?? []) {
    if (!reachableExternalUsage.has(pkg)) reachableExternalUsage.set(pkg, new Set());
    reachableExternalUsage.get(pkg).add(rel(file));
  }
}

const declaredDeps = { ...(packageJson.dependencies ?? {}), ...(packageJson.devDependencies ?? {}) };
const toolPackages = new Set([
  "@types/node",
  "@types/react",
  "@types/react-dom",
  "autoprefixer",
  "eslint",
  "eslint-config-next",
  "postcss",
  "prisma",
  "tailwindcss",
  "tailwindcss-animate",
  "tsx",
  "typescript",
]);
const scriptPackages = new Set();
for (const name of Object.keys(declaredDeps)) {
  const executable = name.startsWith("@") ? name.split("/")[1] : name;
  if (scriptText.includes(executable) || scriptText.includes(name)) scriptPackages.add(name);
}
const unusedDependencies = Object.keys(declaredDeps)
  .filter((name) => !reachableExternalUsage.has(name) && !scriptPackages.has(name) && !toolPackages.has(name))
  .sort();
const undeclaredDependencies = [...reachableExternalUsage.keys()]
  .filter((name) => !(name in declaredDeps))
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
console.log("\nAUDIT_UNDECLARED_DEPENDENCIES_START");
for (const dep of undeclaredDependencies) console.log(dep);
console.log("AUDIT_UNDECLARED_DEPENDENCIES_END");
console.log("\nAUDIT_REACHABLE_EXTERNAL_USAGE_START");
for (const [pkg, files] of [...reachableExternalUsage.entries()].sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`${pkg}: ${[...files].sort().join(", ")}`);
}
console.log("AUDIT_REACHABLE_EXTERNAL_USAGE_END\n");
