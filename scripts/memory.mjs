#!/usr/bin/env node
// CLI dos serviços de memória (/api/memory/*). Usado por pessoas e pelos agentes de código
// (Claude Code, Codex, Cursor) via shell. Lê MEMORY_API_URL e MEMORY_API_KEY do .env.local.
//
//   npm run memory -- sync                      vault Obsidian → índice (incremental, com prune)
//   npm run memory -- pull                      memórias registradas → docs/memorias/*.md
//   npm run memory -- context "tarefa" --agent code
//   npm run memory -- search "consulta" --k 5
//   npm run memory -- ask "pergunta" --agent spec
//   npm run memory -- remember "conteúdo" --title "Título" --type decision --tags a,b
//   npm run memory -- graph doc:docs/specs/demandas.md --depth 1
//   npm run memory -- graphify [graphify-out/graph.json]
//   npm run memory -- eval [--answer]
//   npm run memory -- metrics --days 7
import { existsSync, globSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local", quiet: true });

const root = process.cwd();
const settings = JSON.parse(readFileSync(path.join(root, "memory.config.json"), "utf8"));
const baseUrl = (process.env.MEMORY_API_URL || "http://localhost:8080").replace(/\/$/, "");
const apiKey = process.env.MEMORY_API_KEY || (process.env.MEMORY_API_KEYS || "").split(",")[0]?.trim();

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith("--")) flags[key] = true;
      else {
        flags[key] = next;
        i += 1;
      }
    } else positional.push(arg);
  }
  return { positional, flags };
}

async function call(method, route, body) {
  if (!apiKey) throw new Error("Defina MEMORY_API_KEY (ou MEMORY_API_KEYS) no .env.local.");
  const url = new URL(`${baseUrl}/api/memory/${route}`);
  if (method === "GET" && body) for (const [key, value] of Object.entries(body)) url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${route}: ${response.status} ${payload?.error?.message ?? ""}`.trim());
  return payload;
}

function collectDocuments() {
  const files = new Set();
  for (const pattern of settings.include) for (const file of globSync(pattern, { cwd: root, exclude: settings.exclude })) files.add(file.replace(/\\/g, "/"));
  return [...files].sort().map((file) => ({ path: file, content: readFileSync(path.join(root, file), "utf8") }));
}

async function pull() {
  const { memories } = await call("GET", "memories", { project: settings.project });
  let written = 0;
  for (const memory of memories) {
    const target = path.join(root, memory.path);
    if (!memory.path.startsWith(`${settings.vault}/`)) continue;
    if (existsSync(target) && readFileSync(target, "utf8") === memory.content) continue;
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, memory.content);
    written += 1;
  }
  return { memories: memories.length, written };
}

const commands = {
  async sync({ flags }) {
    const pulled = await pull();
    const documents = collectDocuments();
    const result = await call("POST", "ingest", { project: settings.project, documents, pinned: settings.pinned, prune: !flags["no-prune"] });
    return { pulled, ...result };
  },
  pull,
  async search({ positional, flags }) {
    return call("POST", "search", { project: settings.project, query: positional.join(" "), k: Number(flags.k ?? 8) });
  },
  async context({ positional, flags }) {
    const built = await call("POST", "context", {
      project: settings.project,
      task: positional.join(" "),
      agent: flags.agent,
      budgetTokens: flags.budget ? Number(flags.budget) : undefined,
    });
    if (flags.json) return built;
    const userMessage = built.prompt.messages.at(-1).content[0].text;
    process.stdout.write(`${userMessage}\n\n`);
    return { agent: built.agent, mode: built.retrievalMode, sources: built.sources.map((s) => `${s.id} ${s.path} — ${s.heading}`), stats: built.stats };
  },
  async ask({ positional, flags }) {
    const result = await call("POST", "ask", { project: settings.project, task: positional.join(" "), agent: flags.agent, effort: flags.effort });
    process.stdout.write(`${result.answer}\n\n`);
    return { model: result.model, sources: result.sources.map((s) => `${s.id} ${s.path}`), usage: result.usage, costUsd: result.costUsd, costWithoutCacheUsd: result.costWithoutCacheUsd, latencyMs: result.latencyMs };
  },
  async remember({ positional, flags }) {
    return call("POST", "memories", {
      project: settings.project,
      title: flags.title,
      content: positional.join(" "),
      type: flags.type ?? "fact",
      tags: flags.tags ? String(flags.tags).split(",") : [],
      related: flags.related ? String(flags.related).split(",") : [],
      agent: flags.agent,
    });
  },
  async graph({ positional, flags }) {
    return call("GET", "graph", { project: settings.project, node: positional[0], depth: flags.depth ?? 1 });
  },
  async graphify({ positional }) {
    const file = positional[0] ?? settings.graphify;
    if (!existsSync(file)) throw new Error(`${file} não encontrado. Rode o Graphify no repositório antes.`);
    return call("POST", "graph", { project: settings.project, graph: JSON.parse(readFileSync(file, "utf8")) });
  },
  async eval({ flags }) {
    const cases = JSON.parse(readFileSync(path.join(root, settings.goldenSet), "utf8"));
    const report = await call("POST", "eval", { project: settings.project, mode: flags.answer ? "answer" : "retrieval", k: Number(flags.k ?? 5), cases });
    if (flags.json) return report;
    if (report.variants) for (const variant of report.variants) console.table({ [variant.variant]: variant.metrics });
    return report.metrics ?? { cases: report.cases.length };
  },
  async metrics({ flags }) {
    return call("GET", "metrics", { project: settings.project, days: flags.days ?? 7 });
  },
};

const [command, ...rest] = process.argv.slice(2);
if (!commands[command]) {
  console.error(`Comandos: ${Object.keys(commands).join(", ")}`);
  process.exit(1);
}
try {
  const result = await commands[command](parseArgs(rest));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
