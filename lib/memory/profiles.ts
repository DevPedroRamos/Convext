// Perfis de contexto por agente. Não são agentes novos: mapeiam os agentes/skills que já
// existem (.agents/skills) para o recorte de conhecimento e o orçamento de cada um.

export type AgentProfile = {
  id: string;
  description: string;
  instructions: string;
  budgetTokens: number;
  pinnedBudgetTokens: number;
  historyBudgetTokens: number;
  k: number;
  kindWeights: Partial<Record<string, number>>;
};

const profiles: Record<string, AgentProfile> = {
  default: {
    id: "default",
    description: "Perguntas gerais sobre o produto e a plataforma.",
    instructions: "Responda com base no contexto recuperado. Cite as fontes como [S1], [S2]. Se o contexto não cobrir a pergunta, diga isso em vez de supor.",
    budgetTokens: 1800,
    pinnedBudgetTokens: 1400,
    historyBudgetTokens: 800,
    k: 8,
    kindWeights: {},
  },
  spec: {
    id: "spec",
    description: "Especificação, modelagem de domínio e entrevistas de requisito (to-spec, grill-with-docs, domain-modeling, grilling).",
    instructions:
      "Você apoia a escrita de SPECs e o modelo de domínio. Use o vocabulário do glossário, respeite ADRs aceitas e aponte conflitos com specs existentes citando [S#].",
    budgetTokens: 2400,
    pinnedBudgetTokens: 1400,
    historyBudgetTokens: 1000,
    k: 10,
    kindWeights: { spec: 1.25, decision: 1.3, glossary: 1.2, product: 0.9 },
  },
  code: {
    id: "code",
    description: "Implementação e testes (tdd, codebase-design).",
    instructions:
      "Você apoia a implementação. Priorize contratos, banco, arquitetura e critérios de aceite das specs. Cite [S#] e os arquivos de código mencionados nelas.",
    budgetTokens: 2200,
    pinnedBudgetTokens: 1000,
    historyBudgetTokens: 1200,
    k: 10,
    kindWeights: { spec: 1.2, decision: 1.2, memory: 1.1, product: 0.8 },
  },
  review: {
    id: "review",
    description: "Revisão de arquitetura (improve-codebase-architecture).",
    instructions:
      "Você revisa arquitetura. Confronte o pedido com ADRs, specs e decisões registradas em memória; cite [S#] para cada decisão usada.",
    budgetTokens: 2400,
    pinnedBudgetTokens: 1000,
    historyBudgetTokens: 800,
    k: 10,
    kindWeights: { decision: 1.4, memory: 1.2, spec: 1.1 },
  },
};

const aliases: Record<string, string> = {
  "to-spec": "spec",
  "grill-with-docs": "spec",
  "domain-modeling": "spec",
  grilling: "spec",
  tdd: "code",
  "codebase-design": "code",
  "improve-codebase-architecture": "review",
};

export function resolveProfile(agent?: string | null): AgentProfile {
  const key = (agent ?? "default").toLowerCase();
  return profiles[key] ?? profiles[aliases[key] ?? "default"];
}

export function listProfiles() {
  return Object.values(profiles).map(({ id, description, budgetTokens }) => ({ id, description, budgetTokens, aliases: Object.keys(aliases).filter((a) => aliases[a] === id) }));
}
