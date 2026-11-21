import { spawn } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const home = join(root, ".supabase-home");
const projectRefFile = join(root, "supabase", ".temp", "project-ref");
const supabaseEntrypoint = join(
  root,
  "node_modules",
  "supabase",
  "dist",
  "supabase.js",
);
const expectedProjectRef = "kfhxiljdzgwylruinrve";
const args = process.argv.slice(2);
const command = args.find((arg) => !arg.startsWith("-"));
const commandIndex = command ? args.indexOf(command) : -1;
const subcommand = commandIndex >= 0 ? args[commandIndex + 1] : undefined;
const targetsRemote = args.some((arg) => arg === "--remote" || arg.startsWith("--remote="));
const localMigrationCommand =
  command === "migration" &&
  (subcommand === "new" || (subcommand === "list" && !targetsRemote));
const projectEnvironment =
  config({ path: join(root, ".env.local"), quiet: true }).parsed ?? {};
const isolatedVariables = {
  SUPABASE_ACCESS_TOKEN: [
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_TOKEN",
    "supabase_token",
  ],
  SUPABASE_DB_PASSWORD: ["SUPABASE_DB_PASSWORD"],
  SUPABASE_PROJECT_ID: ["SUPABASE_PROJECT_ID"],
};

for (const [target, aliases] of Object.entries(isolatedVariables)) {
  const source = aliases.find((name) =>
    Object.hasOwn(projectEnvironment, name),
  );

  if (source) {
    process.env[target] = projectEnvironment[source];
  } else {
    delete process.env[target];
  }
}

delete process.env.supabase_token;
delete process.env.SUPABASE_TOKEN;

const informationalCommand =
  args.includes("--help") ||
  args.includes("-h") ||
  args.includes("--version") ||
  args.includes("-v");

if (command === "login" || command === "logout") {
  console.error(
    "Login global bloqueado. Configure SUPABASE_TOKEN no .env.local deste projeto.",
  );
  process.exit(1);
}

if (!informationalCommand) {
  const requiredVariables = localMigrationCommand ? [] : ["SUPABASE_ACCESS_TOKEN"];
  const missingVariables = requiredVariables.filter(
    (name) => !process.env[name]?.trim(),
  );

  if (missingVariables.length > 0) {
    console.error(
      `Credenciais ausentes no .env.local: ${missingVariables.join(", ")}.`,
    );
    process.exit(1);
  }

  const configuredProjectRef =
    process.env.SUPABASE_PROJECT_ID?.trim() || expectedProjectRef;

  if (configuredProjectRef !== expectedProjectRef) {
    console.error(
      `Projeto recusado: esperado ${expectedProjectRef}, recebido ${configuredProjectRef}.`,
    );
    process.exit(1);
  }

  if (command === "link") {
    const projectRefFlag = args.indexOf("--project-ref");
    const requestedProjectRef =
      projectRefFlag >= 0 ? args[projectRefFlag + 1] : configuredProjectRef;

    if (requestedProjectRef !== expectedProjectRef) {
      console.error(
        `Link recusado: este repositório só pode usar ${expectedProjectRef}.`,
      );
      process.exit(1);
    }

    if (projectRefFlag < 0) {
      args.push("--project-ref", expectedProjectRef);
    }
  } else if (command !== "projects" && !localMigrationCommand) {
    let linkedProjectRef;

    try {
      linkedProjectRef = readFileSync(projectRefFile, "utf8").trim();
    } catch {
      console.error(
        "Projeto ainda não vinculado. Execute: npm run supabase -- link",
      );
      process.exit(1);
    }

    if (linkedProjectRef !== expectedProjectRef) {
      console.error(
        `Projeto vinculado incorreto: esperado ${expectedProjectRef}, encontrado ${linkedProjectRef}.`,
      );
      process.exit(1);
    }
  }
}

mkdirSync(home, { recursive: true });

const child = spawn(process.execPath, [supabaseEntrypoint, ...args], {
  cwd: root,
  env: {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    XDG_CONFIG_HOME: home,
    SUPABASE_HOME: home,
  },
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
