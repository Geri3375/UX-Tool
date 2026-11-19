"use client";

import { ArrowUp, Paperclip, X } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, ClipboardEvent, useRef, useState } from "react";

const MAX_IMAGES = 4;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type ImageAttachment = {
  id: string;
  name: string;
  dataUrl: string;
};

type PromptInputProps = {
  autoFocus?: boolean;
  onSubmit: (submission: { question: string; imageCount: number }) => void;
};

export function PromptInput({ autoFocus = false, onSubmit }: PromptInputProps) {
  const [question, setQuestion] = useState("");
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function addImages(files: File[]) {
    const availableSlots = MAX_IMAGES - attachments.length;
    const validImages = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, availableSlots);

    if (availableSlots === 0 || files.length > availableSlots) {
      setAttachmentError(`You can attach up to ${MAX_IMAGES} images.`);
    } else if (validImages.some((file) => file.size > MAX_IMAGE_BYTES)) {
      setAttachmentError("Each image must be 10 MB or smaller.");
    } else {
      setAttachmentError(null);
    }

    validImages
      .filter((file) => file.size <= MAX_IMAGE_BYTES)
      .forEach((file) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          if (typeof reader.result !== "string") return;

          setAttachments((current) => {
            if (current.length >= MAX_IMAGES) return current;

            return [
              ...current,
              {
                id: crypto.randomUUID(),
                name: file.name || "Pasted image",
                dataUrl: reader.result as string,
              },
            ];
          });
        });
        reader.readAsDataURL(file);
      });
  }

  function handlePaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const images = Array.from(event.clipboardData.items)
      .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
      .flatMap((item) => {
        const file = item.getAsFile();
        return file ? [file] : [];
      });

    if (images.length === 0) return;

    event.preventDefault();
    addImages(images);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    addImages(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function removeAttachment(id: string) {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id));
    setAttachmentError(null);
  }

  function submitQuestion() {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion && attachments.length === 0) return;

    onSubmit({
      question: trimmedQuestion,
      imageCount: attachments.length,
    });
  }

  return (
    <form
      className="prompt"
      onSubmit={(event) => {
        event.preventDefault();
        submitQuestion();
      }}
      aria-label="Ask a UX question"
    >
      <label htmlFor="question" className="sr-only">
        Ask a question about UX design
      </label>
      <textarea
        autoFocus={autoFocus}
        id="question"
        value={question}
        onChange={(event) => setQuestion(event.target.value)}
        onPaste={handlePaste}
        placeholder="Ask a question about UX design..."
        rows={2}
      />
      {attachments.length > 0 ? (
        <div className="prompt-attachments" aria-label="Attached images">
          {attachments.map((attachment) => (
            <div className="prompt-attachment" key={attachment.id}>
              <Image
                alt={attachment.name}
                height={56}
                src={attachment.dataUrl}
                unoptimized
                width={80}
              />
              <button
                aria-label={`Remove ${attachment.name}`}
                onClick={() => removeAttachment(attachment.id)}
                type="button"
              >
                <X aria-hidden="true" size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {attachmentError ? (
        <p className="prompt-error" role="alert">{attachmentError}</p>
      ) : null}
      <div className="prompt-actions">
        <input
          accept="image/*"
          className="sr-only"
          multiple
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
        <button
          className="icon-button"
          type="button"
          aria-label="Attach images"
          onClick={() => fileInputRef.current?.click()}
        >
          <Paperclip aria-hidden="true" size={18} strokeWidth={1.8} />
        </button>
        <p>
          {attachments.length > 0
            ? `${attachments.length} image${attachments.length === 1 ? "" : "s"} attached · analysis not connected`
            : "Paste or attach images · analysis not connected"}
        </p>
        <button
          className="send-button"
          type="submit"
          aria-label="Send question"
          disabled={!question.trim() && attachments.length === 0}
        >
          <ArrowUp aria-hidden="true" size={18} strokeWidth={2} />
        </button>
      </div>
    </form>
  );
}
