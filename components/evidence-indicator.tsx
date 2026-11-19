import { BookOpenText, CircleAlert, Sparkles } from "lucide-react";

import type { EvidenceKind } from "@/lib/evidence";

const config = {
  literature: {
    icon: BookOpenText,
    label: "Supported by literature",
    className: "evidence-literature",
  },
  interpretation: {
    icon: Sparkles,
    label: "AI interpretation",
    className: "evidence-interpretation",
  },
  limitation: {
    icon: CircleAlert,
    label: "Evidence limitation",
    className: "evidence-limitation",
  },
} satisfies Record<EvidenceKind, { icon: typeof BookOpenText; label: string; className: string }>;

export function EvidenceIndicator({ kind }: { kind: EvidenceKind }) {
  const item = config[kind];
  const Icon = item.icon;

  return (
    <span className={`evidence-indicator ${item.className}`}>
      <Icon aria-hidden="true" size={14} strokeWidth={1.8} />
      {item.label}
    </span>
  );
}
