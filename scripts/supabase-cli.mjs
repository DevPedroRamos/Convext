import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = join(root, ".supabase-home");
mkdirSync(home, { recursive: true });

const child = spawn("npx", ["supabase", ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, SUPABASE_HOME: home },
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => process.exit(code ?? 1));
