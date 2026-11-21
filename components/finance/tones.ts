import type { Tone } from "@/components/finance/ui";
import type { ContractStatus, LeadStatus, PayrollStatus, ProposalStatus } from "@/lib/finance/types";

// Fora de módulos "use client" para poder ser usado também em Server Components.
export const contractTone: Record<ContractStatus, Tone> = { active: "positive", paused: "warning", ended: "neutral", cancelled: "negative" };
export const leadTone: Record<LeadStatus, Tone> = { new: "info", contacted: "neutral", qualified: "warning", proposal: "warning", won: "positive", lost: "negative", archived: "neutral" };
export const proposalTone: Record<ProposalStatus, Tone> = { draft: "neutral", sent: "info", accepted: "positive", rejected: "negative", expired: "warning" };
export const payrollTone: Record<PayrollStatus, Tone> = { draft: "neutral", closed: "warning", paid: "positive" };
