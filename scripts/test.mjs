import { build } from "esbuild";
import { spawnSync } from "node:child_process";
import { mkdirSync } from "node:fs";
mkdirSync(".test-build", { recursive: true });
await build({
  entryPoints: ["tests/core.test.ts"],
  outfile: ".test-build/core.test.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  packages: "external",
});
const r = spawnSync(process.execPath, ["--test", ".test-build/core.test.mjs"], {
  stdio: "inherit",
});
process.exit(r.status ?? 1);
