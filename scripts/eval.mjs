// Runs the live Q&A accuracy eval against the real Gemini model (US-F6).
// Sets the EVAL_LIVE gate so the otherwise-skipped live test runs. Needs keys in .env.
import { spawnSync } from "node:child_process";

const r = spawnSync(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vitest", "run", "lib/server/qa/evalLive.test.ts"],
  { stdio: "inherit", env: { ...process.env, EVAL_LIVE: "1" } },
);
process.exit(r.status ?? 1);
