import {
  BookOpenText,
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

const conversations = [
  "Choosing research methods",
  "Error message guidance",
  "Navigation depth",
];

export function AppShell() {
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
            <span><BookOpenText aria-hidden="true" size={13} /> No library connected</span>
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

          <aside className="source-panel" aria-label="Source details">
            <div className="source-panel-header">
              <div>
                <p>Source inspection</p>
                <span>Illustrative only</span>
              </div>
              <button className="icon-button" type="button" aria-label="Close source panel">
                <PanelRightClose aria-hidden="true" size={18} />
              </button>
            </div>
            <div className="source-preview-empty">
              <BookOpenText aria-hidden="true" size={22} strokeWidth={1.5} />
              <h2>No source selected</h2>
              <p>Verified excerpts and page context will appear here after document retrieval is connected.</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
