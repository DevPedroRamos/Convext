"use client";

import { createClient } from "@/lib/supabase/browser";

export const PRESENCE_PROMPT_KEY = "convext:presence-prompt";

export function markPresencePrompt() {
  sessionStorage.setItem(PRESENCE_PROMPT_KEY, "1");
}

export function shouldPromptPresence() {
  return sessionStorage.getItem(PRESENCE_PROMPT_KEY) === "1";
}

export function clearPresencePrompt() {
  sessionStorage.removeItem(PRESENCE_PROMPT_KEY);
}

export async function signOutOffline() {
  try {
    await fetch("/api/me/presence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ available: false }),
    });
  } catch {
    // encerrar a sessão mesmo se a presença não gravar
  }
  const supabase = createClient();
  await supabase.auth.signOut();
}
