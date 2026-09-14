import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const env = { ...process.env, STRICT_BUILD_DATA: "1" };

function run(label, entrypoint, args) {
  console.log(`[strict-build] ${label}`);
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd: process.cwd(),
    env,
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run("verifying database content and public counts", require.resolve("tsx/cli"), [
  "scripts/verify-build-data.ts",
]);
run("running Next.js production build with STRICT_BUILD_DATA=1", require.resolve("next/dist/bin/next"), [
  "build",
]);
