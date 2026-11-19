import { ExternalLink } from "lucide-react";

import { EvidenceIndicator } from "@/components/evidence-indicator";

export function MockAnswer() {
  return (
    <article className="answer" aria-labelledby="answer-heading">
      <div className="mock-notice" role="note">
        Interface preview with illustrative content. No retrieval or model response has run.
      </div>

      <header className="answer-header">
        <p className="answer-kicker">Sample answer</p>
        <h1 id="answer-heading">How should a team choose between usability testing and interviews?</h1>
      </header>

      <section className="answer-section">
        <EvidenceIndicator kind="literature" />
        <h2>Choose based on the uncertainty you need to reduce</h2>
        <p>
          Interviews are suited to understanding people&apos;s context, motivations, and mental models.
          Usability testing is better for observing whether people can complete tasks with a specific
          design. The methods answer different questions and are often complementary.
          <button className="citation-link" type="button" aria-label="Open illustrative source 1">
            1
          </button>
        </p>
      </section>

      <section className="answer-section interpretation-block">
        <EvidenceIndicator kind="interpretation" />
        <h2>Practical interpretation</h2>
        <p>
          If the team is still deciding what to build, begin with interviews. If a concrete workflow
          already exists, test it with representative tasks. Use both when assumptions about the
          problem and the interaction are equally risky.
        </p>
      </section>

      <section className="answer-section limitation-block">
        <EvidenceIndicator kind="limitation" />
        <h2>Current limitation</h2>
        <p>
          This sample citation is not connected to a document. Production answers must not label a
          claim as literature-supported unless retrieval provides traceable source metadata.
        </p>
      </section>

      <section className="source-list" aria-labelledby="sources-heading">
        <h2 id="sources-heading">Illustrative source</h2>
        <button className="source-row" type="button" disabled>
          <span className="source-index">1</span>
          <span>
            <strong>Example UX Research Handbook</strong>
            <small>Sample Author · Choosing research methods · Printed p. 42 · PDF p. 51</small>
          </span>
          <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      </section>
    </article>
  );
}
