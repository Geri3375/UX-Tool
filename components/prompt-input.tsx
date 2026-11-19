"use client";

import { ArrowUp, Paperclip } from "lucide-react";
import { useState } from "react";

export function PromptInput() {
  const [question, setQuestion] = useState("");

  return (
    <form
      className="prompt"
      onSubmit={(event) => event.preventDefault()}
      aria-label="Ask a UX question"
    >
      <label htmlFor="question" className="sr-only">
        Ask a question about UX design
      </label>
      <textarea
        id="question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        placeholder="Ask a question about UX design..."
        rows={2}
      />
      <div className="prompt-actions">
        <button className="icon-button" type="button" aria-label="Attach a document" disabled>
          <Paperclip aria-hidden="true" size={18} strokeWidth={1.8} />
        </button>
        <p>Demo interface. Retrieval is not connected.</p>
        <button className="send-button" type="submit" aria-label="Send question" disabled={!question.trim()}>
          <ArrowUp aria-hidden="true" size={18} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}
