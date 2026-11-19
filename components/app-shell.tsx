import {
  BookOpenText,
  ExternalLink,
  Library,
  Menu,
  MessageSquareText,
  PanelRightClose,
  Plus,
  Search,
  Settings,
} from "lucide-react";

import { MockAnswer } from "@/components/mock-answer";
import { PromptInput } from "@/components/prompt-input";
import type { LibraryDocument } from "@/lib/library";

const conversations = [
  "Choosing research methods",
  "Error message guidance",
  "Navigation depth",
];

type AppShellProps = {
  documents: LibraryDocument[];
};

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(sizeBytes / 1024))} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AppShell({ documents }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">C</span>
          <span className="brand-name">Clarity</span>
        </div>

        <button className="new-question" type="button">
          <Plus aria-hidden="true" size={17} strokeWidth={1.8} />
          New question
        </button>

        <nav className="primary-nav" aria-label="Product">
          <a className="nav-item active" href="#conversation" aria-current="page">
            <MessageSquareText aria-hidden="true" size={17} strokeWidth={1.8} />
            Conversation
          </a>
          <a className="nav-item" href="#library">
            <Library aria-hidden="true" size={17} strokeWidth={1.8} />
            Library
          </a>
        </nav>

        <div className="history">
          <p>Recent</p>
          {conversations.map((conversation) => (
            <button key={conversation} type="button">{conversation}</button>
          ))}
        </div>

        <a className="nav-item settings-link" href="#settings">
          <Settings aria-hidden="true" size={17} strokeWidth={1.8} />
          Settings
        </a>
      </aside>

      <main className="workspace" id="conversation">
        <header className="topbar">
          <button className="mobile-menu" type="button" aria-label="Open navigation">
            <Menu aria-hidden="true" size={20} />
          </button>
          <div>
            <p>UX knowledge assistant</p>
            <span>
              <BookOpenText aria-hidden="true" size={13} />
              {documents.length} {documents.length === 1 ? "source" : "sources"} connected
            </span>
          </div>
          <button className="topbar-action" type="button" aria-label="Search conversations">
            <Search aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="conversation-layout">
          <div className="conversation-column">
            <MockAnswer />
            <div className="prompt-wrap"><PromptInput /></div>
          </div>

          <aside className="source-panel" id="library" aria-label="Document library">
            <div className="source-panel-header">
              <div>
                <p>Document library</p>
                <span>Supabase · UX Literature</span>
              </div>
              <button className="icon-button" type="button" aria-label="Close source panel">
                <PanelRightClose aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="library-list">
              {documents.length === 0 ? (
                <div className="source-preview-empty">
                  <BookOpenText aria-hidden="true" size={22} strokeWidth={1.5} />
                  <h2>No documents found</h2>
                  <p>The connected bucket does not contain imported library records yet.</p>
                </div>
              ) : documents.map((document) => (
                <a
                  className="library-document"
                  href={document.publicUrl}
                  key={document.id}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="library-document-icon" aria-hidden="true">
                    <BookOpenText size={17} strokeWidth={1.6} />
                  </span>
                  <span className="library-document-copy">
                    <strong>{document.title}</strong>
                    <small>{formatFileSize(document.sizeBytes)} · Available in Storage</small>
                  </span>
                  <ExternalLink aria-hidden="true" size={14} strokeWidth={1.7} />
                </a>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
