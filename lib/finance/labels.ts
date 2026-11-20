import type { BillingType, ContractStatus, LeadSource, LeadStatus, PayrollStatus, ProposalStatus, ReceivableStatus } from "@/lib/finance/types";

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "Novo",
  contacted: "Em contato",
  qualified: "Qualificado",
  proposal: "Proposta",
  won: "Ganho",
  lost: "Perdido",
  archived: "Arquivado",
};

export const leadSourceLabels: Record<LeadSource, string> = {
  landing: "Site",
  manual: "Manual",
  referral: "Indicação",
  whatsapp: "WhatsApp",
  other: "Outro",
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  draft: "Rascunho",
  sent: "Enviada",
  accepted: "Aceita",
  rejected: "Recusada",
  expired: "Expirada",
};

export const contractStatusLabels: Record<ContractStatus, string> = {
  active: "Ativo",
  paused: "Pausado",
  ended: "Encerrado",
  cancelled: "Cancelado",
};

export const receivableStatusLabels: Record<ReceivableStatus | "overdue", string> = {
  open: "Em aberto",
  overdue: "Vencida",
  paid: "Paga",
  cancelled: "Cancelada",
};

export const payrollStatusLabels: Record<PayrollStatus, string> = {
  draft: "Rascunho",
  closed: "Fechada",
  paid: "Paga",
};

export const billingTypeLabels: Record<BillingType, string> = {
  recurring: "Mensal",
  one_off: "Avulso",
};

export const contractTypeLabels: Record<string, string> = {
  clt: "CLT",
  pj: "PJ",
  freelancer: "Freelancer",
  partner_admin: "Sócio",
};
