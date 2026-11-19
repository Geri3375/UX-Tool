export type EvidenceKind = "literature" | "interpretation" | "limitation";

export type Citation = {
  id: string;
  title: string;
  author: string;
  section: string;
  printedPage: number | null;
  pdfPage: number;
};

export type AnswerSection = {
  id: string;
  kind: EvidenceKind;
  heading: string;
  body: string;
  citationIds: string[];
};

export function validateAnswerCitations(
  sections: AnswerSection[],
  citations: Citation[],
) {
  const knownIds = new Set(citations.map((citation) => citation.id));

  return sections.every((section) => {
    if (section.kind === "literature" && section.citationIds.length === 0) {
      return false;
    }

    if (section.kind !== "literature" && section.citationIds.length > 0) {
      return false;
    }

    return section.citationIds.every((id) => knownIds.has(id));
  });
}
