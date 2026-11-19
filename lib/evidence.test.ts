import { describe, expect, it } from "vitest";

import { validateAnswerCitations } from "./evidence";

const citation = {
  id: "source-1",
  title: "Designing for Evidence",
  author: "Sample Author",
  section: "Research synthesis",
  printedPage: 42,
  pdfPage: 51,
};

describe("validateAnswerCitations", () => {
  it("accepts literature sections with known citations", () => {
    expect(
      validateAnswerCitations(
        [
          {
            id: "section-1",
            kind: "literature",
            heading: "Finding",
            body: "A supported statement.",
            citationIds: [citation.id],
          },
        ],
        [citation],
      ),
    ).toBe(true);
  });

  it("rejects unsupported literature and citations on interpretation", () => {
    expect(
      validateAnswerCitations(
        [
          {
            id: "section-1",
            kind: "literature",
            heading: "Finding",
            body: "An unsupported statement.",
            citationIds: [],
          },
        ],
        [citation],
      ),
    ).toBe(false);

    expect(
      validateAnswerCitations(
        [
          {
            id: "section-2",
            kind: "interpretation",
            heading: "Interpretation",
            body: "Model-generated guidance.",
            citationIds: [citation.id],
          },
        ],
        [citation],
      ),
    ).toBe(false);
  });
});
