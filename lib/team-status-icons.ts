import { Ban, Clock, Coffee, Focus, Headphones, ListChecks, MessageCircle, Pause, Video, Zap, type LucideIcon } from "lucide-react";

export const teamStatusIcons = {
  Focus,
  Video,
  ListChecks,
  Coffee,
  Headphones,
  Clock,
  Zap,
  Pause,
  MessageCircle,
  Ban,
} as const satisfies Record<string, LucideIcon>;

export type TeamStatusIconName = keyof typeof teamStatusIcons;

export const teamStatusIconNames = Object.keys(teamStatusIcons) as TeamStatusIconName[];

export function isTeamStatusIcon(value: string): value is TeamStatusIconName {
  return value in teamStatusIcons;
}

export function teamStatusIcon(name: string): LucideIcon {
  return isTeamStatusIcon(name) ? teamStatusIcons[name] : Focus;
}

export type TeamStatus = {
  id: string;
  name: string;
  icon: TeamStatusIconName;
  sortOrder: number;
};
